import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTrending, fetchCategories } from '../store/slices/venueSlice';
import { toggleAIChat } from '../store/slices/uiSlice';
import StoriesFeed from '../components/StoriesFeed';
import VenueCard from '../components/VenueCard';
import AdCard from '../components/AdCard';
import ReservationModal from '../components/ReservationModal';
import { useTranslation } from '../i18n/LanguageContext';
import { adAPI } from '../services/api';

// To expand to more cities later, just add to this array
const CITIES = ['Montreal', 'Toronto'];

const DEFAULT_CATEGORIES = [
  { id: 'restaurant', slug: 'restaurant', icon: '🍽️', name: 'Restaurants', gradient: 'from-orange-500/30 to-red-600/20',    border: 'hover:border-orange-500/50' },
  { id: 'nightclub',  slug: 'nightclub',  icon: '🎉', name: 'Nightlife',   gradient: 'from-purple-600/30 to-pink-600/20',   border: 'hover:border-purple-500/50' },
  { id: 'lounge',     slug: 'lounge',     icon: '🛋️', name: 'Lounges',    gradient: 'from-blue-600/30 to-cyan-600/20',     border: 'hover:border-blue-500/50'   },
  { id: 'live-music', slug: 'live-music', icon: '🎵', name: 'Live Music',  gradient: 'from-green-600/30 to-teal-600/20',    border: 'hover:border-green-500/50'  },
  { id: 'events',     slug: 'events',     icon: '🎟️', name: 'Events',     gradient: 'from-yellow-500/30 to-orange-600/20', border: 'hover:border-yellow-500/50' },
  { id: 'rooftop',    slug: 'rooftop',    icon: '🏙️', name: 'Rooftop',    gradient: 'from-indigo-600/30 to-violet-600/20', border: 'hover:border-indigo-500/50' },
];

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { trending, categories } = useSelector((state) => state.venues);
  const { reservationModal } = useSelector((state) => state.ui);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [city] = useState('');
  const [feedAd, setFeedAd] = useState(null);
  const [dismissedAd, setDismissedAd] = useState(false);
  const [heroSearch, setHeroSearch] = useState('');

  // Build ticker from translation keys
  const LIVE_ACTIVITIES = Array.from({ length: 10 }, (_, i) => t(`ticker.${i}`));

  useEffect(() => {
    dispatch(fetchTrending());
    dispatch(fetchCategories());
    adAPI.feed().then(res => {
      if (res.status === 200) setFeedAd(res.data);
    }).catch(() => {});
  }, [dispatch]);

  return (
    <div className="min-h-screen">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
        style={{ background: 'linear-gradient(135deg, #0D0D1F 0%, #161635 50%, #0D0D1F 100%)' }}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-12 md:pt-16">
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white mb-6 leading-tight">
            {t('home.hero.title')}<br />
            <span className="text-primary">{t('home.hero.highlight')}</span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('home.hero.desc')}
          </p>

          {/* Search bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); if (heroSearch.trim()) navigate(`/discover?search=${encodeURIComponent(heroSearch.trim())}`); }}
            className="flex gap-2 max-w-xl mx-auto mb-8"
          >
            <input
              type="text"
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              placeholder={t('discover.placeholder')}
              className="input flex-1 text-base py-3 px-5"
            />
            <button type="submit" className="btn-primary px-6 py-3 text-base">
              {t('discover.search')}
            </button>
          </form>

          {/* City picker */}
          <p className="text-gray-500 text-sm mb-4">{t('home.search.chooseCity')}</p>
          <div className="flex gap-4 justify-center mb-8">
            {CITIES.map((c) => (
              <Link
                key={c}
                to={`/discover?city=${c}`}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/15 hover:border-primary transition-all text-white font-semibold text-lg hover:-translate-y-0.5"
              >
                📍 {c}
              </Link>
            ))}
          </div>


          {/* Two signup paths */}
          {!isAuthenticated && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Link to="/register?role=customer"
                className="card p-6 text-left hover:border-primary/50 transition-all hover:-translate-y-1 group">
                <div className="text-3xl mb-3">🌃</div>
                <h3 className="font-display font-bold text-lg text-white mb-1">{t('home.role.customer.title')}</h3>
                <p className="text-gray-500 text-sm">{t('home.role.customer.desc')}</p>
                <span className="text-primary text-sm font-medium mt-3 inline-block group-hover:underline">{t('home.role.customer.cta')}</span>
              </Link>
              <Link to="/register?role=venue_owner"
                className="card p-6 text-left hover:border-accent-purple/50 transition-all hover:-translate-y-1 group">
                <div className="text-3xl mb-3">🏢</div>
                <h3 className="font-display font-bold text-lg text-white mb-1">{t('home.role.owner.title')}</h3>
                <p className="text-gray-500 text-sm">{t('home.role.owner.desc')}</p>
                <span className="text-purple-400 text-sm font-medium mt-3 inline-block group-hover:underline">{t('home.role.owner.cta')}</span>
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

      {/* ── LIVE ACTIVITY TICKER ─────────────────────────── */}
      <div className="bg-dark-card/60 border-b border-dark-border overflow-hidden py-2.5">
        <div className="animate-marquee gap-10 items-center">
          {[...LIVE_ACTIVITIES, ...LIVE_ACTIVITIES].map((activity, i) => (
            <span key={i} className="inline-flex items-center gap-6 mx-6 text-xs text-gray-400">
              {activity}
              <span className="text-dark-border">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── LIVE STORIES ─────────────────────────────────── */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl text-white">{t('home.stories.title')}</h2>
            <p className="text-gray-500 text-sm">{t('home.stories.desc')}</p>
          </div>
          <Link to="/stories" className="text-primary text-sm hover:underline">{t('home.stories.viewAll')}</Link>
        </div>
        <StoriesFeed city={city} />
      </section>

      {/* ── CATEGORIES ───────────────────────────────────── */}
      <section className="py-10 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl text-white">{t('home.categories.title')}</h2>
            <p className="text-gray-500 text-sm mt-1">Find your vibe tonight</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {(categories.length > 0 ? categories : DEFAULT_CATEGORIES).map((cat) => (
            <Link
              key={cat.id}
              to={`/discover?category=${cat.slug}`}
              className={`group relative overflow-hidden rounded-2xl border border-dark-border ${cat.border || 'hover:border-primary/50'} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient || 'from-primary/20 to-accent-purple/20'} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative p-5 flex flex-col items-center text-center gap-3">
                <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{cat.icon}</span>
                <span className="text-white text-sm font-semibold leading-tight">{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TRENDING ─────────────────────────────────────── */}
      <section className="py-12 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl text-white">{t('home.trending.title')}</h2>
            <p className="text-gray-500 text-sm">{t('home.trending.desc')}</p>
          </div>
          <Link to="/discover?ordering=-busy_level" className="text-primary text-sm hover:underline">{t('home.trending.seeAll')}</Link>
        </div>

        {trending.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trending.map((venue, idx) => (
              <React.Fragment key={venue.id}>
                <VenueCard venue={venue} />
                {idx === 3 && feedAd && !dismissedAd && (
                  <AdCard ad={feedAd} onDismiss={() => setDismissedAd(true)} />
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 card">
            <p className="text-5xl mb-4">🌃</p>
            <p className="text-gray-400 text-lg">{t('home.trending.empty')}</p>
            <p className="text-gray-600 text-sm mt-2">{t('home.trending.emptyDesc')}</p>
            <Link to="/discover" className="btn-primary mt-4 inline-block">{t('home.trending.browse')}</Link>
          </div>
        )}
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-20 px-4 bg-dark-card border-y border-dark-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-3xl text-white text-center mb-3">{t('home.howItWorks.title')}</h2>
          <p className="text-gray-500 text-center mb-12">{t('home.howItWorks.subtitle')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '📍', step: '01', titleKey: 'home.howItWorks.1.title', descKey: 'home.howItWorks.1.desc' },
              { icon: '👁', step: '02', titleKey: 'home.howItWorks.2.title', descKey: 'home.howItWorks.2.desc' },
              { icon: '📋', step: '03', titleKey: 'home.howItWorks.3.title', descKey: 'home.howItWorks.3.desc' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">{item.icon}</div>
                <div className="text-primary text-xs font-bold tracking-widest mb-2">{item.step}</div>
                <h3 className="font-display font-bold text-white text-xl mb-2">{t(item.titleKey)}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: 'MTL', labelKey: 'home.stats.mtl' },
            { value: 'YYZ', labelKey: 'home.stats.yyz' },
            { value: 'Live', labelKey: 'home.stats.live' },
            { value: 'Free', labelKey: 'home.stats.free' },
          ].map((stat) => (
            <div key={stat.labelKey} className="card p-6">
              <div className="font-display font-bold text-3xl text-primary mb-1">{stat.value}</div>
              <div className="text-gray-500 text-sm">{t(stat.labelKey)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── VENUE CTA ────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center card p-12"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(123,47,190,0.08))' }}>
          <div className="text-5xl mb-4">🏢</div>
          <h2 className="font-display font-bold text-4xl text-white mb-4">{t('home.cta.title')}</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            {t('home.cta.desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register?role=venue_owner" className="btn-primary text-lg px-8 py-4">{t('home.cta.list')}</Link>
            <Link to="/discover" className="btn-ghost text-lg px-8 py-4">{t('home.cta.how')}</Link>
          </div>
        </div>
      </section>

      {reservationModal.open && <ReservationModal />}
    </div>
  );
}
