-- Comprehensive RLS Policy Fix for FindMe
-- Run this SQL in your Supabase SQL Editor

-- First, disable RLS temporarily to clean up
ALTER TABLE job_seekers DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own job seeker profile" ON job_seekers;
DROP POLICY IF EXISTS "Users can update own job seeker profile" ON job_seekers;
DROP POLICY IF EXISTS "Users can insert own job seeker profile" ON job_seekers;
DROP POLICY IF EXISTS "job_seekers_select" ON job_seekers;
DROP POLICY IF EXISTS "job_seekers_insert" ON job_seekers;
DROP POLICY IF EXISTS "job_seekers_update" ON job_seekers;
DROP POLICY IF EXISTS "job_seekers_all_operations" ON job_seekers;

DROP POLICY IF EXISTS "Users can view own company profile" ON companies;
DROP POLICY IF EXISTS "Users can update own company profile" ON companies;
DROP POLICY IF EXISTS "Users can insert own company profile" ON companies;
DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;
DROP POLICY IF EXISTS "companies_all_operations" ON companies;

-- Drop cross-viewing policies that might exist
DROP POLICY IF EXISTS "companies_can_view_job_seekers" ON job_seekers;
DROP POLICY IF EXISTS "job_seekers_can_view_companies" ON companies;
DROP POLICY IF EXISTS "job_seekers_policy" ON job_seekers;
DROP POLICY IF EXISTS "companies_policy" ON companies;

-- Re-enable RLS
ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies for job_seekers
CREATE POLICY "job_seekers_policy" ON job_seekers
    FOR ALL 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create simple, permissive policies for companies
CREATE POLICY "companies_policy" ON companies 
    FOR ALL 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow companies to view job seeker profiles for matching (but not modify)
CREATE POLICY "companies_can_view_job_seekers" ON job_seekers
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM companies 
            WHERE companies.id = auth.uid()
        )
    );

-- Allow job seekers to view company profiles for matching (but not modify)
CREATE POLICY "job_seekers_can_view_companies" ON companies
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM job_seekers 
            WHERE job_seekers.id = auth.uid()
        )
    );

-- Create policies for future tables (matches, chats, etc.)
-- These will be needed for the swipe and chat functionality

-- Test the policies
-- You can run these queries to verify the policies work:
-- SELECT auth.uid(); -- Should return your user ID
-- SELECT * FROM job_seekers WHERE id = auth.uid(); -- Should work if you're a job seeker
-- SELECT * FROM companies WHERE id = auth.uid(); -- Should work if you're a company