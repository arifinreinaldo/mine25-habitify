import { supabase } from './supabase';

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Check current permission status
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';

  const permission = await Notification.requestPermission();
  return permission;
}

// Get VAPID public key from environment or Supabase
export function getVapidPublicKey(): string | null {
  // TODO: Set this in your .env file as VITE_VAPID_PUBLIC_KEY
  // Generate VAPID keys using: npx web-push generate-vapid-keys
  return import.meta.env.VITE_VAPID_PUBLIC_KEY || null;
}

// Convert URL-safe base64 to Uint8Array (needed for VAPID key)
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  const vapidKey = getVapidPublicKey();
  if (!vapidKey) {
    console.warn('VAPID public key not configured. Set VITE_VAPID_PUBLIC_KEY in .env');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    return false;
  }
}

// Save push subscription to Supabase
export async function savePushSubscription(
  userId: string,
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const subscriptionJson = subscription.toJSON();

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscriptionJson.endpoint,
        p256dh: subscriptionJson.keys?.p256dh,
        auth: subscriptionJson.keys?.auth,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,endpoint'
      });

    if (error) {
      console.error('Failed to save push subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    return false;
  }
}

// Remove push subscription from Supabase
export async function removePushSubscription(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to remove push subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to remove push subscription:', error);
    return false;
  }
}

// Show a local notification (for testing)
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options,
    });
    return true;
  } catch (error) {
    console.error('Failed to show notification:', error);
    return false;
  }
}
