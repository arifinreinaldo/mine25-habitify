import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/AuthContext';
import { HabitDialog } from '../components/habits/HabitDialog';
import { HabitList } from '../components/habits/HabitList';
import { InstallPrompt } from '../components/InstallPrompt';
import { NotificationPreferences } from '../components/NotificationPreferences';
import { NtfySettings } from '../components/NtfySettings';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import type { Habit, StreakData } from '../types/habit';
import { calculateStreak } from '../lib/streaks';
import { format, subDays } from 'date-fns';
import { Loader2, LogOut, Plus, Settings, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completedIds, setCompletedIds] = useState<string[]>([]);
    const [progressValues, setProgressValues] = useState<Record<string, number>>({}); // habitId -> current value
    const [completionNotes, setCompletionNotes] = useState<Record<string, string>>({}); // habitId -> notes
    const [streakData, setStreakData] = useState<Record<string, StreakData>>({}); // habitId -> streak info
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

    const today = format(new Date(), 'yyyy-MM-dd');
    const todayDayOfWeek = new Date().getDay(); // 0 = Sunday, 6 = Saturday

    // Filter habits to only show those scheduled for today
    // Handle both number[] and string[] from Supabase
    const todaysHabits = habits.filter(h => {
        if (!h.frequency_days || h.frequency_days.length === 0) return true;
        return h.frequency_days.some(d => Number(d) === todayDayOfWeek);
    });

    // Habits not scheduled for today (upcoming)
    const upcomingHabits = habits.filter(h => {
        if (!h.frequency_days || h.frequency_days.length === 0) return false;
        return !h.frequency_days.some(d => Number(d) === todayDayOfWeek);
    });

    const [showUpcoming, setShowUpcoming] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
            // Update page title with username
            const username = user.email?.split('@')[0] || 'User';
            document.title = `${username}'s Habits | Habitify`;
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Habits
            const { data: habitsData, error: habitsError } = await supabase
                .from('habits')
                .select('*')
                .eq('user_id', user!.id)
                .eq('is_archived', false)
                .order('created_at', { ascending: true });

            if (habitsError) throw habitsError;
            setHabits(habitsData || []);

            // Fetch Today's Completions
            const { data: completionsData, error: completionsError } = await supabase
                .from('completions')
                .select('habit_id, value, notes')
                .eq('user_id', user!.id)
                .eq('completed_at', today);

            if (completionsError) throw completionsError;
            setCompletedIds(completionsData?.map(c => c.habit_id) || []);

            // Build progress values and notes maps
            const progressMap: Record<string, number> = {};
            const notesMap: Record<string, string> = {};
            completionsData?.forEach(c => {
                progressMap[c.habit_id] = c.value || 1;
                if (c.notes) notesMap[c.habit_id] = c.notes;
            });
            setProgressValues(progressMap);
            setCompletionNotes(notesMap);

            // Fetch completion history for streak calculation (last 365 days)
            const yearAgo = format(subDays(new Date(), 365), 'yyyy-MM-dd');
            const { data: historyData, error: historyError } = await supabase
                .from('completions')
                .select('habit_id, completed_at')
                .eq('user_id', user!.id)
                .gte('completed_at', yearAgo);

            if (historyError) throw historyError;

            // Group completion dates by habit_id
            const completionsByHabit: Record<string, string[]> = {};
            historyData?.forEach(c => {
                if (!completionsByHabit[c.habit_id]) {
                    completionsByHabit[c.habit_id] = [];
                }
                completionsByHabit[c.habit_id].push(c.completed_at);
            });

            // Calculate streaks for each habit
            const streaks: Record<string, StreakData> = {};
            habitsData?.forEach(habit => {
                const dates = completionsByHabit[habit.id] || [];
                streaks[habit.id] = calculateStreak(dates, habit.frequency_days || [], today);
            });
            setStreakData(streaks);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveHabit = async (habitData: Partial<Habit>) => {
        try {
            if (editingHabit) {
                // Update existing
                const { data, error } = await supabase
                    .from('habits')
                    .update(habitData)
                    .eq('id', editingHabit.id)
                    .select()
                    .single();

                if (error) throw error;
                setHabits(prev => prev.map(h => h.id === editingHabit.id ? data : h));
            } else {
                // Create new
                const { data, error } = await supabase
                    .from('habits')
                    .insert([{ ...habitData, user_id: user!.id }])
                    .select()
                    .single();

                if (error) throw error;
                setHabits([...habits, data]);
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error saving habit:', error);
        }
    };

    const handleToggleHabit = async (habitId: string) => {
        const isCompleted = completedIds.includes(habitId);

        // Optimistic Update
        setCompletedIds(prev =>
            isCompleted ? prev.filter(id => id !== habitId) : [...prev, habitId]
        );

        try {
            if (isCompleted) {
                // Delete completion
                const { error } = await supabase
                    .from('completions')
                    .delete()
                    .eq('habit_id', habitId)
                    .eq('completed_at', today);
                if (error) throw error;
                // Clear progress value
                setProgressValues(prev => {
                    const newValues = { ...prev };
                    delete newValues[habitId];
                    return newValues;
                });
            } else {
                // Insert completion
                const { error } = await supabase
                    .from('completions')
                    .insert({
                        habit_id: habitId,
                        user_id: user!.id,
                        completed_at: today,
                        value: 1
                    });
                if (error) throw error;
                setProgressValues(prev => ({ ...prev, [habitId]: 1 }));
            }
        } catch (error) {
            console.error('Error toggling habit:', error);
            // Revert on error
            setCompletedIds(prev =>
                isCompleted ? [...prev, habitId] : prev.filter(id => id !== habitId)
            );
        }
    };

    const handleUpdateProgress = async (habitId: string, newValue: number) => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        const target = habit.frequency_target || 1;
        const clampedValue = Math.max(0, Math.min(newValue, target));
        const previousValue = progressValues[habitId] || 0;
        const wasCompleted = completedIds.includes(habitId);

        // Optimistic update
        if (clampedValue === 0) {
            setCompletedIds(prev => prev.filter(id => id !== habitId));
            setProgressValues(prev => {
                const newValues = { ...prev };
                delete newValues[habitId];
                return newValues;
            });
        } else {
            if (!wasCompleted) {
                setCompletedIds(prev => [...prev, habitId]);
            }
            setProgressValues(prev => ({ ...prev, [habitId]: clampedValue }));
        }

        try {
            if (clampedValue === 0) {
                // Delete completion
                const { error } = await supabase
                    .from('completions')
                    .delete()
                    .eq('habit_id', habitId)
                    .eq('completed_at', today);
                if (error) throw error;
            } else if (!wasCompleted) {
                // Insert new completion
                const { error } = await supabase
                    .from('completions')
                    .insert({
                        habit_id: habitId,
                        user_id: user!.id,
                        completed_at: today,
                        value: clampedValue
                    });
                if (error) throw error;
            } else {
                // Update existing completion
                const { error } = await supabase
                    .from('completions')
                    .update({ value: clampedValue })
                    .eq('habit_id', habitId)
                    .eq('completed_at', today);
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error updating progress:', error);
            // Revert on error
            if (previousValue === 0) {
                setCompletedIds(prev => prev.filter(id => id !== habitId));
                setProgressValues(prev => {
                    const newValues = { ...prev };
                    delete newValues[habitId];
                    return newValues;
                });
            } else {
                if (!wasCompleted) {
                    setCompletedIds(prev => prev.filter(id => id !== habitId));
                }
                setProgressValues(prev => ({ ...prev, [habitId]: previousValue }));
            }
        }
    };

    const handleUpdateNotes = async (habitId: string, notes: string) => {
        const previousNotes = completionNotes[habitId] || '';

        // Optimistic update
        if (notes) {
            setCompletionNotes(prev => ({ ...prev, [habitId]: notes }));
        } else {
            setCompletionNotes(prev => {
                const newNotes = { ...prev };
                delete newNotes[habitId];
                return newNotes;
            });
        }

        try {
            const { error } = await supabase
                .from('completions')
                .update({ notes: notes || null })
                .eq('habit_id', habitId)
                .eq('completed_at', today);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating notes:', error);
            // Revert on error
            if (previousNotes) {
                setCompletionNotes(prev => ({ ...prev, [habitId]: previousNotes }));
            } else {
                setCompletionNotes(prev => {
                    const newNotes = { ...prev };
                    delete newNotes[habitId];
                    return newNotes;
                });
            }
        }
    };

    const handleDeleteHabit = async (habitId: string) => {
        if (!confirm('Are you sure you want to delete this habit?')) return;

        // Optimistic Update
        setHabits(prev => prev.filter(h => h.id !== habitId));

        try {
            const { error } = await supabase
                .from('habits')
                .delete()
                .eq('id', habitId);

            if (error) throw error;
        } catch (error) {
            console.error('Error deleting habit:', error);
            fetchData(); // Sync on error
        }
    };

    const handleEditHabit = (habit: Habit) => {
        setEditingHabit(habit);
        setIsDialogOpen(true);
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };



    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className="min-h-screen bg-background text-text pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-muted/20 bg-background/80 backdrop-blur-md">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Hello, {user?.email?.split('@')[0]}!</h1>
                        <p className="text-sm text-muted">{format(new Date(), 'EEEE, MMMM do')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                            <Settings className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleSignOut}>
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Stats Overview (Simplified for now) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
                        <div className="text-2xl font-bold text-primary">{completedIds.filter(id => todaysHabits.some(h => h.id === id)).length}/{todaysHabits.length}</div>
                        <div className="text-xs text-muted-foreground uppercase font-semibold">Completed Today</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/10">
                        <div className="text-2xl font-bold text-green-500">{Math.round((completedIds.filter(id => todaysHabits.some(h => h.id === id)).length / (todaysHabits.length || 1)) * 100)}%</div>
                        <div className="text-xs text-muted-foreground uppercase font-semibold">Rate</div>
                    </div>
                </div>

                {/* Habit Sections */}
                <div className="space-y-8">
                    <HabitList
                        title="🌅 Early Morning"
                        habits={todaysHabits.filter(h => h.time_of_day === 'early_morning')}
                        completedHabitIds={completedIds}
                        progressValues={progressValues}
                        completionNotes={completionNotes}
                        onToggle={handleToggleHabit}
                        onUpdateProgress={handleUpdateProgress}
                        onUpdateNotes={handleUpdateNotes}
                        onDelete={handleDeleteHabit}
                        onEdit={handleEditHabit}
                        streakData={streakData}
                    />

                    <HabitList
                        title="☀️ Morning"
                        habits={todaysHabits.filter(h => h.time_of_day === 'morning')}
                        completedHabitIds={completedIds}
                        progressValues={progressValues}
                        completionNotes={completionNotes}
                        onToggle={handleToggleHabit}
                        onUpdateProgress={handleUpdateProgress}
                        onUpdateNotes={handleUpdateNotes}
                        onDelete={handleDeleteHabit}
                        onEdit={handleEditHabit}
                        streakData={streakData}
                    />

                    <HabitList
                        title="🌤️ Afternoon"
                        habits={todaysHabits.filter(h => h.time_of_day === 'afternoon')}
                        completedHabitIds={completedIds}
                        progressValues={progressValues}
                        completionNotes={completionNotes}
                        onToggle={handleToggleHabit}
                        onUpdateProgress={handleUpdateProgress}
                        onUpdateNotes={handleUpdateNotes}
                        onDelete={handleDeleteHabit}
                        onEdit={handleEditHabit}
                        streakData={streakData}
                    />

                    <HabitList
                        title="🌆 Evening"
                        habits={todaysHabits.filter(h => h.time_of_day === 'evening')}
                        completedHabitIds={completedIds}
                        progressValues={progressValues}
                        completionNotes={completionNotes}
                        onToggle={handleToggleHabit}
                        onUpdateProgress={handleUpdateProgress}
                        onUpdateNotes={handleUpdateNotes}
                        onDelete={handleDeleteHabit}
                        onEdit={handleEditHabit}
                        streakData={streakData}
                    />

                    <HabitList
                        title="⏰ Custom"
                        habits={todaysHabits.filter(h => h.time_of_day === 'custom')}
                        completedHabitIds={completedIds}
                        progressValues={progressValues}
                        completionNotes={completionNotes}
                        onToggle={handleToggleHabit}
                        onUpdateProgress={handleUpdateProgress}
                        onUpdateNotes={handleUpdateNotes}
                        onDelete={handleDeleteHabit}
                        onEdit={handleEditHabit}
                        streakData={streakData}
                    />

                    <HabitList
                        title="🚫 No Reminder"
                        habits={todaysHabits.filter(h => h.time_of_day === 'anytime')}
                        completedHabitIds={completedIds}
                        progressValues={progressValues}
                        completionNotes={completionNotes}
                        onToggle={handleToggleHabit}
                        onUpdateProgress={handleUpdateProgress}
                        onUpdateNotes={handleUpdateNotes}
                        onDelete={handleDeleteHabit}
                        onEdit={handleEditHabit}
                        streakData={streakData}
                    />

                    {todaysHabits.length === 0 && (
                        <div className="text-center py-10 text-muted">
                            <p>{habits.length === 0 ? 'No habits yet. Start small!' : 'No habits scheduled for today!'}</p>
                        </div>
                    )}

                    {/* Upcoming Habits (collapsible) */}
                    {upcomingHabits.length > 0 && (
                        <div className="pt-4 border-t border-muted/20">
                            <button
                                onClick={() => setShowUpcoming(!showUpcoming)}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-text transition-colors"
                            >
                                <span className={`transition-transform ${showUpcoming ? 'rotate-90' : ''}`}>▶</span>
                                <span>Upcoming ({upcomingHabits.length})</span>
                            </button>
                            {showUpcoming && (
                                <div className="mt-4 opacity-60">
                                    {upcomingHabits.map(habit => (
                                        <div key={habit.id} className="py-2 px-3 rounded-lg bg-surface/50 mb-2 flex items-center gap-3">
                                            <span className="text-xl">{habit.icon}</span>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{habit.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {habit.frequency_days?.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][Number(d)]).join(', ')}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleEditHabit(habit)}
                                                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteHabit(habit.id)}
                                                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6">
                <Button
                    className="gap-2 shadow-lg shadow-primary/20"
                    onClick={() => {
                        setEditingHabit(null);
                        setIsDialogOpen(true);
                    }}
                >
                    <Plus className="h-4 w-4" /> New Habit
                </Button>
            </div>

            <HabitDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onSave={handleSaveHabit}
                habitToEdit={editingHabit || undefined}
            />

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <InstallPrompt />
                        <NotificationPreferences />
                        <NtfySettings />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
