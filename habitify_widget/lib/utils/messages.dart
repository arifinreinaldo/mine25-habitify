/// Passive-aggressive reminder messages (Duolingo style)
const reminders = [
  "Your streak is crying. Do something.",
  "Remember when you said you'd be consistent?",
  "Even Duolingo's owl judges you less.",
  "Your future self is disappointed.",
  "0 habits done? Bold strategy.",
  "The only thing you're building is regret.",
  "Your habits miss you. They've moved on.",
  "Streak: 0. Excuses: Infinite.",
  "Don't break the chain. Seriously.",
  "Your habit is waiting... impatiently.",
  "Consistency > Motivation. Pick one.",
  "Missing one day. That's all it takes.",
  "The couch is comfy, but so is progress.",
  "Plot twist: You actually did it.",
  "Your streak needs you. Don't let it down.",
];

/// Get a random reminder message
String getRandomReminder() {
  final random = (DateTime.now().millisecondsSinceEpoch % reminders.length).toInt();
  return reminders[random];
}

/// Get reminder based on streak length
String getReminderForStreak(int streak) {
  if (streak == 0) {
    return "Time to start a new streak!";
  } else if (streak < 7) {
    return "Keep it going! Only $streak days.";
  } else if (streak < 30) {
    return "🔥 $streak day streak! Don't break it.";
  } else {
    return "🔥 Legend! $streak days and counting!";
  }
}
