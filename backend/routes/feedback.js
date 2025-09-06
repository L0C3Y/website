// backend/routes/feedbacks.js
const express = require("express");
const router = express.Router();
const Feedbacks = require("../models/feedbacks");

// Submit feedback
router.post("/", async (req, res) => {
  const { userId, ebookId, message } = req.body;
  if (!userId || !ebookId || !message)
    return res.status(400).json({ success: false, error: "Missing fields" });

  try {
    const feedback = await Feedbacks.addFeedback(userId, ebookId, message);
    res.json({ success: true, data: feedback });
  } catch (err) {
    console.error("Feedback error:", err.message);
    res.status(500).json({ success: false, error: "Failed to submit feedback" });
  }
});

// Get feedback for an ebook
router.get("/:ebookId", async (req, res) => {
  try {
    const feedbacks = await Feedbacks.getFeedbackByEbook(req.params.ebookId);
    res.json({ success: true, data: feedbacks });
  } catch (err) {
    console.error("Error fetching feedback:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch feedback" });
  }
});

module.exports = router;