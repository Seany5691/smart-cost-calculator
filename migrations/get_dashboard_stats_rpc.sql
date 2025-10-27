-- Create RPC function for optimized dashboard stats query
-- This function combines all three statistics queries into a single database call
-- for improved performance on mobile devices

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_user_id UUID,
  p_is_admin BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_deals INTEGER;
  v_active_projects INTEGER;
  v_total_calculations INTEGER;
  v_thirty_days_ago TIMESTAMP;
BEGIN
  -- Calculate 30 days ago timestamp
  v_thirty_days_ago := NOW() - INTERVAL '30 days';
  
  -- Get total deals count
  IF p_is_admin THEN
    SELECT COUNT(*) INTO v_total_deals
    FROM deal_calculations;
  ELSE
    SELECT COUNT(*) INTO v_total_deals
    FROM deal_calculations
    WHERE "userId" = p_user_id;
  END IF;
  
  -- Get active projects count (deals modified in last 30 days)
  IF p_is_admin THEN
    SELECT COUNT(*) INTO v_active_projects
    FROM deal_calculations
    WHERE "updatedAt" >= v_thirty_days_ago;
  ELSE
    SELECT COUNT(*) INTO v_active_projects
    FROM deal_calculations
    WHERE "userId" = p_user_id
      AND "updatedAt" >= v_thirty_days_ago;
  END IF;
  
  -- Get total calculations count (deal_created, deal_saved, deal_loaded activities)
  IF p_is_admin THEN
    SELECT COUNT(*) INTO v_total_calculations
    FROM activity_logs
    WHERE "activityType" IN ('deal_created', 'deal_saved', 'deal_loaded');
  ELSE
    SELECT COUNT(*) INTO v_total_calculations
    FROM activity_logs
    WHERE "userId" = p_user_id
      AND "activityType" IN ('deal_created', 'deal_saved', 'deal_loaded');
  END IF;
  
  -- Return all stats as JSON
  RETURN json_build_object(
    'totalDeals', COALESCE(v_total_deals, 0),
    'activeProjects', COALESCE(v_active_projects, 0),
    'calculations', COALESCE(v_total_calculations, 0)
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID, BOOLEAN) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_dashboard_stats IS 'Optimized function to fetch all dashboard statistics in a single query for mobile performance';
