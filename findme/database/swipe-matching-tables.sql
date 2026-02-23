-- Swipe and Matching System Tables for FindMe
-- Run this SQL in your Supabase SQL Editor

-- Drop existing tables if they exist (to ensure clean setup)
DROP TABLE IF EXISTS swipes CASCADE;

-- Create swipes table to track all swipe actions
CREATE TABLE swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swiper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    swiped_id UUID NOT NULL,
    swipe_type VARCHAR(10) NOT NULL CHECK (swipe_type IN ('like', 'pass')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one swipe per pair
    UNIQUE(swiper_id, swiped_id)
);

-- Drop existing matches table if it exists without proper structure
DROP TABLE IF EXISTS matches CASCADE;

-- Create matches table for mutual likes
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_seeker_id UUID NOT NULL,
    company_id UUID NOT NULL,
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Ensure one match per pair
    UNIQUE(job_seeker_id, company_id),
    
    -- Add foreign key constraints
    CONSTRAINT fk_job_seeker 
        FOREIGN KEY (job_seeker_id) 
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_company 
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

-- Enable RLS
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

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
        -- Allow creation if user is part of the match
        auth.uid() = job_seeker_id OR 
        auth.uid() = company_id
    );

-- Function to create a match when mutual swipe occurs
CREATE OR REPLACE FUNCTION create_match_on_mutual_swipe()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if this creates a mutual like
    IF NEW.swipe_type = 'like' THEN
        -- Check if the other person already liked this user
        IF EXISTS (
            SELECT 1 FROM swipes 
            WHERE swiper_id = NEW.swiped_id 
            AND swiped_id = NEW.swiper_id 
            AND swipe_type = 'like'
        ) THEN
            -- Create a match (determine who is job seeker vs company)
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
CREATE TRIGGER trigger_create_match_on_mutual_swipe
    AFTER INSERT ON swipes
    FOR EACH ROW
    EXECUTE FUNCTION create_match_on_mutual_swipe();

-- Add some test data verification queries (commented out)
-- SELECT * FROM swipes ORDER BY created_at DESC LIMIT 10;
-- SELECT * FROM matches ORDER BY matched_at DESC LIMIT 10;
-- SELECT COUNT(*) as total_swipes FROM swipes;
-- SELECT COUNT(*) as total_matches FROM matches;