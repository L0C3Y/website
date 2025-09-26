// components/UpcomingCard.jsx
import React, { useState, useEffect } from "react";
import "../styles/cards.css"; // keep your styles or upgrade with Tailwind

const UpcomingCard = ({ ebook, onRegister }) => {
  const [email, setEmail] = useState("");
  const [registered, setRegistered] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  // Countdown timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const release = new Date(ebook.releaseDate);
      const diff = release - now;

      if (diff <= 0) {
        setTimeLeft("Released!");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [ebook.releaseDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      alert("Enter a valid email");
      return;
    }
    onRegister(email, ebook.id);
    setRegistered(true);
    setEmail("");
  };

  return (
    <div className="upcoming-card bg-white shadow-lg rounded-xl overflow-hidden flex flex-col items-center p-4">
      <div className="upcoming-cover mb-4 w-full">
        <img src={ebook.cover} alt={ebook.title} className="w-full h-64 object-cover rounded-lg" />
      </div>

      <h3 className="text-xl font-bold text-center mb-2">{ebook.title}</h3>
      <p className="text-gray-600 text-center mb-2">{ebook.description}</p>
      <p className="text-gray-500 text-sm mb-2">Coming on: {ebook.releaseDate}</p>
      <p className="text-red-500 font-semibold mb-4">{timeLeft}</p>

      {!registered ? (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
          <input
            type="email"
            placeholder="Enter email for 30% off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded-lg p-2 w-full"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg p-2 font-semibold hover:bg-blue-700"
          >
            Register
          </button>
        </form>
      ) : (
        <p className="text-green-600 font-semibold mt-2">✔ Registered! You’ll get 30% off.</p>
      )}
    </div>
  );
};

export default UpcomingCard;
