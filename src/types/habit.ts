export type TimeOfDay = 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'custom' | 'anytime';
export type FrequencyType = 'daily' | 'weekly' | 'custom';
export type HabitType = 'boolean' | 'measurable';

export interface Habit {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    habit_type: HabitType;
    unit?: string; // e.g., "glasses", "minutes", "pages"
    time_of_day: TimeOfDay;
    frequency_type: FrequencyType;
    frequency_days: number[]; // 0-6
    frequency_target?: number;
    reminder_time?: string;
    is_archived: boolean;
    position: number;
    created_at: string;
}

export interface Completion {
    id: string;
    habit_id: string;
    user_id: string;
    completed_at: string; // YYYY-MM-DD
    value?: number; // For measurable habits (e.g., 3 glasses of water)
    notes?: string;
    created_at: string;
}

// Re-export StreakData for convenience
export type { StreakData } from '../lib/streaks';
