const express = require("express");
const router = express.Router();

router.get("/razorpay", (req, res) => {
  res.json({
    key: process.env.RAZORPAY_KEY_ID, // only send public key
  });
});

module.exports = router;