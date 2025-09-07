import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/app.css";

const Home = () => {
  const navigate = useNavigate();
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const validateForm = (data) => {
    const newErrors = {};
    
    if (!data.name || !data.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!data.email || !data.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (data.phone && !/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    const data = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
    };

    // Validate form
    const validationErrors = validateForm(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // });
      
      console.log("Registration data:", data);
      setRegistered(true);
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: ""
      });
      
    } catch (error) {
      console.error("Registration failed:", error);
      setErrors({ general: "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const navigationButtons = [
    { text: "View eBooks", path: "/ebooks" },
    { text: "Upcoming Titles", path: "/upcoming" },
    { text: "Give Feedback", path: "/feedback" }
  ];

  return (
    <div className="home-page">
      {/* Hero section with background video */}
      <div className="hero-video-bg">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="hero-bg-video"
          src="/media/bgv.mp4"
          onError={(e) => {
            console.warn("Background video failed to load:", e);
            // You could set a fallback background image here
          }}
          aria-label="Background video showcasing Snowstorm Shop"
        />
        <div className="hero-overlay">
          <h1 className="hero">Welcome to Snowstorm Shop</h1>
          <p style={{ 
            fontSize: "1.2rem", 
            marginBottom: "2rem", 
            maxWidth: "600px",
            lineHeight: "1.5" 
          }}>
            Claim your free PDF and explore powerful eBooks that will transform your journey.
          </p>
          
          {!registered && (
            <form onSubmit={handleRegister} className="register-form" noValidate>
              {errors.general && (
                <div className="general-error">
                  {errors.general}
                </div>
              )}
              
              <div style={{ width: "100%" }}>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Your Name"
                  required
                  aria-label="Enter your full name"
                  style={{
                    borderColor: errors.name ? "#dc2626" : "var(--border)",
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                />
                {errors.name && (
                  <div className="error-message">
                    {errors.name}
                  </div>
                )}
              </div>

              <div style={{ width: "100%" }}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Your Email"
                  required
                  aria-label="Enter your email address"
                  style={{
                    borderColor: errors.email ? "#dc2626" : "var(--border)",
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                />
                {errors.email && (
                  <div className="error-message">
                    {errors.email}
                  </div>
                )}
              </div>

              <div style={{ width: "100%" }}>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone (optional)"
                  aria-label="Enter your phone number (optional)"
                  style={{
                    borderColor: errors.phone ? "#dc2626" : "var(--border)",
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                />
                {errors.phone && (
                  <div className="error-message">
                    {errors.phone}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="hero-btn"
                disabled={loading}
                style={{
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                  width: "100%"
                }}
                aria-label="Submit registration to get free PDF"
              >
                {loading ? "Processing..." : "Get Free PDF"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Posters row for visual attraction */}
      <section className="poster-row" aria-label="Featured book covers">
        <img
          src="/media/blue.png"
          alt="Why - Motivational book cover"
          className="poster"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
            console.warn("Poster image failed to load:", e.target.src);
          }}
        />
        <img
          src="/media/red.png"
          alt="Life of a Dot - Philosophy book cover"
          className="poster"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
            console.warn("Poster image failed to load:", e.target.src);
          }}
        />
        <img
          src="/media/rp.png"
          alt="Unique Dot - Self-help book cover"
          className="poster"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
            console.warn("Poster image failed to load:", e.target.src);
          }}
        />
        <img
          src="/media/workdone.png"
          alt="Work Done - Productivity book cover"
          className="poster"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
            console.warn("Poster image failed to load:", e.target.src);
          }}
        />
      </section>

      {/* Promo video for "the life of a dot" */}
      <section className="promo-video-section" aria-label="Featured video content">
        <h2 style={{ 
          fontSize: "1.8rem", 
          marginBottom: "1rem", 
          color: "var(--primary-dark)",
          fontWeight: "700"
        }}>
          Discover "The Life of a Dot"
        </h2>
        <p style={{ 
          marginBottom: "1.5rem", 
          color: "var(--text)", 
          maxWidth: "600px", 
          margin: "0 auto 1.5rem auto",
          fontSize: "1.1rem",
          lineHeight: "1.6"
        }}>
          A profound journey exploring the significance of small beginnings and infinite possibilities.
        </p>
        <div style={{
          position: "relative",
          maxWidth: "400px",
          margin: "0 auto",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
        }}>
          <video
            src="/media/rpv.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="promo-video"
            style={{
              width: "100%",
              height: "auto",
              borderRadius: "12px",
              display: "block"
            }}
            onError={(e) => {
              console.warn("Promo video failed to load:", e);
              e.target.style.display = 'none';
            }}
            aria-label="The Life of a Dot promotional video"
          />
        </div>
      </section>

      {/* Thank you section */}
      {registered && (
        <section className="thank-you" aria-label="Registration success">
          <h2 style={{ 
            fontSize: "2rem", 
            marginBottom: "1rem",
            background: "linear-gradient(90deg, #2563eb 0%, #1e40af 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: "700"
          }}>
            ⚔️ Welcome, Warrior!
          </h2>
          <p style={{ 
            marginBottom: "2rem", 
            fontSize: "1.1rem",
            maxWidth: "500px",
            margin: "0 auto 2rem auto",
            lineHeight: "1.6"
          }}>
            Your free PDF is on its way to your inbox. Meanwhile, explore our complete collection:
          </p>
          <div 
            className="nav-links" 
            style={{ 
              display: "flex", 
              gap: "1rem", 
              justifyContent: "center", 
              flexWrap: "wrap" 
            }}
          >
            {navigationButtons.map((button, index) => (
              <button
                key={index}
                onClick={() => navigate(button.path)}
                className="hero-btn"
                style={{ minWidth: "140px" }}
                aria-label={`Navigate to ${button.text}`}
              >
                {button.text}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;