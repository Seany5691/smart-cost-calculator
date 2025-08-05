import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          password_hash: string;
          role: 'admin' | 'manager' | 'user';
          name: string;
          email: string;
          is_active: boolean;
          requires_password_change: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          password_hash: string;
          role?: 'admin' | 'manager' | 'user';
          name: string;
          email: string;
          is_active?: boolean;
          requires_password_change?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          password_hash?: string;
          role?: 'admin' | 'manager' | 'user';
          name?: string;
          email?: string;
          is_active?: boolean;
          requires_password_change?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      hardware_items: {
        Row: {
          id: string;
          name: string;
          cost: number;
          is_extension: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cost: number;
          is_extension?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cost?: number;
          is_extension?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      connectivity_items: {
        Row: {
          id: string;
          name: string;
          cost: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cost: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cost?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      licensing_items: {
        Row: {
          id: string;
          name: string;
          cost: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cost: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cost?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      factors: {
        Row: {
          id: string;
          factors_data: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          factors_data: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          factors_data?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      scales: {
        Row: {
          id: string;
          scales_data: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scales_data: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scales_data?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      deal_calculations: {
        Row: {
          id: string;
          user_id: string;
          customer_name: string | null;
          distance_to_install: number | null;
          term: number | null;
          escalation: number | null;
          total_gross_profit: number | null;
          settlement: number | null;
          sections_data: any;
          totals_data: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          customer_name?: string | null;
          distance_to_install?: number | null;
          term?: number | null;
          escalation?: number | null;
          total_gross_profit?: number | null;
          settlement?: number | null;
          sections_data: any;
          totals_data: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          customer_name?: string | null;
          distance_to_install?: number | null;
          term?: number | null;
          escalation?: number | null;
          total_gross_profit?: number | null;
          settlement?: number | null;
          sections_data?: any;
          totals_data?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
} 