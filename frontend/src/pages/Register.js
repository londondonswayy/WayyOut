import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import { useTranslation } from '../i18n/LanguageContext';

const STEPS_CUSTOMER = ['Account', 'Done'];
const STEPS_VENUE = ['Account', 'Venue Info', 'Done'];

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const { t } = useTranslation();

  const defaultRole = searchParams.get('role') || 'customer';
  const [role, setRole] = useState(defaultRole);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '',
    password: '', password_confirm: '',
  });
  const [honeypot, setHoneypot] = useState('');  // bots fill this; humans don't see it
  const [submitting, setSubmitting] = useState(false);

  const [venueForm, setVenueForm] = useState({
    name: '', city: '', address: '',
    category: '', description: '', phone: '',
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (isAuthenticated && role === 'customer') navigate('/');
    return () => dispatch(clearError());
  }, [isAuthenticated]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/venues/categories/`)
      .then(r => r.json()).then(d => setCategories(d.results || d)).catch(() => {});
  }, []);

  const handleAccount = async (e) => {
    e.preventDefault();
    if (honeypot) return;  // Silently block bots
    if (submitting) return;

    if (form.password !== form.password_confirm) {
      toast.error(t('register.pw.mismatch'));
      return;
    }
    // Basic client-side password strength check
    if (!/[A-Z]/.test(form.password)) {
      toast.error(t('register.pw.upper'));
      return;
    }
    if (!/\d/.test(form.password)) {
      toast.error(t('register.pw.digit'));
      return;
    }

    setSubmitting(true);
    const result = await dispatch(registerUser({ ...form, role }));
    setSubmitting(false);

    if (registerUser.fulfilled.match(result)) {
      if (role === 'venue_owner') {
        setStep(2);
        toast.success(t('register.toast.created'));
      } else {
        toast.success(t('register.toast.welcome'));
        navigate('/');
      }
    } else {
      const err = result.payload;
      if (typeof err === 'object' && err !== null) {
        const msgs = Object.values(err).flat().join(' · ');
        toast.error(msgs || 'Registration failed. Please try again.');
      }
    }
  };

  const handleVenueSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/venues/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...venueForm,
          category: venueForm.category ? parseInt(venueForm.category) : null,
          latitude: 0, longitude: 0,
        }),
      });
      if (res.ok) {
        toast.success('Venue submitted for review! You\'ll be notified once approved.');
        navigate('/venue-dashboard');
      } else {
        const data = await res.json();
        toast.error(Object.values(data).flat().join(', ') || 'Failed to create venue.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const steps = role === 'venue_owner' ? STEPS_VENUE : STEPS_CUSTOMER;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #07071A 0%, #12103A 50%, #07071A 100%)' }}>
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="font-display font-bold text-2xl text-white">WayyOut</span>
          </Link>
          <h1 className="font-display font-bold text-3xl text-white">{t('register.title')}</h1>
          <p className="text-gray-500 mt-1">{t('register.subtitle')}</p>
        </div>

        {/* Step indicator */}
        {role === 'venue_owner' && (
          <div className="flex items-center justify-center mb-8 space-x-2">
            {steps.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center space-x-2 ${i + 1 <= step ? 'text-primary' : 'text-gray-600'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${i + 1 < step ? 'bg-primary border-primary text-white' : i + 1 === step ? 'border-primary text-primary' : 'border-gray-700 text-gray-600'}`}>
                    {i + 1 < step ? '✓' : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 max-w-12 ${i + 1 < step ? 'bg-primary' : 'bg-gray-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="card p-8">

          {/* ── STEP 1: Account ── */}
          {step === 1 && (
            <>
              {/* Role toggle */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { value: 'customer', icon: '🌃', label: t('register.explorer'), desc: t('register.goingOut') },
                  { value: 'venue_owner', icon: '🏢', label: t('register.ownerLabel'), desc: t('register.ownVenue') },
                ].map((r) => (
                  <button key={r.value} type="button" onClick={() => setRole(r.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${role === r.value ? 'border-primary bg-primary/10' : 'border-dark-border hover:border-gray-600'}`}>
                    <div className="text-2xl mb-1">{r.icon}</div>
                    <div className="font-semibold text-sm text-white">{r.label}</div>
                    <div className="text-xs text-gray-500">{r.desc}</div>
                  </button>
                ))}
              </div>

              <form onSubmit={handleAccount} className="space-y-4">
                {/* Honeypot — hidden from real users, bots fill it in */}
                <input
                  type="text"
                  name="url"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
                  aria-hidden="true"
                />
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                    {typeof error === 'string' ? error : Object.entries(error).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')}
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t('register.fullName')} *</label>
                  <input type="text" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" className="input" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t('register.email')} *</label>
                  <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="input" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t('register.phone')}</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" className="input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t('register.password')} *</label>
                    <input type="password" required minLength={8} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={t('register.minChars')} className="input" />
                    {form.password && (
                      <div className="mt-1.5 flex gap-1">
                        {[t('register.pw.length'), t('register.pw.upper'), t('register.pw.digit')].map((rule, i) => {
                          const met = [form.password.length >= 8, /[A-Z]/.test(form.password), /\d/.test(form.password)][i];
                          return (
                            <span key={rule} className={`text-[10px] px-2 py-0.5 rounded-full ${met ? 'bg-green-500/20 text-green-400' : 'bg-dark-border text-gray-600'}`}>
                              {met ? '✓ ' : ''}{rule}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t('register.confirm')} *</label>
                    <input type="password" required value={form.password_confirm} onChange={e => setForm({ ...form, password_confirm: e.target.value })} placeholder={t('register.repeat')} className="input" />
                    {form.password_confirm && (
                      <p className={`text-[10px] mt-1.5 ${form.password === form.password_confirm ? 'text-green-400' : 'text-red-400'}`}>
                        {form.password === form.password_confirm ? t('register.pw.match') : t('register.pw.mismatch')}
                      </p>
                    )}
                  </div>
                </div>
                <button type="submit" disabled={loading || submitting} className="btn-primary w-full mt-2 py-3 disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting || loading ? t('register.creating') : role === 'venue_owner' ? t('register.continue') : t('register.submit')}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2: Venue Info ── */}
          {step === 2 && (
            <form onSubmit={handleVenueSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🏢</div>
                <h2 className="font-display font-bold text-xl text-white">{t('register.venueSetupTitle')}</h2>
                <p className="text-gray-500 text-sm mt-1">{t('register.venueSetupDesc')}</p>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t('register.venueName')} *</label>
                <input type="text" required value={venueForm.name} onChange={e => setVenueForm({ ...venueForm, name: e.target.value })} placeholder="The Grand Lounge" className="input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t('register.city')} *</label>
                  <input type="text" required value={venueForm.city} onChange={e => setVenueForm({ ...venueForm, city: e.target.value })} placeholder="New York" className="input" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{t('register.category')} *</label>
                  <select required value={venueForm.category} onChange={e => setVenueForm({ ...venueForm, category: e.target.value })} className="input">
                    <option value="">{t('register.select')}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t('register.address')} *</label>
                <input type="text" required value={venueForm.address} onChange={e => setVenueForm({ ...venueForm, address: e.target.value })} placeholder="123 Main Street" className="input" />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t('register.phone')}</label>
                <input type="tel" value={venueForm.phone} onChange={e => setVenueForm({ ...venueForm, phone: e.target.value })} placeholder="+1 212-555-0100" className="input" />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">{t('register.description')} *</label>
                <textarea required rows={4} value={venueForm.description} onChange={e => setVenueForm({ ...venueForm, description: e.target.value })}
                  placeholder={t('register.descPlaceholder')} className="input resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => navigate('/')} className="btn-ghost flex-1 py-3 text-sm">{t('register.skip')}</button>
                <button type="submit" className="btn-primary flex-1 py-3">{t('register.submitVenue')}</button>
              </div>
              <p className="text-xs text-gray-600 text-center">{t('register.reviewNotice')}</p>
            </form>
          )}

          <p className="text-center text-gray-500 text-sm mt-6">
            {t('register.haveAccount')}{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">{t('register.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
