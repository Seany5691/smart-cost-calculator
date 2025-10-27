# Database Migrations

This directory contains SQL migration files for the Smart Cost Calculator application.

## get_dashboard_stats_rpc.sql

This migration creates an optimized RPC (Remote Procedure Call) function in Supabase for fetching dashboard statistics in a single query.

### Purpose

The `get_dashboard_stats` function combines three separate queries into one optimized database call:
- Total deals count
- Active projects count (deals modified in last 30 days)
- Total calculations count (from activity logs)

This significantly improves performance on mobile devices by reducing the number of round trips to the database.

### How to Apply

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `get_dashboard_stats_rpc.sql`
4. Execute the SQL script

Alternatively, you can use the Supabase CLI:

```bash
supabase db push
```

### Function Signature

```sql
get_dashboard_stats(
  p_user_id UUID,
  p_is_admin BOOLEAN
) RETURNS JSON
```

### Parameters

- `p_user_id`: The UUID of the current user
- `p_is_admin`: Boolean flag indicating if the user is an admin

### Returns

JSON object with the following structure:

```json
{
  "totalDeals": 0,
  "activeProjects": 0,
  "calculations": 0
}
```

### Security

The function is marked as `SECURITY DEFINER` and grants execute permission to authenticated users only.

### Testing

After applying the migration, you can test the function with:

```sql
-- Test as admin
SELECT get_dashboard_stats('your-user-id-here'::UUID, true);

-- Test as regular user
SELECT get_dashboard_stats('your-user-id-here'::UUID, false);
```

### Rollback

To remove the function:

```sql
DROP FUNCTION IF EXISTS get_dashboard_stats(UUID, BOOLEAN);
```
