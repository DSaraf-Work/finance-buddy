import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { 
  getMessage, 
  getMessageRaw, 
  refreshAccessToken, 
  extractPlainTextBody, 
  parseRawEmailContent 
} from '@/lib/gmail';

/**
 * Test endpoint to fix email extraction by re-processing emails with enhanced raw parsing
 * This will update emails that have truncated content with complete content
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emailId, userId } = req.body;

    console.log('🔧 Fix Email Extraction Request:', {
      emailId,
      userId,
      timestamp: new Date().toISOString()
    });

    // Get emails to fix - either specific email or all emails with short/truncated content
    let query = (supabaseAdmin as any)
      .from('fb_emails')
      .select('*');

    if (emailId) {
      query = query.eq('id', emailId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else {
      // Find emails with likely truncated content (short plain_body or contains disclaimer)
      query = query.or('plain_body.is.null,plain_body.ilike.%Email disclaimer%,char_length(plain_body).lt.500');
    }

    const { data: emails, error: emailError } = await query.limit(10);

    if (emailError) {
      console.error('❌ Error fetching emails:', emailError);
      return res.status(500).json({ error: 'Failed to fetch emails' });
    }

    if (!emails || emails.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No emails found to fix',
        processed: 0,
        results: []
      });
    }

    console.log(`📧 Found ${emails.length} emails to fix`);

    const results = [];

    for (const email of emails) {
      try {
        console.log(`🔄 Processing email ${email.id}:`, {
          subject: email.subject,
          fromAddress: email.from_address,
          currentBodyLength: email.plain_body?.length || 0
        });

        // Get the Gmail connection
        const { data: connection, error: connectionError } = await (supabaseAdmin as any)
          .from('fb_gmail_connections')
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
            .from('fb_gmail_connections')
            .update({
              access_token: refreshedTokens.access_token,
              expires_at: (refreshedTokens as any).expiry_date ? new Date((refreshedTokens as any).expiry_date).toISOString() : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', connection.id);
        }

        // Get the original structured content
        const gmailMessage = await getMessage(accessToken, email.message_id);
        const originalPlainBody = extractPlainTextBody(gmailMessage.payload);

        // Get the raw email content
        const rawMessage = await getMessageRaw(accessToken, email.message_id);
        let enhancedPlainBody = originalPlainBody;

        if (rawMessage.decodedRaw) {
          const parsedContent = parseRawEmailContent(rawMessage.decodedRaw);
          // Use the best available content
          enhancedPlainBody = parsedContent.plainTextBody || 
                             parsedContent.htmlBody || 
                             parsedContent.allBodies.join('\n\n') || 
                             originalPlainBody;
        }

        const improvement = {
          originalLength: originalPlainBody?.length || 0,
          enhancedLength: enhancedPlainBody?.length || 0,
          improvement: (enhancedPlainBody?.length || 0) - (originalPlainBody?.length || 0),
          hasImprovement: (enhancedPlainBody?.length || 0) > (originalPlainBody?.length || 0)
        };

        console.log(`📊 Content analysis for ${email.id}:`, improvement);

        // Update the email with enhanced content if there's improvement
        if (improvement.hasImprovement) {
          const { error: updateError } = await (supabaseAdmin as any)
            .from('fb_emails')
            .update({
              plain_body: enhancedPlainBody,
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
            results.push({
              emailId: email.id,
              success: true,
              improvement,
              contentPreview: enhancedPlainBody?.substring(0, 200) + '...'
            });
          }
        } else {
          console.log(`ℹ️ No improvement needed for email ${email.id}`);
          results.push({
            emailId: email.id,
            success: true,
            improvement,
            message: 'No improvement needed'
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

    const successCount = results.filter(r => r.success).length;
    const improvementCount = results.filter(r => r.success && r.improvement?.hasImprovement).length;

    return res.status(200).json({
      success: true,
      processed: emails.length,
      successful: successCount,
      improved: improvementCount,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Fix email extraction error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
