import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeReservationModal } from '../store/slices/uiSlice';
import { createReservation } from '../store/slices/reservationSlice';
import { toast } from 'react-toastify';

export default function ReservationModal() {
  const dispatch = useDispatch();
  const { reservationModal } = useSelector((state) => state.ui);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.reservations);
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

    const result = await dispatch(createReservation({
      venue: venue.id,
      ...form,
      party_size: parseInt(form.party_size),
    }));

    if (createReservation.fulfilled.match(result)) {
      toast.success(`Reservation request sent to ${venue.name}!`);
      dispatch(closeReservationModal());
    } else {
      toast.error('Failed to send reservation. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-border">
          <div>
            <h2 className="font-display font-bold text-xl text-white">Reserve a Spot</h2>
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
              { value: 'table', label: '🪑 Table', desc: 'Sit-down dining' },
              { value: 'guest_list', label: '📋 Guest List', desc: 'Entry booking' },
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
              <label className="text-xs text-gray-400 mb-1 block">Date</label>
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
              <label className="text-xs text-gray-400 mb-1 block">Time</label>
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
            <label className="text-xs text-gray-400 mb-1 block">Party size</label>
            <select
              value={form.party_size}
              onChange={(e) => setForm({ ...form, party_size: e.target.value })}
              className="input text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
              ))}
            </select>
          </div>

          {/* Special requests */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Special requests (optional)</label>
            <textarea
              value={form.special_requests}
              onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
              placeholder="Dietary requirements, celebrations, seating preference..."
              rows={3}
              className="input text-sm resize-none"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Sending...' : 'Send Reservation Request'}
          </button>

          <p className="text-xs text-gray-600 text-center">
            Venue will confirm or reject your request. You'll be notified instantly.
          </p>
        </form>
      </div>
    </div>
  );
}
