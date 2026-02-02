-- Migration: Direct Messages System for 1-on-1 Chat
-- Replace forum with private student-admin messaging

-- Drop old forum tables
DROP TABLE IF EXISTS forum_replies CASCADE;
DROP TABLE IF EXISTS forum_posts CASCADE;

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Trigger to ensure sender is either the student or an admin
CREATE OR REPLACE FUNCTION check_message_participant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_id = NEW.student_id THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.sender_id AND role = 'admin') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Sender must be the student or an admin';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_message_participant
  BEFORE INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION check_message_participant();

-- Create indexes for performance
CREATE INDEX idx_direct_messages_student_id ON direct_messages(student_id);
CREATE INDEX idx_direct_messages_created_at ON direct_messages(created_at DESC);
CREATE INDEX idx_direct_messages_sender_id ON direct_messages(sender_id);
CREATE INDEX idx_direct_messages_read_at ON direct_messages(read_at) WHERE read_at IS NULL;

-- Enable Row Level Security
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can view messages in their own conversation
CREATE POLICY "Students can view their own messages"
  ON direct_messages
  FOR SELECT
  USING (
    auth.uid() = student_id OR
    auth.uid() = sender_id
  );

-- RLS Policy: Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON direct_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policy: Students can insert messages in their own conversation
CREATE POLICY "Students can send messages in their conversation"
  ON direct_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    (auth.uid() = student_id OR
     EXISTS (
       SELECT 1 FROM profiles
       WHERE id = auth.uid() AND role = 'admin'
     ))
  );

-- RLS Policy: Admins can insert messages in any conversation
CREATE POLICY "Admins can send messages to any student"
  ON direct_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) AND
    auth.uid() = sender_id
  );

-- RLS Policy: Users can update read_at on their received messages
CREATE POLICY "Users can mark their messages as read"
  ON direct_messages
  FOR UPDATE
  USING (
    auth.uid() != sender_id AND
    (auth.uid() = student_id OR
     EXISTS (
       SELECT 1 FROM profiles
       WHERE id = auth.uid() AND role = 'admin'
     ))
  )
  WITH CHECK (
    auth.uid() != sender_id AND
    (auth.uid() = student_id OR
     EXISTS (
       SELECT 1 FROM profiles
       WHERE id = auth.uid() AND role = 'admin'
     ))
  );

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM direct_messages
    WHERE (student_id = user_id OR
           (SELECT role FROM profiles WHERE id = user_id) = 'admin')
      AND sender_id != user_id
      AND read_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_unread_message_count(UUID) TO authenticated;
