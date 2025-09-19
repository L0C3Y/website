import React, { useContext, useState } from "react";
import { AffiliateContext } from "../App"; // ✅ Use the context

const EnhancedCheckout = ({ amount, ebookId }) => {
  const { code: affiliateCode } = useContext(AffiliateContext); // get global affiliate code
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login first!");
        setLoading(false);
        return;
      }

      // 1️⃣ Get Razorpay key
      const keyRes = await fetch("http://localhost:5000/api/payments/key");
      const keyData = await keyRes.json();
      if (!keyData.key) throw new Error("Razorpay key not found");

      // 2️⃣ Create order
      const orderRes = await fetch("http://localhost:5000/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ebookId,
          amount,
          affiliateCode, // automatically uses context
        }),
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
        name: "eBook Store",
        description: "Purchase eBook",
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch("http://localhost:5000/api/payments/verify", {
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
              alert("✅ Payment successful!");
            }
          } catch (err) {
            console.error("Verification fetch error:", err);
            alert("❌ Payment verification failed: " + err.message);
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem("user"))?.name || "User",
          email: JSON.parse(localStorage.getItem("user"))?.email || "test@example.com",
          contact: "9999999999",
        },
        theme: { color: "#3399cc" },
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
    <button onClick={handlePayment} disabled={loading}>
      {loading ? "Processing..." : `Pay ₹${amount}`}
    </button>
  );
};

export default EnhancedCheckout;
