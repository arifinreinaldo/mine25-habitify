/// Widget data model
class WidgetData {
  final int totalHabits;
  final int completedToday;
  final int currentStreak;
  final DateTime lastUpdated;

  WidgetData({
    required this.totalHabits,
    required this.completedToday,
    required this.currentStreak,
    required this.lastUpdated,
  });

  double get progress => totalHabits == 0 ? 0 : (completedToday / totalHabits);

  factory WidgetData.empty() {
    return WidgetData(
      totalHabits: 0,
      completedToday: 0,
      currentStreak: 0,
      lastUpdated: DateTime.now(),
    );
  }

  factory WidgetData.fromJson(Map<String, dynamic> json) {
    return WidgetData(
      totalHabits: json['total_habits'] ?? 0,
      completedToday: json['completed_today'] ?? 0,
      currentStreak: json['current_streak'] ?? 0,
      lastUpdated: DateTime.now(),
    );
  }
}
