//backend/routes/users.js

const express = require("express");
const router = express.Router();
const Users = require("../models/users");
const { asyncHandler, authMiddleware, validate, param } = require("./middleware");

// GET profile
router.get("/:id",
  authMiddleware,
  validate([param("id").notEmpty()]),
  asyncHandler(async (req, res) => {
    const user = await Users.getProfile(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, data: user });
  })
);

// UPDATE profile
router.put("/:id",
  authMiddleware,
  validate([param("id").notEmpty()]),
  asyncHandler(async (req, res) => {
    const user = await Users.updateProfile(req.params.id, req.body);
    res.json({ success: true, data: user });
  })
);

// DELETE profile
router.delete("/:id",
  authMiddleware,
  validate([param("id").notEmpty()]),
  asyncHandler(async (req, res) => {
    await Users.deleteProfile(req.params.id);
    res.json({ success: true, message: "User deleted" });
  })
);

module.exports = router;

