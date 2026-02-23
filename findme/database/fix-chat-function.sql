-- Fix the get_conversation_partners function
-- Run this in Supabase SQL Editor to fix the chat list display

-- Drop and recreate the function with proper logic
CREATE OR REPLACE FUNCTION get_conversation_partners(user_id UUID)
RETURNS TABLE (
    partner_id UUID,
    partner_name VARCHAR,
    last_message_text TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH conversation_partners AS (
        -- Get all unique conversation partners
        SELECT DISTINCT
            CASE 
                WHEN m.sender_id = user_id THEN m.receiver_id
                ELSE m.sender_id
            END as partner_id
        FROM messages m
        WHERE m.sender_id = user_id OR m.receiver_id = user_id
    ),
    partner_info AS (
        -- Get partner names from both job_seekers and companies tables
        SELECT 
            cp.partner_id,
            COALESCE(js.name, c.company_name, 'Unknown User')::VARCHAR as partner_name
        FROM conversation_partners cp
        LEFT JOIN job_seekers js ON js.id = cp.partner_id
        LEFT JOIN companies c ON c.id = cp.partner_id
    ),
    last_messages AS (
        -- Get the last message for each conversation
        SELECT DISTINCT ON (
            CASE 
                WHEN m.sender_id = user_id THEN m.receiver_id
                ELSE m.sender_id
            END
        )
            CASE 
                WHEN m.sender_id = user_id THEN m.receiver_id
                ELSE m.sender_id
            END as partner_id,
            m.message as last_message_text,
            m.created_at as last_message_time
        FROM messages m
        WHERE m.sender_id = user_id OR m.receiver_id = user_id
        ORDER BY 
            CASE 
                WHEN m.sender_id = user_id THEN m.receiver_id
                ELSE m.sender_id
            END,
            m.created_at DESC
    ),
    unread_counts AS (
        -- Count unread messages from each partner
        SELECT 
            m.sender_id as partner_id,
            COUNT(*) as unread_count
        FROM messages m
        WHERE m.receiver_id = user_id 
          AND m.is_read = false
        GROUP BY m.sender_id
    )
    SELECT 
        pi.partner_id,
        pi.partner_name,
        lm.last_message_text,
        lm.last_message_time,
        COALESCE(uc.unread_count, 0) as unread_count
    FROM partner_info pi
    LEFT JOIN last_messages lm ON lm.partner_id = pi.partner_id
    LEFT JOIN unread_counts uc ON uc.partner_id = pi.partner_id
    ORDER BY lm.last_message_time DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
-- SELECT * FROM get_conversation_partners(auth.uid());
