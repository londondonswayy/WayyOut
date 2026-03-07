import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogout } from '../store/slices/authSlice';

const NAV = [
  { to: '/', icon: '📊', label: 'Overview', end: true },
  { to: '/users', icon: '👥', label: 'Users' },
  { to: '/venues', icon: '🏢', label: 'Venues' },
  { to: '/reservations', icon: '📋', label: 'Reservations' },
  { to: '/payments', icon: '💳', label: 'Payments' },
  { to: '/stories', icon: '🎥', label: 'Content' },
  { to: '/analytics', icon: '📈', label: 'Analytics' },
];

export default function Sidebar() {
  const dispatch = useDispatch();
  const { admin } = useSelector(s => s.auth);

  return (
    <aside className="w-60 bg-[#0D0D14] border-r border-[#1E1E2E] flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-[#1E1E2E]">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 bg-[#FF3D57] rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <span className="text-white font-bold text-base">W</span>
          </div>
          <div>
            <p className="font-bold text-white text-base leading-none">WayyOut</p>
            <p className="text-xs text-gray-500 mt-0.5">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-[#FF3D57]/10 text-[#FF3D57] border border-[#FF3D57]/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`
            }>
            <span className="text-base w-5 text-center">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-[#1E1E2E]">
        <div className="flex items-center space-x-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-[#FF3D57]/20 rounded-full flex items-center justify-center text-[#FF3D57] font-bold text-sm">
            {admin?.full_name?.[0] || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{admin?.full_name || 'Admin'}</p>
            <p className="text-xs text-gray-600 truncate">{admin?.email}</p>
          </div>
        </div>
        <button onClick={() => dispatch(adminLogout())}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
          <span className="w-5 text-center">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
