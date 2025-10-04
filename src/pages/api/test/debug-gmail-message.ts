import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { getMessage, getMessageRaw, refreshAccessToken, extractPlainTextBody, parseRawEmailContent } from '@/lib/gmail';

/**
 * Debug endpoint to fetch Gmail message details directly from Gmail API
 * This helps debug why email body extraction is failing
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { emailId } = req.body;

    if (!emailId) {
      return res.status(400).json({ error: 'Email ID is required' });
    }

    console.log('🧪 Debug Gmail Message Request:', {
      emailId,
      timestamp: new Date().toISOString()
    });

    // Get the email details from database
    const { data: email, error: emailError } = await (supabaseAdmin as any)
      .from('fb_emails')
      .select('*')
      .eq('id', emailId)
      .single();

    if (emailError || !email) {
      console.error('❌ Email not found:', emailError);
      return res.status(404).json({ error: 'Email not found' });
    }

    // Get the Gmail connection
    const { data: connection, error: connectionError } = await (supabaseAdmin as any)
      .from('fb_gmail_connections')
      .select('*')
      .eq('id', email.connection_id)
      .single();

    if (connectionError || !connection) {
      console.error('❌ Gmail connection not found:', connectionError);
      return res.status(404).json({ error: 'Gmail connection not found' });
    }

    console.log('📧 Email and Connection Found:', {
      emailId: email.id,
      messageId: email.message_id,
      subject: email.subject,
      fromAddress: email.from_address,
      connectionId: connection.id,
      connectionEmail: connection.email_address
    });

    // Refresh access token if needed
    let accessToken = connection.access_token;
    if (connection.expires_at && new Date(connection.expires_at) <= new Date()) {
      console.log('🔄 Refreshing access token...');
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

    // Fetch the message directly from Gmail API
    console.log('📧 Fetching message from Gmail API...');
    const gmailMessage = await getMessage(accessToken, email.message_id);

    // Extract the plain text body
    console.log('📄 Extracting plain text body...');
    const plainTextBody = extractPlainTextBody(gmailMessage.payload);

    // Also fetch the raw message to see the complete content
    console.log('📧 Fetching RAW message for comparison...');
    const rawMessage = await getMessageRaw(accessToken, email.message_id);

    // Parse the raw email content
    let parsedRawContent = null;
    if (rawMessage.decodedRaw) {
      console.log('🔍 Parsing raw email content...');
      parsedRawContent = parseRawEmailContent(rawMessage.decodedRaw);
    }

    console.log('✅ Gmail Message Analysis Complete:', {
      messageId: email.message_id,
      payloadMimeType: gmailMessage.payload?.mimeType,
      hasDirectBody: !!gmailMessage.payload?.body?.data,
      partsCount: gmailMessage.payload?.parts?.length || 0,
      extractedBodyLength: plainTextBody?.length || 0,
      snippet: gmailMessage.snippet
    });

    return res.status(200).json({
      success: true,
      email: {
        id: email.id,
        messageId: email.message_id,
        subject: email.subject,
        fromAddress: email.from_address,
        storedPlainBodyLength: email.plain_body?.length || 0,
        storedSnippetLength: email.snippet?.length || 0
      },
      gmailApi: {
        messageId: gmailMessage.id,
        threadId: gmailMessage.threadId,
        snippet: gmailMessage.snippet,
        payload: {
          mimeType: gmailMessage.payload?.mimeType,
          hasDirectBody: !!gmailMessage.payload?.body?.data,
          directBodySize: gmailMessage.payload?.body?.size || 0,
          partsCount: gmailMessage.payload?.parts?.length || 0,
          parts: gmailMessage.payload?.parts?.map((part, index) => ({
            index,
            mimeType: part.mimeType,
            hasBodyData: !!part.body?.data,
            bodySize: part.body?.size || 0,
            hasNestedParts: !!part.parts,
            nestedPartsCount: part.parts?.length || 0
          })) || []
        }
      },
      extraction: {
        extractedBodyLength: plainTextBody?.length || 0,
        extractedBodyPreview: plainTextBody?.substring(0, 500) || null,
        hasContent: !!plainTextBody && plainTextBody.length > 100
      },
      rawMessage: {
        hasRaw: !!rawMessage.raw,
        rawLength: rawMessage.raw?.length || 0,
        decodedRawLength: rawMessage.decodedRaw?.length || 0,
        decodedRawPreview: rawMessage.decodedRaw?.substring(0, 1000) || null
      },
      parsedRawContent: parsedRawContent ? {
        hasPlainText: !!parsedRawContent.plainTextBody,
        hasHtml: !!parsedRawContent.htmlBody,
        plainTextLength: parsedRawContent.plainTextBody?.length || 0,
        htmlLength: parsedRawContent.htmlBody?.length || 0,
        totalBodies: parsedRawContent.allBodies.length,
        plainTextPreview: parsedRawContent.plainTextBody?.substring(0, 500) || null,
        htmlPreview: parsedRawContent.htmlBody?.substring(0, 500) || null,
        allBodiesPreview: parsedRawContent.allBodies.map((body, index) => ({
          index,
          preview: body.substring(0, 300) + '...'
        }))
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Debug Gmail message error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
