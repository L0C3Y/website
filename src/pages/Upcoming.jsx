// src/pages/Upcoming.jsx
import React, { useState, useEffect } from "react";
import UpcomingCard from "../component/UpcomingCard";
import { supabase } from "../supabaseClient";
import c from "../../public/calisupcoming.png";

const ebooks = [
  {
    id: 3,
    title: "Calisthenics GuideBook",
    description: "Learn bodyweight exercises and build strength anywhere.",
    cover: c,
    releaseDate: "2025-10-11",
  },
];

export default function Upcoming() {
  const [email, setEmail] = useState("");
  const [registeredEbooks, setRegisteredEbooks] = useState({});

  // Load registration info from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("registeredEbooks");
    if (saved) setRegisteredEbooks(JSON.parse(saved));
  }, []);

  // Save registration info to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("registeredEbooks", JSON.stringify(registeredEbooks));
  }, [registeredEbooks]);

  // Check if email already registered
  const checkRegistration = async (email, ebookId) => {
    if (!email) return false;
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("email", email)
      .eq("ebook_id", ebookId);

    if (error) console.error("Supabase check error:", error.message);
    return data?.length > 0;
  };

  // Generate unique code
  const generateUniqueCode = async (ebookId) => {
    let code;
    let exists = true;

    while (exists) {
      code = "30OFF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data, error } = await supabase
        .from("registrations")
        .select("id")
        .eq("ebook_id", ebookId)
        .eq("code", code);

      if (error) console.error("Supabase check error:", error.message);
      exists = data?.length > 0;
    }

    return code;
  };

  // Handle registration
  const handleRegister = async (email, ebookId) => {
    const alreadyRegistered = await checkRegistration(email, ebookId);
    if (alreadyRegistered) {
      alert("Already registered! Check your email for discount.");
      setRegisteredEbooks((prev) => ({ ...prev, [ebookId]: true }));
      return false;
    }

    const code = await generateUniqueCode(ebookId);

    const { error } = await supabase
      .from("registrations")
      .insert([{ email, ebook_id: ebookId, code }]);

    if (error) {
      console.error("Supabase insert error:", error.message);
      alert("Failed to register. Try again.");
      return false;
    }

    // Optionally send email here

    setRegisteredEbooks((prev) => ({ ...prev, [ebookId]: true }));
    alert(`Registered! Your 30% discount code: ${code}`);
    return true;
  };

  // Realtime subscription to detect deleted rows
  useEffect(() => {
    const subscription = supabase
      .channel("public:registrations")
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "registrations" },
        (payload) => {
          const deleted = payload.old;
          setRegisteredEbooks((prev) => {
            const updated = { ...prev };
            if (updated[deleted.ebook_id]) delete updated[deleted.ebook_id];
            return updated;
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-10"> Upcoming Ebooks </h1>
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {ebooks.map((ebook) => (
          <UpcomingCard
            key={ebook.id}
            ebook={ebook}
            email={email}
            setEmail={setEmail}
            onRegister={handleRegister}
            registered={registeredEbooks[ebook.id] || false}
          />
        ))}
      </div>
    </div>
  );
}
