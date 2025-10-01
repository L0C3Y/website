import React from "react";
import UpcomingCard from "../component/UpcomingCard";
import { supabase } from "../supabaseClient";
import c from "../../public/calisupcoming.png";

// Sample ebook data
const ebooks = [
  {
    id: 3,
    title: "Calisthenics GuideBook",
    description: "Learn bodyweight exercises and build strength anywhere.",
    cover: c,
    releaseDate: "2025-10-11",
  },
];

// Generate discount code
const generateDiscountCode = () => {
  return "30OFF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function Upcoming() {
  const handleRegister = async (email, ebookId) => {
    try {
      // Prevent duplicates
      const { data: existing } = await supabase
        .from("registrations")
        .select("*")
        .eq("email", email)
        .eq("ebook_id", ebookId);

      if (existing.length > 0) {
        alert(
          "You have already registered! Check your email for the discount code."
        );
        return false;
      }

      const code = generateDiscountCode();

      // Save to Supabase
      const { error } = await supabase
        .from("registrations")
        .insert([{ email, ebook_id: ebookId, code }]);

      if (error) {
        console.error(error);
        alert("Failed to register. Try again.");
        return false;
      }

      // Send email via API route
      const emailRes = await fetch("/api/sendCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (!emailRes.ok) {
        alert(
          "Registered, but failed to send email. Check your registration later."
        );
        return true;
      }

      alert("Registered! 🎉 Check your email for the 30% discount code.");
      return true;
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Try again.");
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-10">🚀 Upcoming Ebooks 🚀</h1>
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {ebooks.map((ebook) => (
          <UpcomingCard
            key={ebook.id}
            ebook={ebook}
            onRegister={handleRegister}
          />
        ))}
      </div>
    </div>
  );
}
