-- Create the missing match and test the trigger function

-- 1. Manually create the match that should have been created automatically
INSERT INTO matches (job_seeker_id, company_id, matched_at, is_active)
VALUES (
    'f6ecf723-66b0-4c74-ad20-f3a6ab535235',  -- job_seeker_id
    '8a955aba-c465-4697-b01c-c27e1982ed5d',  -- company_id  
    NOW(),
    true
)
ON CONFLICT (job_seeker_id, company_id) DO NOTHING;

-- 2. Check that the match was created
SELECT 
    m.id,
    m.job_seeker_id,
    m.company_id,
    m.matched_at,
    m.is_active,
    js.name as job_seeker_name,
    c.company_name
FROM matches m
LEFT JOIN job_seekers js ON m.job_seeker_id = js.id
LEFT JOIN companies c ON m.company_id = c.id
ORDER BY m.matched_at DESC;

-- 3. Test the trigger function by creating a new test swipe
-- This will help us verify if the trigger is now working
-- (You can run this after fixing the trigger function)

-- Optional: Create test data for testing the trigger
-- Uncomment these lines if you want to test with new users:

/*
-- Insert test job seeker
INSERT INTO job_seekers (id, name, bio, skills, address, experience, education, personality)
VALUES (
    'test-js-' || generate_random_uuid(),
    'Test Job Seeker',
    'Testing the matching system',
    ARRAY['Testing', 'Debugging'],
    'Test City',
    'Entry Level',
    'Test University',
    'Detail-oriented'
);

-- Insert test company  
INSERT INTO companies (id, company_name, description, industry, location, company_size, culture, benefits)
VALUES (
    'test-co-' || generate_random_uuid(),
    'Test Company',
    'A company for testing',
    'Technology',
    'Test City', 
    '10-50',
    'Testing-focused',
    ARRAY['Remote work', 'Testing tools']
);
*/

SELECT 'Match created successfully! Check your dashboard.' as status;