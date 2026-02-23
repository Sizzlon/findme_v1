-- Test RLS policies on swipes table
-- Run this in Supabase SQL Editor to check if RLS is blocking swipe inserts

-- 1. Check if RLS is enabled on swipes table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'swipes';

-- 2. List RLS policies on swipes table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'swipes';

-- 3. Test basic insert (this should work if you're authenticated)
-- Replace 'your-user-id' with your actual user ID from auth.users
INSERT INTO swipes (swiper_id, swiped_id, swipe_type) 
VALUES (
    auth.uid(), -- This gets your current user ID
    auth.uid(), -- Using same ID as test (this would be the target user/company)
    'like'
);

-- 4. Check if the test insert worked
SELECT * FROM swipes WHERE swiper_id = auth.uid() ORDER BY created_at DESC LIMIT 1;