import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openReservationModal } from '../store/slices/uiSlice';
import { useTranslation } from '../i18n/LanguageContext';
import { toast } from 'react-toastify';

const VIBE_COLORS = {
  casual: 'bg-blue-500/20 text-blue-400',
  lively: 'bg-yellow-500/20 text-yellow-400',
  romantic: 'bg-pink-500/20 text-pink-400',
  upscale: 'bg-purple-500/20 text-purple-400',
  party: 'bg-red-500/20 text-red-400',
};

function BusyBar({ level }) {
  const color = level > 70 ? 'bg-red-500' : level > 40 ? 'bg-yellow-500' : 'bg-green-500';
  const pulseColor = level > 70 ? 'bg-red-400' : level > 40 ? 'bg-yellow-400' : 'bg-green-400';
  return (
    <div className="flex items-center space-x-2">
      <span className="relative flex-shrink-0">
        <span className={`absolute inline-flex h-2 w-2 rounded-full ${pulseColor} opacity-75 animate-ping`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseColor}`} />
      </span>
      <div className="flex-1 h-1.5 bg-dark-border rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${level}%` }} />
      </div>
      <span className="text-xs text-gray-500">{level}%</span>
    </div>
  );
}

export default function VenueCard({ venue }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saved_venues') || '[]').includes(venue.id);
    } catch {
      return false;
    }
  });
  const [heartBounce, setHeartBounce] = useState(false);
  const [viewerCount] = useState(() =>
    Math.max(3, Math.floor((venue.busy_level || 0) / 8 + Math.random() * 10 + 2))
  );

  const toggleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    setHeartBounce(true);
    setTimeout(() => setHeartBounce(false), 400);
    toast(next ? `Saved ${venue.name}` : `Removed ${venue.name}`, {
      icon: next ? '❤️' : '🤍',
      position: 'bottom-center',
      autoClose: 1500,
      hideProgressBar: true,
    });
    try {
      const all = JSON.parse(localStorage.getItem('saved_venues') || '[]');
      const updated = next ? [...all, venue.id] : all.filter((id) => id !== venue.id);
      localStorage.setItem('saved_venues', JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="card group hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-dark-border rounded-t-xl">
        {venue.cover_image ? (
          <img
            src={venue.cover_image}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent-purple/20 flex items-center justify-center">
            <span className="text-5xl opacity-60">
              {venue.category?.name === 'Rooftop' ? '🏙️' :
               venue.category?.name === 'Nightclub' ? '🎉' :
               venue.category?.name === 'Restaurant' ? '🍽️' :
               venue.category?.name === 'Lounge' ? '🛋️' :
               venue.category?.name === 'Live Music' ? '🎵' : '🏢'}
            </span>
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {venue.is_open ? (
            <span className="badge-open">{t('venue.open')}</span>
          ) : (
            <span className="badge-closed">{t('venue.closed')}</span>
          )}
          {venue.is_featured && (
            <span className="badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">⭐ {t('venue.featured')}</span>
          )}
        </div>

        {/* Heart save button */}
        <button
          onClick={toggleSave}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-black/70 hover:scale-110"
          title={saved ? 'Remove from saved' : 'Save venue'}
        >
          <span
            className={`text-lg transition-transform ${heartBounce ? 'scale-150' : 'scale-100'}`}
            style={{ transition: 'transform 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97)' }}
          >
            {saved ? '❤️' : '🤍'}
          </span>
        </button>

        {/* Live viewer count */}
        {venue.is_open && (
          <div className="absolute bottom-3 left-3">
            <span className="flex items-center gap-1.5 text-xs text-white/90 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
              {viewerCount} {t('venue.viewing')}
            </span>
          </div>
        )}

        {venue.category && (
          <div className="absolute bottom-3 right-3">
            <span className="badge bg-black/60 backdrop-blur-sm text-gray-200 border-0">
              {venue.category.icon} {venue.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-white text-lg leading-tight truncate">{venue.name}</h3>
            <p className="text-gray-500 text-sm mt-0.5 truncate">📍 {venue.city} · {venue.address?.split(',')[0]}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center space-x-1 text-yellow-400">
              <span>★</span>
              <span className="text-sm font-semibold">{Number(venue.rating).toFixed(1)}</span>
            </div>
            {venue.price_level && (
              <span className="text-xs text-green-400 font-medium">
                {'$'.repeat(venue.price_level)}
                <span className="text-gray-700">{'$'.repeat(4 - venue.price_level)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Vibe tag */}
        {venue.vibe && (
          <span className={`badge capitalize ${VIBE_COLORS[venue.vibe] || 'bg-gray-500/20 text-gray-400'}`}>
            {venue.vibe}
          </span>
        )}

        {/* Busy level (open) or closed message */}
        {venue.is_open ? (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{t('venue.busyLevel') || 'Crowd'}</span>
              <span className={venue.busy_level > 70 ? 'text-red-400 font-medium' : venue.busy_level > 40 ? 'text-yellow-400 font-medium' : 'text-green-400 font-medium'}>
                {venue.busy_level > 70 ? t('venue.packed') : venue.busy_level > 40 ? t('venue.moderate') : t('venue.quiet')}
              </span>
            </div>
            <BusyBar level={venue.busy_level} />
          </div>
        ) : (
          <p className="text-xs text-gray-600 italic">Opens later tonight</p>
        )}

        {/* Distance */}
        {venue.distance != null && (
          <p className="text-xs text-gray-500">📍 {venue.distance.toFixed(1)} km away</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Link
            to={`/venue/${venue.slug}`}
            className="flex-1 btn-ghost text-sm py-2.5 text-center font-medium"
          >
            {t('venue.view')}
          </Link>
          <button
            onClick={() => venue.is_open
              ? dispatch(openReservationModal(venue))
              : null
            }
            className={`flex-1 text-sm py-2.5 rounded-xl font-medium transition-all ${
              venue.is_open
                ? 'btn-primary'
                : 'bg-dark-border text-gray-500 cursor-not-allowed'
            }`}
            disabled={!venue.is_open}
            title={venue.is_open ? '' : 'Venue is currently closed'}
          >
            {venue.is_open ? t('venue.reserve') : t('venue.closed')}
          </button>
        </div>
      </div>
    </div>
  );
}
