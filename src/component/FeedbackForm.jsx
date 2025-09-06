import React, { useState } from "react";
import "../styles/cards.css";

const FeedbackForm = ({ defaultName = "" , onSubmit }) => {
  const [name, setName] = useState(defaultName);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    onSubmit({ name: name || "Anonymous", feedback });
    setFeedback("");
    setSubmitted(true);

    setTimeout(() => setSubmitted(false), 2000); // success message fade
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
        <button type="submit" className="feedback-btn">
          Submit
        </button>
      </form>

      {submitted && <p className="feedback-success">✅ Thanks for your feedback!</p>}
    </div>
  );
};

export default FeedbackForm;