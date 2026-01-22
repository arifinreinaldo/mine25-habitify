import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import type { Habit } from '../../types/habit';
import { cn } from '../../lib/utils';
import { Trash2, Edit, Minus, Plus, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface HabitCardProps {
    habit: Habit;
    isCompleted: boolean;
    currentValue: number;
    notes: string;
    onToggle: (habitId: string) => void;
    onUpdateProgress: (habitId: string, value: number) => void;
    onUpdateNotes: (habitId: string, notes: string) => void;
    onDelete: (habitId: string) => void;
    onEdit: (habit: Habit) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
    habit,
    isCompleted,
    currentValue,
    notes,
    onToggle,
    onUpdateProgress,
    onUpdateNotes,
    onDelete,
    onEdit
}) => {
    const [localNotes, setLocalNotes] = useState(notes);
    const [isNotesOpen, setIsNotesOpen] = useState(false);

    const isMeasurable = habit.habit_type === 'measurable';
    const target = habit.frequency_target || 1;
    const progress = isMeasurable ? (currentValue / target) * 100 : (isCompleted ? 100 : 0);
    const isGoalMet = isMeasurable ? currentValue >= target : isCompleted;

    const handleSaveNotes = () => {
        onUpdateNotes(habit.id, localNotes);
        setIsNotesOpen(false);
    };

    // Sync local notes with prop when it changes
    React.useEffect(() => {
        setLocalNotes(notes);
    }, [notes]);

    return (
        <Card className={cn(
            "flex flex-col p-4 transition-all duration-300 hover:scale-[1.02]",
            isGoalMet ? "bg-primary/10 border-primary/20" : "bg-surface/40 hover:bg-surface/60"
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-sm transition-colors",
                            isGoalMet ? "bg-primary text-white" : "bg-surface text-muted-foreground"
                        )}
                        style={!isGoalMet ? { backgroundColor: `${habit.color}20`, color: habit.color } : {}}
                    >
                        {habit.icon || '📝'}
                    </div>

                    <div>
                        <h3 className={cn(
                            "font-semibold text-lg transition-all",
                            isGoalMet && "text-muted-foreground line-through"
                        )}>
                            {habit.name}
                        </h3>
                        {habit.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                                {habit.description}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground capitalize">
                            {habit.time_of_day.replace('_', ' ')}
                            {isMeasurable && habit.unit && (
                                <> • {currentValue}/{target} {habit.unit}</>
                            )}
                            {!isMeasurable && target > 1 && (
                                <> • {target}x/{habit.frequency_type === 'daily' ? 'day' : 'week'}</>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isMeasurable ? (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onUpdateProgress(habit.id, currentValue - 1)}
                                disabled={currentValue <= 0}
                                className="h-8 w-8"
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold">{currentValue}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onUpdateProgress(habit.id, currentValue + 1)}
                                disabled={currentValue >= target}
                                className="h-8 w-8"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => onToggle(habit.id)}
                            className="h-6 w-6 border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                    )}

                    {/* Notes button - only show when completed */}
                    {(isCompleted || currentValue > 0) && (
                        <Popover open={isNotesOpen} onOpenChange={setIsNotesOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8",
                                        notes ? "text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <div className="grid gap-3">
                                    <div className="space-y-1">
                                        <h4 className="font-medium text-sm">Check-in Notes</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Add notes about your progress today
                                        </p>
                                    </div>
                                    <Input
                                        placeholder="How did it go?"
                                        value={localNotes}
                                        onChange={(e) => setLocalNotes(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveNotes();
                                        }}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setLocalNotes('');
                                                onUpdateNotes(habit.id, '');
                                                setIsNotesOpen(false);
                                            }}
                                        >
                                            Clear
                                        </Button>
                                        <Button size="sm" onClick={handleSaveNotes}>
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}

                    <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(habit)} className="h-8 w-8 text-muted-foreground hover:text-white">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(habit.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Progress bar for measurable habits */}
            {isMeasurable && (
                <div className="mt-3 h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            )}

            {/* Show notes if present */}
            {notes && (
                <div className="mt-2 text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                    "{notes}"
                </div>
            )}
        </Card>
    );
};
