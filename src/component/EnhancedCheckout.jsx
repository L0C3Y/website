// src/component/EnhancedCheckout.jsx
import React, { useState } from "react";

const EnhancedCheckout = ({ amount, ebookId }) => {
  const [loading, setLoading] = useState(false);

  // Optional: dynamic discount logic (e.g., first-time users)
  const discount = 50; // ₹50 off for example
  const finalPrice = amount - discount;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // 🔹 Replace this with your existing backend checkout logic
      console.log(`Processing payment for ${ebookId}, amount: ₹${finalPrice}`);
      alert(`Payment of ₹${finalPrice} successful for ${ebookId}!`);
    } catch (err) {
      console.error(err);
      alert("Payment failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", marginTop: "0.5rem" }}>
      {/* Discount Badge */}
      {discount > 0 && (
        <div
          style={{
            position: "absolute",
            top: "-10px",
            right: "-10px",
            background: "linear-gradient(135deg, #fbbf24, #f97316)",
            color: "#fff",
            padding: "0.3rem 0.6rem",
            borderRadius: "12px",
            fontWeight: "700",
            fontSize: "0.8rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          ₹{discount} OFF
        </div>
      )}

      {/* Premium Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          width: "100%",
          padding: "0.8rem 1rem",
          fontWeight: "700",
          fontSize: "1rem",
          border: "none",
          borderRadius: "12px",
          color: "#fff",
          cursor: "pointer",
          background: "linear-gradient(90deg, #2563eb 0%, #1e40af 100%)",
          boxShadow: "0 6px 20px rgba(37,99,235,0.3)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 8px 30px rgba(37,99,235,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(37,99,235,0.3)";
        }}
      >
        {loading ? "Processing..." : `Buy Now ₹${finalPrice}`}
      </button>
    </div>
  );
};

export default EnhancedCheckout;
