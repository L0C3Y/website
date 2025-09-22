import React, { useContext, useState } from "react";
import { AffiliateContext } from "../App";

export const BACKEND_URL = import.meta.env.VITE_API_URL.replace(/\/+$/, "");

const EnhancedCheckout = ({ amount, ebookId }) => {
  const { code: affiliateCode } = useContext(AffiliateContext);
  const [loading, setLoading] = useState(false);

  const safeJsonFetch = async (url, options) => {
    const res = await fetch(url, options);
    const text = await res.text();
    try { return JSON.parse(text); } 
    catch { throw new Error("Backend returned invalid JSON"); }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Login required");

      // ✅ Public Razorpay key
      const { key } = await safeJsonFetch(`${BACKEND_URL}/api/payments/key`);

      // ✅ Create order
      const orderData = await safeJsonFetch(`${BACKEND_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, ebookId, affiliateCode }),
      });

      if (!orderData.success) throw new Error(orderData.error || "Order creation failed");

      const rzp = new window.Razorpay({
        key,
        amount: orderData.razorpayOrder.amount,
        currency: orderData.razorpayOrder.currency,
        order_id: orderData.razorpayOrder.id,
        name: "Zorgath eBook Store",
        description: "Purchase your eBook instantly",
        prefill: {
          name: JSON.parse(localStorage.getItem("user"))?.name || "User",
          email: JSON.parse(localStorage.getItem("user"))?.email || "user@example.com",
          contact: "9999999999",
        },
        theme: { color: "#0b61acff" },
        handler: async (response) => {
          try {
            const verify = await safeJsonFetch(`${BACKEND_URL}/api/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ ...response, orderId: orderData.order.id }),
            });
            if (!verify.success) alert("❌ Payment verification failed");
            else alert("✅ Payment successful!");
          } catch (err) { alert("❌ Verification error: " + err.message); }
        },
      });

      rzp.open();
    } catch (err) {
      alert("❌ Payment failed: " + err.message);
    } finally { setLoading(false); }
  };

  return (
    <button onClick={handlePayment} disabled={loading} className={`w-full py-3 rounded-lg font-semibold text-lg ${loading ? "bg-gray-600" : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"}`}>
      {loading ? "⏳ Processing..." : `💳 Pay ₹${amount}`}
    </button>
  );
};

export default EnhancedCheckout;
