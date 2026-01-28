/**
 * Helper functions for updating user stats in Firestore
 */

/**
 * Calculate streak based on last activity date
 * - If last activity was today, keep current streak
 * - If last activity was yesterday, increment streak
 * - If last activity was more than 1 day ago, reset streak to 1
 */
export function calculateStreak(
  lastActivityDate: string | undefined,
  currentStreak: number = 0
): number {
  if (!lastActivityDate) {
    return 1; // First activity
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivity = new Date(lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff === 0) {
    // Same day - keep current streak
    return currentStreak;
  } else if (daysDiff === 1) {
    // Yesterday - increment streak
    return currentStreak + 1;
  } else {
    // More than 1 day - reset to 1
    return 1;
  }
}

/**
 * Parse duration string (e.g., "15 min", "20 min") and return minutes
 */
export function parseDuration(duration: string): number {
  if (!duration) return 0;

  // Extract number from string
  const match = duration.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  return 0;
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayISOString(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split("T")[0];
}
