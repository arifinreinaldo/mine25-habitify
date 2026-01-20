import React from 'react';
import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import type { Habit } from '../../types/habit';
import { cn } from '../../lib/utils';
import { Trash2, Edit } from 'lucide-react';
import { Button } from '../ui/button';

interface HabitCardProps {
    habit: Habit;
    isCompleted: boolean;
    onToggle: (habitId: string) => void;
    onDelete: (habitId: string) => void;
    onEdit: (habit: Habit) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, isCompleted, onToggle, onDelete, onEdit }) => {
    return (
        <Card className={cn(
            "flex items-center justify-between p-4 transition-all duration-300 hover:scale-[1.02]",
            isCompleted ? "bg-primary/10 border-primary/20" : "bg-surface/40 hover:bg-surface/60"
        )}>
            <div className="flex items-center gap-4">
                <div
                    className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm transition-colors",
                        isCompleted ? "bg-primary text-white" : "bg-surface text-muted-foreground"
                    )}
                    style={!isCompleted ? { backgroundColor: `${habit.color}20`, color: habit.color } : {}}
                >
                    {habit.icon || '📝'}
                </div>

                <div>
                    <h3 className={cn(
                        "font-semibold text-lg transition-all",
                        isCompleted && "text-muted-foreground line-through"
                    )}>
                        {habit.name}
                    </h3>
                    <p className="text-xs text-muted-foreground capitalize">
                        {habit.time_of_day} • {habit.frequency_type}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => onToggle(habit.id)}
                    className="h-6 w-6 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />

                {/* Simple actions menu could go here, for now just inline buttons if needed or hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(habit)} className="h-8 w-8 text-muted-foreground hover:text-white">
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(habit.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );
};
