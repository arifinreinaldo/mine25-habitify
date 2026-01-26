# Habitify Clone - Feature Roadmap

## Progress Summary

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Core Habit Features |
| Phase 2 | ✅ Complete | Measurable Habits & Progress |
| Phase 3 | 🔶 Partial | Calendar (pending) / Streaks (done) |
| Phase 4 | ❌ Pending | Reports & Analytics |
| Phase 5 | ✅ Complete | Platform Features (PWA, Notifications, Widget, Themes) |

---

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
| Streak tracking | ✅ Done | `lib/streaks.ts` calculates current/best streaks, displayed in HabitCard |
| Calendar view for streaks | ❌ Pending | Phase 3 |
| Progress bar per habit | ✅ Done | Shows for measurable habits |
| Reports/trends analytics | ❌ Pending | Phase 4 |

### Platform & Notifications

| Feature | Status | Notes |
|---------|--------|-------|
| PWA support (installable) | ✅ Done | `InstallPrompt.tsx`, `usePWAInstall.ts` |
| Push notifications | ✅ Done | `NotificationPreferences.tsx`, `usePushNotifications.ts` |
| Ntfy integration | ✅ Done | `NtfySettings.tsx` for self-hosted notifications |
| Android widget support | ✅ Done | Deep link auth in `Dashboard.tsx` |
| Dark/light mode | ✅ Done | `ModeToggle.tsx`, `theme-provider.tsx` |

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

## Phase 3: Calendar & Streaks (Medium Priority) - PARTIAL

### 3.1 Calendar view component ❌ PENDING
- Monthly grid showing completion status per day
- Color intensity based on completion rate
- Click day to see details

### 3.2 Streak calculation ✅ COMPLETED
- Current streak counter → `lib/streaks.ts:calculateStreak()`
- Longest streak record → `bestStreak` field in StreakData
- Visual streak indicator on habit cards → Flame icon with streak count in HabitCard

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

## Phase 5: Platform Features ✅ COMPLETED

### 5.1 PWA & Installation ✅
- Service worker registration
- Install prompt component (`InstallPrompt.tsx`)
- Hook for install detection (`usePWAInstall.ts`)

### 5.2 Notifications ✅
- Web Push notifications (`usePushNotifications.ts`, `pushNotifications.ts`)
- Notification preferences UI (`NotificationPreferences.tsx`)
- Ntfy self-hosted notification support (`NtfySettings.tsx`)
- Preference persistence (`useNotificationPreferences.ts`)

### 5.3 Android Widget Integration ✅
- Deep link authentication for native Android widget
- Session token passing via `habitify://auth` URL scheme

### 5.4 Theme Support ✅
- Dark/light mode toggle (`ModeToggle.tsx`)
- Theme provider with system preference detection (`theme-provider.tsx`)

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
