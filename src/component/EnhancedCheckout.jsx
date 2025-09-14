// frontend/components/EnhancedCheckout.jsx
import React from "react";

const EnhancedCheckout = ({ amount, bookData, customerInfo, onSuccess, onError, onCancel }) => {
  const handleCheckout = async () => {
    try {
      // 1. Create Razorpay order
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "INR",
          name: customerInfo.name,
          email: customerInfo.email,
        }),
      });

      const order = await res.json();
      if (!order.success) throw new Error(order.error || "Order creation failed");

      // 2. Open Razorpay widget
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID, // from .env
        amount: order.amount,
        currency: order.currency,
        name: "Snowstorm Store",
        description: bookData?.title || "eBook Purchase",
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify payment
            const verifyRes = await fetch("/api/payments/verify-and-fulfill", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: order.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                bookId: bookData?._id,
                customer: customerInfo,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              onSuccess?.(verifyData);
            } else {
              onError?.(verifyData.error || "Verification failed");
            }
          } catch (err) {
            onError?.(err.message);
          }
        },
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
        },
        theme: { color: "#3399cc" },
        modal: { ondismiss: () => onCancel?.() },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      onError?.(err.message);
    }
  };

  return (
    <button className="checkout-btn" onClick={handleCheckout}>
      Pay ₹{amount / 100} Securely
    </button>
  );
};

export default EnhancedCheckout;