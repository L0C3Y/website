const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Transaction = require("../models/transaction");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @route   POST /api/payments/create-order
 * @desc    Create Razorpay Order and store pending transaction
 * @access  Public
 */
router.post("/create-order", async (req, res) => {
  try {
    const {
      amount,
      currency = "INR",
      userName,
      userEmail,
      code,
      affiliateId,
      metadata = {},
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    const options = {
      amount: amount * 100,
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const txn = new Transaction({
      affiliateId: affiliateId || null,
      code: code || null,
      userName,
      userEmail,
      amount,
      currency,
      razorpay_order_id: order.id,
      status: "pending",
      metadata,
    });

    await txn.save();

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      transactionId: txn._id,
    });
  } catch (err) {
    console.error("❌ Create Order Error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay Payment and update transaction
 * @access  Public
 */
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !transactionId
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    const isValid = expectedSign === razorpay_signature;

    const txn = await Transaction.findById(transactionId);
    if (!txn) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    txn.razorpay_payment_id = razorpay_payment_id;
    txn.razorpay_signature = razorpay_signature;
    txn.status = isValid ? "completed" : "failed";
    await txn.save();

    if (isValid) {
      return res.json({
        success: true,
        message: "Payment verified successfully",
        transactionId: txn._id,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid signature",
        transactionId: txn._id,
      });
    }
  } catch (err) {
    console.error("❌ Verify Payment Error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

/**
 * @route   POST /api/payments/refund
 * @desc    Initiate a refund for a completed transaction
 * @access  Admin
 */
router.post("/refund", async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const txn = await Transaction.findById(transactionId);
    if (!txn || txn.status !== "completed") {
      return res.status(404).json({ error: "Refundable transaction not found" });
    }

    const refund = await razorpay.payments.refund(txn.razorpay_payment_id, {
      amount: txn.amount * 100,
    });

    txn.status = "refunded";
    txn.metadata.refund = refund;
    await txn.save();

    res.json({ success: true, message: "Refund initiated", refund });
  } catch (err) {
    console.error("❌ Refund Error:", err);
    res.status(500).json({ error: "Refund failed" });
  }
});

/**
 * @route   POST /api/payments/webhook
 * @desc    Razorpay Webhook Listener
 * @access  Public
 */
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("⚠ Invalid webhook signature");
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = JSON.parse(req.body);

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      await Transaction.findOneAndUpdate(
        { razorpay_payment_id: payment.id },
        { status: "completed" }
      );

      console.log(`✅ Webhook: Payment ${payment.id} marked as completed`);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Webhook Error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * @route   GET /api/payments/:id
 * @desc    Get transaction by ID
 * @access  Public
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const txn = await Transaction.findById(id);
    if (!txn) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(txn);
  } catch (err) {
    console.error("❌ Fetch Transaction Error:", err);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

/**
 * @route   GET /api/payments
 * @desc    List transactions with pagination and filters
 * @access  Admin
 */
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 50, status, email } = req.query;
    const query = {};

    if (status) query.status = status;
    if (email) query.userEmail = email;

    const txns = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      transactions: txns,
    });
  } catch (err) {
    console.error("❌ List Transactions Error:", err);
    res.status(500).json({ error: "Failed to list transactions" });
  }
});

module.exports = router;