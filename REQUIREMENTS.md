# Habitify Clone - Requirements Document

## Project Overview

A habit tracking web application with email notifications, inspired by Habitify. Built for scalability with an MVP-first approach.

**Tech Stack:**
- **Frontend:** Cloudflare Pages (Static hosting with edge functions)
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **Email:** Supabase Edge Functions + Resend/SendGrid

---

## MVP Features (Phase 1)

### 1. User Authentication
- [ ] Email/password signup and login
- [ ] Password reset via email
- [ ] Session management
- [ ] User profile (name, email, timezone)

### 2. Habit Management
- [ ] Create habit (name, description, icon/color)
- [ ] Edit habit
- [ ] Delete habit
- [ ] Archive habit
- [ ] List all habits

### 3. Habit Scheduling
- [ ] Daily habits
- [ ] Weekly habits (select specific days)
- [ ] Custom frequency (X times per week)

### 4. Daily Tracking
- [ ] Mark habit as complete/incomplete
- [ ] View today's habits checklist
- [ ] View habits by time of day (morning, afternoon, evening, night)
- [ ] Current streak counter
- [ ] Completion rate (simple %)

### 5. Basic Reminders
- [ ] Time-based email reminders
- [ ] Daily summary email (morning)
- [ ] End-of-day reminder for incomplete habits

### 6. Simple Analytics
- [ ] Weekly completion chart
- [ ] Current streak per habit
- [ ] Best streak per habit
- [ ] Overall completion rate

---

## Future Features (Phase 2+)

### Folders & Organization
- [ ] Create folders/categories
- [ ] Assign habits to folders
- [ ] Filter habits by folder
- [ ] Drag-and-drop reordering

### Advanced Scheduling
- [ ] Monthly habits
- [ ] Specific dates (1st, 15th of month)
- [ ] Skip/pause habit for date range
- [ ] Vacation mode

### Goals & Targets
- [ ] Set goals (e.g., "Exercise 20 times this month")
- [ ] Goal progress tracking
- [ ] Goal completion notifications

### Enhanced Tracking
- [ ] Notes/journal per habit completion
- [ ] Mood tracking
- [ ] Habit value tracking (numeric: minutes, reps, etc.)
- [ ] Photo attachments

### Advanced Reminders
- [ ] Multiple reminders per habit
- [ ] Habit stacking (chain reminders)
- [ ] Smart reminders based on completion patterns
- [ ] Push notifications (PWA)

### Advanced Analytics
- [ ] Monthly/yearly charts
- [ ] Heat map calendar view
- [ ] Habit correlation insights
- [ ] Export data (CSV, JSON)
- [ ] Weekly/monthly email reports

### Gamification
- [ ] Achievement badges
- [ ] Points system
- [ ] Milestones (7-day, 30-day, 100-day streaks)

### Social Features (Optional)
- [ ] Share progress
- [ ] Accountability partners
- [ ] Public habit challenges

---

## Database Schema (Supabase/PostgreSQL)

### Tables

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  timezone TEXT DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{"daily_summary": true, "reminders": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'check',
  color TEXT DEFAULT '#6366f1',
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'night', 'anytime')),
  frequency_type TEXT CHECK (frequency_type IN ('daily', 'weekly', 'custom')) DEFAULT 'daily',
  frequency_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=Sunday, 6=Saturday
  frequency_target INTEGER DEFAULT 1, -- for "X times per week"
  reminder_time TIME,
  is_archived BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit Completions
CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, completed_at)
);

-- Folders (Phase 2)
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add folder_id to habits (Phase 2)
-- ALTER TABLE habits ADD COLUMN folder_id UUID REFERENCES folders(id);
```

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can CRUD own habits" ON habits FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own completions" ON completions FOR ALL USING (auth.uid() = user_id);
```

---

## API Endpoints (Supabase Edge Functions)

### Auth (Built-in Supabase)
- `POST /auth/signup` - Register
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/reset-password` - Password reset

### Habits
- `GET /habits` - List user habits
- `POST /habits` - Create habit
- `PATCH /habits/:id` - Update habit
- `DELETE /habits/:id` - Delete habit

### Completions
- `GET /completions?date=YYYY-MM-DD` - Get completions for date
- `POST /completions` - Mark habit complete
- `DELETE /completions/:id` - Unmark completion

### Stats
- `GET /stats/overview` - Overall stats
- `GET /stats/habit/:id` - Single habit stats

### Notifications (Edge Functions)
- `POST /notifications/send-daily-summary` - Cron triggered
- `POST /notifications/send-reminders` - Cron triggered

---

## Email Notifications

### Email Types

1. **Welcome Email**
   - Triggered: On signup
   - Content: Getting started guide

2. **Daily Summary (Morning)**
   - Triggered: Cron job (user's timezone, e.g., 7 AM)
   - Content: Today's habits list, yesterday's completion rate

3. **Reminder Email**
   - Triggered: Based on habit reminder_time
   - Content: Specific habit reminder

4. **End-of-Day Nudge**
   - Triggered: Cron job (e.g., 8 PM)
   - Content: Incomplete habits for today

5. **Streak Milestone**
   - Triggered: On completion (7, 30, 100 days)
   - Content: Congratulations message

### Email Service Setup

```
Option 1: Resend (Recommended)
- Free tier: 3,000 emails/month
- Simple API
- Good deliverability

Option 2: SendGrid
- Free tier: 100 emails/day
- More features
- Established provider
```

---

## Frontend Pages

### MVP Pages
1. `/` - Landing page (marketing)
2. `/login` - Login form
3. `/signup` - Registration form
4. `/dashboard` - Main habit view (today's habits)
5. `/habits` - All habits list
6. `/habits/new` - Create habit form
7. `/habits/:id` - Edit habit
8. `/stats` - Analytics/statistics
9. `/settings` - User settings & notifications

### Components
- `HabitCard` - Single habit display with checkbox
- `HabitList` - List of habits grouped by time
- `StreakBadge` - Shows current streak
- `CompletionChart` - Weekly bar chart
- `TimeOfDayTabs` - Morning/Afternoon/Evening/Night tabs

---

## Tech Implementation Details

### Cloudflare Pages Setup
```
- Framework: React (Vite) or SvelteKit
- Deployment: Git integration
- Environment variables for Supabase keys
- Edge functions for SSR (if needed)
```

### Supabase Setup
```
- Project creation
- Database schema migration
- RLS policies
- Edge functions for emails
- Cron jobs via pg_cron or external (e.g., cron-job.org)
```

### Frontend Libraries (Suggested)
```
- UI: Tailwind CSS + shadcn/ui (or DaisyUI)
- State: Zustand or React Query
- Charts: Chart.js or Recharts
- Date handling: date-fns
- Forms: React Hook Form + Zod
```

---

## Development Phases

### Phase 1: MVP (Current Focus)
1. Setup project structure
2. Supabase configuration
3. Authentication flow
4. Habit CRUD
5. Daily tracking
6. Basic stats
7. Email notifications (daily summary + reminders)
8. Deploy to Cloudflare Pages

### Phase 2: Enhanced Features
1. Folders/categories
2. Advanced scheduling
3. Notes and journaling
4. Improved analytics
5. PWA support

### Phase 3: Premium Features
1. Goals
2. Advanced analytics
3. Data export
4. Gamification

---

## File Structure (Suggested)

```
mine25-habitify/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── habits/          # Habit-related components
│   │   ├── stats/           # Analytics components
│   │   └── layout/          # Layout components
│   ├── pages/               # Route pages
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   ├── api.ts           # API helpers
│   │   └── utils.ts         # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # State management
│   └── types/               # TypeScript types
├── supabase/
│   ├── migrations/          # Database migrations
│   └── functions/           # Edge functions
├── public/
├── .env.example
├── package.json
└── README.md
```

---

## Next Steps

1. [ ] Review and finalize requirements
2. [ ] Create Supabase project
3. [ ] Setup Cloudflare Pages project
4. [ ] Initialize frontend with chosen framework
5. [ ] Implement authentication
6. [ ] Build habit management
7. [ ] Add tracking functionality
8. [ ] Setup email notifications
9. [ ] Deploy MVP
