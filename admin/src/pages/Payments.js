import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await adminAPI.payments();
        const data = res.data.results || res.data;
        setPayments(data);
        setTotalRevenue(data.reduce((s, p) => s + parseFloat(p.amount || 0), 0));
        setTotalCommission(data.reduce((s, p) => s + parseFloat(p.commission_amount || 0), 0));
      } finally { setLoading(false); }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      {/* Revenue overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
          <p className="font-display font-bold text-3xl text-white">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="text-gray-500 text-sm mb-1">Platform Commission</p>
          <p className="font-display font-bold text-3xl text-green-400">${totalCommission.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <p className="text-gray-500 text-sm mb-1">Venue Payouts</p>
          <p className="font-display font-bold text-3xl text-blue-400">${(totalRevenue - totalCommission).toFixed(2)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr className="bg-black/20">
              <th>ID</th>
              <th>User</th>
              <th>Venue</th>
              <th>Amount</th>
              <th>Commission</th>
              <th>Payout</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-500">Loading...</td></tr>
            ) : payments.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs text-gray-500">#{p.id}</td>
                <td className="text-xs">{p.user}</td>
                <td className="text-xs">{p.venue}</td>
                <td className="text-white font-medium">${p.amount}</td>
                <td className="text-green-400">${p.commission_amount}</td>
                <td className="text-blue-400">${p.venue_payout}</td>
                <td>
                  <span className={`text-xs font-medium ${
                    p.status === 'completed' ? 'text-green-400' :
                    p.status === 'pending' ? 'text-yellow-400' :
                    'text-red-400'
                  } capitalize`}>{p.status}</span>
                </td>
                <td className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
