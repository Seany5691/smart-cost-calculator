-- Smart Cost Calculator Database Schema
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security (RLS)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');

-- Users table
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    requires_password_change BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hardware items table
CREATE TABLE hardware_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    is_extension BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connectivity items table
CREATE TABLE connectivity_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Licensing items table
CREATE TABLE licensing_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Factors table (JSON structure)
CREATE TABLE factors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    factors_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scales table (JSON structure)
CREATE TABLE scales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    scales_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deal calculations table
CREATE TABLE deal_calculations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    distance_to_install INTEGER,
    term INTEGER,
    escalation DECIMAL(5,2),
    total_gross_profit DECIMAL(10,2), -- New editable field
    settlement DECIMAL(10,2),
    sections_data JSONB NOT NULL,
    totals_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user
INSERT INTO users (username, password_hash, role, name, email, is_active, requires_password_change) 
VALUES (
    'Camryn', 
    '$2a$10$your-hashed-password-here', -- You'll need to hash 'Elliot6242!'
    'admin', 
    'Camryn Admin', 
    'camryn@company.com', 
    true, 
    false
);

-- Insert default hardware items
INSERT INTO hardware_items (name, cost, is_extension) VALUES
('Desk Phone B&W', 1054.00, true),
('Desk Phone Colour', 1378.00, true),
('Switchboard Colour', 2207.00, true),
('Cordless Phone', 2420.00, true),
('Bluetooth Headset Mono', 1996.00, false),
('Bluetooth Headset Dual', 2340.00, false),
('Corded Headset Dual', 1467.00, false),
('Cellphone', 7500.00, false),
('4 Port PoE', 644.00, false),
('8 Port PoE', 813.00, false),
('16 Port PoE', 2282.00, false),
('8 Port Managed PoE', 1657.00, false),
('16 Port Managed PoE', 2994.00, false),
('Access Point Gigabit', 1350.00, false),
('Cloud Router WAN2', 1613.00, false),
('5G/LTE Router', 1800.00, false),
('PC', 9000.00, false),
('A4 Copier', 17000.00, false),
('Server Cabinet', 1466.25, false),
('Additional Mobile App', 0.00, false),
('Additional App on Own Device', 0.00, false),
('Number Porting Per Number', 200.00, false);

-- Insert default connectivity items
INSERT INTO connectivity_items (name, cost) VALUES
('LTE', 599.00),
('Fibre', 599.00),
('Melon Sim Card', 350.00);

-- Insert default licensing items
INSERT INTO licensing_items (name, cost) VALUES
('Premium License', 90.00),
('Service Level Agreement (0 - 5 users)', 299.00),
('Service Level Agreement (6 - 10 users)', 399.00),
('Service Level Agreement (11 users or more)', 499.00);

-- Insert default factors
INSERT INTO factors (factors_data) VALUES (
'{
  "36_months": {
    "0%": {
      "0-20000": 0.03814,
      "20001-50000": 0.03814,
      "50001-100000": 0.03755,
      "100000+": 0.03707
    },
    "10%": {
      "0-20000": 0.03511,
      "20001-50000": 0.03511,
      "50001-100000": 0.03454,
      "100000+": 0.03409
    },
    "15%": {
      "0-20000": 0.04133,
      "20001-50000": 0.04003,
      "50001-100000": 0.03883,
      "100000+": 0.03803
    }
  },
  "48_months": {
    "0%": {
      "0-20000": 0.03155,
      "20001-50000": 0.03155,
      "50001-100000": 0.03093,
      "100000+": 0.03043
    },
    "10%": {
      "0-20000": 0.02805,
      "20001-50000": 0.02805,
      "50001-100000": 0.02741,
      "100000+": 0.02694
    },
    "15%": {
      "0-20000": 0.03375,
      "20001-50000": 0.03245,
      "50001-100000": 0.03125,
      "100000+": 0.03045
    }
  },
  "60_months": {
    "0%": {
      "0-20000": 0.02772,
      "20001-50000": 0.02772,
      "50001-100000": 0.02705,
      "100000+": 0.02658
    },
    "10%": {
      "0-20000": 0.02327,
      "20001-50000": 0.02327,
      "50001-100000": 0.02315,
      "100000+": 0.02267
    },
    "15%": {
      "0-20000": 0.02937,
      "20001-50000": 0.02807,
      "50001-100000": 0.02687,
      "100000+": 0.02607
    }
  }
}'::jsonb
);

-- Insert default scales
INSERT INTO scales (scales_data) VALUES (
'{
  "installation": {
    "0-4": 3500,
    "5-8": 3500,
    "9-16": 7000,
    "17-32": 10500,
    "33+": 15000
  },
  "finance_fee": {
    "0-20000": 1800,
    "20001-50000": 1800,
    "50001-100000": 2800,
    "100001+": 3800
  },
  "gross_profit": {
    "0-4": 10000,
    "5-8": 15000,
    "9-16": 20000,
    "17-32": 25000,
    "33+": 30000
  },
  "additional_costs": {
    "cost_per_kilometer": 1.5,
    "cost_per_point": 750
  }
}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_deal_calculations_user_id ON deal_calculations(user_id);
CREATE INDEX idx_deal_calculations_created_at ON deal_calculations(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectivity_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE licensing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_calculations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read all data
CREATE POLICY "Users can read all data" ON users FOR SELECT USING (true);
CREATE POLICY "Hardware items are readable by all" ON hardware_items FOR SELECT USING (true);
CREATE POLICY "Connectivity items are readable by all" ON connectivity_items FOR SELECT USING (true);
CREATE POLICY "Licensing items are readable by all" ON licensing_items FOR SELECT USING (true);
CREATE POLICY "Factors are readable by all" ON factors FOR SELECT USING (true);
CREATE POLICY "Scales are readable by all" ON scales FOR SELECT USING (true);

-- Admin can modify all data
CREATE POLICY "Admin can modify all data" ON hardware_items FOR ALL USING (true);
CREATE POLICY "Admin can modify all data" ON connectivity_items FOR ALL USING (true);
CREATE POLICY "Admin can modify all data" ON licensing_items FOR ALL USING (true);
CREATE POLICY "Admin can modify all data" ON factors FOR ALL USING (true);
CREATE POLICY "Admin can modify all data" ON scales FOR ALL USING (true);

-- Users can only see their own deals
CREATE POLICY "Users can view own deals" ON deal_calculations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deals" ON deal_calculations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deals" ON deal_calculations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deals" ON deal_calculations FOR DELETE USING (auth.uid() = user_id);

-- Admin can see all deals
CREATE POLICY "Admin can view all deals" ON deal_calculations FOR ALL USING (true);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hardware_items_updated_at BEFORE UPDATE ON hardware_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_connectivity_items_updated_at BEFORE UPDATE ON connectivity_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_licensing_items_updated_at BEFORE UPDATE ON licensing_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_factors_updated_at BEFORE UPDATE ON factors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scales_updated_at BEFORE UPDATE ON scales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deal_calculations_updated_at BEFORE UPDATE ON deal_calculations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 