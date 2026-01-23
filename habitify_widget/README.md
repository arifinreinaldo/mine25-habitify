# Flutter Widget Project Structure

This is the skeleton for the Habitify Android widget implementation.

## Quick Start

```bash
cd habitify_widget
flutter pub get
flutter run
```

## Directory Structure

- **lib/main.dart** - Flutter app entry point
- **lib/models/** - Data models (Habit, WidgetData)
- **lib/services/** - Supabase, widget, and storage services
- **lib/utils/** - Utility functions and messages
- **android/app/src/main/kotlin/** - Native widget provider
- **android/app/src/main/res/layout/** - Widget UI layout
- **android/app/src/main/res/xml/** - Widget metadata

## Next Steps

1. Configure Supabase credentials
2. Implement WorkManager for background sync
3. Build native Kotlin widget provider
4. Create widget UI drawables (backgrounds, progress bar)
5. Test on Android device
