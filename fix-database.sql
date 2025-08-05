-- Fix Database Schema Script
-- Drop and recreate problematic tables with correct camelCase column names
-- This script will NOT touch the factors and scales tables which are working correctly

-- Step 1: Force refresh PostgREST schema cache first
NOTIFY pgrst, 'reload schema';

-- Step 2: Drop the problematic tables (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS deal_calculations CASCADE;
DROP TABLE IF EXISTS hardware_items CASCADE;
DROP TABLE IF EXISTS connectivity_items CASCADE;
DROP TABLE IF EXISTS licensing_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 3: Force another schema cache refresh after dropping
NOTIFY pgrst, 'reload schema';

-- Step 4: Recreate users table with explicit camelCase column names
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'manager', 'admin')),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    "requiresPasswordChange" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Recreate hardware_items table with explicit camelCase column names
CREATE TABLE hardware_items (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    "managerCost" DECIMAL(10,2),
    "userCost" DECIMAL(10,2),
    quantity INTEGER DEFAULT 0,
    locked BOOLEAN DEFAULT false,
    "isExtension" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Recreate connectivity_items table with explicit camelCase column names
CREATE TABLE connectivity_items (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    "managerCost" DECIMAL(10,2),
    "userCost" DECIMAL(10,2),
    quantity INTEGER DEFAULT 0,
    locked BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Recreate licensing_items table with explicit camelCase column names
CREATE TABLE licensing_items (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    "managerCost" DECIMAL(10,2),
    "userCost" DECIMAL(10,2),
    quantity INTEGER DEFAULT 0,
    locked BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 8: Recreate deal_calculations table with explicit camelCase column names
CREATE TABLE deal_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES users(id),
    username VARCHAR(255),
    "userRole" VARCHAR(50),
    "dealName" VARCHAR(255),
    "customerName" VARCHAR(255),
    "dealDetails" JSONB NOT NULL,
    "sectionsData" JSONB NOT NULL,
    "totalsData" JSONB NOT NULL,
    "factorsData" JSONB NOT NULL,
    "scalesData" JSONB NOT NULL,
    "pdfUrl" VARCHAR(500),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 9: Recreate indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_hardware_items_active ON hardware_items("isActive");
CREATE INDEX idx_connectivity_items_active ON connectivity_items("isActive");
CREATE INDEX idx_licensing_items_active ON licensing_items("isActive");
CREATE INDEX idx_deal_calculations_user_id ON deal_calculations("userId");
CREATE INDEX idx_deal_calculations_created_at ON deal_calculations("createdAt");

-- Step 10: Recreate views for easier data access
CREATE VIEW active_hardware_items AS
SELECT * FROM hardware_items WHERE "isActive" = true ORDER BY name;

CREATE VIEW active_connectivity_items AS
SELECT * FROM connectivity_items WHERE "isActive" = true ORDER BY name;

CREATE VIEW active_licensing_items AS
SELECT * FROM licensing_items WHERE "isActive" = true ORDER BY name;

-- Step 11: Enable Row Level Security with permissive policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectivity_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE licensing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_calculations ENABLE ROW LEVEL SECURITY;

-- Step 12: Create permissive policies for development
CREATE POLICY "Allow all users operations" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all hardware operations" ON hardware_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all connectivity operations" ON connectivity_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all licensing operations" ON licensing_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all deal operations" ON deal_calculations FOR ALL USING (true) WITH CHECK (true);

-- Step 13: Insert default admin user (Camryn - cannot be removed or changed)
INSERT INTO users (username, password, role, name, email, "isActive", "requiresPasswordChange") VALUES 
('Camryn', 'Elliot6242!', 'admin', 'Camryn', 'Camryn@smartintegrate.co.za', true, false);

-- Step 14: Insert exact hardware items from JSON (with managerCost and userCost set to cost)
INSERT INTO hardware_items (id, name, cost, "managerCost", "userCost", quantity, locked, "isExtension") VALUES
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

-- Step 15: Insert exact connectivity items from JSON (with managerCost and userCost set to cost)
INSERT INTO connectivity_items (id, name, cost, "managerCost", "userCost", quantity, locked) VALUES
('conn1', 'LTE', 599.00, 599.00, 599.00, 0, false),
('conn2', 'Fibre', 599.00, 599.00, 599.00, 0, false),
('conn3', 'Melon Sim Card', 350.00, 350.00, 350.00, 0, false);

-- Step 16: Insert exact licensing items from JSON (with managerCost and userCost set to cost)
INSERT INTO licensing_items (id, name, cost, "managerCost", "userCost", quantity, locked) VALUES
('lic1', 'Premium License', 90.00, 90.00, 90.00, 0, false),
('lic2', 'Service Level Agreement (0 - 5 users)', 299.00, 299.00, 299.00, 0, false),
('lic3', 'Service Level Agreement (6 - 10 users)', 399.00, 399.00, 399.00, 0, false),
('lic4', 'Service Level Agreement (11 users or more)', 499.00, 499.00, 499.00, 0, false);

-- Step 17: Force multiple schema cache refreshes to ensure PostgREST recognizes the new structure
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(3); -- Wait 3 seconds
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(3); -- Wait another 3 seconds
NOTIFY pgrst, 'reload schema';

-- Success message
SELECT 'Database tables recreated successfully with quoted camelCase column names and schema cache refreshed!' as status; 