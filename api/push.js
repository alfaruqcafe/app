import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  'mailto:alfaruqcafe@gmx.de',
  publicVapidKey,
  privateVapidKey
);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, body, url, targetRole, targetUserId } = req.body;

  try {
    let query = supabase.from('push_subscriptions').select('*');
    
    if (targetRole) {
      if (Array.isArray(targetRole)) {
        query = query.in('role', targetRole);
      } else {
        query = query.eq('role', targetRole);
      }
    }
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      throw error;
    }

    const payload = JSON.stringify({ title, body, url });

    const sendPromises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      return webpush.sendNotification(pushSubscription, payload).catch(error => {
        console.error('Error sending notification, removing sub', error);
        // Optionally delete invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          return supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      });
    });

    await Promise.all(sendPromises);

    res.status(200).json({ success: true, count: subscriptions.length });
  } catch (err) {
    console.error('Push error:', err);
    res.status(500).json({ error: 'Failed to send push notification' });
  }
}
