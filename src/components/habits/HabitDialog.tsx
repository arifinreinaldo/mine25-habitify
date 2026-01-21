import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Habit, TimeOfDay } from '../../types/habit';

interface HabitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (habit: Partial<Habit>) => Promise<void>;
    habitToEdit?: Habit;
}

export const HabitDialog: React.FC<HabitDialogProps> = ({ open, onOpenChange, onSave, habitToEdit }) => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('anytime');
    const [icon, setIcon] = useState('📝');
    const [color, setColor] = useState('#6366f1');
    const [reminderTime, setReminderTime] = useState<string>('');

    React.useEffect(() => {
        if (habitToEdit) {
            setName(habitToEdit.name);
            setTimeOfDay(habitToEdit.time_of_day);
            setIcon(habitToEdit.icon);
            setColor(habitToEdit.color);
            setReminderTime(habitToEdit.reminder_time || '');
        } else {
            setName('');
            setTimeOfDay('anytime');
            setIcon('📝');
            setColor('#6366f1');
            setReminderTime('');
        }
    }, [habitToEdit, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                name,
                time_of_day: timeOfDay,
                icon,
                color,
                frequency_type: 'daily', // Default for MVP
                frequency_days: [0, 1, 2, 3, 4, 5, 6],
                reminder_time: reminderTime || undefined,
            });
            onOpenChange(false);
            setName('');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const colors = [
        '#6366f1', // Indigo
        '#ec4899', // Pink
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#3b82f6', // Blue
        '#ef4444', // Red
    ];

    const icons = ['📝', '💧', '🏃', '🧘', '📚', '💊', '💰', '🧹'];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{habitToEdit ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Habit Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Drink water, Read book"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Time of Day</Label>
                            <Select value={timeOfDay} onValueChange={(v) => setTimeOfDay(v as TimeOfDay)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="morning">Morning</SelectItem>
                                    <SelectItem value="afternoon">Afternoon</SelectItem>
                                    <SelectItem value="evening">Evening</SelectItem>
                                    <SelectItem value="night">Night</SelectItem>
                                    <SelectItem value="anytime">Anytime</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {colors.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-white' : ''}`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setColor(c)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Icon</Label>
                        <div className="flex gap-2 bg-surface p-2 rounded-md overflow-x-auto">
                            {icons.map((ic) => (
                                <button
                                    key={ic}
                                    type="button"
                                    className={`w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted/20 ${icon === ic ? 'bg-primary/20' : ''}`}
                                    onClick={() => setIcon(ic)}
                                >
                                    {ic}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="reminder">Email Reminder</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="reminder"
                                type="time"
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                                className="w-32"
                            />
                            {reminderTime && (
                                <button
                                    type="button"
                                    onClick={() => setReminderTime('')}
                                    className="text-muted-foreground hover:text-foreground text-sm"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Get a passive-aggressive reminder if you haven't completed this habit
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : (habitToEdit ? 'Save Changes' : 'Create Habit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
