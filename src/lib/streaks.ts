export interface StreakData {
    currentStreak: number;
    bestStreak: number;
}

/**
 * Calculate streak data for a habit based on its completion history.
 *
 * @param completionDates - Array of YYYY-MM-DD date strings when habit was completed
 * @param habitFrequencyDays - Array of day indices (0-6, Sun-Sat) when habit is scheduled
 * @param today - Today's date in YYYY-MM-DD format
 * @returns StreakData with current and best streak counts
 */
export function calculateStreak(
    completionDates: string[],
    habitFrequencyDays: number[],
    today: string
): StreakData {
    if (completionDates.length === 0) {
        return { currentStreak: 0, bestStreak: 0 };
    }

    // Convert frequency_days to numbers (handle string[] from Supabase)
    const scheduledDays = new Set(habitFrequencyDays.map(d => Number(d)));

    // If no scheduled days specified, treat as daily
    const isDaily = scheduledDays.size === 0 || scheduledDays.size === 7;

    // Create a Set of completion dates for O(1) lookup
    const completionSet = new Set(completionDates);

    // Parse today's date
    const todayDate = parseDate(today);

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let checkingCurrent = true;

    // Walk backwards from today up to 365 days
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(todayDate);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = formatDate(checkDate);
        const dayOfWeek = checkDate.getDay();

        // Skip if this day is not scheduled for the habit
        if (!isDaily && !scheduledDays.has(dayOfWeek)) {
            continue;
        }

        const wasCompleted = completionSet.has(dateStr);

        if (wasCompleted) {
            tempStreak++;
        } else {
            // If we're still checking current streak, this breaks it
            if (checkingCurrent) {
                // Special case: if today is not completed yet, but yesterday was,
                // we might still have a current streak
                if (i === 0) {
                    // Today not completed, keep checking
                    continue;
                }
                currentStreak = tempStreak;
                checkingCurrent = false;
            }
            // Update best streak if needed
            bestStreak = Math.max(bestStreak, tempStreak);
            tempStreak = 0;
        }
    }

    // Final updates after the loop
    if (checkingCurrent) {
        currentStreak = tempStreak;
    }
    bestStreak = Math.max(bestStreak, tempStreak);

    return { currentStreak, bestStreak };
}

/**
 * Parse a YYYY-MM-DD string into a Date object (local timezone)
 */
function parseDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Format a Date object as YYYY-MM-DD string
 */
function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
