//backend/routes/orders.js

const express = require("express");
const router = express.Router();
const Orders = require("../models/orders");
const razorpay = require("../utils/razorpay");
const crypto = require("crypto");
const { asyncHandler, authMiddleware, validate, body } = require("./middleware");

// Create order
router.post("/create",
  authMiddleware,
  validate([body("userId").notEmpty(), body("ebookId").notEmpty(), body("amount").isFloat({ min: 1 })]),
  asyncHandler(async (req, res) => {
    const { userId, ebookId, amount } = req.body;
    const options = { amount: amount * 100, currency: "INR", receipt: ebook_${ebookId}_${Date.now()} };
    const razorpayOrder = await razorpay.orders.create(options);
    const dbOrder = await Orders.createOrder(userId, ebookId, amount);
    res.json({ success: true, razorpayOrder, dbOrder });
  })
);

// Verify payment
router.post("/verify",
  authMiddleware,
  validate([body("razorpay_order_id").notEmpty(), body("razorpay_payment_id").notEmpty(), body("razorpay_signature").notEmpty(), body("orderId").notEmpty()]),
  asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const digest = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(${razorpay_order_id}|${razorpay_payment_id})
      .digest("hex");
    if (digest !== razorpay_signature) return res.status(400).json({ success: false, error: "Payment verification failed" });

    const updated = await Orders.updateOrderStatus(orderId, "completed");
    res.json({ success: true, data: updated });
  })
);

module.exports = router;


