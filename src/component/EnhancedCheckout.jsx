// src/component/EnhancedCheckout.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const EnhancedCheckout = ({ amount, ebookId }) => {
  const [key, setKey] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Get current user from JWT in localStorage
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return alert("User not logged in");

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const decodedPayload = JSON.parse(atob(base64));
      setCurrentUser(decodedPayload);
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }, []);

  // Load Razorpay checkout script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => console.error("Razorpay script failed to load");
    document.body.appendChild(script);
  }, []);

  // Fetch Razorpay key
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/payments/key");
        setKey(data.key);
      } catch (err) {
        console.error("Error fetching key:", err);
      }
    };
    fetchKey();
  }, []);

  const handlePayment = async () => {
    if (!scriptLoaded) return alert("Payment system not ready");
    if (!currentUser) return alert("User not logged in");

    try {
      const affiliateCode = localStorage.getItem("affiliateCode") || null;

      console.log("Creating order...");
      const { data } = await axios.post(
        "http://localhost:5000/api/payments/create-order",
        {
          amount,
          userId: currentUser.id,
          ebookId,
          affiliateCode,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("Order created:", data);

      const options = {
        key,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: "Your Website",
        description: "Purchase eBook",
        order_id: data.razorpayOrder.id,
        handler: async function (response) {
          console.log("Payment response:", response);

          try {
            const verifyRes = await axios.post(
              "http://localhost:5000/api/payments/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: data.dbOrder.id,
              },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );

            console.log("Payment verified:", verifyRes.data);
            alert("Payment Successful!");
          } catch (err) {
            console.error("Payment verification failed:", err.response?.data || err);
            alert("Payment verification failed");
          }
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment creation failed:", err.response?.data || err);
      alert("Payment Failed");
    }
  };

  return (
    <button onClick={handlePayment} disabled={!key || !scriptLoaded}>
      Pay ₹{amount}
    </button>
  );
};

export default EnhancedCheckout;