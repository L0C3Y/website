const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const razorpay = require("../utils/razorpay");
const { supabase } = require("../supabase"); // service role client
const { asyncHandler, authMiddleware, validate, body } = require("./middleware");

// Helper to parse amount
const parseAmount = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num) || num < 1) throw new Error("Invalid amount");
  return num;
};

// 🔹 Create Razorpay Order
router.post(
  "/create-order",
  authMiddleware,
  validate([
    body("ebookId").notEmpty(),
    body("amount").notEmpty(),
    body("affiliateCode").optional(),
  ]),
  asyncHandler(async (req, res) => {
    const { ebookId, amount, affiliateCode } = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) return res.status(401).json({ success: false, error: "Unauthorized" });

    try {
      const amountNum = parseAmount(amount);

      console.log("Creating order for user:", userId, "Amount:", amountNum, "Ebook:", ebookId);

      // 1️⃣ Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amountNum * 100),
        currency: "INR",
        receipt: `ebook_${ebookId}_${Date.now()}`,
      });
      console.log("Razorpay order created:", razorpayOrder);

      // 2️⃣ Save order to Supabase
      const { data: order, error } = await supabase
        .from("orders")
        .insert([{
          user_id: userId,
          ebook_id: ebookId,
          amount: amountNum,
          status: "pending",
          razorpay_order_id: razorpayOrder.id,
          affiliate_code: affiliateCode || null,
          user_email: userEmail,
        }])
        .select()
        .single();

      if (error) {
        console.error("❌ Supabase insert error:", error);
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, razorpayOrder, order });
    } catch (err) {
      console.error("❌ Create order error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  })
);

// 🔹 Verify Razorpay Payment
router.post(
  "/verify",
  authMiddleware,
  validate([
    body("razorpay_order_id").notEmpty(),
    body("razorpay_payment_id").notEmpty(),
    body("razorpay_signature").notEmpty(),
  ]),
  asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    try {
      // Generate signature
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature)
        return res.status(400).json({ success: false, error: "Payment verification failed" });

      // Update order status
      const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update({ status: "completed", razorpay_payment_id, razorpay_signature })
        .eq("razorpay_order_id", razorpay_order_id)
        .select()
        .single();

      if (updateError) return res.status(500).json({ success: false, error: updateError.message });

      // Handle affiliate commission
      if (updatedOrder.affiliate_code) {
        const { data: affiliate } = await supabase
          .from("affiliates")
          .select("*")
          .eq("code", updatedOrder.affiliate_code)
          .maybeSingle();

        if (affiliate) {
          const commissionAmount = updatedOrder.amount * (affiliate.commission_rate || 0.2);

          await supabase.from("transactions").insert([{
            affiliate_id: affiliate.id,
            code: updatedOrder.affiliate_code,
            user_email: updatedOrder.user_email,
            amount: commissionAmount,
            currency: "INR",
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            status: "completed",
          }]);
        }
      }

      res.json({ success: true, data: updatedOrder });
    } catch (err) {
      console.error("❌ Verify payment error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  })
);

// 🔓 Public Razorpay key
router.get("/key", (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

module.exports = router;
