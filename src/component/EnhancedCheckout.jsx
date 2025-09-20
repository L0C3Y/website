import React, { useContext, useState } from "react";
import { AffiliateContext } from "../App";

const EnhancedCheckout = ({ amount, ebookId }) => {
  const { code: affiliateCode } = useContext(AffiliateContext);
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_API_URL; // ← Render backend URL

  const handlePayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("⚠️ Please login first!");
        setLoading(false);
        return;
      }

      // 1️⃣ Get Razorpay key
      const keyRes = await fetch(`${BACKEND_URL}/api/payments/key`);
      const keyData = await keyRes.json();
      if (!keyData.key) throw new Error("Razorpay key not found");

      // 2️⃣ Create order
      const orderRes = await fetch(`${BACKEND_URL}/api/payments/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ebookId, amount, affiliateCode }),
      });

      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error || "Failed to create order");

      const { razorpayOrder, order } = orderData;
      if (!razorpayOrder) throw new Error("Razorpay order creation failed");

      // 3️⃣ Razorpay checkout
      if (!window.Razorpay) {
        throw new Error(
          "Razorpay script not loaded. Add https://checkout.razorpay.com/v1/checkout.js in index.html"
        );
      }

      const options = {
        key: keyData.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Zorgath eBook Store",
        description: "Purchase your eBook instantly",
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${BACKEND_URL}/api/payments/verify`, {
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

            const verifyData = await verifyRes.json();
            if (!verifyData.success) {
              console.error("Backend verification error:", verifyData.error);
              alert("❌ Payment verification failed: " + verifyData.error);
            } else {
              alert("✅ Payment successful! Download will be available shortly.");
            }
          } catch (err) {
            console.error("Verification fetch error:", err);
            alert("❌ Payment verification failed: " + err.message);
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem("user"))?.name || "User",
          email: JSON.parse(localStorage.getItem("user"))?.email || "user@gmail.com.com",
          contact: "9999999999",
        },
        theme: { color: "#0b61acff" }, // emerald green premium vibe
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
      className={`w-full py-3 rounded-lg font-semibold text-lg transition 
        ${loading ? "bg-gray-600 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"}`}
    >
      {loading ? "⏳ Processing..." : `💳 Pay ₹${amount}`}
    </button>
  );
};

export default EnhancedCheckout;
