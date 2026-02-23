-- Complete Database Setup for FindMe
-- Run this in your Supabase SQL Editor to set up all tables correctly
-- This will drop and recreate all tables, so BACKUP YOUR DATA FIRST!

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop all tables in correct order (reverse dependency order)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS matches CASCADE;  
DROP TABLE IF EXISTS swipes CASCADE;
DROP TABLE IF EXISTS vacancies CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS job_seekers CASCADE;

-- Create job_seekers table
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

-- Create companies table
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

-- Create swipes table (for swiping functionality)
CREATE TABLE swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swiper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    swiped_id UUID NOT NULL,
    swipe_type VARCHAR(10) NOT NULL CHECK (swipe_type IN ('like', 'pass')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(swiper_id, swiped_id)
);

-- Create matches table (for mutual likes)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_seeker_id UUID NOT NULL,
    company_id UUID NOT NULL,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(job_seeker_id, company_id),
    CONSTRAINT fk_match_job_seeker 
        FOREIGN KEY (job_seeker_id) 
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_match_company 
        FOREIGN KEY (company_id) 
        REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiped ON swipes(swiped_id);
CREATE INDEX IF NOT EXISTS idx_swipes_type ON swipes(swipe_type);
CREATE INDEX IF NOT EXISTS idx_matches_job_seeker ON matches(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_matches_company ON matches(company_id);
CREATE INDEX IF NOT EXISTS idx_matches_active ON matches(is_active);

-- Enable Row Level Security
ALTER TABLE job_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_seekers
CREATE POLICY "Users can view own job seeker profile" ON job_seekers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own job seeker profile" ON job_seekers
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own job seeker profile" ON job_seekers
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for companies  
CREATE POLICY "Users can view own company profile" ON companies
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own company profile" ON companies
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own company profile" ON companies
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for swipes
CREATE POLICY "users_can_view_own_swipes" ON swipes
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = swiper_id);

CREATE POLICY "users_can_create_own_swipes" ON swipes
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = swiper_id);

-- RLS Policies for matches
CREATE POLICY "users_can_view_own_matches" ON matches
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() = job_seeker_id OR 
        auth.uid() = company_id
    );

CREATE POLICY "system_can_create_matches" ON matches
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        auth.uid() = job_seeker_id OR 
        auth.uid() = company_id
    );

-- Function to create a match when mutual swipe occurs
CREATE OR REPLACE FUNCTION create_match_on_mutual_swipe()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.swipe_type = 'like' THEN
        IF EXISTS (
            SELECT 1 FROM swipes 
            WHERE swiper_id = NEW.swiped_id 
            AND swiped_id = NEW.swiper_id 
            AND swipe_type = 'like'
        ) THEN
            INSERT INTO matches (job_seeker_id, company_id)
            SELECT 
                CASE 
                    WHEN EXISTS (SELECT 1 FROM job_seekers WHERE id = NEW.swiper_id) 
                    THEN NEW.swiper_id 
                    ELSE NEW.swiped_id 
                END,
                CASE 
                    WHEN EXISTS (SELECT 1 FROM companies WHERE id = NEW.swiper_id) 
                    THEN NEW.swiper_id 
                    ELSE NEW.swiped_id 
                END
            ON CONFLICT (job_seeker_id, company_id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic match creation
DROP TRIGGER IF EXISTS trigger_create_match_on_mutual_swipe ON swipes;
CREATE TRIGGER trigger_create_match_on_mutual_swipe
    AFTER INSERT ON swipes
    FOR EACH ROW
    EXECUTE FUNCTION create_match_on_mutual_swipe();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Verify setup
SELECT 'Setup completed successfully!' as status;