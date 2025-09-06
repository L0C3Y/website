import React, { useState } from "react";
import "../styles/cards.css";

const UpcomingCard = ({ ebook, onRegister }) => {
  const [email, setEmail] = useState("");
  const [registered, setRegistered] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    onRegister(email, ebook.id); // parent handles DB/API call
    setRegistered(true);
  };

  return (
    <div className="upcoming-card">
      <div className="upcoming-cover">
        <img src={ebook.cover} alt={ebook.title} />
      </div>

      <h3>{ebook.title}</h3>
      <p>{ebook.description}</p>
      <p className="release">Coming on: {ebook.releaseDate}</p>

      {!registered ? (
        <form onSubmit={handleSubmit} className="register-form">
          <input
            type="email"
            placeholder="Enter email for 30% off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="ebook-btn">Register</button>
        </form>
      ) : (
        <p className="registered-msg">✔ Registered! You’ll get 30% off.</p>
      )}
    </div>
  );
};

export default UpcomingCard;