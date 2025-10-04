// Email Processing API Endpoint

import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { EmailProcessor } from '@/lib/email-processing/processor';
import { getAIManager } from '@/lib/ai/manager';

interface ProcessEmailsRequest {
  emailId?: string;
  batchSize?: number;
  forceReprocess?: boolean;
}

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📧 Email processing request:', {
    user_id: user.id,
    user_email: user.email,
    request_body: req.body,
    timestamp: new Date().toISOString(),
  });

  try {
    const { emailId, batchSize = 10, forceReprocess = false }: ProcessEmailsRequest = req.body;

    // Validate batch size
    if (batchSize && (batchSize < 1 || batchSize > 100)) {
      return res.status(400).json({ 
        error: 'Batch size must be between 1 and 100' 
      });
    }

    // Check AI model status before processing
    const aiManager = getAIManager();
    const modelStatus = await aiManager.getModelStatus();
    
    console.log('🤖 AI Model Status:', modelStatus);
    
    // Check if at least one model is healthy
    const hasHealthyModel = Object.values(modelStatus).some((status: any) => status.healthy);
    if (!hasHealthyModel) {
      return res.status(503).json({ 
        error: 'No AI models are currently available',
        modelStatus 
      });
    }

    // Initialize email processor
    const processor = new EmailProcessor();

    // Get processing stats before starting
    const statsBefore = await processor.getProcessingStats(user.id);
    console.log('📊 Processing stats before:', statsBefore);

    // Process emails
    const result = await processor.processEmails({
      emailId,
      userId: user.id,
      batchSize,
      forceReprocess,
    });

    // Get processing stats after completion
    const statsAfter = await processor.getProcessingStats(user.id);
    console.log('📊 Processing stats after:', statsAfter);

    console.log('✅ Email processing completed:', {
      user_id: user.id,
      result: {
        success: result.success,
        processedCount: result.processedCount,
        successCount: result.successCount,
        errorCount: result.errorCount,
        processingTime: result.processingTime,
      },
    });

    // Return detailed response
    res.status(200).json({
      success: result.success,
      processed: result.processedCount,
      successful: result.successCount,
      errors: result.errorCount,
      processingTime: result.processingTime,
      errorDetails: result.errors,
      stats: {
        before: statsBefore,
        after: statsAfter,
      },
      modelStatus,
    });

  } catch (error: any) {
    console.error('❌ Email processing error:', error);
    
    res.status(500).json({ 
      error: 'Email processing failed',
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Export configuration for larger request bodies
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
