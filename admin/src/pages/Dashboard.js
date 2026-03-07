import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';

function StatCard({ label, value, icon, change, color, to }) {
  const card = (
    <div className={`bg-[#12121A] border rounded-2xl p-5 transition-all hover:border-[#FF3D57]/40 ${color || 'border-[#1E1E2E]'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {change != null && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${change >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="font-bold text-3xl text-white">{value ?? '—'}</p>
      <p className="text-gray-500 text-sm mt-1">{label}</p>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

function RecentTable({ title, columns, rows, emptyMsg, to }) {
  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E2E]">
        <h3 className="font-semibold text-white">{title}</h3>
        {to && <Link to={to} className="text-[#FF3D57] text-xs hover:underline">View all →</Link>}
      </div>
      {rows.length === 0 ? (
        <div className="text-center py-10 text-gray-600 text-sm">{emptyMsg}</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black/20">
              {columns.map(c => <th key={c} className="text-left text-xs text-gray-500 font-medium uppercase tracking-wider px-5 py-3">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-[#1E1E2E] hover:bg-white/2">
                {row.map((cell, j) => <td key={j} className="px-5 py-3 text-gray-300">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState({ users: null, venues: null, reservations: null, payments: null });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentVenues, setRecentVenues] = useState([]);
  const [recentReservations, setRecentReservations] = useState([]);
  const [pendingVenues, setPendingVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [u, v, r, pay, pv] = await Promise.all([
          adminAPI.users({ page_size: 5 }),
          adminAPI.venues({ page_size: 5 }),
          adminAPI.reservations({ page_size: 5 }),
          adminAPI.payments({ page_size: 1 }),
          adminAPI.venues({ status: 'pending', page_size: 5 }),
        ]);
        setData({
          users: u.data.count,
          venues: v.data.count,
          reservations: r.data.count,
          payments: pay.data.count,
        });
        setRecentUsers(u.data.results || u.data);
        setRecentVenues(v.data.results || v.data);
        setRecentReservations(r.data.results || r.data);
        setPendingVenues(pv.data.results || pv.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STATUS_BADGE = { pending: 'text-yellow-400', approved: 'text-green-400', rejected: 'text-red-400' };
  const RES_BADGE = { pending: 'text-yellow-400', accepted: 'text-green-400', rejected: 'text-red-400', cancelled: 'text-gray-400', completed: 'text-blue-400' };

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={data.users} icon="👥" change={12} to="/users" />
        <StatCard label="Total Venues" value={data.venues} icon="🏢" change={8} to="/venues" />
        <StatCard label="Reservations" value={data.reservations} icon="📋" change={23} to="/reservations" />
        <StatCard label="Payments" value={data.payments} icon="💳" change={18} to="/payments" />
      </div>

      {/* Alerts */}
      {pendingVenues.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-yellow-400 font-semibold">{pendingVenues.length} venue{pendingVenues.length > 1 ? 's' : ''} awaiting approval</p>
              <p className="text-yellow-400/60 text-xs">Review and approve or reject venue submissions</p>
            </div>
          </div>
          <Link to="/venues" className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-yellow-500/30 transition-colors">
            Review Now →
          </Link>
        </div>
      )}

      {/* Recent tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Users */}
        <RecentTable
          title="Recent Registrations"
          to="/users"
          columns={['User', 'Role', 'Joined']}
          emptyMsg="No users yet"
          rows={recentUsers.map(u => [
            <div>
              <p className="text-white font-medium text-sm">{u.full_name}</p>
              <p className="text-gray-500 text-xs">{u.email}</p>
            </div>,
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${u.role === 'venue_owner' ? 'bg-purple-500/20 text-purple-400' : u.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {u.role.replace('_', ' ')}
            </span>,
            <span className="text-gray-500 text-xs">{new Date(u.date_joined).toLocaleDateString()}</span>
          ])}
        />

        {/* Recent Venues */}
        <RecentTable
          title="Recent Venue Submissions"
          to="/venues"
          columns={['Venue', 'City', 'Status']}
          emptyMsg="No venues yet"
          rows={recentVenues.map(v => [
            <div>
              <p className="text-white font-medium text-sm">{v.name}</p>
              <p className="text-gray-500 text-xs">{v.owner?.email || v.owner}</p>
            </div>,
            <span className="text-gray-400 text-xs">{v.city}</span>,
            <span className={`text-xs font-medium capitalize ${STATUS_BADGE[v.status]}`}>{v.status}</span>
          ])}
        />
      </div>

      {/* Recent Reservations */}
      <RecentTable
        title="Recent Reservations"
        to="/reservations"
        columns={['Reference', 'User', 'Venue', 'Date & Time', 'Guests', 'Status']}
        emptyMsg="No reservations yet"
        rows={recentReservations.map(r => [
          <span className="font-mono text-xs text-gray-500">{r.reference}</span>,
          <span className="text-sm">{r.user?.full_name || r.user}</span>,
          <span className="text-sm">{r.venue?.name || r.venue}</span>,
          <span className="text-xs text-gray-400">{r.date} {r.time?.slice(0, 5)}</span>,
          <span className="text-sm">{r.party_size}</span>,
          <span className={`text-xs font-medium capitalize ${RES_BADGE[r.status]}`}>{r.status}</span>
        ])}
      />
    </div>
  );
}
