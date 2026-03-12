import React, { useEffect } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile } from './store/slices/authSlice';
import { setUserLocation } from './store/slices/uiSlice';

import Navbar from './components/Navbar';
import AIChat from './components/AIChat';
import Home from './pages/Home';
import Discover from './pages/Discover';
import VenueDetail from './pages/VenueDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import UserProfile from './pages/UserProfile';
import Reservations from './pages/Reservations';
import VenueOwnerDashboard from './pages/VenueOwnerDashboard';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function VenueOwnerRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  return user?.role === 'venue_owner' ? children : <Navigate to="/" />;
}

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProfile());
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        dispatch(setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
      });
    }
  }, [dispatch]);

  return (
    <LanguageProvider>
    <div className="min-h-screen bg-dark">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/venue/:slug" element={<VenueDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
        <Route path="/reservations" element={<PrivateRoute><Reservations /></PrivateRoute>} />
        <Route path="/venue-dashboard" element={<VenueOwnerRoute><VenueOwnerDashboard /></VenueOwnerRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {isAuthenticated && <AIChat />}
    </div>
    </LanguageProvider>
  );
}
