// Push notification handler for Habitify
// This file is imported by the main service worker

self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let data = {
    title: 'Habitify',
    body: 'You have a habit reminder!',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: [
      { action: 'complete', title: 'Mark Complete' },
      { action: 'snooze', title: 'Remind Later' },
    ],
    requireInteraction: true,
    tag: data.data?.habitId || 'habit-reminder',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const action = event.action;
  const habitId = event.notification.data?.habitId;
  const url = event.notification.data?.url || '/';

  if (action === 'complete' && habitId) {
    // Open app to complete the habit
    event.waitUntil(
      clients.openWindow(`${url}?complete=${habitId}`)
    );
  } else if (action === 'snooze') {
    // Could implement snooze logic here
    console.log('Snooze requested for habit:', habitId);
  } else {
    // Default: open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none found
        return clients.openWindow(url);
      })
    );
  }
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
