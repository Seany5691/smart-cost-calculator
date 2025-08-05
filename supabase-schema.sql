-- Smart Cost Calculator Database Schema
-- Complete Supabase integration with exact data matching

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and role management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'manager', 'admin')),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    isActive BOOLEAN DEFAULT true,
    requiresPasswordChange BOOLEAN DEFAULT false,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hardware items table with exact data structure (camelCase column names)
CREATE TABLE hardware_items (
    id VARCHAR(255) PRIMARY KEY,  -- Using string IDs to match existing data
    name VARCHAR(255) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    managerCost DECIMAL(10,2),
    userCost DECIMAL(10,2),
    quantity INTEGER DEFAULT 0,
    locked BOOLEAN DEFAULT false,
    isExtension BOOLEAN DEFAULT false,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connectivity items table (camelCase column names)
CREATE TABLE connectivity_items (
    id VARCHAR(255) PRIMARY KEY,  -- Using string IDs to match existing data
    name VARCHAR(255) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    managerCost DECIMAL(10,2),
    userCost DECIMAL(10,2),
    quantity INTEGER DEFAULT 0,
    locked BOOLEAN DEFAULT false,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Licensing items table (camelCase column names)
CREATE TABLE licensing_items (
    id VARCHAR(255) PRIMARY KEY,  -- Using string IDs to match existing data
    name VARCHAR(255) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    managerCost DECIMAL(10,2),
    userCost DECIMAL(10,2),
    quantity INTEGER DEFAULT 0,
    locked BOOLEAN DEFAULT false,
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Factors table for financing calculations
CREATE TABLE factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factors_data JSONB NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scales table for pricing calculations
CREATE TABLE scales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scales_data JSONB NOT NULL,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deal calculations table for storing completed deals
CREATE TABLE deal_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    userId UUID REFERENCES users(id),
    username VARCHAR(255),
    userRole VARCHAR(50),
    dealName VARCHAR(255),
    customerName VARCHAR(255),
    dealDetails JSONB NOT NULL,
    sectionsData JSONB NOT NULL,
    totalsData JSONB NOT NULL,
    factorsData JSONB NOT NULL,
    scalesData JSONB NOT NULL,
    pdfUrl VARCHAR(500),
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_hardware_items_active ON hardware_items(isActive);
CREATE INDEX idx_connectivity_items_active ON connectivity_items(isActive);
CREATE INDEX idx_licensing_items_active ON licensing_items(isActive);
CREATE INDEX idx_deal_calculations_user_id ON deal_calculations(userId);
CREATE INDEX idx_deal_calculations_created_at ON deal_calculations(createdAt);

-- Views for easier data access
CREATE VIEW active_hardware_items AS
SELECT * FROM hardware_items WHERE isActive = true ORDER BY name;

CREATE VIEW active_connectivity_items AS
SELECT * FROM connectivity_items WHERE isActive = true ORDER BY name;

CREATE VIEW active_licensing_items AS
SELECT * FROM licensing_items WHERE isActive = true ORDER BY name;

-- Helper functions
CREATE OR REPLACE FUNCTION get_latest_factors()
RETURNS JSONB AS $$
BEGIN
    RETURN (SELECT factors_data FROM factors ORDER BY createdAt DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_latest_scales()
RETURNS JSONB AS $$
BEGIN
    RETURN (SELECT scales_data FROM scales ORDER BY createdAt DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (but with permissive policies for now)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectivity_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE licensing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_calculations ENABLE ROW LEVEL SECURITY;

-- Permissive policies for development (allow all operations)
-- TODO: Replace with proper authentication-based policies in production

-- Users policies - allow all operations
CREATE POLICY "Allow all users operations" ON users FOR ALL USING (true) WITH CHECK (true);

-- Hardware items policies - allow all operations
CREATE POLICY "Allow all hardware operations" ON hardware_items FOR ALL USING (true) WITH CHECK (true);

-- Connectivity items policies - allow all operations
CREATE POLICY "Allow all connectivity operations" ON connectivity_items FOR ALL USING (true) WITH CHECK (true);

-- Licensing items policies - allow all operations
CREATE POLICY "Allow all licensing operations" ON licensing_items FOR ALL USING (true) WITH CHECK (true);

-- Factors policies - allow all operations
CREATE POLICY "Allow all factors operations" ON factors FOR ALL USING (true) WITH CHECK (true);

-- Scales policies - allow all operations
CREATE POLICY "Allow all scales operations" ON scales FOR ALL USING (true) WITH CHECK (true);

-- Deal calculations policies - allow all operations
CREATE POLICY "Allow all deal operations" ON deal_calculations FOR ALL USING (true) WITH CHECK (true);

-- Insert default admin user (Camryn - cannot be removed or changed)
INSERT INTO users (username, password, role, name, email, isActive, requiresPasswordChange) VALUES 
('Camryn', 'Elliot6242!', 'admin', 'Camryn', 'Camryn@smartintegrate.co.za', true, false);

-- Insert exact hardware items from JSON (with managerCost and userCost set to cost)
INSERT INTO hardware_items (id, name, cost, managerCost, userCost, quantity, locked, isExtension) VALUES
('hw1', 'Desk Phone B&W', 1054.00, 1054.00, 1054.00, 0, false, true),
('hw2', 'Desk Phone Colour', 1378.00, 1378.00, 1378.00, 0, false, true),
('hw3', 'Switchboard Colour', 2207.00, 2207.00, 2207.00, 0, false, true),
('hw4', 'Cordless Phone', 2420.00, 2420.00, 2420.00, 0, false, true),
('hw5', 'Bluetooth Headset Mono', 1996.00, 1996.00, 1996.00, 0, false, false),
('hw6', 'Bluetooth Headset Dual', 2340.00, 2340.00, 2340.00, 0, false, false),
('hw7', 'Corded Headset Dual', 1467.00, 1467.00, 1467.00, 0, false, false),
('hw8', 'Cellphone', 7500.00, 7500.00, 7500.00, 0, false, false),
('hw9', '4 Port PoE', 644.00, 644.00, 644.00, 0, false, false),
('hw10', '8 Port PoE', 813.00, 813.00, 813.00, 0, false, false),
('hw11', '16 Port PoE', 2282.00, 2282.00, 2282.00, 0, false, false),
('hw12', '8 Port Managed PoE', 1657.00, 1657.00, 1657.00, 0, false, false),
('hw13', '16 Port Managed PoE', 2994.00, 2994.00, 2994.00, 0, false, false),
('hw14', 'Access Point Gigabit', 1350.00, 1350.00, 1350.00, 0, false, false),
('hw15', 'Cloud Router WAN2', 1613.00, 1613.00, 1613.00, 0, false, false),
('hw16', '5G/LTE Router', 1800.00, 1800.00, 1800.00, 0, false, false),
('hw17', 'PC', 9000.00, 9000.00, 9000.00, 0, false, false),
('hw18', 'A4 Copier', 17000.00, 17000.00, 17000.00, 0, false, false),
('hw19', 'Server Cabinet', 1466.25, 1466.25, 1466.25, 0, false, false),
('hw20', 'Additional Mobile App', 0.00, 0.00, 0.00, 0, false, false),
('hw21', 'Additional App on Own Device', 0.00, 0.00, 0.00, 0, false, false),
('hw22', 'Number Porting Per Number', 200.00, 200.00, 200.00, 0, false, false);

-- Insert exact connectivity items from JSON (with managerCost and userCost set to cost)
INSERT INTO connectivity_items (id, name, cost, managerCost, userCost, quantity, locked) VALUES
('conn1', 'LTE', 599.00, 599.00, 599.00, 0, false),
('conn2', 'Fibre', 599.00, 599.00, 599.00, 0, false),
('conn3', 'Melon Sim Card', 350.00, 350.00, 350.00, 0, false);

-- Insert exact licensing items from JSON (with managerCost and userCost set to cost)
INSERT INTO licensing_items (id, name, cost, managerCost, userCost, quantity, locked) VALUES
('lic1', 'Premium License', 90.00, 90.00, 90.00, 0, false),
('lic2', 'Service Level Agreement (0 - 5 users)', 299.00, 299.00, 299.00, 0, false),
('lic3', 'Service Level Agreement (6 - 10 users)', 399.00, 399.00, 399.00, 0, false),
('lic4', 'Service Level Agreement (11 users or more)', 499.00, 499.00, 499.00, 0, false);

-- Insert exact factors data from JSON
INSERT INTO factors (factors_data) VALUES ('{
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
}'::jsonb);

-- Insert exact scales data from JSON
INSERT INTO scales (scales_data) VALUES ('{
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
}'::jsonb);

-- Success message
SELECT 'Smart Cost Calculator database schema created successfully!' as status; 