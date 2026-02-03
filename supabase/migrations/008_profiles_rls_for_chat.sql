-- Migration: Allow users to view profiles involved in their conversations
-- This fixes the issue where students can't see admin profile info in chat

-- Policy: Users can view profiles of people they have conversations with
CREATE POLICY "Users can view profiles in their conversations"
  ON public.profiles FOR SELECT
  USING (
    -- User can view their own profile
    auth.uid() = id
    OR
    -- User can view profiles of people in their direct message conversations
    id IN (
      SELECT DISTINCT sender_id FROM direct_messages WHERE student_id = auth.uid()
      UNION
      SELECT DISTINCT student_id FROM direct_messages WHERE sender_id = auth.uid()
    )
  );
