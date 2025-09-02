-- Add order field to hardware, connectivity, and licensing tables
-- This allows admin to control the display order of items
-- Using quoted camelCase to match existing database pattern

-- Add order field to hardware_items table
ALTER TABLE hardware_items ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER DEFAULT 0;

-- Add order field to connectivity_items table  
ALTER TABLE connectivity_items ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER DEFAULT 0;

-- Add order field to licensing_items table
ALTER TABLE licensing_items ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER DEFAULT 0;

-- Update existing items with default order values (alphabetical order)
UPDATE hardware_items SET "displayOrder" = 0 WHERE "displayOrder" IS NULL;
UPDATE connectivity_items SET "displayOrder" = 0 WHERE "displayOrder" IS NULL;
UPDATE licensing_items SET "displayOrder" = 0 WHERE "displayOrder" IS NULL;

-- Create indexes for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_hardware_items_order ON hardware_items("displayOrder", name);
CREATE INDEX IF NOT EXISTS idx_connectivity_items_order ON connectivity_items("displayOrder", name);
CREATE INDEX IF NOT EXISTS idx_licensing_items_order ON licensing_items("displayOrder", name);

-- Update the views to use the new order field
CREATE OR REPLACE VIEW active_hardware_items AS
SELECT * FROM hardware_items WHERE "isActive" = true ORDER BY "displayOrder", name;

CREATE OR REPLACE VIEW active_connectivity_items AS
SELECT * FROM connectivity_items WHERE "isActive" = true ORDER BY "displayOrder", name;

CREATE OR REPLACE VIEW active_licensing_items AS
SELECT * FROM licensing_items WHERE "isActive" = true ORDER BY "displayOrder", name;
