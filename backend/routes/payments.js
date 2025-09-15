// backend/routes/payment.js
const express = require("express");
const router = express.Router();
const Orders = require("../models/orders");
const Affiliates = require("../models/affiliates");
const Transaction = require("../models/Transaction");
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");
const { asyncHandler, authMiddleware, validate, body } = require("./middleware");

// Create Razorpay order and save in DB
router.post(
  "/create-order",
  authMiddleware,
  validate([
    body("userId").notEmpty(),
    body("ebookId").notEmpty(),
    body("amount").isFloat({ min: 1 }),
    body("affiliateCode").optional(),
  ]),
  asyncHandler(async (req, res) => {
    const { userId, ebookId, amount, affiliateCode } = req.body;

    // 1️⃣ Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `ebook_${ebookId}_${Date.now()}`,
    });

    // 2️⃣ Save order in DB
    const dbOrder = await Orders.createOrder(userId, ebookId, affiliateCode || null, amount);

    // 3️⃣ Return both Razorpay order and DB order
    res.json({
      success: true,
      razorpayOrder,
      dbOrder,
    });
  })
);

// Verify payment
router.post(
  "/verify",
  authMiddleware,
  validate([
    body("razorpay_order_id").notEmpty(),
    body("razorpay_payment_id").notEmpty(),
    body("razorpay_signature").notEmpty(),
    body("orderId").notEmpty(),
  ]),
  asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // 1️⃣ Verify signature
    const digest = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (digest !== razorpay_signature) {
      return res.status(400).json({ success: false, error: "Payment verification failed" });
    }

    // 2️⃣ Update order status in DB
    const updatedOrder = await Orders.updateOrderStatus(orderId, "completed", {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    // 3️⃣ Handle affiliate commission if exists
    if (updatedOrder.affiliate_code) {
      const affiliateData = await Affiliates.getAffiliateStats(updatedOrder.affiliate_code);
      const commissionRate = affiliateData?.commission_rate || 0.2;
      const commissionAmount = updatedOrder.amount * commissionRate;

      await Transaction.create({
        affiliateId: affiliateData.id,
        code: updatedOrder.affiliate_code,
        userName: req.user.name,
        userEmail: req.user.email,
        amount: commissionAmount,
        currency: updatedOrder.currency,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        status: "completed",
      });
    }

    res.json({ success: true, data: updatedOrder });
  })
);

// Get Razorpay key
router.get("/key", (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

module.exports = router;