-- Migration: Announcements System
-- Admin announcements with dashboard banner and email notifications

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- Create indexes for performance
CREATE INDEX idx_announcements_published_at ON announcements(published_at DESC);
CREATE INDEX idx_announcements_is_active ON announcements(is_active) WHERE is_active = true;
CREATE INDEX idx_announcements_created_by ON announcements(created_by);

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can view active published announcements
CREATE POLICY "Users can view active announcements"
  ON announcements
  FOR SELECT
  USING (
    is_active = true AND
    published_at IS NOT NULL AND
    published_at <= NOW()
  );

-- RLS Policy: Admins can view all announcements (including drafts)
CREATE POLICY "Admins can view all announcements"
  ON announcements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policy: Only admins can create announcements
CREATE POLICY "Only admins can create announcements"
  ON announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) AND
    auth.uid() = created_by
  );

-- RLS Policy: Only admins can update announcements
CREATE POLICY "Only admins can update announcements"
  ON announcements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policy: Only admins can delete announcements
CREATE POLICY "Only admins can delete announcements"
  ON announcements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to get latest active announcement
CREATE OR REPLACE FUNCTION get_latest_announcement()
RETURNS TABLE (
  id UUID,
  title VARCHAR(200),
  content TEXT,
  published_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.content,
    a.published_at
  FROM announcements a
  WHERE a.is_active = true
    AND a.published_at IS NOT NULL
    AND a.published_at <= NOW()
  ORDER BY a.published_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_latest_announcement() TO authenticated;

-- Function to publish announcement (sets published_at to now)
CREATE OR REPLACE FUNCTION publish_announcement(announcement_id UUID)
RETURNS announcements AS $$
DECLARE
  result announcements;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can publish announcements';
  END IF;

  -- Update published_at
  UPDATE announcements
  SET published_at = NOW()
  WHERE id = announcement_id
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION publish_announcement(UUID) TO authenticated;
