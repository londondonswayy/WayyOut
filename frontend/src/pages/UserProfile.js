import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../store/slices/authSlice';
import { authAPI, adAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useTranslation } from '../i18n/LanguageContext';

export default function UserProfile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { t } = useTranslation();
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    city: user?.city || '',
  });
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', new_password_confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [adSub, setAdSub] = useState(null);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    adAPI.subscription().then(res => setAdSub(res.data)).catch(() => {});
  }, []);

  const handleSubscribe = async (plan) => {
    setSubLoading(true);
    try {
      const res = await adAPI.subscribe(plan);
      setAdSub(res.data);
      toast.success(t('adFree.subscribed'));
    } catch {
      toast.error(t('profile.saveFailed'));
    } finally {
      setSubLoading(false);
    }
  };

  const handleCancelSub = async () => {
    setSubLoading(true);
    try {
      await adAPI.cancelSubscription();
      setAdSub({ is_active: false });
      toast.success(t('adFree.cancelled'));
    } catch {
      toast.error(t('profile.saveFailed'));
    } finally {
      setSubLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      dispatch(updateUser(res.data));
      toast.success(t('profile.saved'));
    } catch {
      toast.error(t('profile.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      await authAPI.changePassword(passwordForm);
      toast.success(t('profile.pwChanged'));
      setPasswordForm({ old_password: '', new_password: '', new_password_confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || t('profile.pwFailed'));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display font-bold text-3xl text-white mb-8">{t('profile.title')}</h1>

      {/* Avatar */}
      <div className="card p-6 mb-6 flex items-center space-x-4">
        <div className="w-20 h-20 bg-primary/20 border-2 border-primary/40 rounded-full flex items-center justify-center text-primary font-display font-bold text-3xl">
          {user?.full_name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-display font-bold text-xl text-white">{user?.full_name}</p>
          <p className="text-gray-400">{user?.email}</p>
          <span className="badge bg-primary/20 text-primary capitalize mt-1">{user?.role?.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Profile form */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-white mb-5">{t('profile.editTitle')}</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">{t('profile.fullName')}</label>
            <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">{t('profile.phone')}</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">{t('profile.city')}</label>
            <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">{t('profile.bio')}</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="input resize-none" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? t('profile.saving') : t('profile.save')}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-white mb-5">{t('profile.pwTitle')}</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">{t('profile.pwCurrent')}</label>
            <input type="password" value={passwordForm.old_password} onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">{t('profile.pwNew')}</label>
            <input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} className="input" required minLength={8} />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">{t('profile.pwConfirm')}</label>
            <input type="password" value={passwordForm.new_password_confirm} onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirm: e.target.value })} className="input" required />
          </div>
          <button type="submit" disabled={changingPassword} className="btn-ghost">
            {changingPassword ? t('profile.pwChanging') : t('profile.pwChange')}
          </button>
        </form>
      </div>

      {/* Ad Experience */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-white">{t('adFree.title')}</h2>
          {adSub?.is_active && (
            <span className="badge bg-green-500/20 text-green-400 text-xs">{t('adFree.active')}</span>
          )}
        </div>
        <p className="text-gray-500 text-sm mb-5">{t('adFree.desc')}</p>

        {adSub?.is_active ? (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <p className="text-green-400 text-sm font-medium">{t('adFree.active')}</p>
              <p className="text-gray-400 text-xs mt-1">
                {t('adFree.expires')}: {new Date(adSub.expires_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleCancelSub}
              disabled={subLoading}
              className="btn-ghost text-sm w-full"
            >
              {subLoading ? '...' : t('adFree.cancel')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly plan */}
            <div className="border border-dark-border rounded-xl p-4 hover:border-primary/40 transition-colors">
              <p className="font-semibold text-white mb-0.5">{t('adFree.monthly')}</p>
              <p className="text-primary text-lg font-bold mb-3">{t('adFree.monthlyPrice')}</p>
              <button
                onClick={() => handleSubscribe('monthly')}
                disabled={subLoading}
                className="btn-primary w-full text-sm py-2"
              >
                {subLoading ? '...' : t('adFree.subscribe')}
              </button>
            </div>
            {/* Yearly plan */}
            <div className="border border-primary/30 rounded-xl p-4 bg-primary/5 relative">
              <span className="absolute -top-2.5 right-3 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {t('adFree.save')}
              </span>
              <p className="font-semibold text-white mb-0.5">{t('adFree.yearly')}</p>
              <p className="text-primary text-lg font-bold mb-3">{t('adFree.yearlyPrice')}</p>
              <button
                onClick={() => handleSubscribe('yearly')}
                disabled={subLoading}
                className="btn-primary w-full text-sm py-2"
              >
                {subLoading ? '...' : t('adFree.subscribe')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
