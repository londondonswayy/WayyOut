import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { toast } from 'react-toastify';

const STATUS_BADGE = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  suspended: 'bg-gray-500/20 text-gray-400',
};

export default function Venues() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.venues(filter ? { status: filter } : {});
      setVenues(res.data.results || res.data);
    } catch (err) {
      toast.error('Failed to load venues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVenues(); }, [filter]);

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveVenue(id);
      toast.success('Venue approved!');
      fetchVenues();
    } catch { toast.error('Failed to approve.'); }
  };

  const handleReject = async (id) => {
    try {
      await adminAPI.rejectVenue(id);
      toast.success('Venue rejected.');
      fetchVenues();
    } catch { toast.error('Failed to reject.'); }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex space-x-2">
        {['', 'pending', 'approved', 'rejected', 'suspended'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === s ? 'bg-primary text-white' : 'bg-card border border-border text-gray-400 hover:text-white'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr className="bg-black/20">
              <th>Venue</th>
              <th>Owner</th>
              <th>City</th>
              <th>Category</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-500">Loading...</td></tr>
            ) : venues.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-500">No venues found</td></tr>
            ) : venues.map((venue) => (
              <tr key={venue.id}>
                <td>
                  <div className="font-medium text-white">{venue.name}</div>
                </td>
                <td>{venue.owner?.email}</td>
                <td>{venue.city}</td>
                <td>{venue.category?.name || '—'}</td>
                <td>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[venue.status]}`}>
                    {venue.status}
                  </span>
                </td>
                <td className="text-yellow-400">★ {Number(venue.rating).toFixed(1)}</td>
                <td>
                  <div className="flex space-x-2">
                    {venue.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(venue.id)} className="text-green-400 hover:text-green-300 text-xs font-medium">Approve</button>
                        <button onClick={() => handleReject(venue.id)} className="text-red-400 hover:text-red-300 text-xs font-medium">Reject</button>
                      </>
                    )}
                    {venue.status === 'approved' && (
                      <button onClick={() => handleReject(venue.id)} className="text-yellow-400 hover:text-yellow-300 text-xs font-medium">Suspend</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
