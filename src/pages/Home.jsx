import React, { useState, useEffect } from "react";
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
    phone: "",
    password: "default123",
  });

  // ✅ Auto-detect if already registered (localStorage)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      setRegistered(true); // skip form
    }
  }, []);

  const validateForm = (data) => {
    const newErrors = {};
    if (!data.name.trim()) newErrors.name = "Name is required";
    if (!data.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email))
      newErrors.email = "Enter a valid email";
    if (data.phone && !/^\+?[\d\s\-\(\)]+$/.test(data.phone))
      newErrors.phone = "Enter a valid phone number";
    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const data = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      password: formData.password,
    };

    const validationErrors = validateForm(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        setRegistered(true);
      } else {
        setErrors({ general: result.error || "Registration failed" });
      }
    } catch (error) {
      console.error("Registration failed:", error);
      setErrors({ general: "Server error. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const navigationButtons = [
    { text: "View eBooks", path: "/ebooks" },
    { text: "Upcoming Titles", path: "/upcoming" },
    { text: "Give Feedback", path: "/feedback" },
  ];

  return (
    <div className="home-page">
      <div className="hero-video-bg">
        <video autoPlay loop muted playsInline className="hero-bg-video" src="/media/bgv.mp4" />
        <div className="hero-overlay">
          <h1 className="hero">Welcome to Snowstorm Shop</h1>
          <p>Claim your free PDF and explore powerful eBooks.</p>

          {/* ✅ If registered, skip form */}
          {!registered ? (
            <form onSubmit={handleRegister} className="register-form" noValidate>
              {errors.general && <div className="general-error">{errors.general}</div>}

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your Name"
                required
              />
              {errors.name && <div className="error-message">{errors.name}</div>}

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Your Email"
                required
              />
              {errors.email && <div className="error-message">{errors.email}</div>}

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone (optional)"
              />
              {errors.phone && <div className="error-message">{errors.phone}</div>}

              {/* ✅ Always visible + scrollable */}
              <div className="form-submit-wrapper">
                <button type="submit" className="hero-btn" disabled={loading}>
                  {loading ? "Processing..." : "Get Free PDF"}
                </button>
              </div>
            </form>
          ) : (
            <section className="thank-you">
              <h2>⚔️ Welcome, Warrior!</h2>
              <p>Your free PDF is on its way! Explore our collection:</p>
              <div className="nav-links">
                {navigationButtons.map((btn, idx) => (
                  <button key={idx} onClick={() => navigate(btn.path)} className="hero-btn">
                    {btn.text}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
