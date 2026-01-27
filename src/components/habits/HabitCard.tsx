import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import type { Habit, StreakData } from '../../types/habit';
import { cn } from '../../lib/utils';
import { Trash2, Edit, Minus, Plus, MessageSquare, Flame, ChevronDown, ChevronUp } from 'lucide-react';
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
    streak?: StreakData;
}

const HabitCardComponent: React.FC<HabitCardProps> = ({
    habit,
    isCompleted,
    currentValue,
    notes,
    onToggle,
    onUpdateProgress,
    onUpdateNotes,
    onDelete,
    onEdit,
    streak
}) => {
    const [localNotes, setLocalNotes] = useState(notes);
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isDescExpanded, setIsDescExpanded] = useState(false);
    const [isDescTruncated, setIsDescTruncated] = useState(false);
    const descRef = useRef<HTMLParagraphElement>(null);

    const isMeasurable = habit.habit_type === 'measurable';
    const target = habit.frequency_target || 1;
    const progress = isMeasurable ? (currentValue / target) * 100 : (isCompleted ? 100 : 0);
    const isGoalMet = isMeasurable ? currentValue >= target : isCompleted;

    const handleSaveNotes = () => {
        onUpdateNotes(habit.id, localNotes);
        setIsNotesOpen(false);
    };

    // Sync local notes with prop when it changes or popover opens
    useEffect(() => {
        setLocalNotes(notes);
    }, [notes]);

    // Sync notes when popover opens
    useEffect(() => {
        if (isNotesOpen) {
            setLocalNotes(notes);
        }
    }, [isNotesOpen, notes]);

    // Check if description is truncated
    useEffect(() => {
        if (descRef.current && !isDescExpanded) {
            setIsDescTruncated(descRef.current.scrollWidth > descRef.current.clientWidth);
        }
    }, [habit.description, isDescExpanded]);

    return (
        <Card className={cn(
            "flex flex-col p-3 sm:p-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden rounded-3xl border border-white/10 shadow-sm",
            isGoalMet
                ? "bg-primary/10 border-primary/20 shadow-lg shadow-primary/10"
                : "bg-surface/60 backdrop-blur-md hover:bg-surface/80",
            streak && streak.currentStreak > 0 && !isGoalMet && "border-warning/20 shadow-lg shadow-warning/5"
        )}>
            {/* Row 1: Icon + Title + Streak */}
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "flex-shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl text-xl sm:text-2xl shadow-sm transition-colors",
                        isGoalMet ? "bg-primary text-white" : "bg-surface/80 text-muted-foreground"
                    )}
                    style={!isGoalMet ? { backgroundColor: `${habit.color}20`, color: habit.color } : {}}
                >
                    {habit.icon || '📝'}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={cn(
                        "font-bold text-lg sm:text-xl transition-all truncate",
                        isGoalMet && "text-muted-foreground line-through"
                    )}>
                        {habit.name}
                    </h3>
                </div>
                {streak && streak.currentStreak > 0 && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Flame className="h-4 w-4 text-warning fill-warning" />
                        <span className="text-sm text-warning font-semibold">{streak.currentStreak}</span>
                    </div>
                )}
            </div>

            {/* Row 2: Description */}
            {habit.description && (
                <div className="mt-1 flex items-start gap-1">
                    <p
                        ref={descRef}
                        className={cn(
                            "text-sm text-muted-foreground flex-1",
                            !isDescExpanded && "truncate"
                        )}
                    >
                        {habit.description}
                    </p>
                    {(isDescTruncated || isDescExpanded) && (
                        <button
                            onClick={() => setIsDescExpanded(!isDescExpanded)}
                            className="flex-shrink-0 text-xs text-primary hover:text-primary/80 flex items-center gap-0.5"
                        >
                            {isDescExpanded ? (
                                <>less <ChevronUp className="h-3 w-3" /></>
                            ) : (
                                <>more <ChevronDown className="h-3 w-3" /></>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Row 3: Actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <p className="text-xs text-muted-foreground capitalize">
                    {habit.time_of_day.replace('_', ' ')}
                    {isMeasurable && habit.unit && (
                        <> • {currentValue}/{target} {habit.unit}</>
                    )}
                    {!isMeasurable && target > 1 && (
                        <> • {target}x/{habit.frequency_type === 'daily' ? 'day' : 'week'}</>
                    )}
                </p>
                <div className="flex items-center gap-1">
                    {isMeasurable ? (
                        <div className="flex items-center bg-surface/50 rounded-full p-0.5 border border-white/5">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onUpdateProgress(habit.id, currentValue - 1)}
                                disabled={currentValue <= 0}
                                className="h-8 w-8 rounded-full hover:bg-white/10"
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-bold text-sm">{currentValue}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onUpdateProgress(habit.id, currentValue + 1)}
                                disabled={currentValue >= target}
                                className="h-8 w-8 rounded-full hover:bg-white/10"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => onToggle(habit.id)}
                            className="h-7 w-7 rounded-full border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all duration-300"
                        />
                    )}

                    {(isCompleted || currentValue > 0) && (
                        <Popover open={isNotesOpen} onOpenChange={setIsNotesOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 rounded-full",
                                        notes ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-surface/50"
                                    )}
                                >
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 sm:w-80 rounded-2xl bg-surface/90 backdrop-blur-xl" align="end">
                                <div className="grid gap-3">
                                    <div className="space-y-1">
                                        <h4 className="font-medium text-sm">Check-in Notes</h4>
                                        <p className="text-xs text-muted-foreground">
                                            Add notes about your progress today
                                        </p>
                                    </div>
                                    {notes && (
                                        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                            <p className="text-xs text-muted-foreground mb-1">Current note:</p>
                                            <p className="text-sm italic">"{notes}"</p>
                                        </div>
                                    )}
                                    <Input
                                        placeholder={notes ? "Update your note..." : "How did it go?"}
                                        value={localNotes}
                                        onChange={(e) => setLocalNotes(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveNotes();
                                        }}
                                        className="bg-background/50 border-white/10 rounded-xl"
                                    />
                                    <div className="flex justify-end gap-2">
                                        {notes && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setLocalNotes('');
                                                    onUpdateNotes(habit.id, '');
                                                    setIsNotesOpen(false);
                                                }}
                                                className="rounded-xl text-destructive hover:text-destructive"
                                            >
                                                Delete
                                            </Button>
                                        )}
                                        <Button size="sm" onClick={handleSaveNotes} className="rounded-xl">
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}

                    <Button variant="ghost" size="icon" onClick={() => onEdit(habit)} className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface/50">
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(habit.id)} className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-surface/50">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Progress bar for measurable habits */}
            {isMeasurable && (
                <div className="mt-3 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
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

// Memoize to prevent re-renders when parent state changes but this card's props don't
export const HabitCard = React.memo(HabitCardComponent);
