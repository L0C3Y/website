// backend/routes/users.js
const express = require("express");
const router = express.Router();
const Users = require("../models/users");

// GET profile by user_id
router.get("/:id", async (req, res) => {
  try {
    const user = await Users.getProfile(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("Users getProfile error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

// UPDATE profile
router.put("/:id", async (req, res) => {
  try {
    const user = await Users.updateProfile(req.params.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    console.error("Users updateProfile error:", err.message);
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
});

// DELETE profile
router.delete("/:id", async (req, res) => {
  try {
    await Users.deleteProfile(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("Users deleteProfile error:", err.message);
    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
});

module.exports = router;