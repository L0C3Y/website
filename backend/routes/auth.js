//backend/routes/auth.js

const express = require("express");
const router = express.Router();
const Auth = require("../models/auth");
const Users = require("../models/users");
const { asyncHandler, validate, body } = require("./middleware");

// Register
router.post("/register",
  validate([
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("username").notEmpty()
  ]),
  asyncHandler(async (req, res) => {
    const { email, password, username } = req.body;
    const user = await Auth.registerUser(email, password);
    await Users.createProfile(user.id, { username, email });
    res.json({ success: true, data: user });
  })
);

// Login
router.post("/login",
  validate([
    body("email").isEmail(),
    body("password").notEmpty()
  ]),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const token = await Auth.loginUser(email, password);
    res.json({ success: true, data: token });
  })
);

// Logout
router.post("/logout", asyncHandler(async (req, res) => {
  await Auth.logoutUser();
  res.json({ success: true, message: "Logged out" });
}));

module.exports = router;

