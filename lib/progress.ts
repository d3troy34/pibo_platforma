export function getModuleProgressPercent(
  progressSeconds: number | null | undefined,
  durationSeconds: number | null | undefined,
  completed: boolean
): number {
  if (completed) {
    return 100
  }

  if (
    typeof progressSeconds !== "number" ||
    typeof durationSeconds !== "number" ||
    !Number.isFinite(progressSeconds) ||
    !Number.isFinite(durationSeconds) ||
    progressSeconds <= 0 ||
    durationSeconds <= 0
  ) {
    return 0
  }

  const percentage = (progressSeconds / durationSeconds) * 100
  return Math.round(Math.min(100, Math.max(0, percentage)))
}
