-- Check and fix the matching trigger function

-- 1. First, let's see the current trigger function
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'create_match_on_mutual_swipe';

-- 2. Drop and recreate the trigger function with better logic
DROP FUNCTION IF EXISTS create_match_on_mutual_swipe() CASCADE;

CREATE OR REPLACE FUNCTION create_match_on_mutual_swipe()
RETURNS TRIGGER AS $$
DECLARE
    job_seeker_id_val UUID;
    company_id_val UUID;
BEGIN
    -- Only proceed if this is a 'like' swipe
    IF NEW.swipe_type = 'like' THEN
        
        -- Check if there's a mutual like (the other person already liked this person)
        IF EXISTS (
            SELECT 1 FROM swipes 
            WHERE swiper_id = NEW.swiped_id 
            AND swiped_id = NEW.swiper_id 
            AND swipe_type = 'like'
        ) THEN
            
            -- Determine which is the job seeker and which is the company
            -- Check if NEW.swiper_id is a job seeker
            IF EXISTS (SELECT 1 FROM job_seekers WHERE id = NEW.swiper_id) THEN
                job_seeker_id_val := NEW.swiper_id;
                company_id_val := NEW.swiped_id;
            ELSE
                job_seeker_id_val := NEW.swiped_id;
                company_id_val := NEW.swiper_id;
            END IF;
            
            -- Verify that we have one job seeker and one company
            IF EXISTS (SELECT 1 FROM job_seekers WHERE id = job_seeker_id_val) 
               AND EXISTS (SELECT 1 FROM companies WHERE id = company_id_val) THEN
                
                -- Create the match (with conflict handling)
                INSERT INTO matches (job_seeker_id, company_id, matched_at, is_active)
                VALUES (job_seeker_id_val, company_id_val, NOW(), true)
                ON CONFLICT (job_seeker_id, company_id) DO NOTHING;
                
                -- Log the match creation for debugging
                RAISE NOTICE 'Match created: job_seeker_id=%, company_id=%', job_seeker_id_val, company_id_val;
                
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recreate the trigger
DROP TRIGGER IF EXISTS trigger_create_match_on_mutual_swipe ON swipes;
CREATE TRIGGER trigger_create_match_on_mutual_swipe
    AFTER INSERT ON swipes
    FOR EACH ROW
    EXECUTE FUNCTION create_match_on_mutual_swipe();

-- 4. Test the function manually with some sample data
-- (This will help us see if the function works)
SELECT 'Trigger function recreated successfully' as status;