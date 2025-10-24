import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for common operations
export const supabaseHelpers = {
  // Hardware items
  async getHardwareItems() {
    const { data, error } = await supabase
      .from('hardware_items')
      .select('*')
      .eq('isActive', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async updateHardwareItems(items: any[]) {
    // First, deactivate all items
    await supabase
      .from('hardware_items')
      .update({ isActive: false })
      .eq('isActive', true);

    // Then insert/update the new items
    const { data, error } = await supabase
      .from('hardware_items')
      .upsert(items.map(item => ({
        ...item,
        isActive: true,
        quantity: 0 // Reset quantities when saving
      })))
      .select();

    if (error) throw error;
    return data;
  },

  // Connectivity items
  async getConnectivityItems() {
    const { data, error } = await supabase
      .from('connectivity_items')
      .select('*')
      .eq('isActive', true)
      .order('name');
    
    if (error) throw error;
    
    // Ensure proper type conversion for numeric fields
    const processedData = data?.map(item => ({
      ...item,
      cost: typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost,
      managerCost: typeof item.managerCost === 'string' ? parseFloat(item.managerCost) : item.managerCost,
      userCost: typeof item.userCost === 'string' ? parseFloat(item.userCost) : item.userCost,
      quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity
    })) || [];
    
    return processedData;
  },

  async updateConnectivityItems(items: any[]) {
    // First, deactivate all items
    await supabase
      .from('connectivity_items')
      .update({ isActive: false })
      .eq('isActive', true);

    // Then insert/update the new items
    const { data, error } = await supabase
      .from('connectivity_items')
      .upsert(items.map(item => ({
        ...item,
        isActive: true,
        quantity: 0 // Reset quantities when saving
      })))
      .select();

    if (error) throw error;
    return data;
  },

  // Licensing items
  async getLicensingItems() {
    const { data, error } = await supabase
      .from('licensing_items')
      .select('*')
      .eq('isActive', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async updateLicensingItems(items: any[]) {
    // First, deactivate all items
    await supabase
      .from('licensing_items')
      .update({ isActive: false })
      .eq('isActive', true);

    // Then insert/update the new items
    const { data, error } = await supabase
      .from('licensing_items')
      .upsert(items.map(item => ({
        ...item,
        isActive: true,
        quantity: 0 // Reset quantities when saving
      })))
      .select();

    if (error) throw error;
    return data;
  },

  // Factors
  async getFactors() {
    const { data, error } = await supabase
      .from('factors')
      .select('factors_data')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;
    return data?.factors_data || {};
  },

  async updateFactors(factors: any) {
    const { data, error } = await supabase
      .from('factors')
      .insert({ factors_data: factors })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Scales
  async getScales() {
    const { data, error } = await supabase
      .from('scales')
      .select('scales_data')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // If no data found or error, return default scales
    if (error || !data?.scales_data) {
      return {
        installation: {
          "0-4": 3500,
          "5-8": 3500,
          "9-16": 7000,
          "17-32": 10500,
          "33+": 15000
        },
        finance_fee: {
          "0-20000": 1800,
          "20001-50000": 1800,
          "50001-100000": 2800,
          "100001+": 3800
        },
        gross_profit: {
          "0-4": 10000,
          "5-8": 15000,
          "9-16": 20000,
          "17-32": 25000,
          "33+": 30000
        },
        additional_costs: {
          cost_per_kilometer: 1.5,
          cost_per_point: 750
        }
      };
    }
    
    return data.scales_data;
  },

  async updateScales(scales: any) {
    const { data, error } = await supabase
      .from('scales')
      .insert({ scales_data: scales })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deal calculations
  async getDeals(userId?: string, isAdmin: boolean = false) {
    try {
      let query = supabase
        .from('deal_calculations')
        .select('*')
        .order('createdAt', { ascending: false });

      // Non-admin users can only see their own deals
      if (!isAdmin && userId) {
        query = query.eq('userId', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Failed to retrieve deals from Supabase:', error);
      throw error;
    }
  },

  async getDealById(dealId: string) {
    try {
      const { data, error } = await supabase
        .from('deal_calculations')
        .select('*')
        .eq('id', dealId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to retrieve deal from Supabase:', error);
      throw error;
    }
  },

  async createDeal(deal: any) {
    try {
      const { data, error } = await supabase
        .from('deal_calculations')
        .insert(deal)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to create deal in Supabase:', error);
      throw error;
    }
  },

  async updateDeal(dealId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('deal_calculations')
        .update(updates)
        .eq('id', dealId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to update deal in Supabase:', error);
      throw error;
    }
  },

  async deleteDeal(dealId: string) {
    try {
      const { error } = await supabase
        .from('deal_calculations')
        .delete()
        .eq('id', dealId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.warn('Failed to delete deal from Supabase:', error);
      throw error;
    }
  },

  // Users
  async getUserByUsername(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('isActive', true)
      .single();

    if (error) throw error;
    return data;
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('isActive', true)
      .order('username');

    if (error) throw error;
    return data;
  },

  async createUser(user: any) {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUser(id: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteUser(id: string) {
    const { error } = await supabase
      .from('users')
      .update({ isActive: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Activity logs
  async getActivityLogs(userId?: string, limit: number = 100) {
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('userId', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Failed to retrieve activity logs from Supabase:', error);
      throw error;
    }
  },

  async createActivityLog(log: any) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert(log)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Failed to create activity log in Supabase:', error);
      throw error;
    }
  }
};

// Database types
export interface Database {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          id: string;
          userId: string;
          username: string;
          userRole: 'admin' | 'manager' | 'user';
          activityType: 'deal_created' | 'deal_saved' | 'proposal_generated' | 'pdf_generated' | 'deal_loaded';
          dealId: string | null;
          dealName: string | null;
          timestamp: string;
          metadata: any | null;
          createdAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          username: string;
          userRole: 'admin' | 'manager' | 'user';
          activityType: 'deal_created' | 'deal_saved' | 'proposal_generated' | 'pdf_generated' | 'deal_loaded';
          dealId?: string | null;
          dealName?: string | null;
          timestamp?: string;
          metadata?: any | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          username?: string;
          userRole?: 'admin' | 'manager' | 'user';
          activityType?: 'deal_created' | 'deal_saved' | 'proposal_generated' | 'pdf_generated' | 'deal_loaded';
          dealId?: string | null;
          dealName?: string | null;
          timestamp?: string;
          metadata?: any | null;
          createdAt?: string;
        };
      };
      users: {
        Row: {
          id: string;
          username: string;
          password: string;
          role: 'admin' | 'manager' | 'user';
          name: string;
          email: string;
          isActive: boolean;
          requiresPasswordChange: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          username: string;
          password: string;
          role?: 'admin' | 'manager' | 'user';
          name: string;
          email: string;
          isActive?: boolean;
          requiresPasswordChange?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          username?: string;
          password?: string;
          role?: 'admin' | 'manager' | 'user';
          name?: string;
          email?: string;
          isActive?: boolean;
          requiresPasswordChange?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      hardware_items: {
        Row: {
          id: string;
          name: string;
          cost: number;
          managerCost: number | null;
          userCost: number | null;
          quantity: number;
          locked: boolean;
          isExtension: boolean;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          name: string;
          cost: number;
          managerCost?: number | null;
          userCost?: number | null;
          quantity?: number;
          locked?: boolean;
          isExtension?: boolean;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cost?: number;
          managerCost?: number | null;
          userCost?: number | null;
          quantity?: number;
          locked?: boolean;
          isExtension?: boolean;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      connectivity_items: {
        Row: {
          id: string;
          name: string;
          cost: number;
          managerCost: number | null;
          userCost: number | null;
          quantity: number;
          locked: boolean;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          name: string;
          cost: number;
          managerCost?: number | null;
          userCost?: number | null;
          quantity?: number;
          locked?: boolean;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cost?: number;
          managerCost?: number | null;
          userCost?: number | null;
          quantity?: number;
          locked?: boolean;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      licensing_items: {
        Row: {
          id: string;
          name: string;
          cost: number;
          managerCost: number | null;
          userCost: number | null;
          quantity: number;
          locked: boolean;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          name: string;
          cost: number;
          managerCost?: number | null;
          userCost?: number | null;
          quantity?: number;
          locked?: boolean;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cost?: number;
          managerCost?: number | null;
          userCost?: number | null;
          quantity?: number;
          locked?: boolean;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      factors: {
        Row: {
          id: string;
          factors_data: any;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          factors_data: any;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          factors_data?: any;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      scales: {
        Row: {
          id: string;
          scales_data: any;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          scales_data: any;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          scales_data?: any;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      deal_calculations: {
        Row: {
          id: string;
          userId: string;
          username: string | null;
          userRole: string | null;
          dealName: string | null;
          customerName: string | null;
          dealDetails: any;
          sectionsData: any;
          totalsData: any;
          factorsData: any;
          scalesData: any;
          pdfUrl: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          username?: string | null;
          userRole?: string | null;
          dealName?: string | null;
          customerName?: string | null;
          dealDetails: any;
          sectionsData: any;
          totalsData: any;
          factorsData: any;
          scalesData: any;
          pdfUrl?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          username?: string | null;
          userRole?: string | null;
          dealName?: string | null;
          customerName?: string | null;
          dealDetails?: any;
          sectionsData?: any;
          totalsData?: any;
          factorsData?: any;
          scalesData?: any;
          pdfUrl?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
      };
    };
  };
} 