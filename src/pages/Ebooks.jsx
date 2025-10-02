// src/pages/Ebooks.jsx
import React, { useEffect, useState } from "react";
import EnhancedCheckout from "../component/EnhancedCheckout.jsx";
import "../styles/app.css";
import rpCover from "../media/ebook1.webp";
import wdCover from "../media/ebook2.webp";

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
      title: "The Life of a Dot",
      description:
        "Master the strategies to rise above challenges and dominate your field. Includes mental models, tactics, and proven methods to gain an edge.",
      cover: rpCover,
      price: 299,
    },
    {
      id: "ebook002",
      title: "Why",
      description:
        "A deep dive into productivity, efficiency, and building unstoppable momentum. Learn how to eliminate distractions, systemize work, and maximize output.",
      cover: wdCover,
      price: 299,
    },
  ];

  return (
    <div className="premium-section" style={{ padding: "2rem 1rem", minHeight: "100vh" }}>
      <h1 className="hero" style={{ marginBottom: "2rem" }}>Premium eBook Store</h1>
      <div className="premium-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "2rem",
      }}>
        {ebooks.map((ebook) => (
          <div
            key={ebook.id}
            className="premium-card"
            style={{
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              overflow: "hidden",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.03)";
              e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)";
            }}
          >
            <img
              src={ebook.cover}
              alt={ebook.title}
              style={{ width: "100%", height: "auto", objectFit: "cover" }}
            />
            <div className="premium-card-content" style={{ padding: "1rem" }}>
              <h3 style={{ fontWeight: "700", fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                {ebook.title}
              </h3>
              <p style={{ fontSize: "0.95rem", color: "#f0f0f0", minHeight: "60px" }}>
                {ebook.description.slice(0, 80)}...
              </p>
              <p style={{ fontWeight: "bold", margin: "0.5rem 0", fontSize: "1.05rem" }}>
                ₹{ebook.price}
              </p>

              <EnhancedCheckout amount={ebook.price} ebookId={ebook.id} />

              <button
                className="hero-btn"
                style={{ marginTop: "0.5rem", width: "100%", fontWeight: "600" }}
                onClick={() => setSelectedEbook(ebook)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Premium Modal */}
      {selectedEbook && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setSelectedEbook(null)}
        >
          <div
            className="modal-content"
            style={{
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              padding: "2rem",
              position: "relative",
              boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
              color: "#fff",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-btn"
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#fff",
              }}
              onClick={() => setSelectedEbook(null)}
            >
              ✖
            </button>
            <img
              src={selectedEbook.cover}
              alt={selectedEbook.title}
              style={{ width: "100%", borderRadius: "8px", marginBottom: "1rem" }}
            />
            <h2 style={{ fontWeight: "700", fontSize: "1.5rem", marginBottom: "1rem" }}>
              {selectedEbook.title}
            </h2>
            <p style={{ marginBottom: "1rem", lineHeight: "1.5" }}>
              {selectedEbook.description}
            </p>
            <p style={{ fontWeight: "bold", fontSize: "1.2rem", marginBottom: "1rem" }}>
              Price: ₹{selectedEbook.price}
            </p>
            <EnhancedCheckout amount={selectedEbook.price} ebookId={selectedEbook.id} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Ebooks;
