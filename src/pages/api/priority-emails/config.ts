/**
 * Priority Email Configuration API
 * 
 * GET: Get current configuration
 * POST: Update configuration
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getPriorityEmailConfig, updatePriorityEmailConfig } from '@/lib/priority-email-processor';
import { withAuth } from '@/lib/auth/middleware';

async function handler(req: NextApiRequest, res: NextApiResponse, user: any) {
  if (req.method === 'GET') {
    try {
      const config = await getPriorityEmailConfig();
      
      return res.status(200).json({
        success: true,
        config,
      });
    } catch (error: any) {
      console.error('❌ [PriorityEmailConfig] Failed to get config:', error);
      return res.status(500).json({
        error: 'Failed to get configuration',
        details: error.message,
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { enabled, intervalMinutes } = req.body;

      // Validate interval
      if (intervalMinutes !== undefined) {
        if (typeof intervalMinutes !== 'number' || intervalMinutes < 1 || intervalMinutes > 60) {
          return res.status(400).json({
            error: 'Invalid interval',
            message: 'Interval must be between 1 and 60 minutes',
          });
        }
      }

      // Update configuration
      await updatePriorityEmailConfig(enabled, intervalMinutes);

      // Get updated configuration
      const config = await getPriorityEmailConfig();

      return res.status(200).json({
        success: true,
        config,
        message: 'Configuration updated successfully',
      });
    } catch (error: any) {
      console.error('❌ [PriorityEmailConfig] Failed to update config:', error);
      return res.status(500).json({
        error: 'Failed to update configuration',
        details: error.message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);

