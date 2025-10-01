// src/pages/Upcoming.jsx
import React from "react";
import UpcomingCard from "../component/UpcomingCard";
import { supabase } from "../supabaseClient";
import c from "../../public/calisupcoming.png";

const ebooks = [
  {
    id: 3,
    title: "Calisthenics GuideBook",
    description: "Learn bodyweight exercises and build strength anywhere.",
    cover: c,
    releaseDate: "2025-10-11T00:00:00",
  },
];

export default function Upcoming() {
  const handleRegister = async (email, ebookId, checkOnly = false) => {
    try {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("ebook_id", ebookId)
        .eq("email", email || "");

      if (error) {
        console.error("Supabase error:", error.message);
        if (!checkOnly) alert("Registration failed. Try again.");
        return checkOnly ? { data: [] } : false;
      }

      if (checkOnly) return { data };

      if (data?.length > 0) {
        alert("You have already registered! Check your email for the discount code.");
        return false;
      }

      const code = "30OFF-" + Math.random().toString(36).substring(2, 8).toUpperCase();

      const { error: insertError } = await supabase
        .from("registrations")
        .insert([{ email, ebook_id: ebookId, code }]);

      if (insertError) {
        console.error("Supabase insert error:", insertError.message);
        alert("Failed to register. Try again.");
        return false;
      }

      await fetch("/api/sendCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      alert("Registered! 🎉 Check your email for the 30% discount code.");
      return true;
    } catch (err) {
      console.error("Unexpected error:", err);
      if (!checkOnly) alert("Something went wrong. Try again.");
      return checkOnly ? { data: [] } : false;
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
