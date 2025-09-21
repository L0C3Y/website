import React, { useEffect, useState } from "react";
import EnhancedCheckout from "../component/EnhancedCheckout.jsx";
import "../styles/app.css";
import rpCover from "../media/rp.png";
import wdCover from "../../media/workdone.png";

// ✅ Use Vite env
const BACKEND_URL = import.meta.env.VITE_API_URL;

const Ebooks = () => {
  const [refCode, setRefCode] = useState(null);
  const [selectedEbook, setSelectedEbook] = useState(null);

  // Detect referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setRefCode(ref);
  }, []);

  // Track visit
  useEffect(() => {
    if (!refCode) return;
    const logVisit = async () => {
      try {
        await fetch(`${BACKEND_URL}/api/visits`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliateCode: refCode,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            landingPath: window.location.pathname,
          }),
        });
      } catch (err) {
        console.error("Visit log failed:", err);
      }
    };
    logVisit();
  }, [refCode]);

  const ebooks = [
    {
      id: "ebook001",
      title: "Rising Power",
      description:
        "Master the strategies to rise above challenges and dominate your field. Includes mental models, tactics, and proven methods to gain an edge.",
      cover: rpCover,
      price: 299,
    },
    {
      id: "ebook002",
      title: "Work Done Right",
      description:
        "A deep dive into productivity, efficiency, and building unstoppable momentum. Learn how to eliminate distractions, systemize work, and maximize output.",
      cover: wdCover,
      price: 299,
    },
  ];

  return (
    <div className="premium-section">
      <h1 className="hero">Premium eBook Store</h1>
      <div className="premium-grid">
        {ebooks.map((ebook) => (
          <div key={ebook.id} className="premium-card">
            <img src={ebook.cover} alt={ebook.title} />
            <div className="premium-card-content">
              <h3>{ebook.title}</h3>
              <p>{ebook.description.slice(0, 80)}...</p>
              <p style={{ fontWeight: "bold", margin: "0.5rem 0" }}>₹{ebook.price}</p>

              {/* Checkout */}
              <EnhancedCheckout amount={ebook.price} ebookId={ebook.id} />

              {/* Details */}
              <button
                className="hero-btn"
                style={{ marginTop: "0.5rem" }}
                onClick={() => setSelectedEbook(ebook)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedEbook && (
        <div className="modal-overlay" onClick={() => setSelectedEbook(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedEbook(null)}>
              ✖
            </button>
            <img
              src={selectedEbook.cover}
              alt={selectedEbook.title}
              style={{ width: "100%", borderRadius: "8px", marginBottom: "1rem" }}
            />
            <h2>{selectedEbook.title}</h2>
            <p style={{ margin: "1rem 0" }}>{selectedEbook.description}</p>
            <p style={{ fontWeight: "bold", fontSize: "1.1rem" }}>Price: ₹{selectedEbook.price}</p>
            <EnhancedCheckout amount={selectedEbook.price} ebookId={selectedEbook.id} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Ebooks;
