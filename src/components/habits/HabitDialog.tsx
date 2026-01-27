import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Bell } from 'lucide-react';
import type { Habit, TimeOfDay, FrequencyType, HabitType } from '../../types/habit';

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
    const [description, setDescription] = useState('');
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('anytime');
    const [icon, setIcon] = useState('📝');
    const [color, setColor] = useState('#6366f1');
    const [customTime, setCustomTime] = useState<string>('09:00');
    const [frequencyDays, setFrequencyDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
    const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily');
    const [frequencyTarget, setFrequencyTarget] = useState<number>(1);
    const [habitType, setHabitType] = useState<HabitType>('boolean');
    const [unit, setUnit] = useState<string>('');

    const weekdays = [
        { value: 0, label: 'Sun' },
        { value: 1, label: 'Mon' },
        { value: 2, label: 'Tue' },
        { value: 3, label: 'Wed' },
        { value: 4, label: 'Thu' },
        { value: 5, label: 'Fri' },
        { value: 6, label: 'Sat' },
    ];

    const toggleDay = (day: number) => {
        setFrequencyDays(prev =>
            prev.includes(day)
                ? prev.filter(d => d !== day)
                : [...prev, day].sort((a, b) => a - b)
        );
    };

    React.useEffect(() => {
        if (habitToEdit) {
            setName(habitToEdit.name);
            setDescription(habitToEdit.description || '');
            setTimeOfDay(habitToEdit.time_of_day);
            setIcon(habitToEdit.icon);
            setColor(habitToEdit.color);
            setFrequencyDays(habitToEdit.frequency_days || [0, 1, 2, 3, 4, 5, 6]);
            setFrequencyType(habitToEdit.frequency_type || 'daily');
            setFrequencyTarget(habitToEdit.frequency_target || 1);
            setHabitType(habitToEdit.habit_type || 'boolean');
            setUnit(habitToEdit.unit || '');
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
            setDescription('');
            setTimeOfDay('anytime');
            setIcon('📝');
            setColor('#6366f1');
            setCustomTime('09:00');
            setFrequencyDays([0, 1, 2, 3, 4, 5, 6]);
            setFrequencyType('daily');
            setFrequencyTarget(1);
            setHabitType('boolean');
            setUnit('');
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
                description: description || undefined,
                time_of_day: timeOfDay,
                icon,
                color,
                habit_type: habitType,
                unit: habitType === 'measurable' ? unit || undefined : undefined,
                frequency_type: frequencyType,
                frequency_days: frequencyDays,
                frequency_target: frequencyTarget,
                reminder_time: getReminderTime(),
            });
            onOpenChange(false);
            setName('');
            setDescription('');
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
            <DialogContent className="sm:max-w-[425px] rounded-3xl bg-surface/80 backdrop-blur-2xl border-white/20 shadow-2xl overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="font-display text-xl">{habitToEdit ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4 overflow-y-auto flex-1 min-h-0 pr-2">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Habit Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Drink water, Read book"
                            required
                            className="rounded-xl bg-background/50 border-white/10"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Why is this habit important to you?"
                            className="rounded-xl bg-background/50 border-white/10"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Habit Type</Label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setHabitType('boolean')}
                                className={`flex-1 p-3 rounded-2xl border transition-all text-left ${habitType === 'boolean'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-muted bg-surface/50 hover:bg-surface hover:border-muted-foreground/50'
                                    }`}
                            >
                                <div className="font-medium text-sm">Yes/No</div>
                                <div className="text-xs text-muted-foreground">Simple completion</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setHabitType('measurable')}
                                className={`flex-1 p-3 rounded-2xl border transition-all text-left ${habitType === 'measurable'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-muted bg-surface/50 hover:bg-surface hover:border-muted-foreground/50'
                                    }`}
                            >
                                <div className="font-medium text-sm">Measurable</div>
                                <div className="text-xs text-muted-foreground">Track progress</div>
                            </button>
                        </div>
                        {habitType === 'measurable' && (
                            <div className="flex items-center gap-2 mt-2">
                                <Input
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    placeholder="Unit (e.g., glasses, minutes, pages)"
                                    className="flex-1 rounded-xl bg-background/50 border-white/10"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label>Repeat Days</Label>
                        <div className="flex gap-1">
                            {weekdays.map((day) => (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleDay(day.value)}
                                    className={`flex-1 py-2 px-1 text-xs font-medium rounded-lg border transition-all ${frequencyDays.includes(day.value)
                                            ? 'border-primary bg-primary/20 text-primary'
                                            : 'border-muted bg-surface/50 text-muted-foreground hover:bg-surface hover:border-muted-foreground/50'
                                        }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {frequencyDays.length === 7 ? 'Every day' :
                                frequencyDays.length === 0 ? 'Select at least one day' :
                                    `${frequencyDays.length} days per week`}
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label>Goal</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min={1}
                                max={99}
                                value={frequencyTarget}
                                onChange={(e) => setFrequencyTarget(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-20 rounded-xl bg-background/50 border-white/10"
                            />
                            <span className="text-sm text-muted-foreground">time{frequencyTarget > 1 ? 's' : ''} per</span>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => setFrequencyType('daily')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${frequencyType === 'daily'
                                            ? 'border-primary bg-primary/20 text-primary'
                                            : 'border-muted bg-surface/50 text-muted-foreground hover:bg-surface hover:border-muted-foreground/50'
                                        }`}
                                >
                                    Day
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFrequencyType('weekly')}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${frequencyType === 'weekly'
                                            ? 'border-primary bg-primary/20 text-primary'
                                            : 'border-muted bg-surface/50 text-muted-foreground hover:bg-surface hover:border-muted-foreground/50'
                                        }`}
                                >
                                    Week
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-3">
                        <div className="flex items-start gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/20">
                            <Bell className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-sm">Reminder Time</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Choose when to receive a reminder if this habit isn't completed
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {timeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setTimeOfDay(option.value)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${timeOfDay === option.value
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-muted bg-surface/50 hover:bg-surface hover:border-muted-foreground/50'
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
                                    className="w-32 rounded-xl bg-background/50 border-white/10"
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
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted/20 ${icon === ic ? 'bg-primary/20' : ''}`}
                                        onClick={() => setIcon(ic)}
                                    >
                                        {ic}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="rounded-xl w-full sm:w-auto">
                            {loading ? 'Saving...' : (habitToEdit ? 'Save Changes' : 'Create Habit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
