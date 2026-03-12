import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVenues, fetchCategories, setFilters } from '../store/slices/venueSlice';
import VenueCard from '../components/VenueCard';
import ReservationModal from '../components/ReservationModal';
import { useTranslation } from '../i18n/LanguageContext';

const VIBES = ['casual', 'lively', 'romantic', 'upscale', 'party'];
// To expand to more cities later, just add to this array
const CITIES = ['Montreal', 'Toronto'];

export default function Discover() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { list, categories, loading, filters } = useSelector((state) => state.venues);
  const { reservationModal } = useSelector((state) => state.ui);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const buildParams = () => ({
    city: searchParams.get('city') || '',
    category: searchParams.get('category') || '',
    vibe: searchParams.get('vibe') || '',
    is_open: searchParams.get('is_open') || '',
    search: searchParams.get('search') || '',
    ordering: searchParams.get('ordering') || '-rating',
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const params = buildParams();
    dispatch(fetchVenues(params));
  }, [searchParams]);

  const updateFilter = (key, value) => {
    const current = Object.fromEntries(searchParams.entries());
    if (value) {
      current[key] = value;
    } else {
      delete current[key];
    }
    setSearchParams(current);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilter('search', search);
  };

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header & Search */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl text-white mb-6">{t('discover.title')}</h1>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('discover.placeholder')}
              className="input flex-1"
            />
            <button type="submit" className="btn-primary px-6">{t('discover.search')}</button>
          </form>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
            {/* City */}
            <div className="card p-4">
              <h3 className="text-sm font-medium text-white mb-3">📍 {t('discover.city')}</h3>
              <div className="space-y-2">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateFilter('city', searchParams.get('city') === c ? '' : c)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      searchParams.get('city') === c
                        ? 'bg-primary/20 text-primary font-medium'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Open now */}
            <div className="card p-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-white">{t('discover.openNow')}</span>
                <div
                  onClick={() => updateFilter('is_open', searchParams.get('is_open') === 'true' ? '' : 'true')}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    searchParams.get('is_open') === 'true' ? 'bg-primary' : 'bg-dark-border'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    searchParams.get('is_open') === 'true' ? 'translate-x-5' : ''
                  }`} />
                </div>
              </label>
            </div>

            {/* Categories */}
            <div className="card p-4">
              <h3 className="font-semibold text-sm text-white mb-3">{t('discover.category')}</h3>
              <div className="space-y-2">
                <button
                  onClick={() => updateFilter('category', '')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !searchParams.get('category') ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t('discover.all')}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateFilter('category', cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                      searchParams.get('category') === cat.slug ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Vibes */}
            <div className="card p-4">
              <h3 className="font-semibold text-sm text-white mb-3">{t('discover.vibe')}</h3>
              <div className="flex flex-wrap gap-2">
                {VIBES.map((vibe) => (
                  <button
                    key={vibe}
                    onClick={() => updateFilter('vibe', searchParams.get('vibe') === vibe ? '' : vibe)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                      searchParams.get('vibe') === vibe
                        ? 'bg-primary text-white'
                        : 'bg-dark-border text-gray-400 hover:text-white'
                    }`}
                  >
                    {vibe}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="card p-4">
              <h3 className="font-semibold text-sm text-white mb-3">{t('discover.sortBy')}</h3>
              <select
                value={searchParams.get('ordering') || '-rating'}
                onChange={(e) => updateFilter('ordering', e.target.value)}
                className="input text-sm"
              >
                <option value="-rating">{t('discover.topRated')}</option>
                <option value="-busy_level">{t('discover.busiest')}</option>
                <option value="-created_at">{t('discover.newest')}</option>
              </select>
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400 text-sm">{list.length} {t('discover.count')}</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-48 bg-dark-border" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-dark-border rounded w-3/4" />
                      <div className="h-3 bg-dark-border rounded w-1/2" />
                      <div className="h-3 bg-dark-border rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : list.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {list.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 card">
                <p className="text-5xl mb-4">🔍</p>
                <p className="text-white text-xl font-semibold mb-2">{t('discover.empty')}</p>
                <p className="text-gray-500">{t('discover.emptyDesc')}</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {reservationModal.open && <ReservationModal />}
    </div>
  );
}
