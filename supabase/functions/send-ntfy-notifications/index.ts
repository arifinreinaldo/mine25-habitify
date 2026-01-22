import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Passive-aggressive messages for notifications
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
  "We noticed you haven't done {habit} yet. The habit noticed too. It's not angry, just disappointed.",
  "Plot twist: {habit} was scheduled for today. Did you forget, or did you just... not care?",
  "Your {habit} misses you more than you miss it. And that's saying something.",
  "{habit} checked its calendar. You were supposed to show up. It's trying not to cry.",
  "Congratulations! You've unlocked: {habit}'s trust issues.",
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

interface Profile {
  id: string;
  email: string;
  timezone: string;
}

// Generate topic name from email: ntfy_topic_prefix + email username
function getUserTopic(topicPrefix: string, email: string): string {
  const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${topicPrefix}_${username}`;
}

async function sendNtfyNotification(
  topic: string,
  title: string,
  message: string,
  icon: string,
  priority: number = 3
): Promise<boolean> {
  try {
    const response = await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers: {
        "Title": title,
        "Priority": priority.toString(),
        "Tags": icon,
      },
      body: message,
    });

    if (!response.ok) {
      console.error(`ntfy.sh error: ${response.status} ${await response.text()}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("ntfy.sh error:", error);
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
    const ntfyTopic = Deno.env.get("NTFY_TOPIC");

    if (!ntfyTopic) {
      throw new Error("NTFY_TOPIC is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time
    const now = new Date();

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

    // Fetch profiles with timezone and email
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, timezone")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    const profileMap = new Map<string, Profile>();
    if (profiles) {
      for (const profile of profiles as Profile[]) {
        profileMap.set(profile.id, profile);
      }
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const habit of habits as Habit[]) {
      const profile = profileMap.get(habit.user_id);
      const userTimezone = profile?.timezone || "UTC";
      const userEmail = profile?.email;

      if (!userEmail) {
        console.log(`No email for user ${habit.user_id}, skipping`);
        continue;
      }

      // Generate unique topic for this user
      const userTopic = getUserTopic(ntfyTopic, userEmail);

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

      // Send ntfy notification to user's unique topic
      const title = `${habit.icon} ${habit.name}`;
      const message = getRandomMessage(habit.name);

      console.log(`Sending to topic: ${userTopic}`);

      try {
        const success = await sendNtfyNotification(
          userTopic,
          title,
          message,
          habit.icon,
          4 // High priority
        );

        if (success) {
          console.log(`Sent ntfy notification for ${habit.name}`);
          sentCount++;
        } else {
          errors.push(`${habit.name}: ntfy delivery failed`);
        }
      } catch (error) {
        console.error(`Failed to send ntfy for ${habit.name}:`, error);
        errors.push(`${habit.name}: ${error}`);
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
    console.error("Error in send-ntfy-notifications function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
