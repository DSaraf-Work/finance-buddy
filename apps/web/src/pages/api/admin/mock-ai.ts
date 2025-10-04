import { NextApiRequest, NextApiResponse } from 'next';
import { MockAIConfig } from '@/lib/config/mock-ai-config';

/**
 * API endpoint to manage Mock AI configuration
 * GET: Returns current mock AI status
 * POST: Toggles mock AI on/off
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Return current status
      const status = MockAIConfig.getStatus();
      
      return res.status(200).json({
        success: true,
        mockAI: {
          enabled: status.enabled,
          source: status.source,
          description: status.description,
        },
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
      
      // Perform the requested action
      switch (action) {
        case 'enable':
          MockAIConfig.enable();
          break;
        case 'disable':
          MockAIConfig.disable();
          break;
        case 'toggle':
          MockAIConfig.toggle();
          break;
      }
      
      // Return updated status
      const newStatus = MockAIConfig.getStatus();
      
      return res.status(200).json({
        success: true,
        action: action,
        mockAI: {
          enabled: newStatus.enabled,
          source: newStatus.source,
          description: newStatus.description,
        },
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
}
