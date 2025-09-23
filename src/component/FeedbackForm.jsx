import React, { useState } from "react";
import "../styles/cards.css";

const API_BASE = "https://backend-gfho.onrender.com"; // your backend URL

const FeedbackForm = ({ defaultName = "" }) => {
  const [name, setName] = useState(defaultName);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Anonymous",
          feedback,
        }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error || "Failed to submit");

      setFeedback("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-box">
      <h2>Leave Feedback</h2>
      <form onSubmit={handleSubmit} className="feedback-form">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          disabled={!!defaultName}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          placeholder="Your feedback..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          required
        ></textarea>
        <button type="submit" className="feedback-btn" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>

      {submitted && <p className="feedback-success">✅ Thanks for your Feedback!</p>}
      {error && <p className="feedback-error">❌ {error}</p>}
    </div>
  );
};

export default FeedbackForm;