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
    return data;
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
    
    if (error) throw error;
    return data?.scales_data || {};
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
  async saveDeal(deal: any) {
    const { data, error } = await supabase
      .from('deal_calculations')
      .insert(deal)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserDeals(userId: string) {
    const { data, error } = await supabase
      .from('deal_calculations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
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
  }
};

// Database types
export interface Database {
  public: {
    Tables: {
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