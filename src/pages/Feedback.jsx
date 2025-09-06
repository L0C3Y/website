import React from "react";
import FeedbackForm from "../component/FeedbackForm";

const Feedback = () => {
  const handleFeedbackSubmit = ({ name, feedback }) => {
    console.log("Feedback received:", name, feedback);
    // ⚔️ Later → send POST to backend `/feedbacks`
  };

  return (
    <div>
      <h2>User Feedback</h2>
      <FeedbackForm defaultName="Zorgath" onSubmit={handleFeedbackSubmit} />
    </div>
  );
};

export default Feedback;