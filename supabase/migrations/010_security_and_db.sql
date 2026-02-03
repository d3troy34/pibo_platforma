-- Migration: Security and Database Improvements
-- Description: Add unique constraints for idempotency and performance indexes

-- 1. Unique constraint on enrollments.payment_id (webhook idempotency)
-- Only for non-null values to allow multiple NULL payment_ids
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_payment_id_unique
ON public.enrollments(payment_id) WHERE payment_id IS NOT NULL;

-- 2. Unique constraint on enrollments.user_id (one enrollment per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_user_unique
ON public.enrollments(user_id);

-- 3. Partial unique index on invitations.email for pending invitations
-- Prevents duplicate pending invitations for the same email
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_email_pending
ON public.invitations(email) WHERE accepted_at IS NULL;

-- 4. Composite index for direct_messages queries (performance)
-- Optimizes queries that filter by student_id and order by created_at
CREATE INDEX IF NOT EXISTS idx_direct_messages_student_created
ON public.direct_messages(student_id, created_at DESC);
