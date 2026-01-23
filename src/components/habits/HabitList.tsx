import React from 'react';
import { HabitCard } from './HabitCard';
import type { Habit, StreakData } from '../../types/habit';

interface HabitListProps {
    title: string;
    habits: Habit[];
    completedHabitIds: string[];
    progressValues: Record<string, number>;
    completionNotes: Record<string, string>;
    onToggle: (id: string) => void;
    onUpdateProgress: (id: string, value: number) => void;
    onUpdateNotes: (id: string, notes: string) => void;
    onDelete: (id: string) => void;
    onEdit: (habit: Habit) => void;
    streakData?: Record<string, StreakData>;
}

export const HabitList: React.FC<HabitListProps> = ({
    title,
    habits,
    completedHabitIds,
    progressValues,
    completionNotes,
    onToggle,
    onUpdateProgress,
    onUpdateNotes,
    onDelete,
    onEdit,
    streakData
}) => {
    if (habits.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-text to-muted bg-clip-text text-transparent opacity-80 pl-1">
                {title}
            </h2>
            <div className="space-y-3">
                {habits.map(habit => (
                    <div key={habit.id} className="group">
                        <HabitCard
                            habit={habit}
                            isCompleted={completedHabitIds.includes(habit.id)}
                            currentValue={progressValues[habit.id] || 0}
                            notes={completionNotes[habit.id] || ''}
                            onToggle={onToggle}
                            onUpdateProgress={onUpdateProgress}
                            onUpdateNotes={onUpdateNotes}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            streak={streakData?.[habit.id]}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
