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

// Routes
app.use("/api/config", require("./routes/config"));
app.use("/api/ebooks", require("./routes/ebooks"));
app.use("/api/payments", require("./routes/payments"));
const ordersRouter = require('./routes/orders');
app.use("/api/orders", ordersRouter);
app.use("/api/users", require("./routes/users"));
app.use("/api/feedbacks", require("./routes/feedback"));
app.use("/api/affiliates", require("./routes/affiliates"));

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Snowstorm backend is alive" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`⚡ Server running at http://localhost:${PORT}`);
});