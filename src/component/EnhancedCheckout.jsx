import React, { useEffect, useState } from "react";
import axios from "axios";

const EnhancedCheckout = ({ amount }) => {
  const [key, setKey] = useState("");

  // Fetch public key from backend
  useEffect(() => {
    const fetchKey = async () => {
      const { data } = await axios.get("http://localhost:5000/api/payments/key");
      setKey(data.key);
    };
    fetchKey();
  }, []);

  const handlePayment = async () => {
    try {
      // Create order
      const { data } = await axios.post("http://localhost:5000/api/payments/create-order", { amount });

      const options = {
        key: key,
        amount: data.amount,
        currency: data.currency,
        name: "Your Website",
        description: "Purchase",
        order_id: data.id,
        handler: async function (response) {
          // Verify payment
          await axios.post("http://localhost:5000/api/payments/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          alert("Payment Successful!");
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Payment Failed");
    }
  };

  return <button onClick={handlePayment} disabled={!key}>Pay {amount} INR</button>;
};

export default EnhancedCheckout;
