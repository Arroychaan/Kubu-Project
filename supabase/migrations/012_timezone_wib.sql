-- ============================================
-- Migration: 012_timezone_wib
-- Description: Set Default Timezone to Asia/Jakarta (WIB) for all roles.
-- This ensures NOW() and other time functions operate in WIB context.
-- ============================================

-- 1. Set Timezone for API Users (Authenticated)
ALTER ROLE authenticated SET timezone TO 'Asia/Jakarta';

-- 2. Set Timezone for Service Role (Backend/Edge Functions)
ALTER ROLE service_role SET timezone TO 'Asia/Jakarta';

-- 3. Set Timezone for Database Owner (Dashboard/Migrations)
ALTER ROLE postgres SET timezone TO 'Asia/Jakarta';

-- 4. Set Timezone for Anonymous Users (Public access if any)
ALTER ROLE anon SET timezone TO 'Asia/Jakarta';

-- Note: Existing TIMESTAMPTZ data is stored in UTC but will now be returned/displayed
-- as WIB (+07) by default for these roles.

-- 5. Helper function to get current WIB time explicitly (optional usage)
CREATE OR REPLACE FUNCTION now_wib() 
RETURNS TIMESTAMPTZ 
LANGUAGE sql 
STABLE 
AS $$
  SELECT NOW() AT TIME ZONE 'Asia/Jakarta';
$$;
