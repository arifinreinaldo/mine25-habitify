import { Bell, BellOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { usePushNotifications } from '../hooks/usePushNotifications';

export function NotificationSettings() {
  const {
    isSupported,
    isConfigured,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  // Not supported
  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
        <BellOff className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">Push Notifications</p>
          <p className="text-xs text-muted-foreground">
            Not supported in this browser
          </p>
        </div>
      </div>
    );
  }

  // Not configured (no VAPID key)
  if (!isConfigured) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        <div className="flex-1">
          <p className="text-sm font-medium">Push Notifications</p>
          <p className="text-xs text-muted-foreground">
            Not configured. Set VITE_VAPID_PUBLIC_KEY in environment.
          </p>
        </div>
      </div>
    );
  }

  // Permission denied
  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
        <BellOff className="w-5 h-5 text-red-500" />
        <div className="flex-1">
          <p className="text-sm font-medium">Push Notifications</p>
          <p className="text-xs text-muted-foreground">
            Permission denied. Enable in browser settings.
          </p>
        </div>
      </div>
    );
  }

  // Subscribed
  if (isSubscribed) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <div className="flex-1">
          <p className="text-sm font-medium">Push Notifications</p>
          <p className="text-xs text-muted-foreground">
            Enabled - you'll receive habit reminders
          </p>
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={unsubscribe}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Disable'
          )}
        </Button>
      </div>
    );
  }

  // Not subscribed - show enable button
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
      <Bell className="w-5 h-5 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm font-medium">Push Notifications</p>
        <p className="text-xs text-muted-foreground">
          Get reminders even when the app is closed
        </p>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
      <Button
        variant="default"
        size="sm"
        onClick={subscribe}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          'Enable'
        )}
      </Button>
    </div>
  );
}
