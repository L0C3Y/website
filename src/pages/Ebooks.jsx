import React, { useState } from "react";

const Ebooks = ({ ebooks, customerInfo }) => {
  const [loading, setLoading] = useState(false);

  // Format price to INR
  const formatPrice = (amount) => `₹${amount.toFixed(2)}`;

  const handleBuy = async (book) => {
    setLoading(true);
    try {
      // 1️⃣ Create order on backend
      const res = await fetch("http://localhost:5000/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // JWT
        },
        body: JSON.stringify({
          amount: book.price,
          bookId: book.id,
          bookTitle: book.title,
          currency: "INR",
        }),
      });

      const { order } = await res.json();
      if (!order) throw new Error("Order creation failed");

      // 2️⃣ Open Razorpay checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID, // Your Razorpay Key
        amount: order.amount,
        currency: order.currency,
        name: "Ebook Store",
        description: book.title,
        order_id: order.id,
        handler: async function (response) {
          // 3️⃣ Verify payment with backend
          const verifyRes = await fetch("http://localhost:5000/api/payments/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: customerInfo._id,
              bookId: book.id,
              bookTitle: book.title,
              amount: book.price,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert("Payment successful! Order saved.");
          } else {
            alert("Payment verification failed!");
          }
        },
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
        },
        theme: {
          color: "#F37254",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed, check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ebooks-container">
      {ebooks.map((book) => (
        <div key={book.id} className="ebook-card">
          <h3>{book.title}</h3>
          <p>{formatPrice(book.price)}</p>
          <button onClick={() => handleBuy(book)} disabled={loading}>
            {loading ? "Processing..." : "Buy Now"}
          </button>
        </div>
      ))}
    </div>
  );
};

export default Ebooks;