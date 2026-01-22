import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  savePushSubscription,
  removePushSubscription,
  getVapidPublicKey,
} from '../lib/pushNotifications';

export type PushNotificationState = {
  isSupported: boolean;
  isConfigured: boolean; // VAPID key is set
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
};

export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isConfigured: false,
    permission: 'unsupported',
    isSubscribed: false,
    isLoading: true,
    error: null,
  });

  // Check initial state
  useEffect(() => {
    async function checkState() {
      const supported = isPushSupported();
      const configured = !!getVapidPublicKey();
      const permission = getNotificationPermission();

      let isSubscribed = false;
      if (supported && permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          isSubscribed = !!subscription;
        } catch {
          // Ignore errors during initial check
        }
      }

      setState({
        isSupported: supported,
        isConfigured: configured,
        permission,
        isSubscribed,
        isLoading: false,
        error: null,
      });
    }

    checkState();
  }, []);

  // Request permission and subscribe
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setState(prev => ({ ...prev, error: 'Must be logged in to enable notifications' }));
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permission
      const permission = await requestNotificationPermission();

      if (permission !== 'granted') {
        setState(prev => ({
          ...prev,
          permission,
          isLoading: false,
          error: permission === 'denied' ? 'Notification permission denied' : null,
        }));
        return false;
      }

      // Subscribe to push
      const subscription = await subscribeToPush();

      if (!subscription) {
        setState(prev => ({
          ...prev,
          permission,
          isLoading: false,
          error: 'Failed to subscribe to notifications. Check VAPID key configuration.',
        }));
        return false;
      }

      // Save to database
      const saved = await savePushSubscription(user.id, subscription);

      if (!saved) {
        setState(prev => ({
          ...prev,
          permission,
          isSubscribed: true, // Still subscribed locally
          isLoading: false,
          error: 'Subscribed but failed to save to server',
        }));
        return true; // Partial success
      }

      setState(prev => ({
        ...prev,
        permission,
        isSubscribed: true,
        isLoading: false,
        error: null,
      }));

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to enable notifications',
      }));
      return false;
    }
  }, [user]);

  // Unsubscribe
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const unsubscribed = await unsubscribeFromPush();

      if (user) {
        await removePushSubscription(user.id);
      }

      setState(prev => ({
        ...prev,
        isSubscribed: !unsubscribed,
        isLoading: false,
        error: null,
      }));

      return unsubscribed;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to disable notifications',
      }));
      return false;
    }
  }, [user]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}
