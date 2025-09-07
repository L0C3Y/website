// backend/models/Visit.js
const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({
  affiliateId: { type: mongoose.Schema.Types.ObjectId, ref: "Affiliate" },
  code: { type: String }, // affiliate code for quick queries
  ip: String,
  userAgent: String,
  referrer: String,
  landingPath: String,
  name: String,
  email: String,
  phone: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Visit", visitSchema);
