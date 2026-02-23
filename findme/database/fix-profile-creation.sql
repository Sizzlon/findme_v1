-- Fix for profile creation issues
-- Run this if you're having trouble with company signup

-- First, let's check if the tables have the correct structure
-- If they have DEFAULT uuid_generate_v4(), we need to fix them

-- Drop and recreate tables with correct structure (BACKUP YOUR DATA FIRST!)
DROP TABLE IF EXISTS job_seekers CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Recreate with correct structure (no auto-generated UUIDs)
CREATE TABLE job_seekers (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    address TEXT,
    preferences TEXT[],
    skills TEXT[],
    personality TEXT,
    bio TEXT,
    experience TEXT,
    education TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE companies (
    id UUID PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    culture TEXT,
    benefits TEXT[],
    location TEXT,
    website TEXT,
    company_size VARCHAR(100),
    industry VARCHAR(100),
    logo_url TEXT,
    subscription_status VARCHAR(20) DEFAULT 'trial',
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies for job_seekers
CREATE POLICY "Users can view own job seeker profile" ON job_seekers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own job seeker profile" ON job_seekers
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own job seeker profile" ON job_seekers
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for companies  
CREATE POLICY "Users can view own company profile" ON companies
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own company profile" ON companies
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own company profile" ON companies
    FOR INSERT WITH CHECK (auth.uid() = id);