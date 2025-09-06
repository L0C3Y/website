import React, { useEffect, useState } from "react";
import "../styles/cards.css";

const AffiliateDashboard = ({ affiliateId }) => {
  const [affiliate, setAffiliate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ⚔️ later: fetch(`/api/affiliates/${affiliateId}`)
    // mocked data for now
    const mockData = {
      id: affiliateId,
      name: "Affiliate Alpha",
      totalRevenue: 4500,
      paid: 3000,
      pending: 1500,
      sales: [
        { customer: "Alice", email: "alice@mail.com", amount: 500 },
        { customer: "Bob", email: "bob@mail.com", amount: 1000 },
        { customer: "Charlie", email: "charlie@mail.com", amount: 3000 },
      ],
    };

    setTimeout(() => {
      setAffiliate(mockData);
      setLoading(false);
    }, 500);
  }, [affiliateId]);

  if (loading) return <p>Loading dashboard...</p>;
  if (!affiliate) return <p>No affiliate data found.</p>;

  return (
    <div className="affiliate-dashboard">
      <h2>{affiliate.name} - Dashboard</h2>

      <div className="affiliate-stats">
        <p><strong>Total Revenue:</strong> ₹{affiliate.totalRevenue}</p>
        <p><strong>Paid:</strong> ₹{affiliate.paid}</p>
        <p><strong>Pending:</strong> ₹{affiliate.pending}</p>
      </div>

      <h3>Sales Breakdown</h3>
      <table className="affiliate-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Email</th>
            <th>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {affiliate.sales.map((sale, idx) => (
            <tr key={idx}>
              <td>{sale.customer}</td>
              <td>{sale.email}</td>
              <td>{sale.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AffiliateDashboard;