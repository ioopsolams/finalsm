import { supabase } from '../lib/supabase';

export interface LoyaltyROIMetrics {
  // Primary KPI
  roi: number;
  roiStatus: 'high-performing' | 'profitable' | 'losing-money';
  roiSummaryText: string;
  
  // Financial Metrics
  grossRevenue: number;
  rewardCost: number;
  netRevenue: number;
  cogs: number;
  netProfit: number;
  totalRewardLiability: number;
  
  // Behavioral KPIs
  repeatPurchaseRate: number;
  averageOrderValue: number;
  loyaltyAOV: number;
  purchaseFrequency: number;
  customerLifetimeValue: number;
  
  // Additional metrics
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  activeCustomers: number;
  loyaltyCustomers: number;
}

export interface RevenueBreakdown {
  month: string;
  grossRevenue: number;
  rewardCost: number;
  netRevenue: number;
  netProfit: number;
}

export interface CustomerBehaviorMetrics {
  newCustomers: number;
  returningCustomers: number;
  loyaltyParticipation: number;
  averagePointsEarned: number;
  averagePointsRedeemed: number;
}

export class LoyaltyAnalyticsService {
  static async getLoyaltyROIMetrics(
    restaurantId: string, 
    dateRange: { start: Date; end: Date }
  ): Promise<LoyaltyROIMetrics> {
    try {
      if (!restaurantId) {
        return this.getEmptyMetrics();
      }

      // Get restaurant settings for point value calculation
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('settings')
        .eq('id', restaurantId)
        .single();

      const pointsPerDollar = restaurant?.settings?.points_per_dollar || 1;
      const pointValueAED = 1 / pointsPerDollar; // Each point is worth this much in AED

      // Get all customers and their transaction data
      const { data: customers } = await supabase
        .from('customers')
        .select(`
          id,
          total_points,
          lifetime_points,
          total_spent,
          visit_count,
          created_at
        `)
        .eq('restaurant_id', restaurantId)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      // Get all transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      // Get all reward redemptions
      const { data: redemptions } = await supabase
        .from('reward_redemptions')
        .select('points_used')
        .eq('restaurant_id', restaurantId)
        .gte('redeemed_at', dateRange.start.toISOString())
        .lte('redeemed_at', dateRange.end.toISOString());

      // Calculate metrics
      const totalPointsIssued = transactions
        ?.filter(t => t.points > 0)
        .reduce((sum, t) => sum + t.points, 0) || 0;

      const totalPointsRedeemed = transactions
        ?.filter(t => t.points < 0)
        .reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;

      const grossRevenue = customers?.reduce((sum, c) => sum + c.total_spent, 0) || 0;
      
      const rewardCost = totalPointsRedeemed * pointValueAED;
      
      const netRevenue = grossRevenue - rewardCost;
      
      // Estimate COGS as 30% of gross revenue (configurable)
      const cogsPercentage = restaurant?.settings?.cogs_percentage || 0.3;
      const cogs = grossRevenue * cogsPercentage;
      
      const netProfit = netRevenue - cogs;
      
      // Calculate ROI
      const roi = rewardCost > 0 ? (netProfit / rewardCost) * 100 : 0;
      
      // Determine ROI status
      let roiStatus: 'high-performing' | 'profitable' | 'losing-money';
      if (roi > 100) roiStatus = 'high-performing';
      else if (roi >= 0) roiStatus = 'profitable';
      else roiStatus = 'losing-money';
      
      // Generate ROI summary text
      const roiMultiplier = rewardCost > 0 ? (netProfit / rewardCost) : 0;
      const roiSummaryText = rewardCost > 0 
        ? `For every 1 AED you give in loyalty points, you earn ${roiMultiplier.toFixed(2)} AED in return.`
        : 'No loyalty rewards have been redeemed yet.';

      // Calculate total reward liability (unused points)
      const totalRewardLiability = customers?.reduce((sum, c) => sum + c.total_points, 0) * pointValueAED || 0;

      // Calculate behavioral metrics
      const activeCustomers = customers?.length || 0;
      const loyaltyCustomers = customers?.filter(c => c.visit_count > 1).length || 0;
      const repeatPurchaseRate = activeCustomers > 0 ? (loyaltyCustomers / activeCustomers) * 100 : 0;
      
      const totalOrders = customers?.reduce((sum, c) => sum + c.visit_count, 0) || 0;
      const averageOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;
      
      const loyaltyOrderValue = loyaltyCustomers > 0 
        ? customers?.filter(c => c.visit_count > 1).reduce((sum, c) => sum + c.total_spent, 0) / loyaltyCustomers 
        : 0;
      
      const monthsInRange = Math.max(1, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      const purchaseFrequency = activeCustomers > 0 ? totalOrders / activeCustomers / monthsInRange : 0;
      
      // Estimate customer lifetime as 12 months (configurable)
      const customerLifetimeMonths = restaurant?.settings?.customer_lifetime_months || 12;
      const customerLifetimeValue = averageOrderValue * purchaseFrequency * customerLifetimeMonths;

      return {
        roi,
        roiStatus,
        roiSummaryText,
        grossRevenue,
        rewardCost,
        netRevenue,
        cogs,
        netProfit,
        totalRewardLiability,
        repeatPurchaseRate,
        averageOrderValue,
        loyaltyAOV: loyaltyOrderValue,
        purchaseFrequency,
        customerLifetimeValue,
        totalPointsIssued,
        totalPointsRedeemed,
        activeCustomers,
        loyaltyCustomers
      };

    } catch (error) {
      console.error('Error calculating loyalty ROI metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  static async getRevenueBreakdown(
    restaurantId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<RevenueBreakdown[]> {
    try {
      if (!restaurantId) return [];

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('settings')
        .eq('id', restaurantId)
        .single();

      const pointsPerDollar = restaurant?.settings?.points_per_dollar || 1;
      const pointValueAED = 1 / pointsPerDollar;
      const cogsPercentage = restaurant?.settings?.cogs_percentage || 0.3;

      // Generate monthly breakdown
      const months = [];
      const current = new Date(dateRange.start);
      while (current <= dateRange.end) {
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        
        months.push({
          start: monthStart,
          end: monthEnd,
          name: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        });
        
        current.setMonth(current.getMonth() + 1);
      }

      const breakdown: RevenueBreakdown[] = [];

      for (const month of months) {
        const { data: customers } = await supabase
          .from('customers')
          .select('total_spent')
          .eq('restaurant_id', restaurantId)
          .gte('created_at', month.start.toISOString())
          .lte('created_at', month.end.toISOString());

        const { data: transactions } = await supabase
          .from('transactions')
          .select('points')
          .eq('restaurant_id', restaurantId)
          .eq('type', 'redemption')
          .gte('created_at', month.start.toISOString())
          .lte('created_at', month.end.toISOString());

        const grossRevenue = customers?.reduce((sum, c) => sum + c.total_spent, 0) || 0;
        const rewardCost = transactions?.reduce((sum, t) => sum + Math.abs(t.points), 0) * pointValueAED || 0;
        const netRevenue = grossRevenue - rewardCost;
        const cogs = grossRevenue * cogsPercentage;
        const netProfit = netRevenue - cogs;

        breakdown.push({
          month: month.name,
          grossRevenue,
          rewardCost,
          netRevenue,
          netProfit
        });
      }

      return breakdown;

    } catch (error) {
      console.error('Error getting revenue breakdown:', error);
      return [];
    }
  }

  static async getCustomerBehaviorMetrics(
    restaurantId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<CustomerBehaviorMetrics> {
    try {
      if (!restaurantId) {
        return {
          newCustomers: 0,
          returningCustomers: 0,
          loyaltyParticipation: 0,
          averagePointsEarned: 0,
          averagePointsRedeemed: 0
        };
      }

      const { data: customers } = await supabase
        .from('customers')
        .select('visit_count, lifetime_points, total_points')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString());

      const newCustomers = customers?.filter(c => c.visit_count === 1).length || 0;
      const returningCustomers = customers?.filter(c => c.visit_count > 1).length || 0;
      const totalCustomers = customers?.length || 0;
      
      const loyaltyParticipation = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
      
      const averagePointsEarned = totalCustomers > 0 
        ? customers?.reduce((sum, c) => sum + c.lifetime_points, 0) / totalCustomers 
        : 0;
      
      const averagePointsRedeemed = totalCustomers > 0 
        ? customers?.reduce((sum, c) => sum + (c.lifetime_points - c.total_points), 0) / totalCustomers 
        : 0;

      return {
        newCustomers,
        returningCustomers,
        loyaltyParticipation,
        averagePointsEarned,
        averagePointsRedeemed
      };

    } catch (error) {
      console.error('Error getting customer behavior metrics:', error);
      return {
        newCustomers: 0,
        returningCustomers: 0,
        loyaltyParticipation: 0,
        averagePointsEarned: 0,
        averagePointsRedeemed: 0
      };
    }
  }

  private static getEmptyMetrics(): LoyaltyROIMetrics {
    return {
      roi: 0,
      roiStatus: 'profitable',
      roiSummaryText: 'No data available yet.',
      grossRevenue: 0,
      rewardCost: 0,
      netRevenue: 0,
      cogs: 0,
      netProfit: 0,
      totalRewardLiability: 0,
      repeatPurchaseRate: 0,
      averageOrderValue: 0,
      loyaltyAOV: 0,
      purchaseFrequency: 0,
      customerLifetimeValue: 0,
      totalPointsIssued: 0,
      totalPointsRedeemed: 0,
      activeCustomers: 0,
      loyaltyCustomers: 0
    };
  }
}