-- Fix missing vacancy_id column in swipes table
-- Run this if you're getting swipe errors about missing vacancy_id column

-- Add vacancy_id column to swipes table if it doesn't exist
ALTER TABLE swipes ADD COLUMN IF NOT EXISTS vacancy_id UUID REFERENCES job_vacancies(id) ON DELETE CASCADE;

-- Add vacancy_id column to matches table if it doesn't exist
ALTER TABLE matches ADD COLUMN IF NOT EXISTS vacancy_id UUID REFERENCES job_vacancies(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_swipes_vacancy_id ON swipes(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_matches_vacancy_id ON matches(vacancy_id);

-- Verify the columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'swipes' 
AND column_name IN ('vacancy_id', 'swiped_id');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'matches' 
AND column_name IN ('vacancy_id', 'job_seeker_id', 'company_id');