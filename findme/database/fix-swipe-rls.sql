-- Fix RLS policies to allow cross-user profile viewing for swipe functionality

-- First, drop the problematic policies if they exist
DROP POLICY IF EXISTS "job_seekers_can_view_companies_for_swiping" ON companies;
DROP POLICY IF EXISTS "companies_can_view_job_seekers_for_swiping" ON job_seekers;

-- Simplified approach: Allow authenticated users to view profiles for swiping
-- This is secure because users can only swipe, not edit other profiles

-- Allow all authenticated users to view company profiles (for job seekers to swipe)
CREATE POLICY "authenticated_can_view_companies_for_swiping" ON companies
    FOR SELECT 
    TO authenticated
    USING (true);

-- Allow all authenticated users to view job seeker profiles (for companies to swipe)  
CREATE POLICY "authenticated_can_view_job_seekers_for_swiping" ON job_seekers
    FOR SELECT 
    TO authenticated
    USING (true);

-- Verify the new policies are in place
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('job_seekers', 'companies')
ORDER BY tablename, policyname;