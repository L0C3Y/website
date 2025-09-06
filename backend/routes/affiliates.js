// backend/routes/affiliates.js
const express = require("express");
const router = express.Router();
const Affiliates = require("../models/affiliates");

// Register affiliate
router.post("/register", async (req, res) => {
  const { userId, referralCode } = req.body;
  if (!userId || !referralCode)
    return res.status(400).json({ success: false, error: "Missing fields" });

  try {
    const affiliate = await Affiliates.register(userId, referralCode);
    res.json({ success: true, data: affiliate });
  } catch (err) {
    console.error("Affiliate registration error:", err.message);
    res.status(500).json({ success: false, error: "Failed to register affiliate" });
  }
});

// Track affiliate referrals
router.get("/:userId", async (req, res) => {
  try {
    const referrals = await Affiliates.getReferrals(req.params.userId);
    res.json({ success: true, data: referrals });
  } catch (err) {
    console.error("Error fetching referrals:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch referrals" });
  }
});

module.exports = router;