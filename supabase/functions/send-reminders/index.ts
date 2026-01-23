import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Passive-aggressive Duolingo-style messages
const messages = [
  "Your habit '{habit}' is feeling neglected. It's starting to wonder if you ever cared.",
  "Remember {habit}? No? It remembers you. It's been waiting all day.",
  "We noticed you haven't done {habit} yet. The habit noticed too. It's not angry, just disappointed.",
  "Hey, {habit} is still here. Gathering dust. But that's fine. Everything is fine.",
  "{habit} says hi. Also, it's been waiting. Not that it's counting or anything.",
  "Your {habit} misses you more than you miss it. And that's saying something.",
  "Breaking news: {habit} still exists! Shocking, we know.",
  "Plot twist: {habit} was scheduled for today. Did you forget, or did you just... not care?",
  "Your streak for {habit} is looking lonely. It's giving 'forgotten houseplant' energy.",
  "We're not saying you're avoiding {habit}, but {habit} is starting to take it personally.",
  "Oh, you're busy? That's cool. {habit} will just sit here. Alone. In the dark.",
  "{habit} checked its calendar. You were supposed to show up. It's trying not to cry.",
  "Fun fact: {habit} has been ready for hours. Where were you? Don't answer. It hurts too much.",
  "You know what's sad? {habit} still believes in you. Questionable judgment, honestly.",
  "{habit} isn't mad. It's just... processing. Give it a moment.",
  "Roses are red, violets are blue, {habit} is waiting, and honestly? So disappointed in you.",
  "We asked {habit} how it's doing. It just stared at the wall. Thanks for that.",
  "{habit} saw you scrolling on your phone. It saw everything. Do better.",
  "Your future self called. They said to do {habit}. Also, they sound disappointed.",
  "Legend says if you ignore {habit} long enough, it becomes someone else's healthy routine.",
  "{habit} is not saying you're a quitter, but it's updating its LinkedIn.",
  "Do you smell that? That's the smell of {habit} losing hope.",
  "Somewhere out there, a very tired {habit} is writing poetry about abandonment.",
  "{habit} told the other habits you'd show up. Now it looks like a liar. Happy?",
  "We're legally required to inform you: {habit} has filed an emotional complaint.",
  "{habit} started a journal. Day 1: 'They didn't come again.' It's getting dark.",
  "If {habit} had a therapist, you'd be the main topic. Just saying.",
  "Congratulations! You've unlocked: {habit}'s trust issues.",
  "{habit} was going to send you a motivational quote, but honestly, it's too tired.",
  "This is {habit}'s villain origin story. You did this.",
];

// Passive-aggressive subject lines
const subjects = [
  "👀 {habit} is waiting...",
  "😐 {habit} noticed you haven't shown up",
  "🥀 {habit} is wilting without you",
  "💔 {habit} would like a word",
  "🙃 Everything is fine. ({habit} is not fine)",
  "👁️ {habit} sees you ignoring it",
  "🪦 RIP your {habit} streak",
  "🚨 {habit} has filed a missing person report",
  "😶 {habit} is giving you the silent treatment",
  "🎭 {habit} is pretending not to care",
  "📉 Your {habit} commitment is showing",
  "🥲 {habit} is fine. Totally fine.",
  "⏰ Tick tock... {habit} is still waiting",
  "🦗 *crickets* - Your {habit}, probably",
  "🪑 {habit} saved you a seat. It's getting cold.",
  "📬 You have 1 unread guilt trip from {habit}",
  "🎪 Welcome to the '{habit}' disappointment show",
  "🌧️ {habit}'s forecast: 100% chance of neglect",
  "🔔 Reminder: {habit} remembers everything",
  "💀 {habit} is dead inside (because of you)",
];

function getRandomMessage(habitName: string): string {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex].replace(/{habit}/g, habitName);
}

function getRandomSubject(habitName: string): string {
  const randomIndex = Math.floor(Math.random() * subjects.length);
  return subjects[randomIndex].replace(/{habit}/g, habitName);
}

function generateEmailHtml(habitName: string, habitIcon: string): string {
  const message = getRandomMessage(habitName);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Habit Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #1a1a2e;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a2e; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="background-color: #16213e; border-radius: 16px; overflow: hidden; max-width: 500px;">
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 20px;">${habitIcon}</div>
              <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">
                ${habitName}
              </h1>
              <p style="color: #a0aec0; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                ${message}
              </p>
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Complete Now
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #0f172a; text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                You're receiving this because you set a reminder for this habit.
                <br>
                <a href="#" style="color: #6366f1; text-decoration: none;">Manage notification settings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const senderEmail = Deno.env.get("SENDER_EMAIL") || "noreply@habitify.app";
    const senderName = Deno.env.get("SENDER_NAME") || "Habitify";

    // Debug: Check if API key is loaded
    console.log(`BREVO_API_KEY exists: ${!!brevoApiKey}`);
    console.log(`BREVO_API_KEY starts with: ${brevoApiKey?.substring(0, 10)}...`);

    if (!brevoApiKey) {
      throw new Error("BREVO_API_KEY is not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time in 5-minute window (matches scheduler interval)
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = Math.floor(now.getUTCMinutes() / 5) * 5;
    const timeWindowStart = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}:00`;
    const timeWindowEnd = `${currentHour.toString().padStart(2, "0")}:${(currentMinute + 4).toString().padStart(2, "0")}:59`;

    console.log(`Current UTC time: ${now.toISOString()}`);

    // Query ALL habits with reminders (we'll filter by timezone later)
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
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get unique user IDs and fetch their profiles (only those with email enabled)
    const userIds = [...new Set(habits.map((h: Habit) => h.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, timezone, notify_email")
      .in("id", userIds)
      .eq("notify_email", true);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // Create a map of user_id to profile
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
      const userEmail = profile?.email;
      const userTimezone = profile?.timezone || "UTC";

      if (!userEmail) {
        console.log(`No email for user ${habit.user_id}, skipping`);
        continue;
      }

      // Get current time in user's timezone
      const userLocalTime = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
      const userHour = userLocalTime.getHours();
      // Use 5-minute window to match scheduler interval (prevents duplicate sends)
      const userMinute = Math.floor(userLocalTime.getMinutes() / 5) * 5;
      const userTimeWindowStart = `${userHour.toString().padStart(2, "0")}:${userMinute.toString().padStart(2, "0")}:00`;
      const userTimeWindowEnd = `${userHour.toString().padStart(2, "0")}:${(userMinute + 4).toString().padStart(2, "0")}:59`;

      // Check if habit's reminder_time falls within user's current time window
      const reminderTime = habit.reminder_time;
      if (reminderTime < userTimeWindowStart || reminderTime > userTimeWindowEnd) {
        continue; // Not time for this reminder yet
      }

      console.log(`Habit ${habit.name} matches time window ${userTimeWindowStart}-${userTimeWindowEnd} for timezone ${userTimezone}`);

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

      // Send email via Brevo
      try {
        const emailHtml = generateEmailHtml(habit.name, habit.icon);

        const emailSubject = getRandomSubject(habit.name);

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "api-key": brevoApiKey,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: userEmail }],
            subject: emailSubject,
            htmlContent: emailHtml,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Brevo error for ${habit.name}: ${errorText}`);
          errors.push(`${habit.name}: ${errorText}`);
        } else {
          console.log(`Sent reminder for ${habit.name} to ${userEmail}`);
          sentCount++;
        }
      } catch (emailError) {
        console.error(`Failed to send email for ${habit.name}:`, emailError);
        errors.push(`${habit.name}: ${emailError}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${habits.length} habits`,
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-reminders function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
