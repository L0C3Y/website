import React, { useEffect, useState } from "react";
import FeedbackForm from "../component/FeedbackForm";

const Feedback = ({ ebookId }) => {
  const [user, setUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load logged-in user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  // Normalize API base URL (avoid double slashes)
  const API_URL = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

  // Fetch existing feedbacks
  useEffect(() => {
    if (!ebookId) return;

    const fetchFeedbacks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/feedbacks/${ebookId}`);
        const data = await res.json();
        if (data.success) setFeedbacks(data.data || []);
        else setError(data.error || "Failed to load feedbacks");
      } catch (err) {
        console.error("Error fetching feedbacks:", err);
        setError("Network error while fetching feedbacks");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [ebookId, API_URL]);

  // Handle new feedback submission
  const handleFeedbackSubmit = async ({ name, feedback }) => {
    if (!user) {
      alert("⚠️ Please login first!");
      return;
    }

    setError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/feedbacks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          userId: user.id,
          ebookId,
          message: feedback,
          userName: name || user.name || "Anonymous",
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Append new feedback to list immediately
        setFeedbacks((prev) => [...prev, data.data]);
      } else {
        setError(data.error || "Failed to submit feedback");
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError("Network error while submitting feedback");
    }
  };

  return (
    <div className="feedback-page">
      <h2>User Feedback</h2>

      {error && <p className="error-message">{error}</p>}

      <FeedbackForm
        defaultName={user?.name || ""}
        onSubmit={handleFeedbackSubmit}
      />

      <h3>All Feedbacks</h3>
      {loading ? (
        <p>Loading feedbacks...</p>
      ) : feedbacks.length === 0 ? (
        <p>No feedbacks yet. Be the first to leave one!</p>
      ) : (
        feedbacks.map((fb, idx) => (
          <div key={idx} className="feedback-item">
            <strong>{fb.userName || "Anonymous"}</strong>
            <p>{fb.message}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default Feedback;
