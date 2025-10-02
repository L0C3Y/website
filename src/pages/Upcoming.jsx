import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const Upcoming = () => {
  const [email, setEmail] = useState("");
  const [registered, setRegistered] = useState(false);
  const [discountCode, setDiscountCode] = useState("");

  // Random discount code generator
  const generateCode = () => {
    return "DISC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email) return alert("Enter email");

    const code = generateCode();

    // Save to supabase
    const { data, error } = await supabase
      .from("registrations")
      .insert([{ email, code }])
      .select();

    if (error) {
      alert("Already registered with this email!");
      return;
    }

    setRegistered(true);
    setDiscountCode(code);

    // Save to localStorage
    localStorage.setItem("email", email);
    localStorage.setItem("discountCode", code);
    localStorage.setItem("registered", "true");
  };

  // Check on reload
  useEffect(() => {
    const savedEmail = localStorage.getItem("email");
    const savedCode = localStorage.getItem("discountCode");

    const checkSupabase = async () => {
      if (savedEmail) {
        let { data } = await supabase
          .from("registrations")
          .select("email, code")
          .eq("email", savedEmail)
          .single();

        if (data) {
          setRegistered(true);
          setDiscountCode(data.code);
        } else {
          // Row deleted from Supabase → reset
          localStorage.clear();
          setRegistered(false);
          setDiscountCode("");
        }
      }
    };

    checkSupabase();
  }, []);

  return (
    <div className="p-6">
      {!registered ? (
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="border p-2 rounded w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Register
          </button>
        </form>
      ) : (
        <div className="mt-6 p-4 border rounded bg-green-50 text-center">
          <h2 className="text-lg font-bold text-green-700">
            ✅ Registration Successful!
          </h2>
          <p className="mt-2">Here is your <b>30% discount code:</b></p>
          <div className="text-2xl font-mono bg-gray-200 p-2 mt-2 rounded">
            {discountCode}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Use this code at checkout to get 30% off your book.
          </p>
        </div>
      )}
    </div>
  );
};

export default Upcoming;
