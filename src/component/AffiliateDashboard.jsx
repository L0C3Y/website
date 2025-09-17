import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "../styles/cards.css";

const AffiliateDashboard = () => {
  const [affiliate, setAffiliate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", commissionRate: 0.2 });
  const [editMode, setEditMode] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const location = useLocation();

  // 1️⃣ Detect affiliate from URL
  const detectAffiliate = async () => {
    const path = location.pathname.split("/")[1]; // e.g., snowstrom.shop/karan123
    try {
      const res = await fetch(`/api/affiliates/detect/${path}`);
      const data = await res.json();
      if (data.success) localStorage.setItem("affiliateCode", data.data.code);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAffiliateDashboard = async () => {
    if (!user || !user.id) return setLoading(false);
    try {
      const res = await fetch(`/api/affiliates/${user.affiliate_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAffiliate(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectAffiliate();
    fetchAffiliateDashboard();
  }, []);

  // 2️⃣ Admin-only create/update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user.role !== "admin") return alert("Only admin can configure affiliates");

    const url = editMode ? `/api/affiliates/${affiliate.id}` : `/api/affiliates/create`;
    const method = editMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setForm({ name: "", email: "", commissionRate: 0.2 });
        setEditMode(false);
        fetchAffiliateDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = () => {
    if (!affiliate) return;
    setForm({
      name: affiliate.name,
      email: affiliate.email,
      commissionRate: affiliate.commission_rate,
    });
    setEditMode(true);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure? Soft delete only.")) return;
    if (user.role !== "admin") return alert("Only admin can delete affiliates");

    await fetch(`/api/affiliates/${affiliate.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setAffiliate(null);
  };

  if (loading) return <p>Loading dashboard...</p>;
  if (!affiliate) return <p>No affiliate data. Admin can create one below.</p>;

  return (
    <div className="affiliate-dashboard">
      <h2>{affiliate.name} - Dashboard</h2>

      {/* Admin configuration */}
      {user.role === "admin" && (
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
            required
          />
          <input
            placeholder="Commission Rate (0-1)"
            value={form.commissionRate}
            onChange={(e) => setForm({ ...form, commissionRate: parseFloat(e.target.value) })}
            type="number"
            step="0.01"
            required
          />
          <button type="submit">{editMode ? "Update Affiliate" : "Create Affiliate"}</button>
          {!editMode && (
            <>
              <button type="button" onClick={handleEdit}>Edit</button>
              <button type="button" onClick={handleDelete}>Delete</button>
            </>
          )}
        </form>
      )}

      {/* Dashboard stats */}
      <div className="affiliate-stats">
        <p><strong>Total Revenue:</strong> ₹{affiliate.sales.reduce((sum, s) => sum + s.amount, 0)}</p>
        <p><strong>Paid:</strong> ₹{affiliate.sales.filter(s => s.status === "paid").reduce((sum, s) => sum + s.amount, 0)}</p>
        <p><strong>Pending:</strong> ₹{affiliate.sales.filter(s => s.status !== "paid").reduce((sum, s) => sum + s.amount, 0)}</p>
      </div>

      <h3>Sales Breakdown</h3>
      <table className="affiliate-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Email</th>
            <th>Amount (₹)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {affiliate.sales.map((sale, idx) => (
            <tr key={idx}>
              <td>{sale.user_name}</td>
              <td>{sale.user_email}</td>
              <td>{sale.amount}</td>
              <td>{sale.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        <strong>Referral Link:</strong>{" "}
        <a href={`https://snowstrom.shop/${affiliate.code}`} target="_blank" rel="noreferrer">
          {`https://snowstrom.shop/${affiliate.code}`}
        </a>
      </p>
    </div>
  );
};

export default AffiliateDashboard;
