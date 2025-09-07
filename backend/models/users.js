// backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ["admin", "affiliate", "customer"], default: "customer" },
  affiliateId: { type: mongoose.Schema.Types.ObjectId, ref: "Affiliate", default: null },
  createdAt: { type: Date, default: Date.now },
});

// virtual to set password
userSchema.methods.setPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plain, salt);
};

userSchema.methods.verifyPassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);