package com.example.habitify_widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

/**
 * App Widget Provider for Habitify habit tracker
 * Displays daily progress and streak information
 */
class HabitWidgetProvider : AppWidgetProvider() {

    companion object {
        private const val PREFS_NAME = "HomeWidgetPreferences"
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        // Read cached data from SharedPreferences (set by Flutter via home_widget)
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        val totalHabits = prefs.getString("total_habits", "0")?.toIntOrNull() ?: 0
        val completedToday = prefs.getString("completed_today", "0")?.toIntOrNull() ?: 0
        val currentStreak = prefs.getString("current_streak", "0")?.toIntOrNull() ?: 0
        val progress = prefs.getString("progress", "0")?.toIntOrNull() ?: 0

        val views = RemoteViews(context.packageName, R.layout.habit_widget)

        // Set streak text
        val streakText = when {
            currentStreak == 0 -> "Start your streak!"
            currentStreak == 1 -> "1 day streak"
            else -> "$currentStreak day streak"
        }
        views.setTextViewText(R.id.streak_text, streakText)

        // Set progress text
        views.setTextViewText(R.id.progress_text, "Today: $completedToday/$totalHabits habits")

        // Set progress bar
        views.setProgressBar(R.id.progress_bar, 100, progress, false)

        // Set reminder text based on progress
        val reminderText = when {
            totalHabits == 0 -> "Add some habits to get started!"
            completedToday == totalHabits -> "All done! Great job!"
            currentStreak > 0 && completedToday < totalHabits -> "Don't break your streak!"
            else -> "Let's build some habits!"
        }
        views.setTextViewText(R.id.reminder_text, reminderText)

        // Handle click to open Flutter app
        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        if (intent != null) {
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.streak_emoji, pendingIntent)
            views.setOnClickPendingIntent(R.id.streak_text, pendingIntent)
            views.setOnClickPendingIntent(R.id.progress_text, pendingIntent)
            views.setOnClickPendingIntent(R.id.progress_bar, pendingIntent)
            views.setOnClickPendingIntent(R.id.reminder_text, pendingIntent)
        }

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    override fun onEnabled(context: Context) {
        // Called when the first widget is added
    }

    override fun onDisabled(context: Context) {
        // Called when the last widget is removed
    }
}
