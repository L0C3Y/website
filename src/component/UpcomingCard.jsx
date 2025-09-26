// pages/upcoming.jsx
import React, { useState } from "react";
import UpcomingCard from "../components/UpcomingCard"; // adjust path if needed

// Sample ebook data
const ebooks = [
  {
    id: 1,
    title: "Mastering Mind Power",
    description: "Unlock the secrets of mental strength and focus.",
    cover: "/covers/mind-power.jpg",
    releaseDate: "2025-10-10",
  },
  {
    id: 2,
    title: "Quantum Habits",
    description: "Build habits that change your life at the atomic level.",
    cover: "/covers/quantum-habits.jpg",
    releaseDate: "2025-11-01",
  },
  {
    id: 3,
    title: "Calisthenics GuideBook",
    description: "Learn bodyweight exercises and build strength anywhere.",
    cover: "/covers/calis.png", // make sure this file exists in /public/covers
    releaseDate: "2025-12-05",
  },
];

export default function Upcoming() {
  const [registrations, setRegistrations] = useState([]);

  const handleRegister = (email, ebookId) => {
    setRegistrations((prev) => [...prev, { email, ebookId }]);
    console.log(`Registered ${email} for ebook ${ebookId}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-10">🚀 Upcoming Ebooks 🚀</h1>
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {ebooks.map((ebook) => (
          <UpcomingCard key={ebook.id} ebook={ebook} onRegister={handleRegister} />
        ))}
      </div>
    </div>
  );
}
