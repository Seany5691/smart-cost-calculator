-- Test Database Structure Script
-- Run this after the fix-database.sql to verify everything is working correctly

-- Test 1: Check if tables exist with correct column names
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('users', 'hardware_items', 'connectivity_items', 'licensing_items')
AND column_name IN ('isActive', 'managerCost', 'userCost', 'isExtension', 'createdAt', 'updatedAt')
ORDER BY table_name, column_name;

-- Test 2: Check if users table has the correct structure
SELECT 
    'users' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Test 3: Check if hardware_items table has the correct structure
SELECT 
    'hardware_items' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'hardware_items'
ORDER BY ordinal_position;

-- Test 4: Check if connectivity_items table has the correct structure
SELECT 
    'connectivity_items' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'connectivity_items'
ORDER BY ordinal_position;

-- Test 5: Check if licensing_items table has the correct structure
SELECT 
    'licensing_items' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'licensing_items'
ORDER BY ordinal_position;

-- Test 6: Check if data was inserted correctly
SELECT 'users' as table, COUNT(*) as count FROM users
UNION ALL
SELECT 'hardware_items' as table, COUNT(*) as count FROM hardware_items
UNION ALL
SELECT 'connectivity_items' as table, COUNT(*) as count FROM connectivity_items
UNION ALL
SELECT 'licensing_items' as table, COUNT(*) as count FROM licensing_items;

-- Test 7: Check if Camryn admin user exists
SELECT username, role, name, email, isActive FROM users WHERE username = 'Camryn';

-- Test 8: Check if hardware items have correct data
SELECT id, name, cost, managerCost, userCost, isExtension, isActive 
FROM hardware_items 
WHERE id IN ('hw1', 'hw2', 'hw3') 
ORDER BY id;

-- Test 9: Check if connectivity items have correct data
SELECT id, name, cost, managerCost, userCost, isActive 
FROM connectivity_items 
ORDER BY id;

-- Test 10: Check if licensing items have correct data
SELECT id, name, cost, managerCost, userCost, isActive 
FROM licensing_items 
ORDER BY id;

-- Success message
SELECT 'Database structure verification completed! Check the results above.' as status; 