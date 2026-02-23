-- Check current swipes and matches to debug the matching system

-- 1. Check all swipes that have been made
SELECT 
    s.id,
    s.swiper_id,
    s.swiped_id,
    s.swipe_type,
    s.created_at,
    -- Try to identify swiper type
    CASE 
        WHEN EXISTS (SELECT 1 FROM job_seekers WHERE id = s.swiper_id) THEN 'job_seeker'
        WHEN EXISTS (SELECT 1 FROM companies WHERE id = s.swiper_id) THEN 'company'
        ELSE 'unknown'
    END as swiper_type,
    -- Try to identify swiped type  
    CASE 
        WHEN EXISTS (SELECT 1 FROM job_seekers WHERE id = s.swiped_id) THEN 'job_seeker'
        WHEN EXISTS (SELECT 1 FROM companies WHERE id = s.swiped_id) THEN 'company'
        ELSE 'unknown'
    END as swiped_type
FROM swipes s
ORDER BY s.created_at DESC;

-- 2. Check all matches
SELECT 
    m.id,
    m.job_seeker_id,
    m.company_id,
    m.matched_at,
    m.is_active
FROM matches m
ORDER BY m.matched_at DESC;

-- 3. Check for potential matches (mutual likes)
WITH mutual_likes AS (
    SELECT 
        s1.swiper_id as user1,
        s1.swiped_id as user2,
        s1.swipe_type as user1_swipe,
        s2.swipe_type as user2_swipe
    FROM swipes s1
    JOIN swipes s2 ON s1.swiper_id = s2.swiped_id 
                  AND s1.swiped_id = s2.swiper_id
    WHERE s1.swipe_type = 'like' 
      AND s2.swipe_type = 'like'
)
SELECT 
    ml.*,
    -- Identify the job seeker and company
    CASE 
        WHEN EXISTS (SELECT 1 FROM job_seekers WHERE id = ml.user1) THEN ml.user1
        WHEN EXISTS (SELECT 1 FROM job_seekers WHERE id = ml.user2) THEN ml.user2
        ELSE NULL
    END as job_seeker_id,
    CASE 
        WHEN EXISTS (SELECT 1 FROM companies WHERE id = ml.user1) THEN ml.user1  
        WHEN EXISTS (SELECT 1 FROM companies WHERE id = ml.user2) THEN ml.user2
        ELSE NULL
    END as company_id
FROM mutual_likes ml;

-- 4. Check if the trigger function is working properly
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'create_match_on_mutual_swipe';

-- 5. Check if the trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_create_match_on_mutual_swipe';