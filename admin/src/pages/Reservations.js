import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';

const STATUS_BADGE = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  accepted: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
  completed: 'bg-blue-500/20 text-blue-400',
};

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await adminAPI.reservations(filter ? { status: filter } : {});
        setReservations(res.data.results || res.data);
      } finally { setLoading(false); }
    };
    fetch();
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex space-x-2">
        {['', 'pending', 'accepted', 'rejected', 'cancelled', 'completed'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === s ? 'bg-primary text-white' : 'bg-card border border-border text-gray-400 hover:text-white'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr className="bg-black/20">
              <th>Reference</th>
              <th>User</th>
              <th>Venue</th>
              <th>Date</th>
              <th>Party</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-500">Loading...</td></tr>
            ) : reservations.map((res) => (
              <tr key={res.id}>
                <td className="font-mono text-xs text-gray-400">{res.reference}</td>
                <td>
                  <div className="text-white text-xs">{res.user?.full_name}</div>
                  <div className="text-gray-500 text-xs">{res.user?.email}</div>
                </td>
                <td>{res.venue?.name}</td>
                <td className="text-xs">{res.date} {res.time}</td>
                <td>{res.party_size}</td>
                <td className="capitalize text-xs">{res.reservation_type?.replace('_', ' ')}</td>
                <td>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[res.status]}`}>
                    {res.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
