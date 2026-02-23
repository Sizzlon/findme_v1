-- Quick Database Setup for FindMe
-- Copy and paste this into your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/rglsxabiglioooyqxlyc/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create job_seekers table (simplified)
CREATE TABLE IF NOT EXISTS job_seekers (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    address TEXT,
    preferences TEXT[],
    skills TEXT[],
    personality TEXT,
    bio TEXT,
    experience TEXT,
    education TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create companies table (simplified)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY,
    company_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    description TEXT,
    culture TEXT,
    benefits TEXT[],
    location TEXT,
    website TEXT,
    company_size TEXT,
    industry TEXT,
    logo_url TEXT,
    subscription_status TEXT DEFAULT 'trial',
    subscription_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policies for job_seekers (allow all operations for authenticated users on their own records)
CREATE POLICY "job_seekers_select" ON job_seekers FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "job_seekers_insert" ON job_seekers FOR INSERT WITH CHECK (auth.uid()::text = id::text);
CREATE POLICY "job_seekers_update" ON job_seekers FOR UPDATE USING (auth.uid()::text = id::text);

-- Policies for companies (allow all operations for authenticated users on their own records)
CREATE POLICY "companies_select" ON companies FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "companies_insert" ON companies FOR INSERT WITH CHECK (auth.uid()::text = id::text);
CREATE POLICY "companies_update" ON companies FOR UPDATE USING (auth.uid()::text = id::text);