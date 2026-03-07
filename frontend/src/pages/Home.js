import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTrending, fetchCategories } from '../store/slices/venueSlice';
import { toggleAIChat } from '../store/slices/uiSlice';
import StoriesFeed from '../components/StoriesFeed';
import VenueCard from '../components/VenueCard';
import ReservationModal from '../components/ReservationModal';

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { trending, categories } = useSelector((state) => state.venues);
  const { reservationModal } = useSelector((state) => state.ui);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [city, setCity] = useState('');

  useEffect(() => {
    dispatch(fetchTrending());
    dispatch(fetchCategories());
  }, [dispatch]);

  return (
    <div className="min-h-screen">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
        style={{ background: 'linear-gradient(135deg, #0A0A0F 0%, #1A0A2E 50%, #0A1628 100%)' }}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-primary font-medium">Live venues near you right now</span>
          </div>

          <h1 className="font-display font-bold text-5xl md:text-7xl text-white mb-6 leading-tight">
            Decide where to go.<br />
            <span className="text-primary">Right now.</span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Real-time venue discovery, live crowd vibes, and instant reservations — all in one place.
          </p>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
            <input
              type="text"
              placeholder="Enter your city (e.g. New York, Miami)..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/discover${city ? `?city=${encodeURIComponent(city)}` : ''}`)}
              className="input flex-1"
            />
            <Link
              to={`/discover${city ? `?city=${encodeURIComponent(city)}` : ''}`}
              className="btn-primary whitespace-nowrap"
            >
              Explore Now
            </Link>
          </div>

          <p className="text-gray-600 text-sm mb-14">
            or{' '}
            <button onClick={() => dispatch(toggleAIChat())} className="text-primary hover:underline">
              ask our AI guide ✨
            </button>
          </p>

          {/* Two signup paths */}
          {!isAuthenticated && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Link to="/register?role=customer"
                className="card p-6 text-left hover:border-primary/50 transition-all hover:-translate-y-1 group">
                <div className="text-3xl mb-3">🌃</div>
                <h3 className="font-display font-bold text-lg text-white mb-1">I'm going out</h3>
                <p className="text-gray-500 text-sm">Discover venues, see live vibes, and reserve spots instantly.</p>
                <span className="text-primary text-sm font-medium mt-3 inline-block group-hover:underline">Sign up free →</span>
              </Link>
              <Link to="/register?role=venue_owner"
                className="card p-6 text-left hover:border-accent-purple/50 transition-all hover:-translate-y-1 group">
                <div className="text-3xl mb-3">🏢</div>
                <h3 className="font-display font-bold text-lg text-white mb-1">I own a venue</h3>
                <p className="text-gray-500 text-sm">List your venue, manage reservations, and post live stories.</p>
                <span className="text-purple-400 text-sm font-medium mt-3 inline-block group-hover:underline">List your venue →</span>
              </Link>
            </div>
          )}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── LIVE STORIES ─────────────────────────────────── */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl text-white">Live Stories</h2>
            <p className="text-gray-500 text-sm">See what's happening right now inside venues</p>
          </div>
          <Link to="/discover" className="text-primary text-sm hover:underline">View all →</Link>
        </div>
        <StoriesFeed city={city} />
      </section>

      {/* ── CATEGORIES ───────────────────────────────────── */}
      <section className="py-8 px-4 max-w-7xl mx-auto">
        <h2 className="font-display font-bold text-2xl text-white mb-6">Browse by Category</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/discover?category=${cat.slug}`}
              className="flex items-center space-x-2 px-5 py-3 card hover:border-primary/50 transition-all hover:-translate-y-0.5 font-medium">
              <span className="text-xl">{cat.icon}</span>
              <span className="text-white text-sm">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TRENDING ─────────────────────────────────────── */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl text-white">🔥 Trending Tonight</h2>
            <p className="text-gray-500 text-sm">Highest energy spots right now</p>
          </div>
          <Link to="/discover?ordering=-busy_level" className="text-primary text-sm hover:underline">See all →</Link>
        </div>

        {trending.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trending.map((venue) => <VenueCard key={venue.id} venue={venue} />)}
          </div>
        ) : (
          <div className="text-center py-16 card">
            <p className="text-5xl mb-4">🌃</p>
            <p className="text-gray-400 text-lg">No open venues right now.</p>
            <p className="text-gray-600 text-sm mt-2">Check back tonight or explore all venues.</p>
            <Link to="/discover" className="btn-primary mt-4 inline-block">Browse All Venues</Link>
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-20 px-4 bg-dark-card border-y border-dark-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-white text-center mb-3">How Way Out Works</h2>
          <p className="text-gray-500 text-center mb-12">Three simple steps to your perfect night out</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '📍', step: '01', title: 'Discover', desc: 'Browse nearby venues by category, vibe, or let our AI guide find the perfect match.' },
              { icon: '👁', step: '02', title: 'See the Vibe', desc: 'Watch live stories from inside venues. Check the busy level, crowd, and atmosphere in real time.' },
              { icon: '📋', step: '03', title: 'Reserve', desc: 'Send a reservation request instantly. Get confirmed or declined — no phone calls needed.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">{item.icon}</div>
                <div className="text-primary text-xs font-bold tracking-widest mb-2">{item.step}</div>
                <h3 className="font-display font-bold text-white text-xl mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '10K+', label: 'Active Users' },
            { value: '500+', label: 'Venues Listed' },
            { value: '50K+', label: 'Reservations Made' },
            { value: '15', label: 'Cities Covered' },
          ].map((stat) => (
            <div key={stat.label} className="card p-6">
              <div className="font-display font-bold text-3xl text-primary mb-1">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── VENUE CTA ────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center card p-12"
          style={{ background: 'linear-gradient(135deg, rgba(255,61,87,0.08), rgba(123,47,190,0.08))' }}>
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="font-display font-bold text-4xl text-white mb-4">Own a venue?</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Join hundreds of venues on Way Out. Manage reservations, share live stories, and attract customers every night.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register?role=venue_owner" className="btn-primary text-lg px-8 py-4">List Your Venue Free</Link>
            <Link to="/discover" className="btn-ghost text-lg px-8 py-4">See How It Works</Link>
          </div>
        </div>
      </section>

      {reservationModal.open && <ReservationModal />}
    </div>
  );
}
