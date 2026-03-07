import React, { useEffect, useState } from 'react';
import { adminAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.role = filter;
      if (search) params.search = search;
      const res = await adminAPI.users(params);
      setUsers(res.data.results || res.data);
    } catch { toast.error('Failed to load users.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const toggleActive = async (user) => {
    try {
      await adminAPI.updateUser(user.id, { is_active: !user.is_active });
      setUsers(users.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}.`);
    } catch { toast.error('Failed.'); }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card border border-border rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary"
          />
          <button type="submit" className="bg-primary text-white px-4 py-2 rounded-xl text-sm">Search</button>
        </form>
        <div className="flex space-x-2">
          {['', 'customer', 'venue_owner', 'admin'].map((r) => (
            <button key={r} onClick={() => setFilter(r)}
              className={`px-4 py-2 rounded-full text-xs font-medium capitalize transition-colors ${
                filter === r ? 'bg-primary text-white' : 'bg-card border border-border text-gray-400 hover:text-white'
              }`}
            >
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr className="bg-black/20">
              <th>User</th>
              <th>Role</th>
              <th>City</th>
              <th>Verified</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-500">No users found</td></tr>
            ) : users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="font-medium text-white">{user.full_name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </td>
                <td>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                    user.role === 'venue_owner' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td>{user.city || '—'}</td>
                <td>{user.is_verified ? '✅' : '—'}</td>
                <td>
                  <span className={`text-xs ${user.is_active ? 'text-green-400' : 'text-red-400'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => toggleActive(user)}
                    className={`text-xs font-medium ${user.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
