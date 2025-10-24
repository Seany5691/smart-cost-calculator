# Supabase Migration Guide

## Overview

This guide covers the migration of all localStorage data to Supabase for cross-device access.

## Step 1: Run SQL Schema Updates

Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(255) PRIMARY KEY,
  userId UUID NOT NULL,
  username VARCHAR(255) NOT NULL,
  userRole VARCHAR(50) NOT NULL,
  activityType VARCHAR(50) NOT NULL,
  dealId VARCHAR(255),
  dealName VARCHAR(255),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  CONSTRAINT fk_user_activity FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_userId ON activity_logs(userId);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activityType ON activity_logs(activityType);

-- Scraper Industries Table
CREATE TABLE IF NOT EXISTS scraper_industries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraper_industries_isActive ON scraper_industries(isActive);

-- Scraper Saved Sessions Table
CREATE TABLE IF NOT EXISTS scraper_saved_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL,
  sessionName VARCHAR(255) NOT NULL,
  towns TEXT[] NOT NULL,
  industries TEXT[] NOT NULL,
  config JSONB NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_user_saved_session FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scraper_saved_sessions_userId ON scraper_saved_sessions(userId);

-- Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_saved_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on activity_logs" ON activity_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on scraper_industries" ON scraper_industries FOR ALL USING (true);
CREATE POLICY "Allow all operations on scraper_saved_sessions" ON scraper_saved_sessions FOR ALL USING (true);
```

## Step 2: What Will Be Migrated

The following localStorage data will be migrated to Supabase:

1. **Saved Deals** (`deals-storage`) → `deal_calculations` table (already exists)
2. **Activity Logs** (`activity-logs`) → `activity_logs` table (new)
3. **Scraper Industries** (`smart-scrape-industries`) → `scraper_industries` table (new)
4. **Scraper Saved Sessions** (`smart-scrape-sessions`) → `scraper_saved_sessions` table (new)

## Step 3: Implementation Tasks

See `tasks.md` for the complete implementation plan with 13 major tasks.

## Benefits

- ✅ Access your data from any device or browser
- ✅ No data loss when clearing browser cache
- ✅ Better performance with indexed queries
- ✅ Automatic backups via Supabase
- ✅ Role-based access control
- ✅ Graceful fallback to localStorage if Supabase is unavailable

## Migration Process

The migration will happen automatically when users first access the app after deployment:

1. Check if migration already completed
2. Load existing localStorage data
3. Upload to Supabase (with duplicate prevention)
4. Mark migration as complete
5. Continue using Supabase for all future operations

Users will see a brief loading indicator during migration.
