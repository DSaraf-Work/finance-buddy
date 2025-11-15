/**
 * Cron Endpoint - Priority Email Check
 * 
 * Runs every 1 minute (configurable) to check for unread emails from priority senders
 * and process them automatically.
 * 
 * Priority Senders:
 * - alerts@dcbbank.com
 * - alerts@yes.bank.in
 * - alerts@hdfcbank.net
 * 
 * Flow:
 * 1. Check if priority email checking is enabled
 * 2. Search for unread emails from priority senders across all Gmail connections
 * 3. Process each email (extract transaction, store in database)
 * 4. Mark email as read in Gmail
 * 
 * This endpoint should be called by Vercel Cron or external cron service.
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { processPriorityEmails, getPriorityEmailConfig } from '@/lib/priority-email-processor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret (for security)
  // Support both header and query parameter authentication
  const headerSecret = req.headers['authorization'];
  const querySecret = req.query.secret as string;
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;
  const expectedQuerySecret = process.env.CRON_SECRET;

  const isValidHeader = headerSecret === expectedSecret;
  const isValidQuery = querySecret === expectedQuerySecret;

  if (!isValidHeader && !isValidQuery) {
    console.error('❌ [PriorityEmailCheck] Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🕐 [PriorityEmailCheck] Cron job started:', new Date().toISOString());

  try {
    // Check if priority email checking is enabled
    const config = await getPriorityEmailConfig();
    
    if (!config.enabled) {
      console.log('ℹ️ [PriorityEmailCheck] Priority email checking is disabled');
      return res.status(200).json({
        success: true,
        message: 'Priority email checking is disabled',
        config,
      });
    }

    console.log('📧 [PriorityEmailCheck] Priority email checking is enabled:', config);

    // Process priority emails
    const result = await processPriorityEmails();

    console.log('✅ [PriorityEmailCheck] Cron job completed:', {
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
    console.error('❌ [PriorityEmailCheck] Cron job failed:', error);
    return res.status(500).json({
      error: 'Priority email check failed',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

