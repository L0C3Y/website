import { useState } from "react";

const EnhancedCheckout = ({ amount, ebookId, affiliateCode }) => {
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

      // 1️⃣ Get Razorpay public key from backend
      const keyRes = await fetch("http://localhost:5000/api/payments/key");
      const { key } = await keyRes.json();
      if (!key) throw new Error("Razorpay key not found");

      // 2️⃣ Create Razorpay order via backend
      const orderRes = await fetch("http://localhost:5000/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ebookId, amount, affiliateCode }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.error || "Failed to create order");

      const { razorpayOrder } = orderData;

      // 3️⃣ Razorpay options
      const options = {
        key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "eBook Store",
        description: "Purchase eBook",
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            // 4️⃣ Verify payment with backend
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
              }),
            });

            const verifyData = await verifyRes.json();
            alert(verifyData.success ? "✅ Payment successful!" : "❌ Payment verification failed!");
          } catch (err) {
            console.error("Verification error:", err);
            alert("❌ Payment verification failed!");
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
      alert("❌ Something went wrong while processing payment!");
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
