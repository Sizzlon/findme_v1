-- Chat/Messaging System for FindMe
-- Run this SQL in your Supabase SQL Editor

-- 1. Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = false;

-- 3. Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (for clean setup)
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON messages;

-- 5. Create RLS policies
-- Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages to other users
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Users can update messages they received (e.g., mark as read)
CREATE POLICY "Users can update their received messages"
    ON messages FOR UPDATE
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- 6. Create function to get conversation partners (matched users)
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
    SELECT DISTINCT
        CASE 
            WHEN m.sender_id = user_id THEN m.receiver_id
            ELSE m.sender_id
        END as partner_id,
        COALESCE(js.name, c.company_name, 'Unknown User')::VARCHAR as partner_name,
        (
            SELECT message 
            FROM messages 
            WHERE (sender_id = user_id AND receiver_id = partner_id) 
               OR (sender_id = partner_id AND receiver_id = user_id)
            ORDER BY created_at DESC 
            LIMIT 1
        ) as last_message_text,
        (
            SELECT created_at 
            FROM messages 
            WHERE (sender_id = user_id AND receiver_id = partner_id) 
               OR (sender_id = partner_id AND receiver_id = user_id)
            ORDER BY created_at DESC 
            LIMIT 1
        ) as last_message_time,
        (
            SELECT COUNT(*) 
            FROM messages 
            WHERE sender_id = partner_id 
              AND receiver_id = user_id 
              AND is_read = false
        ) as unread_count
    FROM messages m
    LEFT JOIN job_seekers js ON js.id = partner_id
    LEFT JOIN companies c ON c.id = partner_id
    WHERE m.sender_id = user_id OR m.receiver_id = user_id
    ORDER BY last_message_time DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_sender_id UUID,
    p_receiver_id UUID
)
RETURNS void AS $$
BEGIN
    UPDATE messages
    SET is_read = true
    WHERE sender_id = p_sender_id 
      AND receiver_id = p_receiver_id 
      AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 9. Verify setup
SELECT 'Messages table created successfully' as status;
SELECT COUNT(*) as message_count FROM messages;
