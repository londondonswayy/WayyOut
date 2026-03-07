import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../store/slices/authSlice';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

export default function UserProfile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    city: user?.city || '',
  });
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', new_password_confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      dispatch(updateUser(res.data));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      await authAPI.changePassword(passwordForm);
      toast.success('Password changed!');
      setPasswordForm({ old_password: '', new_password: '', new_password_confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display font-bold text-3xl text-white mb-8">My Profile</h1>

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
        <h2 className="font-semibold text-white mb-5">Edit Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Full Name</label>
            <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">City</label>
            <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="input resize-none" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-5">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Current Password</label>
            <input type="password" value={passwordForm.old_password} onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">New Password</label>
            <input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} className="input" required minLength={8} />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Confirm New Password</label>
            <input type="password" value={passwordForm.new_password_confirm} onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirm: e.target.value })} className="input" required />
          </div>
          <button type="submit" disabled={changingPassword} className="btn-ghost">
            {changingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
