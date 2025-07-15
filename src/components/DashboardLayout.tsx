import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Gift,
  QrCode,
  Settings as SettingsIcon,
  UserCog,
  LineChart,
  CreditCard,
  Settings,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X,
  ChefHat,
  Crown,
  ChevronLeft,
  LogOut,
  Wallet,
  ChevronDown,
  User,
  Utensils
} from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useAuth } from '../contexts/AuthContext';
import CustomerWallet from './CustomerWallet';

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [isPro, setIsPro] = useState(false);
  const [showProAnimation, setShowProAnimation] = useState(false);
  const [showCustomerWallet, setShowCustomerWallet] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user, staff } = useAuth();

  const { notifications, currentUser, refreshData } = useDashboardData(timeRange);

  // Scroll to top when component mounts or location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Rewards', href: '/dashboard/rewards', icon: Gift },
    { name: 'Menu Items', href: '/dashboard/menu-items', icon: Utensils },
    { name: 'Loyalty Config', href: '/dashboard/loyalty-config', icon: SettingsIcon },
    { name: 'QR Codes', href: '/dashboard/qr', icon: QrCode },
    { name: 'Staff', href: '/dashboard/staff', icon: UserCog },
    { name: 'Analytics', href: '/dashboard/analytics', icon: LineChart },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { name: 'Settings', href: '/dashboard/settings', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleUpgrade = (plan: string) => {
    setShowProAnimation(true);
    setIsPro(true);
  };

  const closeProAnimation = () => {
    setShowProAnimation(false);
  };

  const handleSignOut = async () => {
    try {
      setShowUserDropdown(false);
      console.log('Attempting to sign out...');
      await signOut();
      console.log('Sign out successful, navigating to login...');
      navigate('/login');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Force navigation even if sign out fails
      navigate('/login');
    }
  };

  // Get user initials from user metadata or email
  const getUserInitials = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      const emailParts = user.email.split('@')[0].split('.');
      if (emailParts.length >= 2) {
        return `${emailParts[0][0]}${emailParts[1][0]}`.toUpperCase();
      }
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Enhanced Golden Chef Hat Component for Pro Badge
  const GoldenChefHat = () => (
    <Link
      to="/dashboard/billing"
      className="inline-flex items-center justify-center relative group"
    >
      <ChefHat className="h-6 w-6 text-amber-500 hover:text-amber-600 transition-colors duration-200" />
    </Link>
  );

  // Enhanced Pro Welcome Modal Component
  const ProBadgeAnimation = () => {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-lg">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 transform animate-in fade-in-0 zoom-in-95 duration-500">
          <div className="text-center">
            {/* Success icon */}
            <div className="flex justify-center mb-6">
              <ChefHat className="h-16 w-16 text-amber-500" />
            </div>
            
            {/* Welcome message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Premium!</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              🎉 Your account has been upgraded successfully!<br/>
              You now have access to all premium features including advanced analytics, unlimited customers, and priority support.
            </p>
            
            {/* Action button */}
            <button
              onClick={closeProAnimation}
              className="w-full bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Customer Wallet Modal
  if (showCustomerWallet) {
    return (
      <CustomerWallet 
        isDemo={true}
        onClose={() => setShowCustomerWallet(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pro Badge Animation */}
      {showProAnimation && <ProBadgeAnimation />}

      {/* Enhanced Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="flex h-16 items-center justify-between px-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all duration-200 active:scale-95"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] relative">
              {isPro ? (
                <ChefHat className="h-6 w-6 text-amber-500" />
              ) : (
                <ChefHat className="h-6 w-6 text-white" />
              )}
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] bg-clip-text text-transparent">
              TableLoyalty
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isPro && <GoldenChefHat />}
            <button 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative transition-all duration-200 active:scale-95"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {notifications.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 bg-white transform transition-all duration-300 ease-in-out lg:translate-x-0 border-r border-gray-200 shadow-xl lg:shadow-none ${
          isSidebarOpen ? 'w-64' : 'w-16'
        } ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:block`}
      >
        <div className={`flex h-16 items-center gap-2 px-6 border-b border-gray-200 bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] ${!isSidebarOpen ? 'justify-center px-2' : ''}`}>
          {isSidebarOpen && (
            <>
              <div className="p-1 rounded-lg bg-white/20 relative">
                {isPro ? (
                  <ChefHat className="h-8 w-8 text-amber-500" />
                ) : (
                  <ChefHat className="h-8 w-8 text-white" />
                )}
              </div>
              <span className="text-xl font-bold text-white">TableLoyalty</span>
            </>
          )}
          {!isSidebarOpen && (
            <div className="p-1 rounded-lg bg-white/20 relative">
              {isPro ? (
                <ChefHat className="h-8 w-8 text-amber-500" />
              ) : (
                <ChefHat className="h-8 w-8 text-white" />
              )}
            </div>
          )}
        </div>
        
        {/* Sidebar Toggle Button */}
        <div className="hidden lg:block absolute -right-3 top-20 z-50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-white border border-gray-200 rounded-full p-1.5 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
        
        <nav className={`flex flex-col gap-1 p-4 ${!isSidebarOpen ? 'px-2' : ''}`}>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  !isSidebarOpen ? 'justify-center px-2' : ''
                } ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] text-white shadow-lg transform scale-[1.02]'
                    : 'text-gray-700 hover:bg-gray-50 hover:scale-[1.01]'
                }`}
                title={!isSidebarOpen ? item.name : ''}
              >
                <Icon className={`h-5 w-5 ${isActive(item.href) ? 'text-white' : 'text-gray-500 group-hover:text-[#1E2A78]'} ${!isSidebarOpen ? 'mx-auto' : ''}`} />
                {isSidebarOpen && (
                  <>
                    <span className="font-medium">{item.name}</span>
                    <ChevronRight className={`ml-auto h-4 w-4 transition-all duration-200 ${
                      isActive(item.href) ? 'text-white opacity-100 transform rotate-90' : 'text-gray-400 opacity-0 group-hover:opacity-100'
                    }`} />
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Customer Wallet Preview Button */}

        {/* Pro upgrade section */}
        {!isPro && isSidebarOpen && (
          <div className="absolute bottom-16 left-4 right-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">Unlock advanced analytics and unlimited customers</p>
              <Link 
                to="/dashboard/billing"
                className="block w-full bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] text-white text-xs font-medium py-2 rounded-lg hover:shadow-lg transition-all duration-200 text-center"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        {/* Enhanced Desktop header */}
        <header className={`hidden lg:block fixed top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-all duration-300 ${
          isSidebarOpen ? 'left-64 right-0' : 'left-16 right-0'
        }`}>
          <div className="flex h-16 items-center gap-4 px-6">
            <div className="flex-1 flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search customers, rewards, or analytics..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>

              <div className="flex items-center gap-2">
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>

                <button
                  onClick={() => setShowCustomerWallet(true)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Wallet className="h-4 w-4" />
                  Customer Demo
                </button>

                <div className="relative">
                  <button 
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative transition-all duration-200 active:scale-95"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {notifications.length}
                    </span>
                  </button>

                  {/* Enhanced Notifications dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                      </div>
                      {notifications.map((notification) => (
                        <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-[#1E2A78]">
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'success' ? 'bg-green-500' :
                              notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                      <p className="text-xs text-gray-500">{currentUser?.role || 'Restaurant Owner'}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] text-white flex items-center justify-center shadow-lg">
                      <span className="font-medium text-sm">{getUserInitials()}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Dropdown */}
                  {showUserDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserDropdown(false)}
                      />
                      <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] text-white flex items-center justify-center shadow-lg">
                            <span className="font-medium text-sm">{getUserInitials()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{getUserDisplayName()}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                            <p className="text-xs text-blue-600 font-medium">{currentUser?.role || 'Restaurant Owner'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        onClick={() => {
                          setShowUserDropdown(false);
                          navigate('/dashboard/settings');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Profile Settings</p>
                          <p className="text-xs text-gray-500">Manage your account</p>
                        </div>
                      </button>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        onClick={async () => {
                          setShowUserDropdown(false);
                          await handleSignOut();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
                          <LogOut className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Sign Out</p>
                          <p className="text-xs text-red-500">End your session</p>
                        </div>
                      </button>
                    </div>
                    </>
                  )}

                  {isPro && (
                    <div className="ml-2">
                      <GoldenChefHat />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="pt-16 lg:pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;