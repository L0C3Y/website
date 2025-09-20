import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/app.css";

// ✅ Backend URL from environment variable
const BACKEND_URL = process.env.REACT_APP_API_URL;

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

  // ✅ Check login status on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          if (user.role === "admin") navigate("/affiliates");
          else setRegistered(true);
        }
      } catch (err) {
        console.error("Invalid user data in localStorage");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, [navigate]);

  // Form validation
  const validateForm = (data) => {
    const newErrors = {};
    if (!data.name.trim()) newErrors.name = "Name is required";
    if (!data.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = "Enter a valid email";
    if (data.phone && !/^\+?[\d\s\-\(\)]+$/.test(data.phone)) newErrors.phone = "Enter a valid phone number";
    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
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
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const text = await response.text();
      let result;
      try { result = JSON.parse(text); } catch { throw new Error("Server returned invalid JSON"); }

      // Email already registered → auto-login
      if (!result.success && result.error?.toLowerCase().includes("already registered")) {
        const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email, password: data.password }),
        });

        const loginText = await loginResponse.text();
        let loginResult;
        try { loginResult = JSON.parse(loginText); } catch { throw new Error("Server returned invalid JSON on login"); }

        if (loginResult.success) {
          localStorage.setItem("token", loginResult.token);
          localStorage.setItem("user", JSON.stringify(loginResult.user));
          if (loginResult.user.role === "admin") navigate("/affiliates");
          else setRegistered(true);
        } else {
          setErrors({ general: loginResult.error || "Login failed" });
        }
      } else if (result.success) {
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        if (result.user.role === "admin") navigate("/affiliates");
        else setRegistered(true);
      } else {
        setErrors({ general: result.error || "Registration failed" });
      }
    } catch (err) {
      console.error(err);
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
