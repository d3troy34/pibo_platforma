-- Migration: Module Access Control + Course Outline RPC
-- Goal:
-- - Unauthenticated users must NOT be able to read Module 1 content.
-- - Authenticated users can access Module 1 (order_index = 0).
-- - Modules 2+ are accessible only for enrolled users (or admins).
-- - The UI can still show the full outline to authenticated users without leaking protected content.

-- =====================================================
-- Modules RLS
-- =====================================================
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Remove overly-permissive policies (created in earlier schema).
DROP POLICY IF EXISTS "Anyone can view published modules" ON public.modules;
DROP POLICY IF EXISTS "Authenticated users can view published modules" ON public.modules;
DROP POLICY IF EXISTS "Enrolled users can view published modules" ON public.modules;

-- Module 1 (order_index = 0) is free for all authenticated users.
CREATE POLICY "Authenticated users can view free module"
  ON public.modules FOR SELECT
  TO authenticated
  USING (is_published = true AND order_index = 0);

-- Paid access for modules 2+ (enrollments.payment_status = 'completed').
CREATE POLICY "Enrolled users can view all published modules"
  ON public.modules FOR SELECT
  TO authenticated
  USING (is_published = true AND (public.is_enrolled() OR public.is_admin()));

-- =====================================================
-- Course Outline RPC (safe metadata + lock state)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_course_modules_outline()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  thumbnail_url text,
  order_index integer,
  is_published boolean,
  can_access boolean,
  is_locked boolean,
  has_video boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.title,
    m.description,
    m.thumbnail_url,
    m.order_index,
    m.is_published,
    (m.order_index = 0 OR public.is_enrolled() OR public.is_admin()) AS can_access,
    NOT (m.order_index = 0 OR public.is_enrolled() OR public.is_admin()) AS is_locked,
    (m.bunny_video_guid IS NOT NULL) AS has_video
  FROM public.modules m
  WHERE m.is_published = true
  ORDER BY m.order_index ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.get_course_modules_outline() SET search_path = public;

REVOKE ALL ON FUNCTION public.get_course_modules_outline() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_course_modules_outline() TO authenticated;

