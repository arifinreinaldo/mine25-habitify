package com.habitify.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.habitify.R

/**
 * App Widget Provider for Habitify habit tracker
 * Displays daily progress and streak information
 */
class HabitWidgetProvider : AppWidgetProvider() {
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
        // TODO: Fetch widget data from SharedPreferences or Supabase
        val views = RemoteViews(context.packageName, R.layout.habit_widget)

        // TODO: Set widget data
        // views.setTextViewText(R.id.streak_text, "3 day streak")
        // views.setTextViewText(R.id.progress_text, "Today: 2/5 habits")
        // views.setProgressBar(R.id.progress_bar, 100, 40, false)
        // views.setTextViewText(R.id.reminder_text, "⚠️ Don't break your streak!")

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
