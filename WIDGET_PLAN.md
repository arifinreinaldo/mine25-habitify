# Habitify Android Widget - Implementation Plan

> Created: 2026-01-23
> Status: Planning
> Platform: Android only

## Overview

Create a Duolingo-style Android home screen widget that displays habit progress and streak information, fetching data from Supabase.

## Widget Preview

```
┌─────────────────────────────┐
│ 🔥 3 day streak             │
│                             │
│ Today: 2/5 habits done      │
│ ████████░░░░░░░░░░ 40%      │
│                             │
│ ⚠️ "Don't break your streak!"│
└─────────────────────────────┘
```

## Tech Stack

- **Framework**: Flutter + home_widget package
- **Backend**: Existing Supabase (habits, completions tables)
- **Background Sync**: WorkManager
- **Local Cache**: SharedPreferences

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Widget     │────▶│  Background  │────▶│   Supabase   │
│  (Android)   │     │   Service    │     │   Database   │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                     ┌──────▼──────┐
                     │ Local Cache │
                     │ (offline)   │
                     └─────────────┘
```

## Features

### MVP (Phase 1)
- [ ] Display today's habit completion count (e.g., "2/5 done")
- [ ] Progress bar visualization
- [ ] Current streak display with 🔥 icon
- [ ] Tap widget → open web app
- [ ] Background refresh every 30 minutes

### Phase 2
- [ ] Multiple widget sizes (small, medium, large)
- [ ] Passive-aggressive reminder messages (Duolingo-style)
- [ ] Quick-complete habit directly from widget
- [ ] Dark/light theme support

### Phase 3
- [ ] iOS widget support (same Flutter codebase)
- [ ] Customizable widget (choose which habits to show)
- [ ] Streak freeze indicator

## Project Structure

```
habitify_widget/
├── android/
│   └── app/src/main/
│       ├── kotlin/com/habitify/widget/
│       │   ├── HabitWidgetProvider.kt     # Widget provider
│       │   └── HabitWidgetReceiver.kt     # Broadcast receiver
│       └── res/
│           ├── layout/
│           │   └── habit_widget.xml       # Widget layout
│           └── xml/
│               └── habit_widget_info.xml  # Widget metadata
├── lib/
│   ├── main.dart
│   ├── models/
│   │   ├── habit.dart
│   │   └── widget_data.dart
│   ├── services/
│   │   ├── supabase_service.dart          # API calls
│   │   ├── widget_service.dart            # Widget updates
│   │   └── cache_service.dart             # Local storage
│   └── utils/
│       └── messages.dart                  # Passive-aggressive texts
└── pubspec.yaml
```

## Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  supabase_flutter: ^2.0.0      # Supabase client
  home_widget: ^0.4.0            # Android/iOS widget
  workmanager: ^0.5.0            # Background tasks
  shared_preferences: ^2.0.0     # Local cache
  flutter_secure_storage: ^9.0.0 # Store auth tokens

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
```

## Supabase Integration

### Existing RPC Function
Use the existing `get_dashboard_data()` RPC function to fetch habits and completions in a single call.

### Widget-Specific RPC (Optional - for optimization)
```sql
CREATE OR REPLACE FUNCTION get_widget_data()
RETURNS JSON AS $$
DECLARE
  result JSON;
  today DATE := CURRENT_DATE;
BEGIN
  SELECT json_build_object(
    'total_habits', (
      SELECT COUNT(*) FROM habits 
      WHERE user_id = auth.uid() AND is_archived = false
    ),
    'completed_today', (
      SELECT COUNT(*) FROM completions 
      WHERE user_id = auth.uid() AND completed_at = today
    ),
    'current_streak', (
      -- Simplified streak calculation
      SELECT COUNT(DISTINCT completed_at) 
      FROM completions 
      WHERE user_id = auth.uid() 
        AND completed_at >= today - INTERVAL '30 days'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Implementation Phases

### Phase 1: Setup (2 hours)
- [ ] Create Flutter project
- [ ] Configure Supabase Flutter SDK
- [ ] Setup secure token storage
- [ ] Basic app with login flow

### Phase 3: Widget UI (2 hours)
- [ ] Create widget XML layout
- [ ] Implement HabitWidgetProvider.kt
- [ ] Register widget in AndroidManifest.xml
- [ ] Basic static widget display
- [ ] Create widget drawable resources (background, progress bar)

### Phase 3: Data Integration (2 hours)
- [ ] Implement Supabase service
- [ ] Fetch habits and completions
- [ ] Calculate today's progress
- [ ] Calculate current streak
- [ ] Update widget with real data

### Phase 4: Background Sync (2 hours)
- [ ] Configure WorkManager
- [ ] Schedule periodic refresh (30 min)
- [ ] Implement local caching
- [ ] Handle offline state
- [ ] Battery-efficient sync

### Phase 5: Polish (1 hour)
- [ ] Add passive-aggressive messages
- [ ] Handle edge cases (no habits, not logged in)
- [ ] Add loading/error states
- [ ] Test on multiple devices

## Passive-Aggressive Messages

```dart
const messages = [
  "Your streak is crying. Do something.",
  "Remember when you said you'd be consistent?",
  "Even Duolingo's owl judges you less.",
  "Your future self is disappointed.",
  "0 habits done? Bold strategy.",
  "The only thing you're building is regret.",
  "Your habits miss you. They've moved on.",
  "Streak: 0. Excuses: Infinite.",
];
```

## Authentication Flow

1. User logs in via Flutter app (one-time)
2. Store Supabase refresh token securely
3. Widget uses stored token for API calls
4. Token refresh handled automatically

## Widget Update Triggers

| Trigger | Action |
|---------|--------|
| Every 30 minutes | WorkManager background refresh |
| App opened | Immediate widget update |
| Habit completed (in app) | Push update to widget |
| Device boot | Re-register WorkManager |

## Error Handling

| State | Widget Display |
|-------|---------------|
| Not logged in | "Tap to login" |
| No internet | Show cached data + "Offline" |
| API error | Show cached data + retry |
| No habits | "Add your first habit!" |

## Timeline

| Day | Tasks | Hours |
|-----|-------|-------|
| 1 | Setup + Widget UI | 4h |
| 2 | Data Integration + Background Sync | 4h |
| 3 | Polish + Testing | 2h |
| **Total** | | **~10h** |

## Future Considerations

- **iOS Widget**: home_widget supports iOS, minimal extra work
- **Wear OS**: Potential for watch complications
- **Quick Actions**: Complete habits directly from widget
- **Multiple Widgets**: Different widgets for different habit groups

## Resources

- [home_widget package](https://pub.dev/packages/home_widget)
- [Android App Widgets Guide](https://developer.android.com/develop/ui/views/appwidgets)
- [WorkManager](https://pub.dev/packages/workmanager)
- [Supabase Flutter](https://supabase.com/docs/reference/dart/introduction)
