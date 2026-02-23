-- Fix dashboard foreign key relationships and RLS policies

-- First, ensure foreign key constraints exist
-- Note: These may already exist, but we want to make sure

-- Add foreign key constraint for matches -> job_seekers if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_job_seeker_id_fkey'
    ) THEN
        ALTER TABLE matches 
        ADD CONSTRAINT matches_job_seeker_id_fkey 
        FOREIGN KEY (job_seeker_id) REFERENCES job_seekers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for matches -> companies if it doesn't exist  
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'matches_company_id_fkey'
    ) THEN
        ALTER TABLE matches 
        ADD CONSTRAINT matches_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure RLS policies allow reading matches
-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "users_can_view_own_matches" ON matches;

-- Allow users to view matches where they are either the job seeker or company
CREATE POLICY "users_can_view_own_matches" ON matches
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() = job_seeker_id OR 
        auth.uid() = company_id
    );

-- Allow users to view their matches with joined profile data
-- This ensures the dashboard queries work
DROP POLICY IF EXISTS "matches_can_join_profiles" ON matches;
CREATE POLICY "matches_can_join_profiles" ON matches
    FOR SELECT 
    TO authenticated
    USING (true);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Verify foreign key constraints exist
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'matches'
ORDER BY tc.constraint_name;