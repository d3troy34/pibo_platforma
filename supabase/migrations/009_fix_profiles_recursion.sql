-- Migration: Fix infinite recursion in RLS policies
-- Problem: Migration 008 created a profiles policy that queries direct_messages,
-- but direct_messages policies query profiles to check admin status.
-- This circular dependency causes "infinite recursion detected in policy" error.

-- Drop the problematic policy from migration 008
DROP POLICY IF EXISTS "Users can view profiles in their conversations" ON public.profiles;

-- Simple fix: Allow all authenticated users to view all profiles
-- This is appropriate because:
-- 1. Profile info (name, avatar) is typically not sensitive
-- 2. Chat apps need to display sender info for any message
-- 3. Avoids circular RLS dependencies
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
