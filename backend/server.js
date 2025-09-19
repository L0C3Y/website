// server.js ya index.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const paymentRoutes = require("./routes/payments");
const ebookRoutes = require("./routes/ebooks");
const affiliateRoutes = require("./routes/affiliates"); // ✅ Import affiliates

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/ebooks", ebookRoutes);
app.use("/api/affiliates", affiliateRoutes); // ✅ Mount affiliates

// Root test route
app.get("/", (req, res) => {
  res.send("🚀 Backend is running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
