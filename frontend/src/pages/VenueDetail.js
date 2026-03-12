import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { openReservationModal } from '../store/slices/uiSlice';
import { venueAPI } from '../services/api';
import StoriesFeed from '../components/StoriesFeed';
import ReservationModal from '../components/ReservationModal';
import { useSelector } from 'react-redux';
import { useTranslation } from '../i18n/LanguageContext';

const AVATAR_COLORS = ['#7C3AED', '#14B8A6', '#F59E0B', '#EC4899', '#3B82F6', '#10B981'];
const FIRST_NAMES = ['Alex', 'Sofia', 'Marcus', 'Priya', 'Jordan', 'Camille', 'Tyler', 'Mia', 'Noah', 'Léa'];
// Actions are resolved via t() at render time

function WhoIsGoing({ venue, t }) {
  const [people] = useState(() => {
    const count = Math.max(3, Math.floor((venue.busy_level || 30) / 10 + 2));
    return Array.from({ length: Math.min(count, 8) }, (_, i) => ({
      name: FIRST_NAMES[(i * 3 + venue.id) % FIRST_NAMES.length],
      color: AVATAR_COLORS[i % AVATAR_COLORS.length],
      actionKey: `going.action.${i % 5}`,
      minsAgo: Math.floor(i * 4 + Math.random() * 8 + 1),
    }));
  });
  const extraCount = Math.max(0, Math.floor((venue.busy_level || 30) / 5 + 5));

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white text-sm">{t('detail.whoGoing')}</h3>
        <span className="text-xs text-primary">{extraCount + people.length} {t('detail.people')}</span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        {people.slice(0, 6).map((p, i) => (
          <div
            key={i}
            title={p.name}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-dark-card"
            style={{ backgroundColor: p.color, marginLeft: i > 0 ? '-8px' : 0 }}
          >
            {p.name[0]}
          </div>
        ))}
        {extraCount > 0 && (
          <div
            className="w-8 h-8 rounded-full bg-dark-border flex items-center justify-center text-gray-400 text-xs font-bold flex-shrink-0 ring-2 ring-dark-card"
            style={{ marginLeft: '-8px' }}
          >
            +{extraCount}
          </div>
        )}
        <span className="text-gray-500 text-xs ml-2">{t('detail.andMore')}</span>
      </div>
      <div className="space-y-1.5 max-h-28 overflow-hidden">
        {people.slice(0, 3).map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
              style={{ backgroundColor: p.color }}
            >
              {p.name[0]}
            </div>
            <span className="text-white/70">{p.name}</span>
            <span>{t(p.actionKey)}</span>
            <span className="text-gray-600 ml-auto">{p.minsAgo}{t('detail.minsAgo')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VenueDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { reservationModal } = useSelector((state) => state.ui);
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await venueAPI.detail(slug);
        setVenue(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [slug]);

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await venueAPI.addReview(slug, review);
      const res = await venueAPI.detail(slug);
      setVenue(res.data);
      setReview({ rating: 5, comment: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-20 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-72 bg-dark-card rounded-2xl mb-6" />
          <div className="h-8 bg-dark-card rounded w-1/3 mb-4" />
          <div className="h-4 bg-dark-card rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🏚️</p>
          <p className="text-white text-xl">Venue not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen">
      {/* Cover */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        {venue.cover_image ? (
          <img src={venue.cover_image} alt={venue.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent-purple/20 flex items-center justify-center">
            <span className="text-8xl">🏢</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent" />

        {/* Badges */}
        <div className="absolute top-20 left-6 flex gap-2">
          {venue.is_open ? <span className="badge-open">● Open Now</span> : <span className="badge-closed">● Closed</span>}
          {venue.category && <span className="badge bg-dark/80 text-gray-300">{venue.category.name}</span>}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-10 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-4xl text-white">{venue.name}</h1>
            <p className="text-gray-400 mt-1">📍 {venue.address}, {venue.city}</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center space-x-1 text-yellow-400">
                <span>★</span>
                <span className="font-semibold">{Number(venue.rating).toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({venue.review_count} reviews)</span>
              </div>
              {venue.vibe && (
                <span className="badge bg-primary/20 text-primary capitalize">{venue.vibe}</span>
              )}
            </div>
          </div>

          {venue.is_open && (
            <button
              onClick={() => dispatch(openReservationModal(venue))}
              className="btn-primary px-8 py-3 text-lg"
            >
              {t('detail.reserveNow')}
            </button>
          )}
        </div>

        {/* Busy level */}
        {venue.is_open && (
          <div className="card p-4 mb-6 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Busy level</span>
                <span className={venue.busy_level > 70 ? 'text-red-400' : venue.busy_level > 40 ? 'text-yellow-400' : 'text-green-400'}>
                  {venue.busy_level > 70 ? t('detail.veryBusy') : venue.busy_level > 40 ? t('detail.moderate') : t('detail.quiet')}
                </span>
              </div>
              <div className="h-2 bg-dark-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${venue.busy_level > 70 ? 'bg-red-500' : venue.busy_level > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${venue.busy_level}%` }}
                />
              </div>
            </div>
            {venue.capacity > 0 && (
              <div className="text-right text-sm">
                <p className="text-white font-semibold">{venue.current_occupancy}/{venue.capacity}</p>
                <p className="text-gray-500">capacity</p>
              </div>
            )}
          </div>
        )}

        {/* Who's going tonight */}
        {venue.is_open && <WhoIsGoing venue={venue} t={t} />}

        {/* Tabs */}
        <div className="flex border-b border-dark-border mb-6">
          {['about', 'stories', 'photos', 'reviews', 'hours'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {t(`detail.tab.${tab}`)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <p className="text-gray-300 leading-relaxed">{venue.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {venue.phone && <div className="flex items-center space-x-3 text-gray-400"><span>📞</span><span>{venue.phone}</span></div>}
              {venue.email && <div className="flex items-center space-x-3 text-gray-400"><span>✉️</span><span>{venue.email}</span></div>}
              {venue.website && <div className="flex items-center space-x-3"><span>🌐</span><a href={venue.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{venue.website}</a></div>}
            </div>
          </div>
        )}

        {activeTab === 'stories' && (
          <div>
            <StoriesFeed />
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {venue.photos?.length > 0 ? venue.photos.map((photo) => (
              <div key={photo.id} className="aspect-square overflow-hidden rounded-xl">
                <img src={photo.image} alt={photo.caption} className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </div>
            )) : (
              <p className="col-span-full text-center py-12 text-gray-500">No photos yet</p>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {venue.reviews?.map((rev) => (
              <div key={rev.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold">
                      {rev.user.full_name[0]}
                    </div>
                    <span className="font-medium text-white">{rev.user.full_name}</span>
                  </div>
                  <div className="text-yellow-400">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                </div>
                <p className="text-gray-400 text-sm">{rev.comment}</p>
              </div>
            ))}

            <form onSubmit={submitReview} className="card p-5 space-y-4">
              <h3 className="font-semibold text-white">{t('detail.review.title')}</h3>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setReview({ ...review, rating: star })}
                    className={`text-2xl transition-colors ${star <= review.rating ? 'text-yellow-400' : 'text-gray-600'}`}>
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={review.comment}
                onChange={(e) => setReview({ ...review, comment: e.target.value })}
                placeholder={t('detail.review.placeholder')}
                rows={3}
                className="input resize-none"
                required
              />
              <button type="submit" disabled={submittingReview} className="btn-primary">
                {submittingReview ? t('detail.review.submitting') : t('detail.review.submit')}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="card p-5">
            <div className="space-y-3">
              {venue.opening_hours?.map((hours) => (
                <div key={hours.id} className="flex justify-between items-center py-2 border-b border-dark-border last:border-0">
                  <span className="text-white font-medium">{t(`day.${hours.day}`)}</span>
                  <span className="text-gray-400">
                    {hours.is_closed ? t('hours.closed') : `${hours.open_time} – ${hours.close_time}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {reservationModal.open && <ReservationModal />}
    </div>
  );
}
