import React, { useState, useEffect } from 'react';
import { 
  Building, Lock, Eye, EyeOff, ArrowRight, ChefHat,
  Users, TrendingUp, Gift, DollarSign, QrCode, Calculator,
  Utensils, Search, User, CheckCircle, AlertCircle, X,
  Loader2, Sparkles, Crown, Award, Plus, Minus, Zap
} from 'lucide-react';
import { BranchService, Branch, BranchStats } from '../services/branchService';
import { CustomerService } from '../services/customerService';
import { MenuItemService, MenuItem } from '../services/menuItemService';
import { LoyaltyConfigService } from '../services/loyaltyConfigService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase'; 


interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_points: number;
  current_tier: 'bronze' | 'silver' | 'gold';
}

const StaffUI: React.FC = () => {
  const [step, setStep] = useState<'branch-select' | 'password' | 'dashboard'>('branch-select');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchStats, setBranchStats] = useState<BranchStats | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Point assignment states
  const [assignmentMode, setAssignmentMode] = useState<'qr' | 'menu'>('qr');
  const [customerEmail, setCustomerEmail] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [orderAmount, setOrderAmount] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuItems, setSelectedMenuItems] = useState<{[key: string]: number}>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [loyaltyConfig, setLoyaltyConfig] = useState<any>(null);

  const { restaurant } = useAuth();

  useEffect(() => {
    if (restaurant) {
      fetchBranches();
      fetchMenuItems();
      fetchLoyaltyConfig();
    }
  }, [restaurant]);

  const fetchBranches = async () => {
    if (!restaurant) return;
    
    try {
      const branchesData = await BranchService.getBranches(restaurant.id);
      setBranches(branchesData.filter(b => b.is_active));
    } catch (err: any) {
      console.error('Error fetching branches:', err);
      setError('Failed to load branches');
    }
  };

  const fetchMenuItems = async () => {
    if (!restaurant) return;
    
    try {
      const items = await MenuItemService.getMenuItems(restaurant.id);
      setMenuItems(items.filter(item => item.is_active));
    } catch (err: any) {
      console.error('Error fetching menu items:', err);
    }
  };

  const fetchLoyaltyConfig = async () => {
    if (!restaurant) return;
    
    try {
      const config = await LoyaltyConfigService.getLoyaltyConfig(restaurant.id);
      setLoyaltyConfig(config);
    } catch (err: any) {
      console.error('Error fetching loyalty config:', err);
    }
  };

  const handleBranchSelect = async (branch: Branch) => {
    setSelectedBranch(branch);
    setStep('password');
    setError('');
    
    // Fetch branch stats
    if (restaurant) {
      try {
        const stats = await BranchService.getBranchStats(restaurant.id, branch.id);
        setBranchStats(stats);
      } catch (err) {
        console.error('Error fetching branch stats:', err);
      }
    }
  };

  const handlePasswordSubmit = async () => {
    if (!selectedBranch || !restaurant) return;

    try {
      setLoading(true);
      setError('');

      const isValid = await BranchService.verifyBranchPassword(
        restaurant.id, 
        selectedBranch.id, 
        password
      );

      if (isValid) {
        setStep('dashboard');
      } else {
        setError('Invalid password. Please try again.');
      }
    } catch (err: any) {
      setError('Failed to verify password');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSearch = async (email: string) => {
    if (!email || !restaurant) {
      setFoundCustomer(null);
      return;
    }

    try {
      const customer = await CustomerService.getCustomerByEmail(restaurant.id, email);
      setFoundCustomer(customer);
    } catch (err) {
      setFoundCustomer(null);
    }
  };

  const calculatePointsForOrder = () => {
    if (!loyaltyConfig || !foundCustomer) return 0;

    if (assignmentMode === 'qr') {
      const amount = parseFloat(orderAmount) || 0;
      if (amount <= 0) return 0;

      const result = LoyaltyConfigService.calculatePointsPreview(
        loyaltyConfig,
        undefined,
        amount,
        foundCustomer.current_tier,
        1
      );
      return result.points;
    } else {
      let totalPoints = 0;
      Object.entries(selectedMenuItems).forEach(([itemId, quantity]) => {
        if (quantity > 0) {
          const menuItem = menuItems.find(item => item.id === itemId);
          if (menuItem) {
            const result = LoyaltyConfigService.calculatePointsPreview(
              loyaltyConfig,
              menuItem,
              menuItem.selling_price,
              foundCustomer.current_tier,
              quantity
            );
            totalPoints += result.points;
          }
        }
      });
      return totalPoints;
    }
  };

  const handleAssignPoints = async () => {
    if (!foundCustomer || !restaurant || !selectedBranch) return;

    try {
      setAssignmentLoading(true);
      
      const pointsToAssign = calculatePointsForOrder();
      if (pointsToAssign <= 0) {
        setError('No points to assign');
        return;
      }

      let description = '';
      let amountSpent = 0;

      if (assignmentMode === 'qr') {
        amountSpent = parseFloat(orderAmount) || 0;
        description = `Order amount: ${amountSpent} AED`;
      } else {
        const itemDescriptions: string[] = [];
        Object.entries(selectedMenuItems).forEach(([itemId, quantity]) => {
          if (quantity > 0) {
            const menuItem = menuItems.find(item => item.id === itemId);
            if (menuItem) {
              itemDescriptions.push(`${menuItem.name} x${quantity}`);
              amountSpent += menuItem.selling_price * quantity;
            }
          }
        });
        description = `Items: ${itemDescriptions.join(', ')}`;
      }

      // Use the process_point_transaction function directly
      const { error } = await supabase.rpc('process_point_transaction', {
        p_restaurant_id: restaurant.id,
        p_customer_id: foundCustomer.id,
        p_type: 'purchase',
        p_points: pointsToAssign,
        p_description: `${description} (${selectedBranch.name})`,
        p_amount_spent: amountSpent,
        p_reward_id: null
      });

      if (error) {
        throw new Error(error.message);
      }

      // Refresh customer data to get updated points
      const updatedCustomer = await CustomerService.getCustomer(
        restaurant.id,
        foundCustomer.id
      );
      
      if (updatedCustomer) {
        setFoundCustomer(updatedCustomer);
      }

      // Reset form
      setCustomerEmail('');
      setOrderAmount('');
      setSelectedMenuItems({});
      setShowConfirmModal(false);
      setError('');
      
      // Show success message
      alert(`Successfully assigned ${pointsToAssign} points to ${foundCustomer.first_name} ${foundCustomer.last_name}!`);

      // Clear customer after success message
      setTimeout(() => {
        setFoundCustomer(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error assigning points:', err);
      setError(err.message || 'Failed to assign points');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'gold': return { name: 'Gold', icon: Crown, color: 'text-yellow-600' };
      case 'silver': return { name: 'Silver', icon: Award, color: 'text-gray-600' };
      default: return { name: 'Bronze', icon: ChefHat, color: 'text-orange-600' };
    }
  };

  // Branch Selection Screen
  if (step === 'branch-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">{restaurant?.name}</h1>
                <p className="text-xs text-gray-500">Staff Portal</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Building className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Branch</h2>
              <p className="text-gray-600">Choose the branch you're working at today</p>
            </div>

            {branches.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
                <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Branches</h3>
                <p className="text-gray-600">Contact your manager to set up branches</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    onClick={() => handleBranchSelect(branch)}
                    className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#1E2A78] hover:shadow-lg transition-all duration-200 text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Building className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-[#1E2A78] transition-colors">
                          {branch.name}
                        </h3>
                        <p className="text-sm text-gray-600">{branch.location}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[#1E2A78] transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Password Screen
  if (step === 'password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">{selectedBranch?.name}</h1>
                <p className="text-xs text-gray-500">{selectedBranch?.location}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setStep('branch-select');
                setPassword('');
                setError('');
              }}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Change Branch
            </button>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Enter Staff Password</h2>
                <p className="text-gray-600">Access the staff portal for {selectedBranch?.name}</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent pr-10"
                      placeholder="Enter staff password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handlePasswordSubmit}
                  disabled={loading || !password.trim()}
                  className="w-full bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Access Portal
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Staff Dashboard
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
              <h1 className="font-bold text-gray-900">{selectedBranch?.name}</h1>
              <p className="text-xs text-gray-500">Staff Portal • {selectedBranch?.location}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setStep('branch-select');
              setPassword('');
              setError('');
            }}
            className="text-gray-600 hover:text-gray-800 transition-colors text-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Branch Stats */}
        {branchStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customers</p>
                  <p className="text-xl font-bold text-gray-900">{branchStats.totalCustomers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Gift className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Redemptions</p>
                  <p className="text-xl font-bold text-gray-900">{branchStats.totalRedemptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Points Issued</p>
                  <p className="text-xl font-bold text-gray-900">{branchStats.totalPointsIssued.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-xl font-bold text-gray-900">{branchStats.totalRevenue.toFixed(0)} AED</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Point Assignment Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Points to Customer</h2>

          {/* Assignment Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAssignmentMode('qr')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                assignmentMode === 'qr'
                  ? 'bg-[#1E2A78] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <QrCode className="h-4 w-4" />
              Order Amount
            </button>
            <button
              onClick={() => setAssignmentMode('menu')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
                assignmentMode === 'menu'
                  ? 'bg-[#1E2A78] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Utensils className="h-4 w-4" />
              Menu Items
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          {/* Customer Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value);
                  handleCustomerSearch(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent"
                placeholder="Enter customer email"
              />
            </div>

            {foundCustomer && (
              <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-full flex items-center justify-center text-white font-medium">
                    {foundCustomer.first_name[0]}{foundCustomer.last_name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-green-900">
                      {foundCustomer.first_name} {foundCustomer.last_name}
                    </p>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const tierInfo = getTierInfo(foundCustomer.current_tier);
                        const TierIcon = tierInfo.icon;
                        return (
                          <>
                            <TierIcon className={`h-4 w-4 ${tierInfo.color}`} />
                            <span className="text-sm text-green-700">
                              {tierInfo.name} • {foundCustomer.total_points} points
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Amount Mode */}
          {assignmentMode === 'qr' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Amount (AED)
                </label>
                <input
                  type="number"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent"
                  placeholder="Enter total order amount"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {/* Menu Items Mode */}
          {assignmentMode === 'menu' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Select Menu Items</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {menuItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.selling_price} AED</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedMenuItems(prev => ({
                          ...prev,
                          [item.id]: Math.max(0, (prev[item.id] || 0) - 1)
                        }))}
                        className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {selectedMenuItems[item.id] || 0}
                      </span>
                      <button
                        onClick={() => setSelectedMenuItems(prev => ({
                          ...prev,
                          [item.id]: (prev[item.id] || 0) + 1
                        }))}
                        className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Points Preview */}
          {foundCustomer && (
            <div className="mt-6 p-4 bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] rounded-xl text-white">
              <div className="text-center">
                <p className="text-3xl font-bold">{calculatePointsForOrder()}</p>
                <p className="text-sm opacity-90">points will be assigned</p>
              </div>
            </div>
          )}

          {/* Assign Button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!foundCustomer || calculatePointsForOrder() <= 0}
            className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Assign Points
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && foundCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Confirm Point Assignment</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-full flex items-center justify-center text-white font-medium">
                    {foundCustomer.first_name[0]}{foundCustomer.last_name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {foundCustomer.first_name} {foundCustomer.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{foundCustomer.email}</p>
                  </div>
                </div>
              </div>

              {/* Points to Assign */}
              <div className="bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] rounded-xl p-4 text-white text-center">
                <p className="text-3xl font-bold">{calculatePointsForOrder()}</p>
                <p className="text-sm opacity-90">points will be assigned</p>
              </div>

              {/* Order Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                {assignmentMode === 'qr' ? (
                  <p className="text-sm text-gray-600">Order Amount: {orderAmount} AED</p>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(selectedMenuItems).map(([itemId, quantity]) => {
                      if (quantity > 0) {
                        const item = menuItems.find(i => i.id === itemId);
                        return item ? (
                          <p key={itemId} className="text-sm text-gray-600">
                            {item.name} x{quantity} = {(item.selling_price * quantity).toFixed(2)} AED
                          </p>
                        ) : null;
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPoints}
                disabled={assignmentLoading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {assignmentLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Confirm Assignment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffUI;