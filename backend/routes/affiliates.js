//backend/routes/affiliates.js

const express = require("express");
const router = express.Router();
const Affiliates = require("../models/affiliates");
const { asyncHandler, authMiddleware, validate, body, param } = require("./middleware");

// Register affiliate
router.post("/register",
  authMiddleware,
  validate([body("userId").notEmpty(), body("referralCode").notEmpty()]),
  asyncHandler(async (req, res) => {
    const { userId, referralCode } = req.body;
    const affiliate = await Affiliates.register(userId, referralCode);
    res.json({ success: true, data: affiliate });
  })
);

// Get referrals
router.get("/:userId",
  authMiddleware,
  validate([param("userId").notEmpty()]),
  asyncHandler(async (req, res) => {
    const referrals = await Affiliates.getReferrals(req.params.userId);
    res.json({ success: true, data: referrals });
  })
);

module.exports = router;

