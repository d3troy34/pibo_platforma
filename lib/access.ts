/**
 * Determines if a user can access a specific module.
 * - Admins can access everything.
 * - Module 1 (order_index === 0) is free for all authenticated users.
 * - Modules 2+ require a completed enrollment.
 */
export function canAccessModule(
  hasEnrollment: boolean,
  isAdmin: boolean,
  orderIndex: number
): boolean {
  if (isAdmin) return true
  if (orderIndex === 0) return true
  return hasEnrollment
}
