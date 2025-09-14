require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/media', express.static(path.join(__dirname, '../media')));

// Route Imports (Make sure each of these files exports a router)
const configRoutes = require("./routes/config");
const ebookRoutes = require("./routes/ebooks");
const paymentRoutes = require("./routes/payments");
const ordersRouter = require("./routes/orders");
const userRoutes = require("./routes/users");
const feedbackRoutes = require("./routes/feedback");
const affiliateRoutes = require("./routes/affiliates");


// Route Usage
app.use("/api/config", configRoutes);
app.use("/api/ebooks", ebookRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", ordersRouter);
app.use("/api/users", userRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/affiliates", affiliateRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({ message: "Snowstorm backend is alive" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`⚡ Server running at http://localhost:${PORT}`);
});
