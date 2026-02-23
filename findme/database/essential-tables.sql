-- Essential tables for FindMe application
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create job_seekers table
CREATE TABLE IF NOT EXISTS job_seekers (
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

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
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
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own job seeker profile" ON job_seekers
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own job seeker profile" ON job_seekers
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Create policies for companies
CREATE POLICY "Users can view own company profile" ON companies
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own company profile" ON companies
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own company profile" ON companies
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);