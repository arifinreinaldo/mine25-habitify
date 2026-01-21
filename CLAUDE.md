# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Vite)
npm run build    # Type-check with tsc then build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture

This is a **habit tracking application** (Habitify clone) built with:
- **React 19** + **TypeScript** + **Vite**
- **Supabase** for authentication and database
- **Tailwind CSS v3** for styling
- **Radix UI** primitives for accessible components
- **React Router v7** for routing

### Project Structure

```
src/
├── features/auth/     # Auth context with Supabase session management
├── pages/             # Route components (Login, Signup, Dashboard)
├── components/
│   ├── ui/            # Reusable UI primitives (Button, Card, Dialog, etc.)
│   └── habits/        # Habit-specific components (HabitCard, HabitList, HabitDialog)
├── types/             # TypeScript interfaces (Habit, Completion)
└── lib/
    ├── supabase.ts    # Supabase client initialization
    └── utils.ts       # cn() utility for className merging
```

### Data Model

Three Supabase tables:
- **habits**: User habits with name, icon, color, time_of_day (early_morning/morning/afternoon/evening/custom/anytime), frequency settings
- **completions**: Records of habit completions by date (completed_at as YYYY-MM-DD)
- **profiles**: User profiles storing timezone (auto-updated on login)

### Key Patterns

- **Auth Flow**: `AuthContext` wraps the app, provides `useAuth()` hook with user/session/loading state
- **Protected Routes**: `ProtectedRoute` component redirects to `/login` if not authenticated
- **Optimistic Updates**: Dashboard updates local state immediately, reverts on error
- **UI Components**: Follow shadcn/ui patterns using `cn()` for conditional classes

### Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
