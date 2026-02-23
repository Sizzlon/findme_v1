-- Run this in Supabase SQL Editor to check swipes table structure and data
-- This will help debug why swipes aren't being recorded

-- 1. Check if swipes table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'swipes'
ORDER BY ordinal_position;

-- 2. Check current swipes count
SELECT COUNT(*) as total_swipes FROM swipes;

-- 3. Check if vacancy_id column exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'swipes' 
    AND column_name = 'vacancy_id'
) as vacancy_id_exists;

-- 4. Sample recent swipes (if any)
SELECT 
    id,
    swiper_id,
    swiped_id,
    vacancy_id,
    swipe_type,
    created_at
FROM swipes 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check constraints on swipes table
SELECT 
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'swipes';