import React, { useEffect, useState } from "react";
import "../styles/cards.css";
import toast, { Toaster } from "react-hot-toast";
import copy from "copy-to-clipboard";

const API_BASE = import.meta.env.VITE_API_URL.replace(/\/+$/, "");

const AffiliateDashboard = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [allAffiliates, setAllAffiliates] = useState([]);
  const [affiliateData, setAffiliateData] = useState(null);

  const [loginForm, setLoginForm] = useState({
    role: "admin",
    identifier: "",
    password: "",
    email: "",
    name: "",
  });

  const [affiliateForm, setAffiliateForm] = useState({
    id: null,
    name: "",
    email: "",
    commissionRate: 0.2,
  });
  const [editMode, setEditMode] = useState(false);

  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  // ------------------------
  // Login Handler
  // ------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = `${API_BASE}/api/auth/login`;
      let body = {};

      if (loginForm.role === "admin") {
        body = {
          role: "admin",
          identifier: loginForm.identifier,
          password: loginForm.password,
        };
      } else if (loginForm.role === "affiliate") {
        body = {
          role: "affiliate",
          identifier: loginForm.email,
          name: loginForm.name || loginForm.email,
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Login failed");

      setUser(data.user);
      setToken(data.token);
      fetchDashboard(data.user, data.token);
      toast.success("Logged in successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------
  // Fetch dashboard data
  // ------------------------
  const fetchDashboard = async (loggedUser = user, authToken = token) => {
    if (!loggedUser || !authToken) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/affiliates`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to fetch dashboard");

      if (loggedUser.role === "admin") setAllAffiliates(data.data || []);
      if (loggedUser.role === "affiliate") setAffiliateData(data.data || {});
    } catch (err) {
      console.error(err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------
  // Logout
  // ------------------------
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setAllAffiliates([]);
    setAffiliateData(null);
    setLoginForm({ role: "admin", identifier: "", password: "", email: "", name: "" });
    toast.success("Logged out successfully");
  };

  // ------------------------
  // Admin: Create / Update Affiliate
  // ------------------------
  const handleSubmitAffiliate = async (e) => {
    e.preventDefault();
    if (!user || user.role !== "admin") return;

    if (!affiliateForm.name || !affiliateForm.email) {
      toast.error("Name and Email are required");
      return;
    }

    if (affiliateForm.commissionRate < 0 || affiliateForm.commissionRate > 1) {
      toast.error("Commission rate must be between 0 and 1");
      return;
    }

    const url = editMode
      ? `${API_BASE}/api/affiliates/${affiliateForm.id}`
      : `${API_BASE}/api/affiliates/create`;
    const method = editMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: affiliateForm.name,
          email: affiliateForm.email,
          commissionRate: affiliateForm.commissionRate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Operation failed");

      toast.success(editMode ? "Affiliate updated!" : "Affiliate created!");
      setAffiliateForm({ id: null, name: "", email: "", commissionRate: 0.2 });
      setEditMode(false);
      fetchDashboard();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const handleEdit = (aff) => {
    setAffiliateForm({
      id: aff.id,
      name: aff.name,
      email: aff.email,
      commissionRate: aff.commission_rate,
    });
    setEditMode(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will soft delete.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/affiliates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Delete failed");

      toast.success("Affiliate deleted!");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const copyReferral = (link) => {
    copy(link);
    toast.success("Referral link copied!");
  };

  // ------------------------
  // Pagination helpers
  // ------------------------
  const paginatedAffiliates = allAffiliates.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  );

  const totalPages = Math.ceil(allAffiliates.length / pagination.limit);

  // ------------------------
  // UI
  // ------------------------
  if (!user)
    return (
      <div className="affiliate-dashboard login-page">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <select
            value={loginForm.role}
            onChange={(e) => setLoginForm({ ...loginForm, role: e.target.value })}
          >
            <option value="admin">Admin</option>
            <option value="affiliate">Affiliate</option>
          </select>
          {loginForm.role === "admin" ? (
            <>
              <input
                placeholder="Admin Username"
                value={loginForm.identifier}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, identifier: e.target.value })
                }
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                required
              />
            </>
          ) : (
            <>
              <input
                type="email"
                placeholder="Affiliate Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Affiliate Name (optional)"
                value={loginForm.name}
                onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
              />
            </>
          )}
          <button type="submit">{loading ? "Logging in..." : "Login"}</button>
        </form>
        {error && <p className="error-message">{error}</p>}
        <Toaster />
      </div>
    );

  if (user.role === "admin")
    return (
      <div className="affiliate-dashboard">
        <div className="top-bar">
          <h2>Admin Dashboard</h2>
          <button onClick={handleLogout}>Logout</button>
        </div>

        <h3>All Affiliates</h3>
        <table className="affiliate-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Commission</th>
              <th>Sales</th>
              <th>Revenue</th>
              <th>Commission Earned</th>
              <th>Referral Link</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAffiliates.map((aff) => (
              <tr key={aff.id}>
                <td>{aff.name}</td>
                <td>{aff.email}</td>
                <td>{aff.commission_rate}</td>
                <td>{aff.sales_count}</td>
                <td>₹{aff.total_revenue}</td>
                <td>₹{aff.total_commission}</td>
                <td>
                  <button onClick={() => copyReferral(aff.referral_link)}>Copy Link</button>
                </td>
                <td>
                  <button onClick={() => handleEdit(aff)}>✏️</button>
                  <button onClick={() => handleDelete(aff.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button
            onClick={() =>
              setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })
            }
            disabled={pagination.page === 1}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {totalPages}
          </span>
          <button
            onClick={() =>
              setPagination({ ...pagination, page: Math.min(totalPages, pagination.page + 1) })
            }
            disabled={pagination.page === totalPages}
          >
            Next
          </button>
        </div>

        <h3>{editMode ? "Edit Affiliate" : "Create New Affiliate"}</h3>
        <form onSubmit={handleSubmitAffiliate}>
          <input
            placeholder="Name"
            value={affiliateForm.name}
            onChange={(e) => setAffiliateForm({ ...affiliateForm, name: e.target.value })}
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={affiliateForm.email}
            onChange={(e) => setAffiliateForm({ ...affiliateForm, email: e.target.value })}
            required
          />
          <input
            placeholder="Commission Rate (0-1)"
            type="number"
            step="0.01"
            value={affiliateForm.commissionRate}
            onChange={(e) =>
              setAffiliateForm({ ...affiliateForm, commissionRate: parseFloat(e.target.value) })
            }
            required
          />
          <button type="submit">{editMode ? "Update" : "Create"}</button>
        </form>
        <Toaster />
      </div>
    );

  if (user.role === "affiliate")
    return (
      <div className="affiliate-dashboard">
        <div className="top-bar">
          <h2>Affiliate Dashboard</h2>
          <button onClick={handleLogout}>Logout</button>
        </div>

        {affiliateData && (
          <>
            <h3>Your Info</h3>
            <p><strong>Name:</strong> {affiliateData.name}</p>
            <p><strong>Email:</strong> {affiliateData.email}</p>
            <p><strong>Commission Rate:</strong> {affiliateData.commission_rate}</p>
            <p><strong>Total Sales:</strong> {affiliateData.sales_count}</p>
            <p><strong>Total Revenue:</strong> ₹{affiliateData.total_revenue}</p>
            <p><strong>Commission Earned:</strong> ₹{affiliateData.total_commission}</p>
            <p>
              <strong>Your Referral Link:</strong>{" "}
              <button onClick={() => copyReferral(affiliateData.referral_link)}>
                Copy Link
              </button>
            </p>
          </>
        )}
        <Toaster />
      </div>
    );
};

export default AffiliateDashboard;
