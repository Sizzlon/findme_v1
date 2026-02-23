-- Fix RLS policies for signup flow
-- Run this in your Supabase SQL Editor

-- Drop existing problematic policies
DROP POLICY IF EXISTS "job_seekers_select" ON job_seekers;
DROP POLICY IF EXISTS "job_seekers_insert" ON job_seekers;
DROP POLICY IF EXISTS "job_seekers_update" ON job_seekers;
DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;

-- Create permissive policies that work with the signup flow
CREATE POLICY "job_seekers_all_operations" ON job_seekers
    FOR ALL 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "companies_all_operations" ON companies
    FOR ALL 
    USING (auth.uid() = id)  
    WITH CHECK (auth.uid() = id);

-- Alternative: If the above still doesn't work, temporarily disable RLS
-- ALTER TABLE job_seekers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE companies DISABLE ROW LEVEL SECURITY;