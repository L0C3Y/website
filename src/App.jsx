// src/App.jsx
import React, { useEffect, useMemo, useState, createContext } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";

// Pages (you said these exist)
import Home from "./pages/Home";
import Ebooks from "./pages/Ebooks";
import Upcoming from "./pages/Upcoming";
import Feedback from "./pages/Feedback";

// Components
import AffiliateDashboard from "./component/AffiliateDashboard";
import "./App.css";

// ---- Affiliate Context (available to whole app) ----
export const AffiliateContext = createContext({
  code: null,
  setCode: () => {},
});

// ---- Helper: reads ?aff= from URL and persists it ----
const AffiliateTracker = ({ children }) => {
  const location = useLocation();
  const [code, setCode] = useState(() => localStorage.getItem("aff_code") || null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const aff = params.get("aff");
    if (aff && aff.trim()) {
      localStorage.setItem("aff_code", aff.trim());
      setCode(aff.trim());
    }
  }, [location.search]);

  const value = useMemo(() => ({ code, setCode }), [code]);
  return <AffiliateContext.Provider value={value}>{children}</AffiliateContext.Provider>;
};

// ---- Basic Navbar / Footer (minimal, “dirty” ok) ----
const Navbar = () => (
  <nav className="nav">
    <Link to="/" className="logo">Snowstorm</Link>
    <div className="nav-links">
      <Link to="/ebooks">Ebooks</Link>
      <Link to="/upcoming">Upcoming</Link>
      <Link to="/feedback">Feedback</Link>
      <Link to="/affiliates">Affiliates</Link>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="footer">
    <p>© {new Date().getFullYear()} Snowstorm. All rights reserved.</p>
  </footer>
);

// ---- App Shell: fetches data once and routes pages ----
export default function App() {
  const [ebooks, setEbooks] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    setLoading(true);
    setErr("");
    // MOCK DATA
    setEbooks([
      { id: 1, title: "Sample Ebook", author: "Author", description: "A great ebook." }
    ]);
    setUpcoming([
      { id: 2, title: "Upcoming Ebook", author: "Author", description: "Coming soon!" }
    ]);
    setLoading(false);
  }, []);

  return (
    <BrowserRouter>
      <AffiliateTracker>
        <div className="app">
          <Navbar />

          {err && (
            <div className="banner error">
              <strong>Error:</strong> {err}
            </div>
          )}
          {loading && <div className="banner info">Loading…</div>}

          <main className="container">
            <Routes>
              <Route path="/" element={<Home ebooks={ebooks} upcoming={upcoming} />} />
              <Route path="/ebooks" element={<Ebooks ebooks={ebooks} />} />
              <Route path="/upcoming" element={<Upcoming upcoming={upcoming} />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/affiliates" element={<AffiliateDashboard />} />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AffiliateTracker>
    </BrowserRouter>
  );
}