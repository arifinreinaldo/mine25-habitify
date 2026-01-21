# Habitify Clone - Feature Roadmap

## Feature Cross-Check: Current vs Desired

### Core Habit Features

| Feature | Status | Notes |
|---------|--------|-------|
| Habit creation with name, icon, color | ✅ Done | `HabitDialog.tsx` |
| Description field | ✅ Done | Added to HabitDialog and HabitCard |
| Daily/weekly goals (X times per day/week) | ✅ Done | `frequency_target` + `frequency_type` in HabitDialog |
| Repeat rules (specific weekdays) | ✅ Done | Weekday picker in HabitDialog, filtered in Dashboard |
| Simple yes/no completion | ✅ Done | Checkbox toggle in HabitCard |
| Check-in (partial progress/log) | ✅ Done | Notes popover on completed habits |
| Measurable habits with progress bars | ✅ Done | `habit_type: 'measurable'` with increment/decrement |

### Tracking & Visualization

| Feature | Status | Notes |
|---------|--------|-------|
| List-style daily dashboard | ✅ Done | `Dashboard.tsx` groups by time_of_day |
| Calendar view for streaks | ❌ Pending | Phase 3 |
| Progress bar per habit | ✅ Done | Shows for measurable habits |
| Reports/trends analytics | ❌ Pending | Phase 4 |

---

## Phase 1: Complete Core Habit Features ✅ COMPLETED

### 1.1 Add description field to HabitDialog ✅
- Added textarea input for description
- Display description in HabitCard

### 1.2 Implement repeat rules UI ✅
- Added weekday picker (Sun-Sat) in HabitDialog
- Dashboard filters habits to only show those scheduled for today
- Shows "Every day" or "X days per week" indicator

### 1.3 Add daily/weekly goals ✅
- Added goal input in HabitDialog (`frequency_target`)
- Support "X times per day" or "X times per week"
- Shows goal in HabitCard subtitle

---

## Phase 2: Measurable Habits & Progress ✅ COMPLETED

### 2.1 Add habit type field ✅
- Added `habit_type: 'boolean' | 'measurable'` to Habit type
- Added `unit: string` field (e.g., "glasses", "minutes", "pages")
- Toggle in HabitDialog to switch between types

### 2.2 Progress tracking for measurable habits ✅
- Increment/decrement buttons for measurable habits
- `value` field in completions table
- Progress bar component showing current/target

### 2.3 Check-in / partial logging ✅
- Notes popover on completed habits
- Notes displayed on HabitCard when present
- Save/clear notes functionality

---

## Phase 3: Calendar & Streaks (Medium Priority) - PENDING

### 3.1 Calendar view component
- Monthly grid showing completion status per day
- Color intensity based on completion rate
- Click day to see details

### 3.2 Streak calculation
- Current streak counter
- Longest streak record
- Visual streak indicator on habit cards

---

## Phase 4: Reports & Analytics (Medium Priority) - PENDING

### 4.1 Weekly/monthly reports page
- Completion rate over time (line chart)
- Best/worst performing habits
- Day-of-week heatmap

### 4.2 Per-habit statistics
- Total completions
- Average completion rate
- Best streak

---

## Database Schema Updates Required

For new features to work, ensure your Supabase `habits` table has these columns:
```sql
ALTER TABLE habits ADD COLUMN IF NOT EXISTS habit_type TEXT DEFAULT 'boolean';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS unit TEXT;
```

And your `completions` table has:
```sql
ALTER TABLE completions ADD COLUMN IF NOT EXISTS value INTEGER DEFAULT 1;
ALTER TABLE completions ADD COLUMN IF NOT EXISTS notes TEXT;
```
