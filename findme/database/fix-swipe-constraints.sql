-- Fix swipes table to support multiple swipes per company for different vacancies
-- Run this in Supabase SQL Editor

-- 1. First, let's see the current constraint
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'swipes' AND constraint_type = 'UNIQUE';

-- 2. Add vacancy_id column if it doesn't exist
ALTER TABLE swipes ADD COLUMN IF NOT EXISTS vacancy_id UUID REFERENCES job_vacancies(id) ON DELETE CASCADE;

-- 3. Drop the old unique constraint that only includes (swiper_id, swiped_id)
-- This allows multiple swipes from same user to same company for different vacancies
DO $$ 
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'swipes_swiper_id_swiped_id_key' 
        AND table_name = 'swipes'
    ) THEN
        ALTER TABLE swipes DROP CONSTRAINT swipes_swiper_id_swiped_id_key;
        RAISE NOTICE 'Dropped old unique constraint swipes_swiper_id_swiped_id_key';
    END IF;
END $$;

-- 4. Create a new unique constraint that includes vacancy_id for vacancy swipes
-- This allows: multiple swipes to same company for different vacancies
-- But prevents: duplicate swipes on the same vacancy
CREATE UNIQUE INDEX IF NOT EXISTS swipes_unique_vacancy_swipe 
ON swipes (swiper_id, swiped_id, vacancy_id) 
WHERE vacancy_id IS NOT NULL;

-- 5. Keep a unique constraint for profile swipes (where vacancy_id is null)
CREATE UNIQUE INDEX IF NOT EXISTS swipes_unique_profile_swipe 
ON swipes (swiper_id, swiped_id) 
WHERE vacancy_id IS NULL;

-- 6. Create index for performance
CREATE INDEX IF NOT EXISTS idx_swipes_vacancy_id ON swipes(vacancy_id);

-- 7. Verify the new structure
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'swipes';

-- 8. Show all indexes on swipes table
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'swipes';