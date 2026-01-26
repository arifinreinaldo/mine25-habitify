import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <h2 className="text-xl font-bold font-display bg-gradient-to-r from-text to-muted bg-clip-text text-transparent opacity-80 pl-1">
                {title}
            </h2>
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {habits.map(habit => (
                        <motion.div
                            key={habit.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="group"
                        >
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
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
