import React from "react";
import axios from "axios";

export default function Checkout({ amount }) {
  const handlePayment = async () => {
    try {
      // 1. Create order on backend
      const { data: order } = await axios.post("http://localhost:5000/api/payment/orders", {
        amount,
      });

      // 2. Initialize Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // from .env
        amount: order.amount,
        currency: "INR",
        name: "Snowstorm Store",
        description: "Ebook Purchase",
        order_id: order.id,
        handler: async function (response) {
          // Send payment verification to backend
          const verifyRes = await axios.post("http://localhost:5000/api/payment/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verifyRes.data.success) {
            alert("✅ Payment successful!");
          } else {
            alert("❌ Payment verification failed!");
          }
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Payment failed. Try again.");
    }
  };

  return (
    <button onClick={handlePayment} className="pay-btn">
      Pay ₹{amount / 100}
    </button>
  );
}