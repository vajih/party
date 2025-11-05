-- ============================================================
-- CREATE FUNCTION TO GET ALL AUTH USERS (FOR MISSION CONTROL)
-- This allows the dashboard to see all 62 sign-ups
-- ============================================================

-- This function uses SECURITY DEFINER to access auth.users
-- Only returns basic info: id, email, created_at

CREATE OR REPLACE FUNCTION public.get_all_auth_users_for_dashboard()
RETURNS TABLE (
    id uuid,
    email text,
    created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        au.created_at
    FROM auth.users au
    ORDER BY au.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users (your co-hosts)
GRANT EXECUTE ON FUNCTION public.get_all_auth_users_for_dashboard() TO authenticated;

-- ============================================================
-- USAGE:
-- SELECT * FROM get_all_auth_users_for_dashboard();
-- 
-- This will return all 62 users who have signed up (requested magic link)
-- ============================================================
