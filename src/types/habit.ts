export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'anytime';
export type FrequencyType = 'daily' | 'weekly' | 'custom';

export interface Habit {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
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
    notes?: string;
    created_at: string;
}
