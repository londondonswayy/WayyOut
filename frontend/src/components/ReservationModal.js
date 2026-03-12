import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeReservationModal } from '../store/slices/uiSlice';
import { createReservation } from '../store/slices/reservationSlice';
import { toast } from 'react-toastify';
import { useTranslation } from '../i18n/LanguageContext';

export default function ReservationModal() {
  const dispatch = useDispatch();
  const { reservationModal } = useSelector((state) => state.ui);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.reservations);
  const { t } = useTranslation();
  const venue = reservationModal.venue;

  const [form, setForm] = useState({
    reservation_type: 'table',
    date: '',
    time: '',
    party_size: 2,
    special_requests: '',
  });

  if (!reservationModal.open || !venue) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to make a reservation.');
      return;
    }
    if (loading) return;  // Prevent double-submission

    const result = await dispatch(createReservation({
      venue: venue.id,
      ...form,
      party_size: parseInt(form.party_size),
      special_requests: form.special_requests.slice(0, 500),  // enforce max client-side too
    }));

    if (createReservation.fulfilled.match(result)) {
      toast.success(`Reservation request sent to ${venue.name}!`);
      dispatch(closeReservationModal());
    } else {
      const payload = result.payload;
      const msg = payload?.userMessage
        || payload?.error
        || (typeof payload === 'object' ? Object.values(payload).flat().join(' · ') : null)
        || 'Failed to send reservation. Please try again.';
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <div>
            <h2 className="font-display font-bold text-xl text-white">{t('res.title')}</h2>
            <p className="text-gray-400 text-sm mt-0.5">{venue.name}</p>
          </div>
          <button
            onClick={() => dispatch(closeReservationModal())}
            className="text-gray-500 hover:text-white transition-colors text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'table', label: t('res.table'), desc: t('res.tableDining') },
              { value: 'guest_list', label: t('res.guestList'), desc: t('res.guestEntry') },
            ].map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setForm({ ...form, reservation_type: type.value })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  form.reservation_type === type.value
                    ? 'border-primary bg-primary/10'
                    : 'border-dark-border hover:border-gray-600'
                }`}
              >
                <div className="font-medium text-sm text-white">{type.label}</div>
                <div className="text-xs text-gray-500">{type.desc}</div>
              </button>
            ))}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{t('res.date')}</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{t('res.time')}</label>
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="input text-sm"
              />
            </div>
          </div>

          {/* Party size */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">{t('res.partySize')}</label>
            <select
              value={form.party_size}
              onChange={(e) => setForm({ ...form, party_size: e.target.value })}
              className="input text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? t('res.guest') : t('res.guests')}</option>
              ))}
            </select>
          </div>

          {/* Special requests */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">
              {t('res.special')}
              <span className="ml-1 text-gray-600">
                {form.special_requests.length}/500
              </span>
            </label>
            <textarea
              value={form.special_requests}
              onChange={(e) => setForm({ ...form, special_requests: e.target.value.slice(0, 500) })}
              placeholder={t('res.specialPlaceholder')}
              rows={3}
              maxLength={500}
              className="input text-sm resize-none"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? t('res.loading') : t('res.submit')}
          </button>

          <p className="text-xs text-gray-600 text-center">
            {t('res.notice')}
          </p>
        </form>
      </div>
    </div>
  );
}
