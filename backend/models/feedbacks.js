const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ebookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ebook",
    required: false, // allow feedback not tied to ebook
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add static methods for your routes
feedbackSchema.statics.addFeedback = function(userId, ebookId, message) {
  return this.create({ userId, ebookId, message });
};
feedbackSchema.statics.getFeedbackByEbook = function(ebookId) {
  return this.find({ ebookId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model("Feedback", feedbackSchema);