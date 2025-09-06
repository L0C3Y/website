const mongoose = require("mongoose");

const affiliateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  commissionRate: {
    type: Number,
    default: 0.1, // 10% by default
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  referredSales: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Affiliate", affiliateSchema);