import React, { useState, useEffect, useMemo, createContext } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";

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

// ---- Affiliate Tracker ----
const AffiliateTracker = ({ children }) => {
  const location = useLocation();
  const [code, setCode] = useState(() => {
    try {
      return localStorage.getItem("aff_code") || null;
    } catch {
      return null;
    }
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

// ---- Checkout Wrapper ----
const CheckoutWrapper = () => {
  const { ebookId } = useParams();
  const parsedId = Number(ebookId) || 0;
  return <EnhancedCheckout ebookId={parsedId} amount={500} />;
};

// ---- Main App ----
export default function App() {
  const [ebooks, setEbooks] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      setLoading(true);
      setErr("");
      setEbooks([{ id: 1, title: "Sample Ebook", author: "Author", description: "A great ebook." }]);
      setUpcoming([{ id: 2, title: "Upcoming Ebook", author: "Author", description: "Coming soon!" }]);
    } catch (e) {
      setErr("Failed to load content");
      console.error(e);
    } finally {
      setLoading(false);
    }
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
              <Route path="/ebooks" element={Ebooks ? <Ebooks ebooks={ebooks} /> : <div>Loading...</div>} />
              <Route path="/upcoming" element={Upcoming ? <Upcoming upcoming={upcoming} /> : <div>Loading...</div>} />
              <Route path="/feedback" element={Feedback ? <Feedback /> : <div>Loading...</div>} />
              <Route path="/affiliates" element={AffiliateDashboard ? <AffiliateDashboard /> : <div>Loading...</div>} />
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
