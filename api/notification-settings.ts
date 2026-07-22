import type { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

/**
 * GET  /api/notification-settings  → returns { hour, minute }
 * POST /api/notification-settings  → saves  { hour, minute }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const ref = db.collection('settings').doc('notification_time');

  if (req.method === 'GET') {
    try {
      const doc = await ref.get();
      if (doc.exists) {
        return res.status(200).json({ success: true, ...doc.data() });
      }
      // Return default if not set yet
      return res.status(200).json({ success: true, hour: 19, minute: 0 });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  if (req.method === 'POST') {
    const { hour, minute } = req.body || {};
    if (typeof hour !== 'number' || typeof minute !== 'number' ||
        hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return res.status(400).json({ error: 'Invalid hour or minute' });
    }
    try {
      await ref.set({ hour, minute, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      return res.status(200).json({ success: true, hour, minute });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
