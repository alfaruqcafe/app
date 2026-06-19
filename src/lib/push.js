import { supabase } from './supabase';

// Convert urlB64ToUint8Array
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPushNotifications(userId = null, role = 'customer') {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push-Benachrichtigungen werden von diesem Browser nicht unterstützt.');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicVapidKey) {
    throw new Error('VAPID Public Key fehlt in den Umgebungsvariablen.');
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlB64ToUint8Array(publicVapidKey)
  });

  const subJson = subscription.toJSON();

  // Save to Supabase
  const { error } = await supabase.from('push_subscriptions').insert({
    user_id: userId,
    role: role,
    endpoint: subJson.endpoint,
    p256dh: subJson.keys.p256dh,
    auth: subJson.keys.auth
  });

  if (error) {
    throw error;
  }

  return true;
}

export async function sendPushNotification(payload) {
  // payload: { title, body, url, targetRole, targetUserId }
  const res = await fetch('/api/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('Fehler beim Senden der Push-Benachrichtigung');
  }
  return res.json();
}
