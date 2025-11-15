import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth/middleware';
import { MockAIConfig } from '@/lib/config/mock-ai-config';

/**
 * API endpoint to manage user-level Mock AI configuration
 * GET: Returns current user's mock AI status
 * POST: Toggles/enables/disables mock AI for current user
 */
export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const userId = user.id;

  try {
    if (req.method === 'GET') {
      // Return current user's status
      const status = await MockAIConfig.getStatusForUser(userId);

      return res.status(200).json({
        success: true,
        mockAI: {
          enabled: status.enabled,
          source: status.source,
          description: status.description,
        },
        userId,
        timestamp: new Date().toISOString(),
      });
    }
    
    if (req.method === 'POST') {
      const { action } = req.body;
      
      if (!action || !['enable', 'disable', 'toggle'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Must be "enable", "disable", or "toggle"',
        });
      }
      
      // Perform the requested action for the current user
      let newEnabled: boolean;

      switch (action) {
        case 'enable':
          await MockAIConfig.enableForUser(userId);
          newEnabled = true;
          break;
        case 'disable':
          await MockAIConfig.disableForUser(userId);
          newEnabled = false;
          break;
        case 'toggle':
          newEnabled = await MockAIConfig.toggleForUser(userId);
          break;
        default:
          newEnabled = false;
      }

      // Return updated status
      const newStatus = await MockAIConfig.getStatusForUser(userId);

      return res.status(200).json({
        success: true,
        action: action,
        mockAI: {
          enabled: newStatus.enabled,
          source: newStatus.source,
          description: newStatus.description,
        },
        userId,
        message: newStatus.enabled
          ? 'Mock AI enabled - using pattern-based extraction'
          : 'Mock AI disabled - using real AI models',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Method not allowed
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
    
  } catch (error) {
    console.error('Mock AI API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
