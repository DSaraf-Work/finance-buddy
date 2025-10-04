import { NextApiRequest, NextApiResponse } from 'next';
import { EmailProcessor } from '@/lib/email-processing/processor';

/**
 * Test endpoint to verify that the processing flow uses the same standardized extractor
 * as the re-extraction flow
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emailId } = req.body;

    if (!emailId) {
      return res.status(400).json({ error: 'emailId is required' });
    }

    console.log('🧪 Testing processing flow with standardized extractor:', {
      emailId,
      timestamp: new Date().toISOString()
    });

    // Initialize email processor (now uses SchemaAwareTransactionExtractor)
    const processor = new EmailProcessor();

    // Process the specific email
    const result = await processor.processEmails({
      emailId: emailId,
      userId: '19ebbae0-475b-4043-85f9-438cd07c3677', // Test user ID
      batchSize: 1,
      forceReprocess: true,
    });

    console.log('✅ Processing flow test completed:', {
      success: result.success,
      processedCount: result.processedCount,
      successCount: result.successCount,
      errorCount: result.errorCount,
      errors: result.errors,
      processingTime: result.processingTime
    });

    return res.status(200).json({
      success: true,
      message: 'Processing flow test completed',
      result: {
        success: result.success,
        processedCount: result.processedCount,
        successCount: result.successCount,
        errorCount: result.errorCount,
        errors: result.errors,
        processingTime: result.processingTime
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Processing flow test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Processing flow test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
