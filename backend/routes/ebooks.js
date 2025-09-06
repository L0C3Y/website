// backend/routes/ebooks.js
const express = require("express");
const router = express.Router();
const Ebooks = require("../models/ebooks");

// GET all published ebooks
router.get("/", async (req, res) => {
  try {
    const ebooks = await Ebooks.getAllEbooks();
    res.json({ success: true, data: ebooks });
  } catch (err) {
    console.error("Error fetching ebooks:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch ebooks" });
  }
});

// GET upcoming ebooks
router.get("/upcoming", async (req, res) => {
  try {
    const ebooks = await Ebooks.getUpcomingEbooks();
    res.json({ success: true, data: ebooks });
  } catch (err) {
    console.error("Error fetching upcoming ebooks:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch upcoming ebooks" });
  }
});

// POST register for upcoming ebook discount
router.post("/upcoming/register", async (req, res) => {
  const { ebookId, email } = req.body;
  if (!ebookId || !email) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  try {
    const registration = await Ebooks.registerForUpcoming(ebookId, email);
    res.json({ success: true, data: registration });
  } catch (err) {
    console.error("Error registering for upcoming ebook:", err.message);
    res.status(500).json({ success: false, error: "Failed to register" });
  }
});

module.exports = router;