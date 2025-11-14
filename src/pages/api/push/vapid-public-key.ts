/**
 * VAPID Public Key Endpoint
 * 
 * Returns the VAPID public key needed for client-side push subscription.
 * This is a public endpoint that doesn't require authentication.
 */

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      throw new Error('VAPID_PUBLIC_KEY not configured');
    }

    return res.status(200).json({ publicKey });
  } catch (error: any) {
    console.error('Failed to get VAPID public key:', error);
    return res.status(500).json({ error: error.message });
  }
}

