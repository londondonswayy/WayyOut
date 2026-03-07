import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { toggleAIChat } from '../store/slices/uiSlice';
import { notificationAPI } from '../services/api';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { aiChatOpen } = useSelector((state) => state.ui);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      notificationAPI.unreadCount().then(r => setUnread(r.data.count)).catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark/90 backdrop-blur-xl border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" onClick={() => setMenuOpen(false)}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-white font-display font-bold text-sm">W</span>
            </div>
            <span className="font-display font-bold text-xl text-white">WayyOut</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-primary' : 'text-gray-400 hover:text-white'}`}>Home</Link>
            <Link to="/discover" className={`text-sm font-medium transition-colors ${isActive('/discover') ? 'text-primary' : 'text-gray-400 hover:text-white'}`}>Discover</Link>
            {isAuthenticated && user?.role === 'venue_owner' && (
              <Link to="/venue-dashboard" className={`text-sm font-medium transition-colors ${isActive('/venue-dashboard') ? 'text-primary' : 'text-gray-400 hover:text-white'}`}>My Venues</Link>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* AI */}
                <button onClick={() => dispatch(toggleAIChat())}
                  className={`hidden md:flex items-center space-x-2 px-3 py-2 rounded-xl text-sm transition-all ${aiChatOpen ? 'bg-accent-purple/30 border border-accent-purple text-purple-300' : 'bg-accent-purple/10 border border-accent-purple/30 text-purple-400 hover:bg-accent-purple/20'}`}>
                  <span>✨</span><span>AI Guide</span>
                </button>

                {/* Notifications */}
                <Link to="/reservations" className="relative p-2 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unread > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full text-xs text-white flex items-center justify-center font-bold">{unread}</span>
                  )}
                </Link>

                {/* Avatar dropdown */}
                <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center space-x-2 group">
                    <div className="w-9 h-9 bg-primary/20 border-2 border-primary/40 rounded-full flex items-center justify-center text-primary font-bold text-sm group-hover:border-primary transition-colors">
                      {user?.full_name?.[0]?.toUpperCase()}
                    </div>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-12 w-52 card py-2 shadow-2xl shadow-black/50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-dark-border mb-1">
                        <p className="text-sm font-semibold text-white">{user?.full_name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full capitalize ${user?.role === 'venue_owner' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {user?.role?.replace('_', ' ')}
                        </span>
                      </div>
                      <Link to="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-border transition-colors">Profile</Link>
                      <Link to="/reservations" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-border transition-colors">Reservations</Link>
                      {user?.role === 'venue_owner' && (
                        <Link to="/venue-dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-border transition-colors">My Venues</Link>
                      )}
                      <hr className="border-dark-border my-1" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-dark-border transition-colors">
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
