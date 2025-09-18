// src/App.jsx
import React, { useEffect, useMemo, useState, createContext } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Ebooks from "./pages/Ebooks";
import Upcoming from "./pages/Upcoming";
import Feedback from "./pages/Feedback";

// Components
import AffiliateDashboard from "./component/AffiliateDashboard";
import "./App.css";

// ---- Affiliate Context ----
export const AffiliateContext = createContext({
  code: null,
  setCode: () => {},
});

// ---- Helper: reads ?aff= from URL ----
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

// ---- Navbar / Footer ----
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

// ---- App ----
export default function App() {
  const [ebooks, setEbooks] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const BACKEND_URL = "https://backend-gfho.onrender.com/api";

  useEffect(() => {
    setLoading(true);
    setErr("");

    const fetchData = async () => {
      try {
        // Fetch ebooks
        const ebooksRes = await fetch(`${BACKEND_URL}/ebooks`);
        const ebooksData = await ebooksRes.json();
        setEbooks(ebooksData || []);

        // Fetch upcoming ebooks
        const upcomingRes = await fetch(`${BACKEND_URL}/upcoming`);
        const upcomingData = await upcomingRes.json();
        setUpcoming(upcomingData || []);
      } catch (error) {
        console.error(error);
        setErr("Failed to fetch data from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AffiliateTracker>
    </BrowserRouter>
  );
}
