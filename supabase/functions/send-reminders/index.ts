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
];

function getRandomMessage(habitName: string): string {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex].replace(/{habit}/g, habitName);
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

interface HabitWithUser {
  id: string;
  name: string;
  icon: string;
  user_id: string;
  reminder_time: string;
  profiles: {
    email: string;
    timezone: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mailerooApiKey = Deno.env.get("MAILEROO_API_KEY")!;
    const mailerooFromEmail =
      Deno.env.get("MAILEROO_FROM_EMAIL") || "noreply@habitify.app";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time in 15-minute window
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = Math.floor(now.getUTCMinutes() / 15) * 15;
    const timeWindowStart = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}:00`;
    const timeWindowEnd = `${currentHour.toString().padStart(2, "0")}:${(currentMinute + 14).toString().padStart(2, "0")}:59`;

    console.log(`Checking for reminders between ${timeWindowStart} and ${timeWindowEnd} UTC`);

    // Query habits with reminder_time in current window
    // Join with profiles to get user email and timezone
    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select(
        `
        id,
        name,
        icon,
        user_id,
        reminder_time,
        profiles!inner(email, timezone)
      `
      )
      .not("reminder_time", "is", null)
      .eq("is_archived", false)
      .gte("reminder_time", timeWindowStart)
      .lte("reminder_time", timeWindowEnd);

    if (habitsError) {
      throw habitsError;
    }

    if (!habits || habits.length === 0) {
      console.log("No habits with reminders in this time window");
      return new Response(
        JSON.stringify({ message: "No reminders to send", sent: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const today = now.toISOString().split("T")[0];
    let sentCount = 0;
    const errors: string[] = [];

    for (const habit of habits as unknown as HabitWithUser[]) {
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

      const userEmail = habit.profiles?.email;
      if (!userEmail) {
        console.log(`No email for user ${habit.user_id}, skipping`);
        continue;
      }

      // Send email via Maileroo
      try {
        const emailHtml = generateEmailHtml(habit.name, habit.icon);

        const response = await fetch("https://smtp.maileroo.com/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": mailerooApiKey,
          },
          body: JSON.stringify({
            from: `Habitify <${mailerooFromEmail}>`,
            to: userEmail,
            subject: `👀 ${habit.name} is waiting...`,
            html: emailHtml,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Maileroo error for ${habit.name}: ${errorText}`);
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
