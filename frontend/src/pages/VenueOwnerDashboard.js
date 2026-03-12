import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { venueAPI, reservationAPI, adAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from '../i18n/LanguageContext';

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
  const { t } = useTranslation();
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

  // Ads state
  const [campaigns, setCampaigns] = useState([]);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    headline: '', body: '', cta_text: 'Book Now', budget: '',
    cost_per_impression: '0.01', start_date: '', end_date: '',
  });
  const [savingCampaign, setSavingCampaign] = useState(false);

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

  useEffect(() => {
    if (activeTab === 'ads' && selectedVenue) {
      adAPI.campaigns()
        .then(res => setCampaigns(res.data.results || res.data))
        .catch(() => {});
    }
  }, [activeTab, selectedVenue]);

  const loadVenues = async () => {
    setLoading(true);
    try {
      const res = await venueAPI.myVenues();
      const list = res.data.results || res.data;
      setVenues(list);
      if (list.length > 0) setSelectedVenue(list[0]);
    } catch { toast.error(t('dash.toastLoadFail')); }
    finally { setLoading(false); }
  };

  const handleToggleOpen = async () => {
    try {
      const res = await venueAPI.toggleOpen(selectedVenue.slug);
      const updated = { ...selectedVenue, is_open: res.data.is_open };
      setSelectedVenue(updated);
      setVenues(venues.map(v => v.id === updated.id ? updated : v));
      toast.success(res.data.is_open ? t('dash.toastOpen') : t('dash.toastClosed'));
    } catch { toast.error(t('dash.toastStatusFail')); }
  };

  const handleBusyLevel = async (level) => {
    try {
      await venueAPI.updateBusyLevel(selectedVenue.slug, level);
      const updated = { ...selectedVenue, busy_level: level };
      setSelectedVenue(updated);
      setVenues(venues.map(v => v.id === updated.id ? updated : v));
    } catch { toast.error(t('dash.toastBusyFail')); }
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
      toast.success(t('dash.toastSubmitted'));
      setShowCreateForm(false);
      setCreateForm({ name: '', city: '', address: '', category: '', description: '', phone: '', vibe: '', capacity: '' });
      loadVenues();
    } catch (err) {
      const data = err.response?.data || {};
      toast.error(Object.values(data).flat().join(', ') || t('dash.toastLoadFail'));
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setSavingCampaign(true);
    try {
      await adAPI.createCampaign({ ...campaignForm, venue: selectedVenue.id });
      toast.success(t('ads.created'));
      setShowCampaignForm(false);
      setCampaignForm({ headline: '', body: '', cta_text: 'Book Now', budget: '', cost_per_impression: '0.01', start_date: '', end_date: '' });
      const res = await adAPI.campaigns();
      setCampaigns(res.data.results || res.data);
    } catch (err) {
      const data = err.response?.data || {};
      toast.error(Object.values(data).flat().join(', ') || t('dash.toastLoadFail'));
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleToggleCampaignStatus = async (campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    try {
      await adAPI.updateCampaign(campaign.id, { status: newStatus });
      setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c));
      toast.success(t('ads.updated'));
    } catch { toast.error(t('dash.toastLoadFail')); }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await adAPI.deleteCampaign(id);
      setCampaigns(campaigns.filter(c => c.id !== id));
      toast.success(t('ads.deleted'));
    } catch { toast.error(t('dash.toastLoadFail')); }
  };

  const pendingRes = reservations.filter(r => r.status === 'pending').length;
  const acceptedRes = reservations.filter(r => r.status === 'accepted').length;
  const totalRes = reservations.length;

  const TABS = [
    { key: 'overview', label: t('dash.tabOverview') },
    { key: 'reservations', label: t('dash.tabReservations') },
    { key: 'ads', label: t('ads.tab') },
    { key: 'settings', label: t('dash.tabSettings') },
  ];

  const SETTINGS_FIELDS = [
    [t('dash.name'), selectedVenue?.name],
    [t('dash.city'), selectedVenue?.city],
    [t('dash.category'), selectedVenue?.category?.name || '—'],
    [t('dash.phone'), selectedVenue?.phone || '—'],
    [t('dash.capacity'), selectedVenue?.capacity || '—'],
    [t('dash.vibe'), selectedVenue?.vibe || '—'],
    [t('dash.status'), selectedVenue?.status],
    [t('dash.rating'), `${Number(selectedVenue?.rating || 0).toFixed(1)} (${selectedVenue?.review_count} ${t('dash.reviews')})`],
  ];

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">{t('dash.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('dash.welcome')} {user?.full_name}</p>
        </div>
        <button onClick={() => setShowCreateForm(true)} className="btn-primary flex items-center space-x-2">
          <span>+</span><span>{t('dash.addVenue')}</span>
        </button>
      </div>

      {/* Create Venue Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-dark-border">
              <h2 className="font-display font-bold text-xl text-white">{t('dash.addVenueTitle')}</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-500 hover:text-white text-2xl">×</button>
            </div>
            <form onSubmit={handleCreateVenue} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t('dash.venueName')} *</label>
                <input required className="input" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="The Grand Lounge" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t('dash.city')} *</label>
                  <input required className="input" value={createForm.city} onChange={e => setCreateForm({ ...createForm, city: e.target.value })} placeholder="New York" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t('dash.category')}</label>
                  <select className="input" value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })}>
                    <option value="">{t('dash.select')}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t('dash.address')} *</label>
                <input required className="input" value={createForm.address} onChange={e => setCreateForm({ ...createForm, address: e.target.value })} placeholder="123 Main Street" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t('dash.phone')}</label>
                  <input className="input" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} placeholder="+1 212-555-0100" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t('dash.capacity')}</label>
                  <input type="number" className="input" value={createForm.capacity} onChange={e => setCreateForm({ ...createForm, capacity: e.target.value })} placeholder="100" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t('dash.vibe')}</label>
                <select className="input" value={createForm.vibe} onChange={e => setCreateForm({ ...createForm, vibe: e.target.value })}>
                  <option value="">{t('dash.selectVibe')}</option>
                  {['casual', 'lively', 'romantic', 'upscale', 'party'].map(v => (
                    <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t('dash.description')} *</label>
                <textarea required rows={4} className="input resize-none" value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder={t('dash.descPlaceholder')} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn-ghost flex-1">{t('dash.cancel')}</button>
                <button type="submit" className="btn-primary flex-1">{t('dash.submitReview')}</button>
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
          <h2 className="font-display font-bold text-2xl text-white mb-2">{t('dash.noVenues')}</h2>
          <p className="text-gray-500 mb-6">{t('dash.noVenuesDesc')}</p>
          <button onClick={() => setShowCreateForm(true)} className="btn-primary px-8 py-3">{t('dash.createVenue')}</button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Venue sidebar */}
          <aside className="w-full lg:w-56 flex-shrink-0 space-y-2">
            <p className="text-xs text-gray-600 uppercase tracking-wider px-1 mb-2">{t('dash.yourVenues')}</p>
            {venues.map(v => (
              <button key={v.id} onClick={() => { setSelectedVenue(v); setActiveTab('overview'); }}
                className={`w-full text-left p-3 rounded-xl transition-all border ${selectedVenue?.id === v.id ? 'bg-primary/10 border-primary/40 text-primary' : 'border-dark-border text-gray-400 hover:text-white hover:bg-dark-card'}`}>
                <p className="font-semibold text-sm">{v.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs ${v.is_open ? 'text-green-400' : 'text-red-400'}`}>
                    {v.is_open ? t('dash.open') : t('dash.closed')}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_BADGE[v.status] || ''}`}>{v.status}</span>
                </div>
              </button>
            ))}
            <button onClick={() => setShowCreateForm(true)}
              className="w-full text-left p-3 rounded-xl border border-dashed border-dark-border text-gray-600 hover:border-primary/40 hover:text-primary transition-all text-sm">
              {t('dash.addVenueBtn')}
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
                    <p className="text-yellow-400 text-xs mt-1">{t('dash.pendingApproval')}</p>
                  )}
                </div>
                <button onClick={handleToggleOpen}
                  disabled={selectedVenue.status !== 'approved'}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${selectedVenue.is_open ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30'}`}>
                  {selectedVenue.is_open ? t('dash.closeVenue') : t('dash.openVenue')}
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-dark-border">
                {TABS.map(({ key, label }) => (
                  <button key={key} onClick={() => setActiveTab(key)}
                    className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === key ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'}`}>
                    {label}
                    {key === 'reservations' && pendingRes > 0 && (
                      <span className="ml-2 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">{pendingRes}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Overview tab */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label={t('dash.totalRes')} value={totalRes} icon="📋" />
                    <StatCard label={t('dash.pending')} value={pendingRes} icon="⏳" sub={t('dash.needsAction')} />
                    <StatCard label={t('dash.confirmed')} value={acceptedRes} icon="✅" />
                    <StatCard label={t('dash.rating')} value={`${Number(selectedVenue.rating || 0).toFixed(1)} ★`} icon="⭐" sub={`${selectedVenue.review_count || 0} ${t('dash.reviews')}`} />
                  </div>

                  {/* Busy level */}
                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white">{t('dash.busyTitle')}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{t('dash.busyDesc')}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-display font-bold text-2xl ${selectedVenue.busy_level > 70 ? 'text-red-400' : selectedVenue.busy_level > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {selectedVenue.busy_level}%
                        </span>
                        <p className="text-xs text-gray-500">
                          {selectedVenue.busy_level > 70 ? t('dash.veryBusy') : selectedVenue.busy_level > 40 ? t('dash.moderate') : t('dash.quiet')}
                        </p>
                      </div>
                    </div>
                    <input type="range" min="0" max="100" value={selectedVenue.busy_level}
                      onChange={e => handleBusyLevel(parseInt(e.target.value))}
                      disabled={!selectedVenue.is_open}
                      className="w-full accent-primary disabled:opacity-40" />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>{t('dash.empty')}</span><span>{t('dash.half')}</span><span>{t('dash.packed')}</span>
                    </div>
                  </div>

                  {/* Recent reservations preview */}
                  <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">{t('dash.recentRes')}</h3>
                      <button onClick={() => setActiveTab('reservations')} className="text-primary text-xs hover:underline">{t('dash.viewAll')}</button>
                    </div>
                    {reservations.slice(0, 5).length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-6">{t('dash.noRes')}</p>
                    ) : (
                      <div className="space-y-3">
                        {reservations.slice(0, 5).map(r => (
                          <div key={r.id} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                            <div>
                              <p className="text-sm text-white font-medium">{r.user?.full_name}</p>
                              <p className="text-xs text-gray-500">{r.date} at {r.time} · {r.party_size} {t('dash.guests')}</p>
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
                    <h3 className="font-semibold text-white">{t('dash.allRes')}</h3>
                    <span className="text-sm text-gray-500">{totalRes} {t('dash.total')}</span>
                  </div>
                  {reservations.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">{t('dash.noRes')}</div>
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
                                {r.date} at {r.time} · {r.party_size} {t('dash.guests')} · {r.reservation_type?.replace('_', ' ')}
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
                                {t('dash.accept')}
                              </button>
                              <button onClick={() => handleReservationAction(r.id, 'rejected')}
                                className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-colors">
                                {t('dash.decline')}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Ads tab */}
              {activeTab === 'ads' && (
                <div className="space-y-5">
                  {/* Pricing info */}
                  <div className="card p-4 flex items-center gap-3 border-primary/20">
                    <span className="text-2xl">💡</span>
                    <p className="text-gray-400 text-sm">{t('ads.pricing')} <span className="text-primary font-medium">$0.01 {t('ads.cpi').toLowerCase()}.</span></p>
                  </div>

                  {/* Header + create button */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{t('ads.campaigns')}</h3>
                    <button onClick={() => setShowCampaignForm(true)} className="btn-primary text-sm px-4 py-2">
                      + {t('ads.create')}
                    </button>
                  </div>

                  {/* Create campaign form */}
                  {showCampaignForm && (
                    <div className="card p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-white">{t('ads.create')}</h4>
                        <button onClick={() => setShowCampaignForm(false)} className="text-gray-500 hover:text-white text-xl">×</button>
                      </div>
                      <form onSubmit={handleCreateCampaign} className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">{t('ads.headline')} *</label>
                          <input required className="input" value={campaignForm.headline} maxLength={80}
                            onChange={e => setCampaignForm({ ...campaignForm, headline: e.target.value })}
                            placeholder="Book your table this weekend!" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">{t('ads.body')}</label>
                          <textarea rows={2} className="input resize-none" value={campaignForm.body} maxLength={200}
                            onChange={e => setCampaignForm({ ...campaignForm, body: e.target.value })}
                            placeholder="Limited spots available..." />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">{t('ads.cta')}</label>
                            <input className="input" value={campaignForm.cta_text} maxLength={30}
                              onChange={e => setCampaignForm({ ...campaignForm, cta_text: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">{t('ads.budget')}</label>
                            <input required type="number" min="1" step="0.01" className="input" value={campaignForm.budget}
                              onChange={e => setCampaignForm({ ...campaignForm, budget: e.target.value })} placeholder="50.00" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">{t('ads.cpi')}</label>
                          <input type="number" min="0.001" step="0.001" className="input" value={campaignForm.cost_per_impression}
                            onChange={e => setCampaignForm({ ...campaignForm, cost_per_impression: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">{t('ads.startDate')} *</label>
                            <input required type="date" className="input" value={campaignForm.start_date}
                              onChange={e => setCampaignForm({ ...campaignForm, start_date: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">{t('ads.endDate')} *</label>
                            <input required type="date" className="input" value={campaignForm.end_date}
                              onChange={e => setCampaignForm({ ...campaignForm, end_date: e.target.value })} />
                          </div>
                        </div>
                        <div className="flex gap-3 pt-1">
                          <button type="button" onClick={() => setShowCampaignForm(false)} className="btn-ghost flex-1">{t('dash.cancel')}</button>
                          <button type="submit" disabled={savingCampaign} className="btn-primary flex-1">
                            {savingCampaign ? '...' : t('ads.launch')}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Campaigns list */}
                  {campaigns.length === 0 ? (
                    <div className="card text-center py-12">
                      <p className="text-4xl mb-3">📢</p>
                      <p className="text-white font-semibold">{t('ads.empty')}</p>
                      <p className="text-gray-500 text-sm mt-1">{t('ads.emptyDesc')}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {campaigns.map(c => {
                        const statusColors = {
                          active: 'bg-green-500/20 text-green-400',
                          paused: 'bg-yellow-500/20 text-yellow-400',
                          draft: 'bg-gray-500/20 text-gray-400',
                          completed: 'bg-blue-500/20 text-blue-400',
                        };
                        return (
                          <div key={c.id} className="card p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="font-semibold text-white text-sm truncate">{c.headline}</p>
                                  <span className={`badge text-xs flex-shrink-0 ${statusColors[c.status] || ''}`}>{c.status}</span>
                                </div>
                                <p className="text-xs text-gray-500">{c.start_date} → {c.end_date}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                              <div>
                                <span className="text-gray-500 block">{t('ads.impressions')}</span>
                                <span className="text-white font-medium">{c.impressions_count}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block">{t('ads.spent')}</span>
                                <span className="text-white font-medium">${Number(c.spent).toFixed(2)} / ${Number(c.budget).toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block">Remaining</span>
                                <span className="text-primary font-medium">${Number(c.budget_remaining).toFixed(2)}</span>
                              </div>
                            </div>
                            {/* Budget bar */}
                            <div className="h-1.5 bg-dark-border rounded-full overflow-hidden mb-3">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${Math.min(100, (c.spent / c.budget) * 100)}%` }}
                              />
                            </div>
                            <div className="flex gap-2">
                              {(c.status === 'active' || c.status === 'paused') && (
                                <button
                                  onClick={() => handleToggleCampaignStatus(c)}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${c.status === 'active' ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                                >
                                  {c.status === 'active' ? t('ads.pause') : t('ads.resume')}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteCampaign(c.id)}
                                className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              >
                                {t('ads.delete')}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Settings tab */}
              {activeTab === 'settings' && (
                <div className="card p-5 space-y-4">
                  <h3 className="font-semibold text-white">{t('dash.venueInfo')}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {SETTINGS_FIELDS.map(([label, value]) => (
                      <div key={label}>
                        <span className="text-gray-500 block text-xs">{label}</span>
                        <span className="text-white capitalize">{value}</span>
                      </div>
                    ))}
                  </div>
                  {selectedVenue.description && (
                    <div>
                      <span className="text-gray-500 block text-xs mb-1">{t('dash.description')}</span>
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
