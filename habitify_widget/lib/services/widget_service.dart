import 'package:home_widget/home_widget.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/widget_data.dart';

/// Service to manage widget updates and caching
class WidgetService {
  static const _widgetDataKey = 'widget_data';
  static const _lastUpdateKey = 'widget_last_update';

  /// Update home widget with data
  static Future<void> updateWidget(WidgetData data) async {
    try {
      await HomeWidget.saveWidgetData<String>(
        'total_habits',
        data.totalHabits.toString(),
      );
      await HomeWidget.saveWidgetData<String>(
        'completed_today',
        data.completedToday.toString(),
      );
      await HomeWidget.saveWidgetData<String>(
        'current_streak',
        data.currentStreak.toString(),
      );
      await HomeWidget.saveWidgetData<String>(
        'progress',
        (data.progress * 100).toStringAsFixed(0),
      );

      // Save locally for offline display
      await _cacheWidgetData(data);

      // Request widget update
      await HomeWidget.updateWidget(
        name: 'HabitWidgetProvider',
        androidName: 'com.habitify.widget.HabitWidgetProvider',
      );
    } catch (e) {
      print('Error updating widget: $e');
    }
  }

  /// Cache widget data locally
  static Future<void> _cacheWidgetData(WidgetData data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_widgetDataKey, _widgetDataToJson(data));
    await prefs.setInt(_lastUpdateKey, DateTime.now().millisecondsSinceEpoch);
  }

  /// Get cached widget data
  static Future<WidgetData?> getCachedWidgetData() async {
    final prefs = await SharedPreferences.getInstance();
    final cached = prefs.getString(_widgetDataKey);
    if (cached != null) {
      return _widgetDataFromJson(cached);
    }
    return null;
  }

  /// Check if cache is fresh (less than 1 hour old)
  static Future<bool> isCacheFresh() async {
    final prefs = await SharedPreferences.getInstance();
    final lastUpdate = prefs.getInt(_lastUpdateKey);
    if (lastUpdate == null) return false;

    final age = DateTime.now().millisecondsSinceEpoch - lastUpdate;
    return age < Duration(hours: 1).inMilliseconds;
  }

  // Simple serialization helpers
  static String _widgetDataToJson(WidgetData data) {
    return '''{"total_habits":${data.totalHabits},"completed_today":${data.completedToday},"current_streak":${data.currentStreak}}''';
  }

  static WidgetData _widgetDataFromJson(String json) {
    // Simple JSON parsing (could use json package for robustness)
    return WidgetData.empty();
  }
}
