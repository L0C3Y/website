// src/pages/upcoming.jsx
import React from "react";
import UpcomingCard from "../component/UpcomingCard";
import { supabase } from "../supabaseClient"; // ../ goes up one folder from pages/
import c from "../../public/calisupcoming.png";

const ebooks = [
  {
    id: 3,
    title: "Calisthenics GuideBook",
    description: "Learn bodyweight exercises and build strength anywhere.",
    cover: c,
    releaseDate: "2025-10-11T00:00:00",
  }
];

export default function Upcoming() {

  const handleRegister = async (email, ebookId) => {
    try {
      const { data, error } = await supabase
        .from("registrations")
        .insert([{ email, ebook_id: ebookId }]);

      if (error) {
        console.error("❌ Registration error:", error.message);
        alert("Failed to register. Try again.");
      } else {
        console.log("✅ Registered:", data);
        alert("Registered! You’ll be notified for the ebook.");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong. Try again.");
    }
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
