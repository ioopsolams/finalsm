import React, { useState } from 'react';
import { 
  X, Gift, Sparkles, CheckCircle, QrCode, Clock, 
  User, Crown, Award, ChefHat, Copy, Check, Share2,
  AlertTriangle, Loader2
} from 'lucide-react';

interface Reward {
  id: string;
  name: string;
  description?: string;
  points_required: number;
  category: string;
  min_tier: 'bronze' | 'silver' | 'gold';
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  current_tier: 'bronze' | 'silver' | 'gold';
  total_points: number;
}

interface RedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward | null;
  customer: Customer | null;
  onConfirmRedemption: () => Promise<void>;
  restaurantName: string;
}

const RedemptionModal: React.FC<RedemptionModalProps> = ({
  isOpen,
  onClose,
  reward,
  customer,
  onConfirmRedemption,
  restaurantName
}) => {
  const [step, setStep] = useState<'confirm' | 'processing' | 'qr' | 'complete'>('confirm');
  const [redemptionCode, setRedemptionCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !reward || !customer) return null;

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'gold':
        return { name: 'Gold', icon: Crown, color: 'text-yellow-600' };
      case 'silver':
        return { name: 'Silver', icon: Award, color: 'text-gray-600' };
      default:
        return { name: 'Bronze', icon: ChefHat, color: 'text-orange-600' };
    }
  };

  const tierInfo = getTierInfo(customer.current_tier);
  const TierIcon = tierInfo.icon;

  const handleConfirmRedemption = async () => {
    try {
      setLoading(true);
      setStep('processing');
      
      await onConfirmRedemption();
      
      // Generate redemption code
      const code = `${restaurantName.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      setRedemptionCode(code);
      
      setStep('qr');
    } catch (error) {
      console.error('Redemption failed:', error);
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleStaffConfirmation = () => {
    setStep('complete');
    setTimeout(() => {
      onClose();
      // Reset state for next use
      setStep('confirm');
      setRedemptionCode('');
      setCopied(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            {step === 'confirm' ? 'Confirm Redemption' :
             step === 'processing' ? 'Processing...' :
             step === 'qr' ? 'Redemption QR Code' :
             'Redemption Complete!'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Confirmation Step */}
        {step === 'confirm' && (
          <div className="space-y-6">
            {/* Reward Details */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-xl flex items-center justify-center">
                  <Gift className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{reward.name}</h4>
                  {reward.description && (
                    <p className="text-gray-600 text-sm mb-2">{reward.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1E2A78]">
                      {reward.points_required} points
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {reward.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-full flex items-center justify-center text-white font-medium">
                  {customer.first_name[0]}{customer.last_name[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {customer.first_name} {customer.last_name}
                  </p>
                  <div className="flex items-center gap-2">
                    <TierIcon className={`h-4 w-4 ${tierInfo.color}`} />
                    <span className="text-sm text-gray-600">{tierInfo.name} Member</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Current Points</p>
                  <p className="font-semibold text-gray-900">{customer.total_points}</p>
                </div>
                <div>
                  <p className="text-gray-500">After Redemption</p>
                  <p className="font-semibold text-gray-900">
                    {customer.total_points - reward.points_required}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 mb-1">Important</p>
                  <p className="text-yellow-800 text-sm">
                    Once confirmed, {reward.points_required} points will be deducted from your account. 
                    Show the QR code to staff to complete your redemption.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRedemption}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-[#1E2A78] to-[#3B4B9A] text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Confirm Redemption
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1E2A78] to-[#3B4B9A] rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Processing Redemption</h4>
            <p className="text-gray-600">Please wait while we process your reward redemption...</p>
          </div>
        )}

        {/* QR Code Step */}
        {step === 'qr' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Redemption Confirmed!</h4>
              <p className="text-gray-600">Show this QR code to staff to claim your reward</p>
            </div>

            {/* QR Code Display */}
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="w-48 h-48 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center border-2 border-gray-200">
                <QrCode className="h-24 w-24 text-gray-400" />
              </div>
              
              <div className="space-y-2">
                <p className="font-medium text-gray-900">Redemption Code</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-white px-3 py-2 rounded-lg border text-lg font-mono">
                    {redemptionCode}
                  </code>
                  <button
                    onClick={() => copyToClipboard(redemptionCode)}
                    className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Reward Details */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">Your Reward</h5>
              <p className="text-blue-800 font-semibold">{reward.name}</p>
              {reward.description && (
                <p className="text-blue-700 text-sm mt-1">{reward.description}</p>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 mb-1">Next Steps</p>
                  <ol className="text-yellow-800 text-sm space-y-1 list-decimal list-inside">
                    <li>Show this QR code to restaurant staff</li>
                    <li>Staff will scan or enter the redemption code</li>
                    <li>Enjoy your reward!</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Demo Staff Confirmation Button */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500 text-center mb-3">
                Demo: Staff would scan this QR code
              </p>
              <button
                onClick={handleStaffConfirmation}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Staff: Confirm Redemption
              </button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Reward Claimed!</h4>
            <p className="text-gray-600 mb-4">
              Your {reward.name} has been successfully redeemed. Enjoy!
            </p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 text-sm">
                Thank you for being a loyal customer at {restaurantName}!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedemptionModal;