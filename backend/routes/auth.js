const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { asyncHandler, body, validate } = require("./middleware");
const bcrypt = require("bcrypt");
const { supabase } = require("../supabase");

// Register user
router.post(
  "/register",
  validate([
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ]),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password: hashedPassword }])
      .select()
      .single();

    if (error) return res.status(400).json({ success: false, error: error.message });

    const token = jwt.sign({ id: data.id, name: data.name, email: data.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ success: true, user: data, token });
  })
);

// Login user
router.post(
  "/login",
  validate([body("email").isEmail(), body("password").notEmpty()]),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) return res.status(400).json({ success: false, error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, data.password);
    if (!isMatch) return res.status(400).json({ success: false, error: "Invalid email or password" });

    const token = jwt.sign({ id: data.id, name: data.name, email: data.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ success: true, user: data, token });
  })
);

module.exports = router;