import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Passive-aggressive messages for push notifications
const messages = [
  "Your habit '{habit}' is feeling neglected. It's starting to wonder if you ever cared.",
  "Remember {habit}? No? It remembers you. It's been waiting all day.",
  "{habit} says hi. Also, it's been waiting. Not that it's counting or anything.",
  "Breaking news: {habit} still exists! Shocking, we know.",
  "Your streak for {habit} is looking lonely. It's giving 'forgotten houseplant' energy.",
  "Oh, you're busy? That's cool. {habit} will just sit here. Alone. In the dark.",
  "{habit} isn't mad. It's just... processing. Give it a moment.",
  "{habit} saw you scrolling on your phone. It saw everything. Do better.",
  "Your future self called. They said to do {habit}. Also, they sound disappointed.",
  "This is {habit}'s villain origin story. You did this.",
];

function getRandomMessage(habitName: string): string {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex].replace(/{habit}/g, habitName);
}

interface Habit {
  id: string;
  name: string;
  icon: string;
  user_id: string;
  reminder_time: string;
}

interface PushSubscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string; icon?: string; data?: Record<string, unknown> },
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    webpush.setVapidDetails(
      "mailto:noreply@habitify.app",
      vapidPublicKey,
      vapidPrivateKey
    );

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );

    return true;
  } catch (error) {
    console.error(`Push error for ${subscription.endpoint}:`, error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys are not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = Math.floor(now.getUTCMinutes() / 5) * 5;

    console.log(`Current UTC time: ${now.toISOString()}`);

    // Query habits with reminders
    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select("id, name, icon, user_id, reminder_time")
      .not("reminder_time", "is", null)
      .eq("is_archived", false);

    if (habitsError) {
      throw habitsError;
    }

    if (!habits || habits.length === 0) {
      console.log("No habits with reminders");
      return new Response(
        JSON.stringify({ message: "No reminders to send", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unique user IDs
    const userIds = [...new Set(habits.map((h: Habit) => h.user_id))];

    // Fetch profiles with timezone (only those with push enabled)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, timezone, notify_push")
      .in("id", userIds)
      .eq("notify_push", true);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    const profileMap = new Map<string, { timezone: string }>();
    if (profiles) {
      for (const profile of profiles) {
        profileMap.set(profile.id, { timezone: profile.timezone || "UTC" });
      }
    }

    // Fetch push subscriptions for these users
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth")
      .in("user_id", userIds);

    if (subscriptionsError) {
      console.error("Error fetching push subscriptions:", subscriptionsError);
    }

    // Group subscriptions by user
    const subscriptionMap = new Map<string, PushSubscription[]>();
    if (subscriptions) {
      for (const sub of subscriptions as PushSubscription[]) {
        const existing = subscriptionMap.get(sub.user_id) || [];
        existing.push(sub);
        subscriptionMap.set(sub.user_id, existing);
      }
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const habit of habits as Habit[]) {
      const profile = profileMap.get(habit.user_id);
      const userTimezone = profile?.timezone || "UTC";
      const userSubscriptions = subscriptionMap.get(habit.user_id);

      if (!userSubscriptions || userSubscriptions.length === 0) {
        continue; // No push subscriptions for this user
      }

      // Get current time in user's timezone
      const userLocalTime = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
      const userHour = userLocalTime.getHours();
      const userMinute = Math.floor(userLocalTime.getMinutes() / 5) * 5;
      const userTimeWindowStart = `${userHour.toString().padStart(2, "0")}:${userMinute.toString().padStart(2, "0")}:00`;
      const userTimeWindowEnd = `${userHour.toString().padStart(2, "0")}:${(userMinute + 4).toString().padStart(2, "0")}:59`;

      // Check if habit's reminder_time falls within user's current time window
      const reminderTime = habit.reminder_time;
      if (reminderTime < userTimeWindowStart || reminderTime > userTimeWindowEnd) {
        continue; // Not time for this reminder yet
      }

      console.log(`Habit ${habit.name} matches time window for timezone ${userTimezone}`);

      // Get today's date in user's timezone
      const today = userLocalTime.toISOString().split("T")[0];

      // Check if habit was already completed today
      const { data: completion } = await supabase
        .from("completions")
        .select("id")
        .eq("habit_id", habit.id)
        .eq("completed_at", today)
        .single();

      if (completion) {
        console.log(`Habit ${habit.name} already completed today, skipping`);
        continue;
      }

      // Send push notification to all user's devices
      const message = getRandomMessage(habit.name);
      const payload = {
        title: `${habit.icon} ${habit.name}`,
        body: message,
        icon: "/pwa-192x192.png",
        data: {
          habitId: habit.id,
          url: "/",
        },
      };

      for (const subscription of userSubscriptions) {
        try {
          const success = await sendPushNotification(
            subscription,
            payload,
            vapidPublicKey,
            vapidPrivateKey
          );

          if (success) {
            console.log(`Sent push for ${habit.name} to device`);
            sentCount++;
          } else {
            errors.push(`${habit.name}: Push delivery failed`);
          }
        } catch (error) {
          console.error(`Failed to send push for ${habit.name}:`, error);
          errors.push(`${habit.name}: ${error}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${habits.length} habits`,
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-push-notifications function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
