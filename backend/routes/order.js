const express = require("express");
const router = express.Router();
const Orders = require("../models/orders"); // Supabase-based now
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");

// Create Razorpay order + store pending order in Supabase
router.post("/create", async (req, res) => {
  const { userId, ebookId, amount } = req.body;
  if (!userId || !ebookId || !amount) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    // Razorpay order
    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `ebook_${ebookId}_${Date.now()}`,
    };
    const razorpayOrder = await razorpay.orders.create(options);

    // Save pending order in Supabase
    const dbOrder = await Orders.createOrder(userId, ebookId);

    res.json({ razorpayOrder, dbOrder });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create Razorpay order" });
  }
});

// Verify Razorpay payment signature + update Supabase order
router.post("/verify", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  try {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = hmac.digest("hex");

    if (digest !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Mark order as completed in Supabase
    const updated = await Orders.updateOrderStatus(orderId, "completed");

    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message || "Payment verification failed" });
  }
});

module.exports = router;