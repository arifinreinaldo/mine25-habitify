/// Habit model matching web app schema
class Habit {
  final String id;
  final String name;
  final String icon;
  final String color;
  final String timeOfDay;
  final List<int> frequencyDays;
  final int? frequencyTarget;

  Habit({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
    required this.timeOfDay,
    required this.frequencyDays,
    this.frequencyTarget,
  });

  factory Habit.fromJson(Map<String, dynamic> json) {
    return Habit(
      id: json['id'] as String,
      name: json['name'] as String,
      icon: json['icon'] as String? ?? '📝',
      color: json['color'] as String? ?? '#6366f1',
      timeOfDay: json['time_of_day'] as String? ?? 'anytime',
      frequencyDays: List<int>.from(
        (json['frequency_days'] as List?)?.map((d) => int.parse(d.toString())) ?? [],
      ),
      frequencyTarget: json['frequency_target'] as int?,
    );
  }
}
