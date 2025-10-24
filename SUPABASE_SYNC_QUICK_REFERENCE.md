# Supabase Sync Quick Reference

Quick reference for developers implementing the Supabase sync feature.

## Schema Files

| File | Purpose | When to Run |
|------|---------|-------------|
| `supabase-schema.sql` | Base schema (users, items, deals) | First time setup |
| `supabase-sync-migration.sql` | Adds sync tables (activity_logs, etc.) | After base schema |
| `test-supabase-sync-schema.sql` | Test and verify setup | Optional verification |

## Tables Added

### activity_logs
```typescript
interface ActivityLog {
  id: string;                    // VARCHAR(255) PK
  userId: string;                // UUID FK -> users.id
  username: string;              // VARCHAR(255)
  userRole: 'admin' | 'manager' | 'user';
  activityType: 'deal_created' | 'deal_saved' | 'proposal_generated' | 'pdf_generated' | 'deal_loaded';
  dealId?: string;               // VARCHAR(255)
  dealName?: string;             // VARCHAR(255)
  timestamp: string;             // TIMESTAMPTZ
  metadata?: Record<string, any>; // JSONB
  createdAt: string;             // TIMESTAMPTZ
}
```

### scraper_industries
```typescript
interface ScraperIndustry {
  id: string;                    // UUID PK
  name: string;                  // VARCHAR(255) UNIQUE
  userId?: string;               // UUID FK -> users.id
  isActive: boolean;             // BOOLEAN
  createdAt: string;             // TIMESTAMPTZ
  updatedAt: string;             // TIMESTAMPTZ
}
```

### scraper_saved_sessions
```typescript
interface ScraperSavedSession {
  id: string;                    // UUID PK
  userId: string;                // UUID FK -> users.id
  sessionName: string;           // VARCHAR(255)
  towns: string[];               // TEXT[]
  industries: string[];          // TEXT[]
  config: Record<string, any>;   // JSONB
  createdAt: string;             // TIMESTAMPTZ
  updatedAt: string;             // TIMESTAMPTZ
}
```

## Key Changes to Existing Tables

### deal_calculations
- **ID Type Changed**: UUID → VARCHAR(255) (matches localStorage)
- **RLS Policies**: Added proper user isolation
- **All other columns**: Unchanged

## RLS Policy Summary

| Table | Users Can | Admins Can |
|-------|-----------|------------|
| activity_logs | View/insert own | View all |
| deal_calculations | View/insert/update/delete own | View/delete all |
| scraper_industries | View active, insert, update/delete own | Update/delete all |
| scraper_saved_sessions | View/insert/update/delete own | View all |

## Common Queries

### Activity Logs

```sql
-- Get user's recent activities (last 100)
SELECT * FROM activity_logs
WHERE userId = auth.uid()
ORDER BY timestamp DESC
LIMIT 100;

-- Get all activities by type
SELECT * FROM activity_logs
WHERE userId = auth.uid()
AND activityType = 'deal_created'
ORDER BY timestamp DESC;
```

### Deal Calculations

```sql
-- Get user's deals
SELECT * FROM deal_calculations
WHERE userId = auth.uid()
ORDER BY createdAt DESC;

-- Get specific deal
SELECT * FROM deal_calculations
WHERE id = 'deal_123'
AND userId = auth.uid();

-- Delete deal
DELETE FROM deal_calculations
WHERE id = 'deal_123'
AND userId = auth.uid();
```

### Scraper Industries

```sql
-- Get all active industries
SELECT * FROM scraper_industries
WHERE isActive = true
ORDER BY name;

-- Add new industry
INSERT INTO scraper_industries (name, userId, isActive)
VALUES ('New Industry', auth.uid(), true);

-- Delete industry
DELETE FROM scraper_industries
WHERE name = 'Industry Name'
AND userId = auth.uid();
```

### Scraper Saved Sessions

```sql
-- Get user's saved sessions
SELECT * FROM scraper_saved_sessions
WHERE userId = auth.uid()
ORDER BY createdAt DESC;

-- Save new session
INSERT INTO scraper_saved_sessions (userId, sessionName, towns, industries, config)
VALUES (
  auth.uid(),
  'My Session',
  ARRAY['Cape Town', 'Durban'],
  ARRAY['Legal', 'Accounting'],
  '{"maxResults": 50}'::jsonb
);

-- Delete session
DELETE FROM scraper_saved_sessions
WHERE id = 'session-uuid'
AND userId = auth.uid();
```

## Indexes

All tables have optimized indexes for common queries:

```sql
-- activity_logs
idx_activity_logs_user_id          -- WHERE userId = ?
idx_activity_logs_activity_type    -- WHERE activityType = ?
idx_activity_logs_timestamp        -- ORDER BY timestamp DESC
idx_activity_logs_user_timestamp   -- WHERE userId = ? ORDER BY timestamp DESC

-- deal_calculations
idx_deal_calculations_user_id      -- WHERE userId = ?
idx_deal_calculations_created_at   -- ORDER BY createdAt DESC

-- scraper_industries
idx_scraper_industries_name        -- WHERE name = ?
idx_scraper_industries_user_id     -- WHERE userId = ?
idx_scraper_industries_active      -- WHERE isActive = true

-- scraper_saved_sessions
idx_scraper_saved_sessions_user_id     -- WHERE userId = ?
idx_scraper_saved_sessions_created_at  -- ORDER BY createdAt DESC
```

## Migration Checklist

- [ ] Run `supabase-schema.sql` (if not already done)
- [ ] Run `supabase-sync-migration.sql`
- [ ] Run `test-supabase-sync-schema.sql` (optional)
- [ ] Verify tables exist in Supabase dashboard
- [ ] Verify indexes created successfully
- [ ] Verify RLS policies are active
- [ ] Test sample queries in SQL Editor
- [ ] Update application code to use new tables
- [ ] Test migration from localStorage
- [ ] Deploy to production

## Testing Checklist

- [ ] Insert activity log
- [ ] Query activity logs by user
- [ ] Query activity logs by type
- [ ] Insert deal calculation
- [ ] Update deal calculation
- [ ] Delete deal calculation
- [ ] Query deals by user
- [ ] Insert scraper industry
- [ ] Query active industries
- [ ] Delete scraper industry
- [ ] Insert saved session
- [ ] Query saved sessions
- [ ] Delete saved session
- [ ] Verify RLS policies (non-admin can't see other users' data)
- [ ] Verify RLS policies (admin can see all data)
- [ ] Test query performance with indexes

## Troubleshooting

### "relation does not exist"
- Ensure base schema (`supabase-schema.sql`) is applied first
- Check table name spelling (case-sensitive)

### "permission denied"
- Check RLS policies are enabled
- Verify user is authenticated (`auth.uid()` returns UUID)
- Ensure user role is correct in users table

### "duplicate key value"
- Check if migration already ran
- Verify localStorage migration flags
- Use `ON CONFLICT` clauses for upserts

### Slow queries
- Verify indexes exist: `SELECT * FROM pg_indexes WHERE tablename = 'activity_logs';`
- Check query plan: `EXPLAIN ANALYZE SELECT ...`
- Ensure WHERE clauses use indexed columns

## Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Disable Supabase sync (fallback to localStorage)
NEXT_PUBLIC_DISABLE_SUPABASE_SYNC=false
```

## Sample Data

The migration includes sample data for testing:
- 3 activity logs for Camryn user
- 1 test deal calculation
- Sample industries and sessions

To remove sample data:
```sql
DELETE FROM activity_logs WHERE id LIKE 'test_%' OR id LIKE 'activity_test_%';
DELETE FROM deal_calculations WHERE id LIKE 'test_deal_%';
```

## Next Steps

1. Apply schema migrations
2. Implement Supabase helper functions (see design.md)
3. Update activity logger service
4. Update calculator store
5. Update deals pages
6. Update dashboard
7. Implement migration handler component
8. Test thoroughly
9. Deploy

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- Design Document: `design.md`
- Requirements Document: `requirements.md`
- Setup Guide: `SUPABASE_SYNC_SETUP.md`
