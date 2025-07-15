import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './components/DashboardHome';
import CustomerWallet from './components/CustomerWallet';
import RewardsPage from './components/RewardsPage';
import DebugAuth from './components/DebugAuth';
import MenuItemsPage from './components/MenuItemsPage';
import LoyaltyConfigPage from './components/LoyaltyConfigPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1E2A78] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
          <p className="text-xs text-gray-400 mt-2">If this takes too long, check the console for errors</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/debug" element={<DebugAuth />} />
          
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          
          <Route 
            path="/wallet/:restaurantSlug?" 
            element={<CustomerWallet />}
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="customers" element={<div className="p-8 text-center text-gray-500">Customers page coming soon...</div>} />
            <Route path="rewards" element={<RewardsPage />} />
            <Route path="menu-items" element={<MenuItemsPage />} />
            <Route path="loyalty-config" element={<LoyaltyConfigPage />} />
            <Route path="qr" element={<div className="p-8 text-center text-gray-500">QR Codes page coming soon...</div>} />
            <Route path="staff" element={<div className="p-8 text-center text-gray-500">Staff page coming soon...</div>} />
            <Route path="analytics" element={<div className="p-8 text-center text-gray-500">Analytics page coming soon...</div>} />
            <Route path="billing" element={<div className="p-8 text-center text-gray-500">Billing page coming soon...</div>} />
            <Route path="settings" element={<div className="p-8 text-center text-gray-500">Settings page coming soon...</div>} />
          </Route>
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
