/**
 * POST /api/merchant-mappings
 *
 * Save a merchant_name → merchant_normalized mapping for the authenticated user.
 * Subsequent AI extractions and manual transaction creations with a matching
 * merchant_name will automatically use the stored merchant_normalized value.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { saveMerchantMapping } from '@/lib/merchant-mappings/service';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { merchant_name, merchant_normalized } = req.body;

  if (!merchant_name?.trim()) {
    return res.status(400).json({ error: 'merchant_name is required' });
  }
  if (!merchant_normalized?.trim()) {
    return res.status(400).json({ error: 'merchant_normalized is required' });
  }

  try {
    await saveMerchantMapping(user.id, merchant_name, merchant_normalized);
    console.log('✅ Merchant mapping saved:', { user_id: user.id, merchant_name, merchant_normalized });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Failed to save merchant mapping:', err);
    return res.status(500).json({ error: err.message || 'Failed to save merchant mapping' });
  }
});
