// src/pages/Ebooks.jsx
import React from "react";
import EnhancedCheckout from "../component/EnhancedCheckout.jsx";

const Ebooks = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Buy eBook</h1>
      <p>Price: ₹199</p>
      <EnhancedCheckout amount={199} ebookId="ebook001" />
    </div>
  );
};

export default Ebooks;