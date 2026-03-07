import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogin } from '../store/slices/authSlice';

export default function AdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(adminLogin(form));
    if (adminLogin.fulfilled.match(result)) navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-display font-bold text-2xl">W</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-white">Admin Access</h1>
          <p className="text-gray-500 text-sm mt-1">WayyOut Management Console</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                Invalid credentials or insufficient permissions.
              </div>
            )}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Admin Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors text-sm"
                placeholder="admin@wayout.app"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-[#0A0A0F] border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-all"
            >
              {loading ? 'Signing in...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
