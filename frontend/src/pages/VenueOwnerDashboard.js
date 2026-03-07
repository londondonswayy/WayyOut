import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { venueAPI, reservationAPI } from '../services/api';
import { toast } from 'react-toastify';

const STATUS_BADGE = {
  pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-400 border border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const RES_BADGE = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  accepted: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
  completed: 'bg-blue-500/20 text-blue-400',
};

function StatCard({ label, value, icon, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {sub && <span className="text-xs text-gray-500">{sub}</span>}
      </div>
      <div className="font-display font-bold text-3xl text-white">{value}</div>
      <div className="text-gray-500 text-sm mt-1">{label}</div>
    </div>
  );
}

export default function VenueOwnerDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', city: '', address: '', category: '',
    description: '', phone: '', vibe: '', capacity: '',
  });

  useEffect(() => {
    loadVenues();
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/venues/categories/`)
      .then(r => r.json()).then(d => setCategories(d.results || d)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedVenue?.slug) {
      reservationAPI.venueReservations(selectedVenue.slug)
        .then(res => setReservations(res.data.results || res.data))
        .catch(() => {});
    }
  }, [selectedVenue]);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const res = await venueAPI.myVenues();
      const list = res.data.results || res.data;
      setVenues(list);
      if (list.length > 0) setSelectedVenue(list[0]);
    } catch { toast.error('Failed to load venues.'); }
    finally { setLoading(false); }
  };

  const handleToggleOpen = async () => {
    try {
      const res = await venueAPI.toggleOpen(selectedVenue.slug);
      const updated = { ...selectedVenue, is_open: res.data.is_open };
      setSelectedVenue(updated);
      setVenues(venues.map(v => v.id === updated.id ? updated : v));
      toast.success(res.data.is_open ? '✅ Venue is now OPEN' : '🔴 Venue is now CLOSED');
    } catch { toast.error('Failed to update status.'); }
  };

  const handleBusyLevel = async (level) => {
    try {
      await venueAPI.updateBusyLevel(selectedVenue.slug, level);
      const updated = { ...selectedVenue, busy_level: level };
      setSelectedVenue(updated);
      setVenues(venues.map(v => v.id === updated.id ? updated : v));
    } catch { toast.error('Failed to update busy level.'); }
  };

  const handleReservationAction = async (id, status) => {
    try {
      await reservationAPI.updateStatus(id, { status });
      setReservations(reservations.map(r => r.id === id ? { ...r, status } : r));
      toast.success(`Reservation ${status}.`);
    } catch { toast.error('Failed.'); }
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    try {
      await venueAPI.create({
        ...createForm,
        category: createForm.category ? parseInt(createForm.category) : null,
        capacity: createForm.capacity ? parseInt(createForm.capacity) : 0,
        latitude: 0, longitude: 0,
      });
      toast.success('Venue submitted for review!');
      setShowCreateForm(false);
      setCreateForm({ name: '', city: '', address: '', category: '', description: '', phone: '', vibe: '', capacity: '' });
      loadVenues();
    } catch (err) {
      const data = err.response?.data || {};
      toast.error(Object.values(data).flat().join(', ') || 'Failed to create venue.');
    }
  };

  const pendingRes = reservations.filter(r => r.status === 'pending').length;
  const acceptedRes = reservations.filter(r => r.status === 'accepted').length;
  const totalRes = reservations.length;

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">Venue Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.full_name}</p>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="btn-primary flex items-center space-x-2">
          <span>+</span><span>Add Venue</span>
        </button>
      </div>

      {/* Create Venue Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-dark-border">
              <h2 className="font-display font-bold text-xl text-white">Add New Venue</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-500 hover:text-white text-2xl">×</button>
            </div>
            <form onSubmit={handleCreateVenue} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Venue Name *</label>
                <input required className="input" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="The Grand Lounge" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">City *</label>
                  <input required className="input" value={createForm.city} onChange={e => setCreateForm({ ...createForm, city: e.target.value })} placeholder="New York" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Category</label>
                  <select className="input" value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })}>
                    <option value="">Select...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Address *</label>
                <input required className="input" value={createForm.address} onChange={e => setCreateForm({ ...createForm, address: e.target.value })} placeholder="123 Main Street" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                  <input className="input" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="+1 212-555-0100" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Capacity</label>
                  <input type="number" className="input" value={createForm.capacity} onChange={e => setCreateForm({ ...createForm, capacity: e.target.value })} placeholder="100" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Vibe</label>
                <select className="input" value={createForm.vibe} onChange={e => setCreateForm({ ...createForm, vibe: e.target.value })}>
                  <option value="">Select vibe...</option>
                  {['casual', 'lively', 'romantic', 'upscale', 'party'].map(v => (
                    <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description *</label>
                <textarea required rows={4} className="input resize-none" value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Tell customers what makes your venue special..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn-ghost flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Submit for Review</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-28" />)}
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-24 card">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="font-display font-bold text-2xl text-white mb-2">No venues yet</h2>
          <p className="text-gray-500 mb-6">Create your first venue to start accepting reservations.</p>
          <button onClick={() => setShowCreateForm(true)} className="btn-primary px-8 py-3">Create Your Venue</button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Venue sidebar */}
          <aside className="w-full lg:w-56 flex-shrink-0 space-y-2">
            <p className="text-xs text-gray-600 uppercase tracking-wider px-1 mb-2">Your Venues</p>
            {venues.map(v => (
              <button key={v.id} onClick={() => { setSelectedVenue(v); setActiveTab('overview'); }}
                className={`w-full text-left p-3 rounded-xl transition-all border ${selectedVenue?.id === v.id ? 'bg-primary/10 border-primary/40 text-primary' : 'border-dark-border text-gray-400 hover:text-white hover:bg-dark-card'}`}>
                <p className="font-semibold text-sm">{v.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs ${v.is_open ? 'text-green-400' : 'text-red-400'}`}>
                    {v.is_open ? '● Open' : '● Closed'}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_BADGE[v.status] || ''}`}>{v.status}</span>
                </div>
              </button>
            ))}
            <button onClick={() => setShowCreateForm(true)}
              className="w-full text-left p-3 rounded-xl border border-dashed border-dark-border text-gray-600 hover:border-primary/40 hover:text-primary transition-all text-sm">
              + Add venue
            </button>
          </aside>

          {/* Main panel */}
          {selectedVenue && (
            <main className="flex-1 space-y-5">

              {/* Venue header */}
              <div className="card p-5 flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="font-display font-bold text-2xl text-white">{selectedVenue.name}</h2>
                    <span className={`badge ${STATUS_BADGE[selectedVenue.status]}`}>{selectedVenue.status}</span>
                  </div>
                  <p className="text-gray-500 text-sm">📍 {selectedVenue.city}{selectedVenue.address ? ` · ${selectedVenue.address}` : ''}</p>
                  {selectedVenue.status === 'pending' && (
                    <p className="text-yellow-400 text-xs mt-1">⏳ Awaiting admin approval before going live</p>
                  )}
                </div>
                <button onClick={handleToggleOpen}
                  disabled={selectedVenue.status !== 'approved'}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${selectedVenue.is_open ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30'}`}>
                  {selectedVenue.is_open ? '🔴 Close Venue' : '🟢 Open Venue'}
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-dark-border">
                {['overview', 'reservations', 'settings'].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`px-5 py-3 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${activeTab === t ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'}`}>
                    {t}
                    {t === 'reservations' && pendingRes > 0 && (
                      <span className="ml-2 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">{pendingRes}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Overview tab */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Reservations" value={totalRes} icon="📋" />
                    <StatCard label="Pending" value={pendingRes} icon="⏳" sub="needs action" />
                    <StatCard label="Confirmed" value={acceptedRes} icon="✅" />
                    <StatCard label="Rating" value={`${Number(selectedVenue.rating || 0).toFixed(1)} ★`} icon="⭐" sub={`${selectedVenue.review_count || 0} reviews`} />
                  </div>

                  {/* Busy level */}
                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white">Live Busy Level</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Update in real time to show customers how busy you are</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-display font-bold text-2xl ${selectedVenue.busy_level > 70 ? 'text-red-400' : selectedVenue.busy_level > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {selectedVenue.busy_level}%
                        </span>
                        <p className="text-xs text-gray-500">{selectedVenue.busy_level > 70 ? 'Very Busy' : selectedVenue.busy_level > 40 ? 'Moderate' : 'Quiet'}</p>
                      </div>
                    </div>
                    <input type="range" min="0" max="100" value={selectedVenue.busy_level}
                      onChange={e => handleBusyLevel(parseInt(e.target.value))}
                      disabled={!selectedVenue.is_open}
                      className="w-full accent-primary disabled:opacity-40" />
                    <div className="flex justify-between text-xs text-gray-600 mt-1"><span>Empty</span><span>Half</span><span>Packed</span></div>
                  </div>

                  {/* Recent reservations preview */}
                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">Recent Reservations</h3>
                      <button onClick={() => setActiveTab('reservations')} className="text-primary text-xs hover:underline">View all →</button>
                    </div>
                    {reservations.slice(0, 5).length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-6">No reservations yet</p>
                    ) : (
                      <div className="space-y-3">
                        {reservations.slice(0, 5).map(r => (
                          <div key={r.id} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                            <div>
                              <p className="text-sm text-white font-medium">{r.user?.full_name}</p>
                              <p className="text-xs text-gray-500">{r.date} at {r.time} · {r.party_size} guests</p>
                            </div>
                            <span className={`badge ${RES_BADGE[r.status]} capitalize text-xs`}>{r.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reservations tab */}
              {activeTab === 'reservations' && (
                <div className="card overflow-hidden">
                  <div className="p-4 border-b border-dark-border flex items-center justify-between">
                    <h3 className="font-semibold text-white">All Reservations</h3>
                    <span className="text-sm text-gray-500">{totalRes} total</span>
                  </div>
                  {reservations.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">No reservations yet</div>
                  ) : (
                    <div className="divide-y divide-dark-border">
                      {reservations.map(r => (
                        <div key={r.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-white">{r.user?.full_name}</p>
                                <span className="text-xs text-gray-600 font-mono">{r.reference}</span>
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {r.date} at {r.time} · {r.party_size} guests · {r.reservation_type?.replace('_', ' ')}
                              </p>
                              {r.special_requests && (
                                <p className="text-xs text-gray-600 mt-1 italic">"{r.special_requests}"</p>
                              )}
                            </div>
                            <span className={`badge ${RES_BADGE[r.status]} capitalize flex-shrink-0`}>{r.status}</span>
                          </div>
                          {r.status === 'pending' && (
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => handleReservationAction(r.id, 'accepted')}
                                className="flex-1 py-2 rounded-xl bg-green-500/20 text-green-400 text-sm font-semibold hover:bg-green-500/30 transition-colors">
                                ✓ Accept
                              </button>
                              <button onClick={() => handleReservationAction(r.id, 'rejected')}
                                className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-colors">
                                ✕ Decline
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings tab */}
              {activeTab === 'settings' && (
                <div className="card p-5 space-y-4">
                  <h3 className="font-semibold text-white">Venue Info</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      ['Name', selectedVenue.name],
                      ['City', selectedVenue.city],
                      ['Category', selectedVenue.category?.name || '—'],
                      ['Phone', selectedVenue.phone || '—'],
                      ['Capacity', selectedVenue.capacity || '—'],
                      ['Vibe', selectedVenue.vibe || '—'],
                      ['Status', selectedVenue.status],
                      ['Rating', `${Number(selectedVenue.rating || 0).toFixed(1)} (${selectedVenue.review_count} reviews)`],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <span className="text-gray-500 block text-xs">{label}</span>
                        <span className="text-white capitalize">{value}</span>
                      </div>
                    ))}
                  </div>
                  {selectedVenue.description && (
                    <div>
                      <span className="text-gray-500 block text-xs mb-1">Description</span>
                      <p className="text-gray-300 text-sm leading-relaxed">{selectedVenue.description}</p>
                    </div>
                  )}
                </div>
              )}
            </main>
          )}
        </div>
      )}
    </div>
  );
}
