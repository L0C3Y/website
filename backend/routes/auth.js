// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const Auth = require("../models/auth");
const Users = require("../models/users");

// Register user + auto profile
router.post("/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    // 1. Create user in Supabase auth
    const user = await Auth.registerUser(email, password);

    // 2. Create linked profile in custom table
    await Users.createProfile(user.id, { username, email });

    res.json({ success: true, data: user });
  } catch (err) {
    console.error("Auth register error:", err.message);
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await Auth.loginUser(email, password);
    res.json({ success: true, data: token });
  } catch (err) {
    console.error("Auth login error:", err.message);
    res.status(401).json({ success: false, error: "Invalid credentials" });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    await Auth.logoutUser();
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("Auth logout error:", err.message);
    res.status(500).json({ success: false, error: "Logout failed" });
  }
});

module.exports = router;