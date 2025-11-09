import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_EMAILS_FETCHED,
  TABLE_GMAIL_CONNECTIONS
} from '@/lib/constants/database';
import {
  getEnhancedMessage,
  refreshAccessToken,
  validateEmailContent,
  parseRawEmailContentEnhanced
} from '@/lib/gmail';

/**
 * Enhanced email re-processing endpoint
 * Uses multiple strategies to fetch complete email content from Gmail API
 * Fixes emails that have truncated or incomplete content
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emailId, userId, batchSize = 10, forceReprocess = false } = req.body;

    console.log('🔧 Enhanced Email Re-processing Request:', {
      emailId,
      userId,
      batchSize,
      forceReprocess,
      timestamp: new Date().toISOString()
    });

    // Build query to find emails that need re-processing
    let query = (supabaseAdmin as any)
      .from(TABLE_EMAILS_FETCHED)
      .select('*');

    if (emailId) {
      // Process specific email
      query = query.eq('id', emailId);
    } else if (userId) {
      // Process emails for specific user
      query = query.eq('user_id', userId);
      
      if (!forceReprocess) {
        // Only process emails that likely have incomplete content
        query = query.or(
          'plain_body.is.null,' +
          'plain_body.ilike.%Email disclaimer%,' +
          'char_length(plain_body).lt.500'
        );
      }
    } else {
      // Process emails that likely have incomplete content across all users
      query = query.or(
        'plain_body.is.null,' +
        'plain_body.ilike.%Email disclaimer%,' +
        'char_length(plain_body).lt.500'
      );
    }

    const { data: emails, error: emailError } = await query.limit(batchSize);

    if (emailError) {
      console.error('❌ Error fetching emails:', emailError);
      return res.status(500).json({ error: 'Failed to fetch emails' });
    }

    if (!emails || emails.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No emails found for re-processing',
        processed: 0,
        results: []
      });
    }

    console.log(`📧 Found ${emails.length} emails for enhanced re-processing`);

    const results = [];
    let successCount = 0;
    let improvedCount = 0;

    for (const email of emails) {
      try {
        console.log(`🔄 Enhanced processing email ${email.id}:`, {
          subject: email.subject,
          fromAddress: email.from_address,
          currentBodyLength: email.plain_body?.length || 0
        });

        // Get the Gmail connection
        const { data: connection, error: connectionError } = await (supabaseAdmin as any)
          .from(TABLE_GMAIL_CONNECTIONS)
          .select('*')
          .eq('id', email.connection_id)
          .single();

        if (connectionError || !connection) {
          console.error(`❌ Gmail connection not found for email ${email.id}`);
          results.push({
            emailId: email.id,
            success: false,
            error: 'Gmail connection not found'
          });
          continue;
        }

        // Refresh access token if needed
        let accessToken = connection.access_token;
        if (connection.expires_at && new Date(connection.expires_at) <= new Date()) {
          console.log(`🔄 Refreshing access token for connection ${connection.id}...`);
          const refreshedTokens = await refreshAccessToken(connection.refresh_token);
          accessToken = refreshedTokens.access_token!;
          
          // Update the connection with new tokens
          await (supabaseAdmin as any)
            .from(TABLE_GMAIL_CONNECTIONS)
            .update({
              access_token: refreshedTokens.access_token,
              expires_at: (refreshedTokens as any).expiry_date ? new Date((refreshedTokens as any).expiry_date).toISOString() : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', connection.id);
        }

        // Use enhanced message fetching
        const enhancedResult = await getEnhancedMessage(accessToken, email.message_id);

        const improvement = {
          originalLength: email.plain_body?.length || 0,
          enhancedLength: enhancedResult.content?.length || 0,
          improvement: (enhancedResult.content?.length || 0) - (email.plain_body?.length || 0),
          hasImprovement: (enhancedResult.content?.length || 0) > (email.plain_body?.length || 0),
          strategy: enhancedResult.strategy,
          validation: enhancedResult.validation
        };

        console.log(`📊 Enhanced processing results for ${email.id}:`, improvement);

        // Update the email if we have better content
        if (improvement.hasImprovement || enhancedResult.validation.isValid) {
          const { error: updateError } = await (supabaseAdmin as any)
            .from(TABLE_EMAILS_FETCHED)
            .update({
              plain_body: enhancedResult.content,
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id);

          if (updateError) {
            console.error(`❌ Failed to update email ${email.id}:`, updateError);
            results.push({
              emailId: email.id,
              success: false,
              error: 'Failed to update email',
              improvement
            });
          } else {
            console.log(`✅ Successfully updated email ${email.id} with enhanced content`);
            successCount++;
            if (improvement.hasImprovement) improvedCount++;
            
            results.push({
              emailId: email.id,
              success: true,
              improvement,
              contentPreview: enhancedResult.content?.substring(0, 200) + '...',
              strategy: enhancedResult.strategy,
              validation: enhancedResult.validation
            });
          }
        } else {
          console.log(`ℹ️ No improvement found for email ${email.id}`);
          successCount++;
          results.push({
            emailId: email.id,
            success: true,
            improvement,
            message: 'No improvement found',
            strategy: enhancedResult.strategy,
            validation: enhancedResult.validation
          });
        }

      } catch (error) {
        console.error(`❌ Error processing email ${email.id}:`, error);
        results.push({
          emailId: email.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return res.status(200).json({
      success: true,
      processed: emails.length,
      successful: successCount,
      improved: improvedCount,
      results,
      summary: {
        totalEmails: emails.length,
        successfullyProcessed: successCount,
        contentImproved: improvedCount,
        failedProcessing: emails.length - successCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Enhanced email re-processing error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
