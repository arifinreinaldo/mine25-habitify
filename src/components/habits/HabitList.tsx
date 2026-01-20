import React from 'react';
import { HabitCard } from './HabitCard';
import type { Habit } from '../../types/habit';

interface HabitListProps {
    title: string;
    habits: Habit[];
    completedHabitIds: string[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (habit: Habit) => void;
}

export const HabitList: React.FC<HabitListProps> = ({
    title,
    habits,
    completedHabitIds,
    onToggle,
    onDelete,
    onEdit
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
                            onToggle={onToggle}
                            onDelete={onDelete}
                            onEdit={onEdit}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
