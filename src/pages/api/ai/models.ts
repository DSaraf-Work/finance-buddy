// AI Model Management API Endpoint

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { getAIManager } from '@/lib/ai/manager';
import { checkEnvironmentVariables } from '@/lib/ai/config';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  console.log('🤖 AI Models API request:', {
    method: req.method,
    user_id: user.id,
    timestamp: new Date().toISOString(),
  });

  try {
    const aiManager = getAIManager();

    switch (req.method) {
      case 'GET':
        // Get model status and configuration
        const modelStatus = await aiManager.getModelStatus();
        const envCheck = checkEnvironmentVariables();
        
        console.log('📊 AI Model Status Retrieved:', {
          modelCount: Object.keys(modelStatus).length,
          healthyModels: Object.values(modelStatus).filter((s: any) => s.healthy).length,
          envValid: envCheck.valid,
        });

        res.status(200).json({
          models: modelStatus,
          environment: envCheck,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'POST':
        // Test AI model with a simple request
        const { model, prompt = 'Hello, please respond with "AI model is working correctly."' } = req.body;

        if (!prompt) {
          return res.status(400).json({ error: 'Prompt is required for testing' });
        }

        console.log('🧪 Testing AI model:', { model, promptLength: prompt.length });

        const testResponse = await aiManager.generateResponse({
          prompt,
          maxTokens: 50,
          temperature: 0.1,
        });

        console.log('✅ AI model test successful:', {
          model: testResponse.model,
          provider: testResponse.provider,
          responseLength: testResponse.content.length,
          usage: testResponse.usage,
        });

        res.status(200).json({
          success: true,
          response: testResponse.content,
          model: testResponse.model,
          provider: testResponse.provider,
          usage: testResponse.usage,
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
        break;
    }

  } catch (error: any) {
    console.error('❌ AI Models API error:', error);
    
    res.status(500).json({ 
      error: 'AI models operation failed',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});
