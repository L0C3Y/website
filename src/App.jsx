import React, { useState, useEffect, useMemo, createContext } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Ebooks from "./pages/Ebooks";
import Upcoming from "./pages/Upcoming";
import Feedback from "./pages/Feedback";
import AffiliateDashboard from "./component/AffiliateDashboard";
import EnhancedCheckout from "./component/EnhancedCheckout";
import "./App.css";

// ✅ Context for affiliate code
export const AffiliateContext = createContext({
  code: null,
  setCode: () => {},
});

// ---- Affiliate Tracker embedded ----
const AffiliateTracker = ({ children }) => {
  const location = useLocation();
  const [code, setCode] = useState(() => localStorage.getItem("aff_code") || null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const aff = params.get("aff"); // ?aff=CODE
    if (aff && aff.trim()) {
      localStorage.setItem("aff_code", aff.trim());
      setCode(aff.trim());
    }
  }, [location.search]);

  const value = useMemo(() => ({ code, setCode }), [code]);
  return <AffiliateContext.Provider value={value}>{children}</AffiliateContext.Provider>;
};

// ---- Navbar & Footer ----
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

// ---- Main App ----
export default function App() {
  const [ebooks, setEbooks] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    // Mock data; replace with API fetch if needed
    setLoading(true);
    setErr("");
    setEbooks([{ id: 1, title: "Sample Ebook", author: "Author", description: "A great ebook." }]);
    setUpcoming([{ id: 2, title: "Upcoming Ebook", author: "Author", description: "Coming soon!" }]);
    setLoading(false);
  }, []);

  return (
    <BrowserRouter>
      <AffiliateTracker>
        <div className="app">
          <Navbar />

          {err && <div className="banner error"><strong>Error:</strong> {err}</div>}
          {loading && <div className="banner info">Loading…</div>}

          <main className="container">
            <Routes>
              <Route path="/" element={<Home ebooks={ebooks} upcoming={upcoming} />} />
              <Route path="/ebooks" element={<Ebooks ebooks={ebooks} />} />
              <Route path="/upcoming" element={<Upcoming upcoming={upcoming} />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/affiliates" element={<AffiliateDashboard />} />
              {/* Example checkout route */}
              <Route path="/checkout/:ebookId" element={<EnhancedCheckout amount={500} ebookId={1} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AffiliateTracker>
    </BrowserRouter>
  );
}
