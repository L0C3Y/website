import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/app.css";

const Home = () => {
  const navigate = useNavigate();
  const [registered, setRegistered] = useState(false);

  const handleRegister = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);

    const data = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
    };

    console.log("⚔️ User registered:", data);
    setRegistered(true);

    // ⚔️ Later: POST /api/users
    // fetch("/api/users", { method: "POST", body: JSON.stringify(data) })
  };

  return (
    <div className="home-page">
      <header className="hero">
        <h1>Welcome to Snowstorm Shop</h1>
        <p>Claim your free PDF and explore powerful eBooks.</p>
      </header>

      {!registered ? (
        <form onSubmit={handleRegister} className="register-form">
          <input type="text" name="name" placeholder="Your Name" required />
          <input type="email" name="email" placeholder="Your Email" required />
          <input type="tel" name="phone" placeholder="Phone (optional)" />
          <button type="submit" className="hero-btn">
            Get Free PDF
          </button>
        </form>
      ) : (
        <div className="thank-you">
          <h2>⚔️ Welcome, Warrior.</h2>
          <p>
            Your free PDF is ready. Check your email. Meanwhile, explore more:
          </p>
          <div className="nav-links">
            <button onClick={() => navigate("/ebooks")} className="hero-btn">
              View eBooks
            </button>
            <button onClick={() => navigate("/upcoming")} className="hero-btn">
              Upcoming Titles
            </button>
            <button onClick={() => navigate("/feedback")} className="hero-btn">
              Give Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;