import React, { useEffect, useState } from "react";
import FeedbackForm from "../component/FeedbackForm";

const Feedback = ({ ebookId }) => {
  const [user, setUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);

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
      try {
        const res = await fetch(`${API_URL}/api/feedbacks/${ebookId}`);
        const data = await res.json();
        if (data.success) setFeedbacks(data.data || []);
      } catch (err) {
        console.error("Error fetching feedbacks:", err);
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
          userName: name || "Anonymous",
        }),
      });
      const data = await res.json();

      if (data.success) {
        setFeedbacks((prev) => [...prev, data.data]);
      } else {
        alert("❌ Failed to submit feedback: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("❌ Error submitting feedback");
    }
  };

  return (
    <div className="feedback-page">
      <h2>User Feedback</h2>
      <FeedbackForm
        defaultName={user?.name || ""}
        onSubmit={handleFeedbackSubmit}
      />

      <h3>All Feedbacks</h3>
      {feedbacks.length === 0 ? (
        <p>No feedbacks yet.</p>
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