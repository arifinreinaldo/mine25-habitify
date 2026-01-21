import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { Habit, TimeOfDay } from '../../types/habit';

interface HabitDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (habit: Partial<Habit>) => Promise<void>;
    habitToEdit?: Habit;
}

// Time of day options with their default reminder times
const timeOptions: { value: TimeOfDay; label: string; time: string; emoji: string }[] = [
    { value: 'early_morning', label: 'Early Morning', time: '06:00', emoji: '🌅' },
    { value: 'morning', label: 'Morning', time: '08:00', emoji: '☀️' },
    { value: 'afternoon', label: 'Afternoon', time: '13:00', emoji: '🌤️' },
    { value: 'evening', label: 'Evening', time: '18:00', emoji: '🌆' },
    { value: 'custom', label: 'Custom Time', time: '', emoji: '⏰' },
    { value: 'anytime', label: 'No Reminder', time: '', emoji: '🚫' },
];

export const HabitDialog: React.FC<HabitDialogProps> = ({ open, onOpenChange, onSave, habitToEdit }) => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('anytime');
    const [icon, setIcon] = useState('📝');
    const [color, setColor] = useState('#6366f1');
    const [customTime, setCustomTime] = useState<string>('09:00');

    React.useEffect(() => {
        if (habitToEdit) {
            setName(habitToEdit.name);
            setTimeOfDay(habitToEdit.time_of_day);
            setIcon(habitToEdit.icon);
            setColor(habitToEdit.color);
            // If editing and has reminder_time, check if it matches a preset
            if (habitToEdit.reminder_time) {
                const matchingOption = timeOptions.find(o => o.time === habitToEdit.reminder_time);
                if (matchingOption && matchingOption.value !== 'custom' && matchingOption.value !== 'anytime') {
                    setTimeOfDay(matchingOption.value);
                } else if (habitToEdit.time_of_day === 'custom') {
                    setCustomTime(habitToEdit.reminder_time);
                }
            }
        } else {
            setName('');
            setTimeOfDay('anytime');
            setIcon('📝');
            setColor('#6366f1');
            setCustomTime('09:00');
        }
    }, [habitToEdit, open]);

    const getReminderTime = (): string | undefined => {
        if (timeOfDay === 'anytime') return undefined;
        if (timeOfDay === 'custom') return customTime;
        const option = timeOptions.find(o => o.value === timeOfDay);
        return option?.time || undefined;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                name,
                time_of_day: timeOfDay,
                icon,
                color,
                frequency_type: 'daily',
                frequency_days: [0, 1, 2, 3, 4, 5, 6],
                reminder_time: getReminderTime(),
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

                    <div className="grid gap-2">
                        <Label>Reminder Time</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Get a passive-aggressive email reminder if you haven't completed this habit
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {timeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setTimeOfDay(option.value)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                                        timeOfDay === option.value
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-muted bg-surface hover:border-muted-foreground/50'
                                    }`}
                                >
                                    <span className="text-xl mb-1">{option.emoji}</span>
                                    <span className="text-xs font-medium">{option.label}</span>
                                    {option.time && (
                                        <span className="text-[10px] text-muted-foreground">{option.time}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        {timeOfDay === 'custom' && (
                            <div className="flex items-center gap-2 mt-2">
                                <Input
                                    type="time"
                                    value={customTime}
                                    onChange={(e) => setCustomTime(e.target.value)}
                                    className="w-32"
                                />
                                <span className="text-sm text-muted-foreground">Your local time</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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

                        <div className="grid gap-2">
                            <Label>Icon</Label>
                            <div className="flex flex-wrap gap-2">
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
