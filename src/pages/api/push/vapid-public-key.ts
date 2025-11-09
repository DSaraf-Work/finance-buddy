import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint to get VAPID public key
 * GET /api/push/vapid-public-key
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return res.status(500).json({ error: 'VAPID public key not configured' });
  }

  return res.status(200).json({ publicKey: vapidPublicKey });
}

