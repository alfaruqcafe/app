import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const publicVapidKey = "BC2zPvA9_vshUlncxjdRhOq6IbBIrcfdQ2NU7Z4OLEKODHQ8-_ne-ax_3XGXxsiYUrMlMLNqsHCsTBm64xicBDE";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  'mailto:alfaruqcafe@gmx.de',
  publicVapidKey,
  privateVapidKey
);

const supabase = createClient(
  "https://xbjsasgcsujggnzvidyj.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhianNhc2djc3VqZ2duenZpZHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MDI1ODYsImV4cCI6MjA5NzQ3ODU4Nn0.wjnokF374_AFQ7ibTU3RBoVqukilPFUPaMogNt1o_0c"
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
