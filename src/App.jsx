import React, { useState, useEffect, useMemo, createContext } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useParams } from "react-router-dom";

import Home from "./pages/Home";
import Ebooks from "./pages/Ebooks";
import Upcoming from "./pages/Upcoming";
import Feedback from "./pages/Feedback";
import AffiliateDashboard from "./component/AffiliateDashboard";
import EnhancedCheckout from "./component/EnhancedCheckout";
import "./App.css";
import backgroundImg from './media/background.png';

export const AffiliateContext = createContext({ code: null, setCode: () => {} });

const AffiliateTracker = ({ children }) => {
  const location = useLocation();
  const [code, setCode] = useState(() => {
    try { return localStorage.getItem("aff_code") || null; } catch { return null; }
  });

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const aff = params.get("aff");
      if (aff?.trim()) {
        localStorage.setItem("aff_code", aff.trim());
        setCode(aff.trim());
      }
    } catch {}
  }, [location.search]);

  const value = useMemo(() => ({ code, setCode }), [code]);
  return <AffiliateContext.Provider value={value}>{children}</AffiliateContext.Provider>;
};

const Navbar = () => {
  const location = useLocation();
  const [active, setActive] = useState(location.pathname);

  const links = [
    { to: "/ebooks", label: "Ebooks" },
    { to: "/upcoming", label: "Upcoming" },
    { to: "/feedback", label: "Feedback" },
    { to: "/affiliates", label: "Affiliates" },
  ];

  return (
    <nav className="nav">
      <Link to="/" className="logo">SnowZorgath</Link>
      <div className="nav-links">
        {links.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={active === link.to ? "active" : ""}
            onClick={() => setActive(link.to)}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

const Footer = () => (
  <footer className="footer">
    <p>© {new Date().getFullYear()} SnowZorgath. All rights reserved.</p>
  </footer>
);

const CheckoutWrapper = () => {
  const { ebookId } = useParams();
  const parsedId = Number(ebookId) || 0;
  return <EnhancedCheckout ebookId={parsedId} amount={500} />;
};

export default function App() {
  const [ebooks, setEbooks] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      setLoading(true);
      setErr("");
      // fetch from backend/Supabase
      setEbooks([{ id: 1, title: "Mastering React", description: "Level up your React skills", price: 299, cover: "/covers/react.png" }]);
      setUpcoming([{ id: 2, title: "Next JS Secrets", description: "Coming soon!", price: 0, cover: "/covers/next.png" }]);
    } catch (e) {
      setErr("Failed to load content");
      console.error(e);
    } finally { setLoading(false); }
  }, []);

  return (
    <BrowserRouter>
      <AffiliateTracker>
        <div className="app" style={{
          backgroundImage: `url(${backgroundImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
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
              <Route path="/checkout/:ebookId" element={<CheckoutWrapper />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AffiliateTracker>
    </BrowserRouter>
  );
}
