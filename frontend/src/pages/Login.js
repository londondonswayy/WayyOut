import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import { useTranslation } from '../i18n/LanguageContext';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'venue_owner') navigate('/venue-dashboard');
      else navigate('/');
    }
    return () => dispatch(clearError());
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;  // Prevent double-submit
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.user.full_name.split(' ')[0]}!`);
    } else {
      const err = result.payload;
      // Show lockout message if rate-limited
      if (err?.status === 429 || err?.userMessage) {
        toast.error(err.userMessage || 'Too many login attempts. Please wait 15 minutes.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #07071A 0%, #12103A 50%, #07071A 100%)' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="font-display font-bold text-2xl text-white">WayyOut</span>
          </Link>
          <h1 className="font-display font-bold text-3xl text-white">{t('login.title')}</h1>
          <p className="text-gray-500 mt-1">{t('login.subtitle')}</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {typeof error === 'string' ? error : 'Invalid email or password.'}
              </div>
            )}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{t('login.email')}</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com" className="input" autoComplete="email" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{t('login.password')}</label>
              <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••" className="input" autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? t('login.loading') : t('login.submit')}
            </button>
          </form>

          {/* Quick test logins */}
          <div className="mt-6 pt-6 border-t border-dark-border">
            <p className="text-xs text-gray-600 mb-3 text-center">Quick access (demo)</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Customer', email: 'alice@example.com', color: 'blue' },
                { label: 'Venue', email: 'owner1@wayout.app', color: 'purple' },
                { label: 'Admin', email: 'admin@wayout.app', color: 'red' },
              ].map(({ label, email, color }) => (
                <button key={label} type="button"
                  onClick={() => setForm({ email, password: label === 'Admin' ? 'admin123456' : 'pass123456' })}
                  className={`text-xs py-2 px-3 rounded-lg border transition-colors ${
                    color === 'blue' ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10' :
                    color === 'purple' ? 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10' :
                    'border-red-500/30 text-red-400 hover:bg-red-500/10'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-700 text-center mt-2">Click then Sign In</p>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
