import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/AuthContext';
import { CreateHabitDialog } from '../components/habits/CreateHabitDialog';
import { HabitList } from '../components/habits/HabitList';
import { Habit, TimeOfDay } from '../types/habit';
import { format } from 'date-fns';
import { Loader2, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [completedIds, setCompletedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const today = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        if (user) {
            fetchData();
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
                .select('habit_id')
                .eq('user_id', user!.id)
                .eq('completed_at', today);

            if (completionsError) throw completionsError;
            setCompletedIds(completionsData?.map(c => c.habit_id) || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHabit = async (newHabit: Partial<Habit>) => {
        try {
            const { data, error } = await supabase
                .from('habits')
                .insert([{ ...newHabit, user_id: user!.id }])
                .select()
                .single();

            if (error) throw error;
            setHabits([...habits, data]);
        } catch (error) {
            console.error('Error creating habit:', error);
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
            } else {
                // Insert completion
                const { error } = await supabase
                    .from('completions')
                    .insert({
                        habit_id: habitId,
                        user_id: user!.id,
                        completed_at: today
                    });
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error toggling habit:', error);
            // Revert on error
            setCompletedIds(prev =>
                isCompleted ? [...prev, habitId] : prev.filter(id => id !== habitId)
            );
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
        console.log('Edit not implemented yet', habit);
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const filterHabits = (time: TimeOfDay) => habits.filter(h => h.time_of_day === time || h.time_of_day === 'anytime');

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
                    <Button variant="ghost" size="icon" onClick={handleSignOut}>
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 space-y-8">
                {/* Stats Overview (Simplified for now) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
                        <div className="text-2xl font-bold text-primary">{completedIds.length}</div>
                        <div className="text-xs text-muted-foreground uppercase font-semibold">Completed</div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/10">
                        <div className="text-2xl font-bold text-green-500">{Math.round((completedIds.length / (habits.length || 1)) * 100)}%</div>
                        <div className="text-xs text-muted-foreground uppercase font-semibold">Rate</div>
                    </div>
                </div>

                {/* Habit Sections */}
                <div className="space-y-8">
                    <HabitList
                        title="Morning"
                        habits={habits.filter(h => h.time_of_day === 'morning')}
                        completedHabitIds={completedIds}
                        onToggle={handleToggleHabit}
                        onDelete={handleDeleteHabit}
                        onEdit={handleEditHabit}
                    />

                    <HabitList
                        title="Afternoon"
                        habits={habits.filter(h => h.time_of_day === 'afternoon')}
                        completedHabitIds={completedIds}
                        onToggle={handleToggleHabit}
                        onDelete={handleDeleteHabit}
                        onEdit={handleEditHabit}
                    />

                    <HabitList
                        title="Evening"
                        habits={habits.filter(h => h.time_of_day === 'evening')}
                        completedHabitIds={completedIds}
                        onToggle={handleToggleHabit}
                        onDelete={handleDeleteHabit}
                        onEdit={handleEditHabit}
                    />

                    <HabitList
                        title="Anytime"
                        habits={habits.filter(h => h.time_of_day === 'anytime')}
                        completedHabitIds={completedIds}
                        onToggle={handleToggleHabit}
                        onDelete={handleDeleteHabit}
                        onEdit={handleEditHabit}
                    />

                    {habits.length === 0 && (
                        <div className="text-center py-10 text-muted">
                            <p>No habits yet. Start small!</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6">
                <CreateHabitDialog onSave={handleCreateHabit} />
            </div>
        </div>
    );
}
