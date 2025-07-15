import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChefHat, Phone, User, CheckCircle2, ArrowRight, 
  Gift, Crown, Sparkles, Timer, X, ArrowLeft,
  Loader2, TrendingUp, Award, Heart, Utensils,
  Coffee, CreditCard, MapPin, Clock, Zap, Plus,
  Minus, QrCode, Share2, Copy, Check, AlertCircle, Percent,
  Star, Menu, Bell, Settings, LogOut, Wallet, Home
} from 'lucide-react';
import { CustomerService } from '../services/customerService';
import { RewardService } from '../services/rewardService';
import { supabase } from '../lib/supabase';
import CustomerOnboarding from './CustomerOnboarding';
import CustomerRedemptionModal from './CustomerRedemptionModal';
import { useAuth } from '../contexts/AuthContext';


interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  total_points: number;
  lifetime_points: number;
  current_tier: 'bronze' | 'silver' | 'gold';
  tier_progress: number;
  visit_count: number;
  total_spent: number;
  last_visit?: string;
  created_at: string;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  category: string;
  image_url?: string;
  min_tier: 'bronze' | 'silver' | 'gold';
  is_active: boolean;
}

interface Transaction {
  id: string;
  type: 'purchase' | 'bonus' | 'referral' | 'signup' | 'redemption';
  points: number;
  amount_spent?: number;
  description?: string;
  created_at: string;
  reward_id?: string;
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  settings: any;
}

const CustomerWallet: React.FC = () => {
  const { restaurantSlug } = useParams();
  const navigate = useNavigate();
  const { restaurant: authRestaurant } = useAuth();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'rewards' | 'history' | 'profile'>('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // If we have restaurantSlug from URL, fetch by slug
    if (restaurantSlug && !authRestaurant) {
      fetchRestaurant();
    } 
    // If we're in demo mode (no slug but have auth restaurant), use auth restaurant
    else if (!restaurantSlug && authRestaurant) {
      setRestaurant(authRestaurant);
      setShowOnboarding(true);
      setLoading(false);
    }
  }, [restaurantSlug, authRestaurant]);

  useEffect(() => {
    if (restaurant && customer) {
      fetchCustomerData();
    }
  }, [restaurant, customer?.id]);

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      
      if (restaurantSlug) {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', restaurantSlug)
          .single();

        if (error) throw error;
        setRestaurant(data);
      }
      
      // Check if customer is already logged in (localStorage)
      const restaurantId = restaurantSlug ? restaurant?.id : authRestaurant?.id;
      if (!restaurantId) return;
      
      const savedCustomer = localStorage.getItem(`customer_${restaurantId}`);
      if (savedCustomer) {
        const customerData = JSON.parse(savedCustomer);
        setCustomer(customerData);
      } else {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      if (restaurantSlug) navigate('/'); // Only navigate away if this was a real restaurant URL
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerData = async () => {
    if (!restaurant || !customer) return;
    
    try {
      const [rewardsData, transactionsData] = await Promise.all([
        RewardService.getAvailableRewards(restaurant.id, customer.id),
        CustomerService.getCustomerTransactions(restaurant.id, customer.id)
      ]);
      
      setRewards(rewardsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const handleOnboardingComplete = (customerData: Customer) => {
    setCustomer(customerData);
    setShowOnboarding(false);
    localStorage.setItem(`customer_${restaurant!.id}`, JSON.stringify(customerData));
  };

  const handleRedemption = async (reward: Reward) => {
    if (!customer || !restaurant) return;

    try {
      await RewardService.redeemReward(restaurant.id, customer.id, reward.id);
      
      // Refresh customer data
      const updatedCustomer = await CustomerService.getCustomer(restaurant.id, customer.id);
      if (updatedCustomer) {
        setCustomer(updatedCustomer);
        localStorage.setItem(`customer_${restaurant.id}`, JSON.stringify(updatedCustomer));
      }
      
      await fetchCustomerData();
      setShowRedemptionModal(false);
      setSelectedReward(null);
    } catch (error) {
      console.error('Redemption failed:', error);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem(`customer_${restaurant!.id}`);
    setCustomer(null);
    setShowOnboarding(true);
    setShowMenu(false);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-orange-400 to-orange-600';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      default: return 'from-orange-400 to-orange-600';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return Award;
      case 'silver': return Crown;
      case 'gold': return Sparkles;
      default: return Award;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return CreditCard;
      case 'bonus': return Gift;
      case 'referral': return Heart;
      case 'signup': return User;
      case 'redemption': return Gift;
      default: return CreditCard;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1E2A78] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <CustomerOnboarding
        restaurant={restaurant!}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  if (!customer || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">Unable to load your wallet</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[#1E2A78] text-white rounded-xl hover:bg-[#3B4B9A] transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const TierIcon = getTierIcon(customer.current_tier);
  const tierGradient = getTierColor(customer.current_tier);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">{restaurant.name}</h1>
              <p className="text-xs text-gray-500">Loyalty Program</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-4 top-16 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-full flex items-center justify-center text-white font-medium">
                    {customer.first_name[0]}{customer.last_name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.first_name} {customer.last_name}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-5 h-5" />
                <span>Profile Settings</span>
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}
      </header>

      {/* Main Content */}
      <main className="pb-20">
        {activeTab === 'home' && (
          <div className="p-4 space-y-6">
            {/* Points Card */}
            <div className={`bg-gradient-to-br ${tierGradient} rounded-2xl p-6 text-white relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TierIcon className="w-6 h-6" />
                    <span className="font-medium capitalize">{customer.current_tier} Member</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-sm">Total Visits</p>
                    <p className="text-xl font-bold">{customer.visit_count}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-white/80 text-sm mb-1">Available Points</p>
                  <p className="text-4xl font-bold">{customer.total_points.toLocaleString()}</p>
                </div>
                
                <div className="bg-white/20 rounded-xl p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Progress to Next Tier</span>
                    <span className="text-sm">{customer.tier_progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all duration-300"
                      style={{ width: `${customer.tier_progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lifetime Points</p>
                    <p className="text-lg font-bold text-gray-900">{customer.lifetime_points.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-lg font-bold text-gray-900">${customer.total_spent.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Available Rewards Preview */}
            {rewards.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Available Rewards</h3>
                    <button
                      onClick={() => setActiveTab('rewards')}
                      className="text-[#1E2A78] text-sm font-medium"
                    >
                      View All
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {rewards.slice(0, 3).map((reward) => (
                    <div key={reward.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{reward.name}</h4>
                        <p className="text-xs text-gray-600">{reward.points_required} points</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedReward(reward);
                          setShowRedemptionModal(true);
                        }}
                        disabled={customer.total_points < reward.points_required}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          customer.total_points >= reward.points_required
                            ? 'bg-[#1E2A78] text-white hover:bg-[#3B4B9A]'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Redeem
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {transactions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                    <button
                      onClick={() => setActiveTab('history')}
                      className="text-[#1E2A78] text-sm font-medium"
                    >
                      View All
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {transactions.slice(0, 3).map((transaction) => {
                    const Icon = getTransactionIcon(transaction.type);
                    return (
                      <div key={transaction.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.description || transaction.type}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                        </div>
                        <span className={`text-sm font-medium ${
                          transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Available Rewards</h2>
              <div className="text-sm text-gray-600">
                {customer.total_points.toLocaleString()} points available
              </div>
            </div>

            {rewards.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rewards Available</h3>
                <p className="text-gray-600">
                  Keep earning points to unlock amazing rewards!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rewards.map((reward) => (
                  <div key={reward.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{reward.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#1E2A78]">
                              {reward.points_required} points
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                              {reward.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setSelectedReward(reward);
                          setShowRedemptionModal(true);
                        }}
                        disabled={customer.total_points < reward.points_required}
                        className={`w-full py-3 rounded-lg font-medium transition-colors ${
                          customer.total_points >= reward.points_required
                            ? 'bg-[#1E2A78] text-white hover:bg-[#3B4B9A]'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {customer.total_points >= reward.points_required ? 'Redeem Reward' : 'Not Enough Points'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>

            {transactions.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
                <p className="text-gray-600">
                  Your transaction history will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => {
                  const Icon = getTransactionIcon(transaction.type);
                  return (
                    <div key={transaction.id} className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {transaction.description || transaction.type}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                          {transaction.amount_spent && (
                            <p className="text-sm text-gray-500">Amount: ${transaction.amount_spent}</p>
                          )}
                        </div>
                        <span className={`text-lg font-bold ${
                          transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="p-4 space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Profile</h2>

            {/* Profile Info */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Personal Information</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {customer.first_name[0]}{customer.last_name[0]}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {customer.first_name} {customer.last_name}
                    </h4>
                    <p className="text-gray-600">{customer.email}</p>
                    {customer.phone && (
                      <p className="text-gray-600">{customer.phone}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-medium text-gray-900">{formatDate(customer.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Tier</p>
                    <div className="flex items-center gap-1">
                      <TierIcon className="w-4 h-4 text-gray-600" />
                      <p className="font-medium text-gray-900 capitalize">{customer.current_tier}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Account</h3>
              </div>
              <div className="p-4 space-y-3">
                <button className="w-full flex items-center justify-between p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    <span>Account Settings</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-between p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'home'
                ? 'text-[#1E2A78] bg-blue-50'
                : 'text-gray-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'rewards'
                ? 'text-[#1E2A78] bg-blue-50'
                : 'text-gray-600'
            }`}
          >
            <Gift className="w-5 h-5" />
            <span className="text-xs font-medium">Rewards</span>
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'text-[#1E2A78] bg-blue-50'
                : 'text-gray-600'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs font-medium">History</span>
          </button>
          
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
              activeTab === 'profile'
                ? 'text-[#1E2A78] bg-blue-50'
                : 'text-gray-600'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </nav>

      {/* Redemption Modal */}
      {showRedemptionModal && selectedReward && (
        <CustomerRedemptionModal
          reward={selectedReward}
          customer={customer}
          restaurant={restaurant}
          onConfirm={() => handleRedemption(selectedReward)}
          onClose={() => {
            setShowRedemptionModal(false);
            setSelectedReward(null);
          }}
        />
      )}
    </div>
  );
};

export default CustomerWallet;