// src/pages/Ebooks.jsx
import React, { useEffect, useState } from "react";
import EnhancedCheckout from "../component/EnhancedCheckout.jsx";

const Ebooks = () => {
  const [refCode, setRefCode] = useState(null);

  // Auto-detect referral code from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref");
    if (ref) setRefCode(ref);
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Buy eBook</h1>
      <p>Price: ₹199</p>
      <EnhancedCheckout amount={199} ebookId="ebook001" affiliateCode={refCode} />
    </div>
  );
};

export default Ebooks;
