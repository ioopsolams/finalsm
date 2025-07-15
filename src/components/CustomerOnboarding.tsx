import React, { useState } from 'react';
import { 
  User, Mail, Phone, Calendar, ArrowRight, ArrowLeft, 
  CheckCircle, Search, UserPlus, Sparkles, Gift, Star,
  Trophy, Heart, Zap, ChefHat, Eye, EyeOff, Lock,
  Shield, MessageSquare, Loader2
} from 'lucide-react';
import { CustomerService } from '../services/customerService';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  settings: any;
}

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

interface CustomerOnboardingProps {
  restaurant: Restaurant;
  onComplete: (customer: Customer) => void;
}

const CustomerOnboarding: React.FC<CustomerOnboardingProps> = ({ restaurant, onComplete }) => {
  const [step, setStep] = useState(0); // 0: welcome, 1: auth choice, 2: login, 3: signup, 4: sms verification
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    smsCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);
  const [smsCodeSent, setSmsCodeSent] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleEmailCheck = async (email: string) => {
    if (!email || email.length < 3) return;

    try {
      const customer = await CustomerService.getCustomerByEmail(restaurant.id, email);
      if (customer) {
        setExistingCustomer(customer);
        setAuthMode('login');
      } else {
        setExistingCustomer(null);
        setAuthMode('signup');
      }
    } catch (err) {
      setExistingCustomer(null);
    }
  };

  const handleLogin = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      // Simulate password verification (in real app, this would be handled by auth service)
      const customer = await CustomerService.getCustomerByEmail(restaurant.id, formData.email);
      if (customer) {
        onComplete(customer);
      } else {
        setError('Invalid email or password');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Send SMS code (simulate)
      if (formData.phone && !smsCodeSent) {
        setSmsCodeSent(true);
        setStep(4); // Go to SMS verification
        setLoading(false);
        return;
      }

      // Create customer
      const newCustomer = await CustomerService.createCustomer(restaurant.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        date_of_birth: formData.birthDate || undefined
      });

      onComplete(newCustomer);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSmsVerification = async () => {
    if (!formData.smsCode.trim() || formData.smsCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      // Simulate SMS verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create customer after SMS verification
      const newCustomer = await CustomerService.createCustomer(restaurant.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.birthDate || undefined
      });

      onComplete(newCustomer);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendSmsCode = async () => {
    setLoading(true);
    try {
      // Simulate resending SMS
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSmsCodeSent(true);
      setError('');
    } catch (err) {
      setError('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">{restaurant.name}</h1>
              <p className="text-xs text-gray-500">Loyalty Program</p>
            </div>
          </div>
          
          {step > 0 && (
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="w-full max-w-md">
          {/* Progress indicator */}
          {step > 0 && step < 4 && (
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3].map((stepNumber) => (
                <React.Fragment key={stepNumber}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    step >= stepNumber 
                      ? 'bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] text-white' 
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  }`}>
                    {step > stepNumber ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      stepNumber
                    )}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`w-8 h-1 mx-2 rounded-full transition-all duration-300 ${
                      step > stepNumber ? 'bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A]' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Main card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {error && (
              <div className="bg-red-50 border-b border-red-200 text-red-700 px-6 py-4 text-sm">
                {error}
              </div>
            )}

            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-3xl flex items-center justify-center mx-auto">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome to {restaurant.name}!
                  </h1>
                  <p className="text-gray-600 leading-relaxed">
                    Join our loyalty program and start earning rewards with every visit
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Gift className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-green-900">Earn Points</p>
                      <p className="text-sm text-green-700">Get points with every purchase</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-blue-900">Exclusive Rewards</p>
                      <p className="text-sm text-blue-700">Redeem points for amazing rewards</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-purple-900">VIP Status</p>
                      <p className="text-sm text-purple-700">Unlock higher tiers for better perks</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 justify-center">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <p className="font-medium text-yellow-900">Get 100 bonus points for joining!</p>
                  </div>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="w-full bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] text-white font-medium py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 1: Auth Choice */}
            {step === 1 && (
              <div className="p-8 space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Join Our Loyalty Program</h2>
                  <p className="text-gray-600">Enter your email to get started</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        handleInputChange('email', e.target.value);
                        handleEmailCheck(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                {existingCustomer && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-full flex items-center justify-center text-white font-medium">
                        {existingCustomer.first_name[0]}{existingCustomer.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">Welcome back!</p>
                        <p className="text-sm text-blue-700">
                          {existingCustomer.first_name} {existingCustomer.last_name}
                        </p>
                        <p className="text-sm text-blue-600">
                          {existingCustomer.total_points} points • {existingCustomer.current_tier} tier
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setStep(existingCustomer ? 2 : 3)}
                  disabled={!formData.email.trim()}
                  className="w-full bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {existingCustomer ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Login */}
            {step === 2 && (
              <div className="p-8 space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
                  <p className="text-gray-600">Sign in to access your loyalty account</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent transition-all duration-200"
                        placeholder="Enter your email"
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent transition-all duration-200"
                        placeholder="Enter your password"
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
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading || !formData.email.trim() || !formData.password.trim()}
                  className="w-full bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 w-4" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setStep(3);
                    }}
                    className="text-[#1E2A78] hover:text-[#3B4B9A] font-medium transition-colors"
                  >
                    Don't have an account? Sign up
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Signup */}
            {step === 3 && (
              <div className="p-8 space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Create Your Account</h2>
                  <p className="text-gray-600">Join our loyalty program and start earning rewards</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent transition-all duration-200"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent transition-all duration-200"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent transition-all duration-200"
                        placeholder="john@example.com"
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent transition-all duration-200"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      We'll send you exclusive offers and updates
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth (Optional)
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => handleInputChange('birthDate', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      We'll send you special birthday rewards!
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSignup}
                  disabled={loading || !formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()}
                  className="w-full bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {formData.phone ? 'Send Verification Code' : 'Create Account'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setStep(2);
                    }}
                    className="text-[#1E2A78] hover:text-[#3B4B9A] font-medium transition-colors"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: SMS Verification */}
            {step === 4 && (
              <div className="p-8 space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Verify Your Phone</h2>
                  <p className="text-gray-600">
                    We sent a 6-digit code to {formData.phone}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={formData.smsCode}
                    onChange={(e) => handleInputChange('smsCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1E2A78] focus:border-transparent transition-all duration-200 text-center text-2xl font-mono tracking-widest"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={handleSmsVerification}
                  disabled={loading || formData.smsCode.length !== 6}
                  className="w-full bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Verify & Create Account
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                  <button
                    onClick={resendSmsCode}
                    disabled={loading}
                    className="text-[#1E2A78] hover:text-[#3B4B9A] font-medium transition-colors"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOnboarding;