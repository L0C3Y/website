// backend/models/Affiliate.js
const mongoose = require("mongoose");

const affiliateSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // random characters used in link
  name: { type: String, required: true },
  email: { type: String },
  commissionRate: { type: Number, default: 0.20 }, // 20% by default
  clicks: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 }, // sum of amounts from sales
  totalCommission: { type: Number, default: 0 }, // sum of commission owed
  totalPaid: { type: Number, default: 0 }, // total paid out
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Affiliate", affiliateSchema);
