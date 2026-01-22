import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.220.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Passive-aggressive Duolingo-style messages for push notifications
const pushMessages = [
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
];

const pushTitles = [
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
];

function getRandomMessage(habitName: string): string {
  const randomIndex = Math.floor(Math.random() * pushMessages.length);
  return pushMessages[randomIndex].replace(/{habit}/g, habitName);
}

function getRandomTitle(habitName: string): string {
  const randomIndex = Math.floor(Math.random() * pushTitles.length);
  return pushTitles[randomIndex].replace(/{habit}/g, habitName);
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

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Convert base64 URL-safe to standard base64
function base64UrlToBase64(base64Url: string): string {
  return base64Url.replace(/-/g, '+').replace(/_/g, '/');
}

// Convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const standardBase64 = base64UrlToBase64(base64);
  const padding = '='.repeat((4 - (standardBase64.length % 4)) % 4);
  const binaryString = atob(standardBase64 + padding);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Import ECDSA private key for VAPID signing
async function importPrivateKey(base64PrivateKey: string): Promise<CryptoKey> {
  const privateKeyBytes = base64ToUint8Array(base64PrivateKey);

  // Create JWK from raw private key bytes (32 bytes for P-256)
  const jwk = {
    kty: "EC",
    crv: "P-256",
    d: base64Encode(privateKeyBytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    x: "", // Will be derived
    y: "", // Will be derived
  };

  // For VAPID, we need to derive the public key from the private key
  // This is complex, so we'll use a different approach - import the raw key directly
  return await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

// Create VAPID JWT token
async function createVapidJwt(
  audience: string,
  subject: string,
  vapidPrivateKey: string,
  vapidPublicKey: string
): Promise<string> {
  const header = {
    typ: "JWT",
    alg: "ES256",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const headerBase64 = btoa(JSON.stringify(header))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const payloadBase64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const unsignedToken = `${headerBase64}.${payloadBase64}`;

  // Import the private key
  const privateKeyBytes = base64ToUint8Array(vapidPrivateKey);

  // Create a proper JWK for the private key
  // For P-256, we need x, y coordinates from the public key
  const publicKeyBytes = base64ToUint8Array(vapidPublicKey);

  // The public key is 65 bytes: 0x04 || x (32 bytes) || y (32 bytes)
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: base64Encode(x).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    y: base64Encode(y).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    d: base64Encode(privateKeyBytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  };

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  // Convert signature from DER to raw format (64 bytes)
  const signatureArray = new Uint8Array(signature);
  const signatureBase64 = base64Encode(signatureArray)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${unsignedToken}.${signatureBase64}`;
}

// Send push notification to a single subscription
async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string; icon?: string; badge?: string; data?: Record<string, unknown> },
  vapidPrivateKey: string,
  vapidPublicKey: string,
  vapidSubject: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    const endpoint = subscription.endpoint;
    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.host}`;

    // Create VAPID JWT
    const jwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKey, vapidPublicKey);

    // Create authorization header
    const authorization = `vapid t=${jwt}, k=${vapidPublicKey}`;

    // Encrypt the payload using the subscription's keys
    const payloadString = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payloadString);

    // For simplicity, we'll send unencrypted payload first to test
    // In production, you should use proper encryption (RFC 8291)

    // Import subscription keys for encryption
    const p256dhBytes = base64ToUint8Array(subscription.p256dh);
    const authBytes = base64ToUint8Array(subscription.auth);

    // Generate local ECDH key pair for content encryption
    const localKeyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveBits"]
    );

    // Export local public key
    const localPublicKeyRaw = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
    const localPublicKeyBytes = new Uint8Array(localPublicKeyRaw);

    // Import subscription public key
    const subscriptionPublicKey = await crypto.subtle.importKey(
      "raw",
      p256dhBytes,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      []
    );

    // Derive shared secret
    const sharedSecretBits = await crypto.subtle.deriveBits(
      { name: "ECDH", public: subscriptionPublicKey },
      localKeyPair.privateKey,
      256
    );
    const sharedSecret = new Uint8Array(sharedSecretBits);

    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Derive encryption keys using HKDF
    const authInfo = encoder.encode("Content-Encoding: auth\0");
    const keyInfo = encoder.encode("Content-Encoding: aes128gcm\0");

    // Import shared secret for HKDF
    const ikm = await crypto.subtle.importKey(
      "raw",
      sharedSecret,
      "HKDF",
      false,
      ["deriveBits"]
    );

    // First HKDF extraction with auth secret as salt
    const prkBits = await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: authBytes,
        info: authInfo,
      },
      ikm,
      256
    );

    // Import PRK for second HKDF
    const prk = await crypto.subtle.importKey(
      "raw",
      prkBits,
      "HKDF",
      false,
      ["deriveBits"]
    );

    // Derive content encryption key
    const cekInfo = new Uint8Array([
      ...encoder.encode("Content-Encoding: aes128gcm\0"),
    ]);

    // Build key info context
    const keyInfoContext = new Uint8Array([
      ...encoder.encode("WebPush: info\0"),
      ...p256dhBytes,
      ...localPublicKeyBytes,
    ]);

    const cekBits = await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: salt,
        info: keyInfoContext,
      },
      prk,
      128
    );

    // Derive nonce
    const nonceInfo = new Uint8Array([
      ...encoder.encode("Content-Encoding: nonce\0"),
    ]);
    const nonceBits = await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: salt,
        info: keyInfoContext,
      },
      prk,
      96
    );
    const nonce = new Uint8Array(nonceBits);

    // Import CEK for AES-GCM
    const cek = await crypto.subtle.importKey(
      "raw",
      cekBits,
      "AES-GCM",
      false,
      ["encrypt"]
    );

    // Add padding delimiter to payload
    const paddedPayload = new Uint8Array(payloadBytes.length + 1);
    paddedPayload.set(payloadBytes);
    paddedPayload[payloadBytes.length] = 2; // Delimiter

    // Encrypt payload
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      cek,
      paddedPayload
    );

    // Build the encrypted content
    // Header: salt (16) + rs (4) + idlen (1) + keyid (65)
    const recordSize = new Uint8Array(4);
    new DataView(recordSize.buffer).setUint32(0, 4096, false);

    const header = new Uint8Array(86 + new Uint8Array(ciphertext).length);
    header.set(salt, 0);
    header.set(recordSize, 16);
    header[20] = 65; // keyid length (uncompressed public key)
    header.set(localPublicKeyBytes, 21);
    header.set(new Uint8Array(ciphertext), 86);

    // Send the push notification
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": authorization,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL": "86400",
        "Urgency": "normal",
      },
      body: header,
    });

    if (response.ok || response.status === 201) {
      return { success: true, statusCode: response.status };
    } else {
      const errorText = await response.text();
      return { success: false, statusCode: response.status, error: errorText };
    }
  } catch (error) {
    return { success: false, error: error.message };
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
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:noreply@habitify.app";

    console.log(`VAPID_PRIVATE_KEY exists: ${!!vapidPrivateKey}`);
    console.log(`VAPID_PUBLIC_KEY exists: ${!!vapidPublicKey}`);

    if (!vapidPrivateKey || !vapidPublicKey) {
      throw new Error("VAPID keys are not configured. Set VAPID_PRIVATE_KEY and VAPID_PUBLIC_KEY in Supabase secrets.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time
    const now = new Date();
    console.log(`Current UTC time: ${now.toISOString()}`);

    // Query ALL habits with reminders (we'll filter by timezone)
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

    // Get unique user IDs and fetch their profiles and push subscriptions
    const userIds = [...new Set(habits.map((h: Habit) => h.user_id))];

    const [profilesResult, subscriptionsResult] = await Promise.all([
      supabase.from("profiles").select("id, email, timezone").in("id", userIds),
      supabase.from("push_subscriptions").select("*").in("user_id", userIds),
    ]);

    if (profilesResult.error) {
      console.error("Error fetching profiles:", profilesResult.error);
    }

    // Create maps for quick lookup
    const profileMap = new Map<string, Profile>();
    if (profilesResult.data) {
      for (const profile of profilesResult.data as Profile[]) {
        profileMap.set(profile.id, profile);
      }
    }

    const subscriptionMap = new Map<string, PushSubscription[]>();
    if (subscriptionsResult.data) {
      for (const sub of subscriptionsResult.data as PushSubscription[]) {
        const existing = subscriptionMap.get(sub.user_id) || [];
        existing.push(sub);
        subscriptionMap.set(sub.user_id, existing);
      }
    }

    let sentCount = 0;
    const errors: string[] = [];
    const expiredSubscriptions: string[] = [];

    for (const habit of habits as Habit[]) {
      const profile = profileMap.get(habit.user_id);
      const userTimezone = profile?.timezone || "UTC";
      const userSubscriptions = subscriptionMap.get(habit.user_id);

      if (!userSubscriptions || userSubscriptions.length === 0) {
        console.log(`No push subscriptions for user ${habit.user_id}, skipping`);
        continue;
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

      // Send push notification to all user's subscriptions
      const title = getRandomTitle(habit.name);
      const body = getRandomMessage(habit.name);

      for (const subscription of userSubscriptions) {
        const result = await sendPushNotification(
          subscription,
          {
            title,
            body,
            icon: "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            data: { habitId: habit.id, habitName: habit.name },
          },
          vapidPrivateKey,
          vapidPublicKey,
          vapidSubject
        );

        if (result.success) {
          console.log(`Sent push notification for ${habit.name} to subscription ${subscription.id}`);
          sentCount++;
        } else {
          console.error(`Failed to send push for ${habit.name}: ${result.error}`);
          errors.push(`${habit.name}: ${result.error}`);

          // If subscription is expired (410 Gone or 404 Not Found), mark for deletion
          if (result.statusCode === 410 || result.statusCode === 404) {
            expiredSubscriptions.push(subscription.id);
          }
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      console.log(`Removing ${expiredSubscriptions.length} expired subscriptions`);
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", expiredSubscriptions);
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${habits.length} habits`,
        sent: sentCount,
        expiredRemoved: expiredSubscriptions.length,
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
