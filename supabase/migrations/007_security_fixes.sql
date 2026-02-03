-- Migration: Security fixes for Function Search Path Mutable warnings
-- Sets search_path on all functions to prevent SQL injection via search path manipulation

-- Fix check_message_participant function
ALTER FUNCTION public.check_message_participant() SET search_path = public;

-- Fix get_unread_message_count function
ALTER FUNCTION public.get_unread_message_count(UUID) SET search_path = public;

-- Fix get_latest_announcement function (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_latest_announcement') THEN
    EXECUTE 'ALTER FUNCTION public.get_latest_announcement() SET search_path = public';
  END IF;
END $$;

-- Fix publish_announcement function (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'publish_announcement') THEN
    EXECUTE 'ALTER FUNCTION public.publish_announcement(UUID) SET search_path = public';
  END IF;
END $$;

-- Fix update_module_progress_update function (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_module_progress_update') THEN
    EXECUTE 'ALTER FUNCTION public.update_module_progress_update() SET search_path = public';
  END IF;
END $$;

-- Fix handle_new_user function
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Fix update_updated_at_column function
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Fix is_admin function
ALTER FUNCTION public.is_admin() SET search_path = public;

-- Fix is_enrolled function
ALTER FUNCTION public.is_enrolled() SET search_path = public;
