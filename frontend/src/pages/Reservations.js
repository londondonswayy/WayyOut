import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyReservations } from '../store/slices/reservationSlice';
import { reservationAPI } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { useTranslation } from '../i18n/LanguageContext';

const STATUS_STYLES = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  accepted: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-gray-500/20 text-gray-400',
  completed: 'bg-blue-500/20 text-blue-400',
};

function ReservationCard({ reservation, onCancel, t }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg">{reservation.venue.name}</h3>
          <p className="text-gray-500 text-sm">{t('myres.ref')} {reservation.reference}</p>
        </div>
        <span className={`badge ${STATUS_STYLES[reservation.status] || ''} capitalize`}>
          {reservation.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-gray-400 mb-4">
        <div>
          <span className="text-gray-600 block text-xs">{t('myres.date')}</span>
          <span className="text-white">{format(new Date(reservation.date), 'MMM d, yyyy')}</span>
        </div>
        <div>
          <span className="text-gray-600 block text-xs">{t('myres.time')}</span>
          <span className="text-white">{reservation.time}</span>
        </div>
        <div>
          <span className="text-gray-600 block text-xs">{t('myres.partySize')}</span>
          <span className="text-white">{reservation.party_size} {t('myres.guests')}</span>
        </div>
        <div>
          <span className="text-gray-600 block text-xs">{t('myres.type')}</span>
          <span className="text-white capitalize">{reservation.reservation_type.replace('_', ' ')}</span>
        </div>
      </div>

      {reservation.special_requests && (
        <p className="text-gray-500 text-sm mb-4 italic">"{reservation.special_requests}"</p>
      )}

      {reservation.rejection_reason && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 mb-4">
          <p className="text-red-400 text-sm">{t('myres.rejected')} {reservation.rejection_reason}</p>
        </div>
      )}

      {['pending', 'accepted'].includes(reservation.status) && (
        <button
          onClick={() => onCancel(reservation.id)}
          className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
        >
          {t('myres.cancel')}
        </button>
      )}
    </div>
  );
}

export default function Reservations() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((state) => state.reservations);
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');

  useEffect(() => {
    dispatch(fetchMyReservations(filter ? { status: filter } : {}));
  }, [filter, dispatch]);

  const handleCancel = async (id) => {
    try {
      await reservationAPI.cancel(id);
      toast.success(t('myres.cancelled'));
      dispatch(fetchMyReservations(filter ? { status: filter } : {}));
    } catch {
      toast.error(t('myres.cancelFailed'));
    }
  };

  const STATUS_LABELS = {
    '': t('myres.all'),
    pending: t('dash.pending'),
    accepted: t('dash.confirmed'),
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    completed: 'Completed',
  };

  return (
    <div className="pt-20 min-h-screen max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-bold text-3xl text-white">{t('myres.title')}</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {['', 'pending', 'accepted', 'rejected', 'cancelled', 'completed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === s ? 'bg-primary text-white' : 'bg-dark-card border border-dark-border text-gray-400 hover:text-white'
            }`}
          >
            {STATUS_LABELS[s] || s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-dark-border rounded w-1/3 mb-3" />
              <div className="h-4 bg-dark-border rounded w-1/4 mb-4" />
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, j) => <div key={j} className="h-8 bg-dark-border rounded" />)}
              </div>
            </div>
          ))}
        </div>
      ) : list.length > 0 ? (
        <div className="space-y-4">
          {list.map((res) => (
            <ReservationCard key={res.id} reservation={res} onCancel={handleCancel} t={t} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 card">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-white text-xl font-semibold mb-2">{t('myres.empty')}</p>
          <p className="text-gray-500">{t('myres.emptyDesc')}</p>
        </div>
      )}
    </div>
  );
}
