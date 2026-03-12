import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adAPI } from '../services/api';

export default function AdCard({ ad, onDismiss }) {
  useEffect(() => {
    adAPI.impression(ad.id).catch(() => {});
  }, [ad.id]);

  return (
    <div className="card overflow-hidden relative group">
      {/* Sponsored badge */}
      <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
        Sponsored
      </div>
      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 z-10 w-6 h-6 bg-black/60 rounded-full text-white/60 hover:text-white flex items-center justify-center text-sm leading-none"
      >
        ×
      </button>

      {/* Cover image */}
      <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-accent-purple/20 overflow-hidden">
        {ad.venue_cover || ad.image ? (
          <img
            src={ad.image || ad.venue_cover}
            alt={ad.headline}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🏢</div>
        )}
      </div>

      <div className="p-4">
        <p className="text-gray-500 text-xs mb-1">{ad.venue_name} · {ad.venue_city}</p>
        <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">{ad.headline}</h3>
        {ad.body && <p className="text-gray-400 text-xs mb-3 line-clamp-2">{ad.body}</p>}
        <Link
          to={`/venues/${ad.venue_slug}`}
          className="btn-primary text-xs py-1.5 px-4 inline-block"
        >
          {ad.cta_text || 'Book Now'}
        </Link>
      </div>
    </div>
  );
}
