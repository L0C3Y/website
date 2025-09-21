import React, { useContext, useState } from "react";
import { AffiliateContext } from "../App";

// ✅ Use Vite environment variable
const BACKEND_URL = import.meta.env.VITE_API_URL;

const EnhancedCheckout = ({ amount, ebookId }) => {
  const { code: affiliateCode } = useContext(AffiliateContext);
  const [loading, setLoading] = useState(false);

  // Safe JSON fetch
  const safeJsonFetch = async (url, options) => {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("Backend returned invalid JSON:", text);
      throw new Error("Backend returned invalid JSON");
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Login required to purchase");

      // 1️⃣ Get Razorpay key
      const keyData = await safeJsonFetch(`${BACKEND_URL}/api/payments/key`);
      if (!keyData.key) throw new Error("Razorpay key missing from backend");

      // 2️⃣ Create order
      const orderData = await safeJsonFetch(`${BACKEND_URL}/api/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ebookId, amount, affiliateCode }),
      });

      if (!orderData.success || !orderData.razorpayOrder)
        throw new Error(orderData.error || "Order creation failed");

      const { razorpayOrder, order } = orderData;

      // 3️⃣ Razorpay checkout
      if (!window.Razorpay)
        throw new Error("Razorpay not loaded. Add checkout.js in index.html");

      const options = {
        key: keyData.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Zorgath eBook Store",
        description: "Purchase your eBook instantly",
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            const verifyData = await safeJsonFetch(`${BACKEND_URL}/api/payments/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: order.id,
              }),
            });

            if (!verifyData.success) alert("❌ Payment verification failed");
            else alert("✅ Payment successful! Download available shortly.");
          } catch (err) {
            console.error("Verification error:", err);
            alert("❌ Payment verification failed: " + err.message);
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem("user"))?.name || "User",
          email: JSON.parse(localStorage.getItem("user"))?.email || "user@example.com",
          contact: "9999999999",
        },
        theme: { color: "#0b61acff" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment error:", err);
      alert("❌ Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={`w-full py-3 rounded-lg font-semibold text-lg transition ${
        loading
          ? "bg-gray-600 cursor-not-allowed"
          : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
      }`}
    >
      {loading ? "⏳ Processing..." : `💳 Pay ₹${amount}`}
    </button>
  );
};

export default EnhancedCheckout;
