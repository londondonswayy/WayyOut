import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Venues from './pages/Venues';
import Reservations from './pages/Reservations';
import Payments from './pages/Payments';
import Stories from './pages/Stories';
import Analytics from './pages/Analytics';
import AdminLogin from './pages/AdminLogin';

function AdminLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-[#0A0A0F]">
          {children}
        </main>
      </div>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/*" element={
        <PrivateRoute>
          <AdminLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/reservations" element={<Reservations />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/stories" element={<Stories />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </AdminLayout>
        </PrivateRoute>
      } />
    </Routes>
  );
}
