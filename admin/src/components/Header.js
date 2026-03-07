import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/users': 'User Management',
  '/venues': 'Venue Management',
  '/reservations': 'Reservations',
  '/payments': 'Payments & Revenue',
  '/stories': 'Content Moderation',
  '/analytics': 'Analytics',
};

export default function Header() {
  const location = useLocation();
  const { admin } = useSelector((state) => state.auth);
  const title = PAGE_TITLES[location.pathname] || 'Admin';

  return (
    <header className="h-16 border-b border-border bg-sidebar px-6 flex items-center justify-between">
      <h1 className="font-display font-bold text-white text-xl">{title}</h1>
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <p className="text-sm font-medium text-white">{admin?.full_name || 'Admin'}</p>
          <p className="text-xs text-gray-500">{admin?.email}</p>
        </div>
        <div className="w-9 h-9 bg-primary/20 border border-primary/40 rounded-full flex items-center justify-center text-primary font-bold text-sm">
          {admin?.full_name?.[0] || 'A'}
        </div>
      </div>
    </header>
  );
}
