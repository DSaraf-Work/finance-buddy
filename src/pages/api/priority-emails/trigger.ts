/**
 * Manual Trigger - Priority Email Check
 * 
 * Allows users to manually trigger priority email checking from the UI.
 * This endpoint can be called without cron secret (uses user authentication instead).
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { processPriorityEmails, getPriorityEmailConfig } from '@/lib/priority-email-processor';
import { withAuth } from '@/lib/auth/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse, user: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🚀 [PriorityEmailTrigger] Manual trigger started by user:', user.id);

  try {
    // Check if priority email checking is enabled
    const config = await getPriorityEmailConfig();
    
    console.log('📧 [PriorityEmailTrigger] Current config:', config);

    // Process priority emails (even if disabled, allow manual trigger)
    const result = await processPriorityEmails();

    console.log('✅ [PriorityEmailTrigger] Manual trigger completed:', {
      success: result.success,
      connectionsProcessed: result.connectionsProcessed,
      emailsFound: result.emailsFound,
      emailsProcessed: result.emailsProcessed,
      emailsMarkedRead: result.emailsMarkedRead,
      errors: result.errors.length,
    });

    return res.status(200).json({
      success: result.success,
      result,
      config,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ [PriorityEmailTrigger] Manual trigger failed:', error);
    return res.status(500).json({
      error: 'Priority email check failed',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

export default withAuth(handler);

