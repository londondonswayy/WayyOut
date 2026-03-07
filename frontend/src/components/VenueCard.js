import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openReservationModal } from '../store/slices/uiSlice';

const VIBE_COLORS = {
  casual: 'bg-blue-500/20 text-blue-400',
  lively: 'bg-yellow-500/20 text-yellow-400',
  romantic: 'bg-pink-500/20 text-pink-400',
  upscale: 'bg-purple-500/20 text-purple-400',
  party: 'bg-red-500/20 text-red-400',
};

function BusyBar({ level }) {
  const color = level > 70 ? 'bg-red-500' : level > 40 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1 h-1.5 bg-dark-border rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${level}%` }} />
      </div>
      <span className="text-xs text-gray-500">{level}%</span>
    </div>
  );
}

export default function VenueCard({ venue, compact = false }) {
  const dispatch = useDispatch();

  return (
    <div className="card group hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-dark-border">
        {venue.cover_image ? (
          <img
            src={venue.cover_image}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent-purple/20 flex items-center justify-center">
            <span className="text-4xl">🏢</span>
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {venue.is_open ? (
            <span className="badge-open">● Open Now</span>
          ) : (
            <span className="badge-closed">● Closed</span>
          )}
          {venue.is_featured && (
            <span className="badge bg-accent-gold/20 text-yellow-400">★ Featured</span>
          )}
        </div>

        {venue.category && (
          <div className="absolute top-3 right-3">
            <span className="badge bg-dark/80 text-gray-300">{venue.category.name}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display font-semibold text-white text-lg leading-tight">{venue.name}</h3>
            <p className="text-gray-500 text-sm mt-0.5">{venue.city} · {venue.address?.split(',')[0]}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 text-yellow-400">
              <span>★</span>
              <span className="text-sm font-medium">{Number(venue.rating).toFixed(1)}</span>
            </div>
            <span className="text-xs text-gray-600">({venue.review_count})</span>
          </div>
        </div>

        {/* Vibe tag */}
        {venue.vibe && (
          <span className={`badge ${VIBE_COLORS[venue.vibe] || 'bg-gray-500/20 text-gray-400'}`}>
            {venue.vibe}
          </span>
        )}

        {/* Busy level */}
        {venue.is_open && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Busy level</span>
            </div>
            <BusyBar level={venue.busy_level} />
          </div>
        )}

        {/* Distance */}
        {venue.distance != null && (
          <p className="text-xs text-gray-500">📍 {venue.distance.toFixed(1)} km away</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Link
            to={`/venue/${venue.slug}`}
            className="flex-1 btn-ghost text-sm py-2 text-center"
          >
            View
          </Link>
          {venue.is_open && (
            <button
              onClick={() => dispatch(openReservationModal(venue))}
              className="flex-1 btn-primary text-sm py-2"
            >
              Reserve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
