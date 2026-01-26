import { useMemo, useState, memo } from 'react';
import { motion } from 'framer-motion';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    addMonths,
    subMonths,
    isSameMonth,
    isToday,
    isFuture,
    startOfWeek,
    endOfWeek,
    getDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { cn } from '../../lib/utils';
import type { Habit, Completion } from '../../types/habit';

interface HabitCalendarProps {
    habits: Habit[];
    completions: Completion[];
}

interface DayData {
    date: Date;
    dateStr: string;
    completedCount: number;
    scheduledCount: number;
    completionRate: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isFuture: boolean;
}

function HabitCalendarComponent({ habits, completions }: HabitCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

    // Build completion map: { 'YYYY-MM-DD': Set<habitId> }
    const completionMap = useMemo(() => {
        const map: Record<string, Set<string>> = {};
        completions.forEach((c) => {
            if (!map[c.completed_at]) {
                map[c.completed_at] = new Set();
            }
            map[c.completed_at].add(c.habit_id);
        });
        return map;
    }, [completions]);

    // Get completion notes map: { 'YYYY-MM-DD': { habitId: notes } }
    const notesMap = useMemo(() => {
        const map: Record<string, Record<string, string>> = {};
        completions.forEach((c) => {
            if (c.notes) {
                if (!map[c.completed_at]) {
                    map[c.completed_at] = {};
                }
                map[c.completed_at][c.habit_id] = c.notes;
            }
        });
        return map;
    }, [completions]);

    // Calculate days with data
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

        const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

        return days.map((date): DayData => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayOfWeek = getDay(date);
            const isFutureDay = isFuture(date);

            // Get habits scheduled for this day
            const scheduledHabits = habits.filter((h) => {
                if (!h.frequency_days || h.frequency_days.length === 0) return true;
                return h.frequency_days.some((d) => Number(d) === dayOfWeek);
            });

            const scheduledCount = scheduledHabits.length;
            const completedHabits = completionMap[dateStr] || new Set();
            const completedCount = scheduledHabits.filter((h) =>
                completedHabits.has(h.id)
            ).length;

            const completionRate =
                scheduledCount > 0 ? completedCount / scheduledCount : 0;

            return {
                date,
                dateStr,
                completedCount,
                scheduledCount,
                completionRate,
                isCurrentMonth: isSameMonth(date, currentMonth),
                isToday: isToday(date),
                isFuture: isFutureDay,
            };
        });
    }, [currentMonth, habits, completionMap]);

    // Get habits for selected day
    const selectedDayHabits = useMemo(() => {
        if (!selectedDay) return [];

        const dayOfWeek = getDay(selectedDay.date);
        const completedHabits = completionMap[selectedDay.dateStr] || new Set();
        const dayNotes = notesMap[selectedDay.dateStr] || {};

        return habits
            .filter((h) => {
                if (!h.frequency_days || h.frequency_days.length === 0) return true;
                return h.frequency_days.some((d) => Number(d) === dayOfWeek);
            })
            .map((h) => ({
                ...h,
                completed: completedHabits.has(h.id),
                notes: dayNotes[h.id] || null,
            }));
    }, [selectedDay, habits, completionMap, notesMap]);

    const handlePrevMonth = () => {
        const oneYearAgo = subMonths(new Date(), 12);
        const newMonth = subMonths(currentMonth, 1);
        if (newMonth >= startOfMonth(oneYearAgo)) {
            setCurrentMonth(newMonth);
        }
    };

    const handleNextMonth = () => {
        const newMonth = addMonths(currentMonth, 1);
        if (!isFuture(startOfMonth(newMonth))) {
            setCurrentMonth(newMonth);
        }
    };

    const canGoPrev = useMemo(() => {
        const oneYearAgo = subMonths(new Date(), 12);
        return subMonths(currentMonth, 1) >= startOfMonth(oneYearAgo);
    }, [currentMonth]);

    const canGoNext = useMemo(() => {
        return !isFuture(startOfMonth(addMonths(currentMonth, 1)));
    }, [currentMonth]);

    const getIntensityClass = (rate: number, isFutureDay: boolean, scheduledCount: number) => {
        if (isFutureDay) return 'bg-muted/10';
        if (scheduledCount === 0) return 'bg-muted/10'; // No habits scheduled
        if (rate === 0) return 'bg-red-500/30 dark:bg-red-400/20';
        if (rate < 0.34) return 'bg-orange-500/40 dark:bg-orange-400/30';
        if (rate < 0.67) return 'bg-yellow-500/50 dark:bg-yellow-400/40';
        if (rate < 1) return 'bg-emerald-500/50 dark:bg-emerald-400/40';
        return 'bg-emerald-500 dark:bg-emerald-400 text-white ring-2 ring-emerald-300/50';
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl bg-surface/60 backdrop-blur-md border border-white/10 p-4 sm:p-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevMonth}
                    disabled={!canGoPrev}
                    className="rounded-full h-9 w-9"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div key={currentMonth.toISOString()} className="relative overflow-hidden">
                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-lg sm:text-xl font-semibold font-display"
                    >
                        {format(currentMonth, 'MMMM yyyy')}
                    </motion.h2>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextMonth}
                    disabled={!canGoNext}
                    className="rounded-full h-9 w-9"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            {/* Weekday labels */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {weekDays.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-1"
                    >
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day[0]}</span>
                    </div>
                ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarDays.map((day, index) => (
                    <motion.button
                        key={day.dateStr}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.01 }}
                        whileHover={!day.isFuture ? { scale: 1.1, zIndex: 10 } : {}}
                        whileTap={!day.isFuture ? { scale: 0.9 } : {}}
                        onClick={() => !day.isFuture && setSelectedDay(day)}
                        disabled={day.isFuture}
                        className={cn(
                            'relative min-h-14 sm:min-h-16 p-1.5 sm:p-2 rounded-xl transition-all flex flex-col items-center justify-start',
                            'hover:ring-2 ring-primary/30',
                            'focus:outline-none focus:ring-2 focus:ring-primary/50',
                            getIntensityClass(day.completionRate, day.isFuture, day.scheduledCount),
                            !day.isCurrentMonth && 'opacity-40',
                            day.isFuture && 'cursor-not-allowed opacity-30',
                            day.isToday && 'ring-2 ring-primary shadow-lg shadow-primary/20'
                        )}
                    >
                        <span
                            className={cn(
                                'text-sm sm:text-base font-semibold',
                                day.isToday && 'text-primary',
                                day.completionRate === 1 && day.scheduledCount > 0 && !day.isFuture && 'text-white'
                            )}
                        >
                            {format(day.date, 'd')}
                        </span>
                        {!day.isFuture && day.scheduledCount > 0 && (
                            <div className="mt-auto pb-0.5">
                                <span className={cn(
                                    'text-[10px] sm:text-xs font-medium',
                                    day.completionRate === 1 ? 'text-white/90' : 'text-muted-foreground'
                                )}>
                                    {day.completedCount}/{day.scheduledCount}
                                </span>
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-red-500/30 dark:bg-red-400/20" />
                        <span className="text-xs text-muted-foreground">0%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-orange-500/40 dark:bg-orange-400/30" />
                        <span className="text-xs text-muted-foreground">1-33%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-yellow-500/50 dark:bg-yellow-400/40" />
                        <span className="text-xs text-muted-foreground">34-66%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-emerald-500/50 dark:bg-emerald-400/40" />
                        <span className="text-xs text-muted-foreground">67-99%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-emerald-500 dark:bg-emerald-400 ring-2 ring-emerald-300/50" />
                        <span className="text-xs text-muted-foreground">100%</span>
                    </div>
                </div>
            </div>

            {/* Day Detail Dialog */}
            <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
                <DialogContent className="sm:max-w-[400px] rounded-3xl bg-surface/90 backdrop-blur-xl border-white/10">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDay && format(selectedDay.date, 'EEEE, MMMM d, yyyy')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                        {selectedDayHabits.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                                No habits scheduled for this day
                            </p>
                        ) : (
                            selectedDayHabits.map((habit) => (
                                <div
                                    key={habit.id}
                                    className={cn(
                                        'flex items-start gap-3 p-3 rounded-2xl',
                                        habit.completed
                                            ? 'bg-success/10 border border-success/20'
                                            : 'bg-muted/10 border border-muted/20'
                                    )}
                                >
                                    <span className="text-xl flex-shrink-0">{habit.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm truncate">
                                                {habit.name}
                                            </span>
                                            {habit.completed ? (
                                                <Check className="h-4 w-4 text-success flex-shrink-0" />
                                            ) : (
                                                <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            )}
                                        </div>
                                        {habit.notes && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {habit.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {selectedDay && (
                        <div className="pt-2 border-t border-white/10">
                            <div className="text-center">
                                <span className="text-2xl font-bold text-primary">
                                    {Math.round(selectedDay.completionRate * 100)}%
                                </span>
                                <span className="text-sm text-muted-foreground ml-2">
                                    ({selectedDay.completedCount}/{selectedDay.scheduledCount} completed)
                                </span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}

export const HabitCalendar = memo(HabitCalendarComponent);
