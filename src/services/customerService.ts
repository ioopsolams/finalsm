import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export class CustomerService {
  static async getCustomers(restaurantId: string): Promise<Customer[]> {
    try {
      if (!restaurantId) return [];

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getCustomers:', error);
      return [];
    }
  }

  static async getCustomer(restaurantId: string, customerId: string): Promise<Customer | null> {
    try {
      if (!restaurantId) return null;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('restaurant_id', restaurantId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      console.error('Error in getCustomer:', error);
      return null;
    }
  }

  static async getCustomerByEmail(restaurantId: string, email: string): Promise<Customer | null> {
    try {
      if (!restaurantId) return null;
      
      console.log('🔍 DEBUG: Looking for customer by email:', email, 'in restaurant:', restaurantId);

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ DEBUG: Error finding customer by email:', error);
        throw new Error(error.message);
      }

      console.log('📋 DEBUG: Customer found by email:', data ? `${data.first_name} ${data.last_name}` : 'None');
      return data || null;
    } catch (error: any) {
      console.error('💥 DEBUG: Error in getCustomerByEmail:', error);
      return null;
    }
  }

  static async createCustomer(restaurantId: string, customerData: Omit<CustomerInsert, 'restaurant_id'>): Promise<Customer> {
    if (!restaurantId) {
      throw new Error('Restaurant not found. Please create a restaurant first.');
    }

    // Check if customer already exists
    const existingCustomer = await this.getCustomerByEmail(restaurantId, customerData.email);
    if (existingCustomer) {
      throw new Error('Customer with this email already exists');
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        ...customerData,
        restaurant_id: restaurantId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Give signup bonus
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('settings')
      .eq('id', restaurantId)
      .single();

    const signupBonus = restaurant?.settings?.signup_bonus || 100;

    await supabase.rpc('process_point_transaction', {
      p_restaurant_id: restaurantId,
      p_customer_id: data.id,
      p_type: 'signup',
      p_points: signupBonus,
      p_description: 'Welcome bonus for joining our loyalty program'
    });

    // Fetch updated customer data
    return this.getCustomer(restaurantId, data.id) || data;
  }

  static async updateCustomer(restaurantId: string, customerId: string, updates: CustomerUpdate): Promise<Customer | null> {
    try {
      if (!restaurantId) return null;

      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', customerId)
        .eq('restaurant_id', restaurantId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error: any) {
      console.error('Error in updateCustomer:', error);
      return null;
    }
  }

  static async deleteCustomer(restaurantId: string, customerId: string): Promise<void> {
    if (!restaurantId) {
      throw new Error('Restaurant not found');
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('restaurant_id', restaurantId);

    if (error) {
      throw new Error(error.message);
    }
  }

  static async getCustomerTransactions(restaurantId: string, customerId: string): Promise<Transaction[]> {
    try {
      if (!restaurantId) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getCustomerTransactions:', error);
      return [];
    }
  }

  static async addPointsTransaction(
    restaurantId: string,
    customerId: string,
    amountSpent?: number,
    description?: string
  ): Promise<void> {
    if (!restaurantId) {
      throw new Error('Restaurant not found');
    }

    // Get customer tier for calculation
    const customer = await this.getCustomer(restaurantId, customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Calculate points using reward engine
    // Note: Points calculation now handled per menu item
    // This method is for legacy support only
    const points = Math.floor((amountSpent || 0) * 0.1); // Fallback: 10 AED = 1 point

    if (points <= 0) {
      return; // No points to award
    }

    const { error } = await supabase.rpc('process_point_transaction', {
      p_restaurant_id: restaurantId,
      p_customer_id: customerId,
      p_type: 'purchase',
      p_points: points,
      p_amount_spent: amountSpent,
      p_description: description || `Points earned from ${amountSpent} AED purchase`
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  static async searchCustomers(restaurantId: string, query: string): Promise<Customer[]> {
    try {
      if (!restaurantId) return [];

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in searchCustomers:', error);
      return [];
    }
  }

  static async getCustomerStats(restaurantId: string): Promise<{
    totalCustomers: number;
    newThisMonth: number;
    totalPoints: number;
    averageSpent: number;
  }> {
    try {
      if (!restaurantId) {
        return {
          totalCustomers: 0,
          newThisMonth: 0,
          totalPoints: 0,
          averageSpent: 0,
        };
      }

      const { data: customers, error } = await supabase
        .from('customers')
        .select('total_points, total_spent, created_at')
        .eq('restaurant_id', restaurantId);

      if (error) {
        throw new Error(error.message);
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalCustomers = customers.length;
      const newThisMonth = customers.filter(c => new Date(c.created_at) >= startOfMonth).length;
      const totalPoints = customers.reduce((sum, c) => sum + c.total_points, 0);
      const averageSpent = totalCustomers > 0 
        ? customers.reduce((sum, c) => sum + c.total_spent, 0) / totalCustomers 
        : 0;

      return {
        totalCustomers,
        newThisMonth,
        totalPoints,
        averageSpent,
      };
    } catch (error: any) {
      console.error('Error in getCustomerStats:', error);
      return {
        totalCustomers: 0,
        newThisMonth: 0,
        totalPoints: 0,
        averageSpent: 0,
      };
    }
  }
}