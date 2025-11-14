/**
 * Gmail Pub/Sub Webhook Endpoint
 * 
 * Receives push notifications from Google Cloud Pub/Sub when new emails arrive.
 * This endpoint is called by Google's Pub/Sub service when Gmail receives new emails.
 * 
 * Flow:
 * 1. Gmail receives new email
 * 2. Google Cloud Pub/Sub publishes notification
 * 3. This webhook receives the notification
 * 4. Webhook triggers email sync for the affected user
 * 
 * Pub/Sub Message Format:
 * {
 *   "message": {
 *     "data": "base64-encoded-payload",
 *     "messageId": "string",
 *     "publishTime": "timestamp"
 *   },
 *   "subscription": "string"
 * }
 * 
 * Decoded Payload Format:
 * {
 *   "emailAddress": "user@gmail.com",
 *   "historyId": "1234567"
 * }
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_GMAIL_CONNECTIONS } from '@/lib/constants/database';

interface PubSubMessage {
  message: {
    data: string;
    messageId: string;
    publishTime: string;
    attributes?: Record<string, string>;
  };
  subscription: string;
}

interface GmailNotificationPayload {
  emailAddress: string;
  historyId: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log('📨 [Gmail Pub/Sub Webhook] Request received:', {
    requestId,
    method: req.method,
    timestamp: new Date().toISOString(),
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip'],
    },
    query: req.query,
    bodyType: typeof req.body,
    bodyKeys: req.body ? Object.keys(req.body) : [],
    bodyPreview: typeof req.body === 'string' ? req.body.substring(0, 100) : undefined,
  });

  // Only accept POST requests
  if (req.method !== 'POST') {
    console.log(`❌ [${requestId}] Method not allowed:`, req.method);
    return res.status(405).json({
      error: 'Method not allowed',
      requestId,
      allowedMethods: ['POST']
    });
  }

  try {
    // Check if body is a string (HTML from Vercel Auth)
    if (typeof req.body === 'string') {
      console.log(`❌ [${requestId}] Received HTML instead of JSON (Vercel Auth blocking):`, {
        bodyPreview: req.body.substring(0, 200),
      });
      return res.status(403).json({
        error: 'Vercel Authentication is blocking this endpoint',
        requestId,
        message: 'Please disable Vercel Authentication for /api/webhooks/* routes or configure webhook authentication',
        documentation: 'https://vercel.com/docs/security/deployment-protection'
      });
    }

    // Parse Pub/Sub message
    const pubsubMessage: PubSubMessage = req.body;

    console.log(`📦 [${requestId}] Pub/Sub message received:`, {
      messageId: pubsubMessage.message?.messageId,
      publishTime: pubsubMessage.message?.publishTime,
      subscription: pubsubMessage.subscription,
      hasData: !!pubsubMessage.message?.data,
      dataLength: pubsubMessage.message?.data?.length || 0,
      attributes: pubsubMessage.message?.attributes,
    });

    if (!pubsubMessage.message) {
      console.log(`❌ [${requestId}] Invalid Pub/Sub message: missing message`);
      return res.status(400).json({
        error: 'Invalid Pub/Sub message format',
        requestId,
        received: pubsubMessage
      });
    }

    // Gmail Pub/Sub sends notification data in attributes, not in the data field
    // The data field contains the actual email content (which we don't need here)
    let payload: GmailNotificationPayload;

    if (pubsubMessage.message.attributes) {
      // Real Gmail Pub/Sub format: data in attributes
      console.log(`📧 [${requestId}] Gmail Pub/Sub format detected (attributes):`, {
        emailAddress: pubsubMessage.message.attributes.emailAddress,
        historyId: pubsubMessage.message.attributes.historyId,
        messageId: pubsubMessage.message.attributes.messageId,
        from: pubsubMessage.message.attributes.from,
      });

      payload = {
        emailAddress: pubsubMessage.message.attributes.emailAddress as string,
        historyId: pubsubMessage.message.attributes.historyId as string,
      };
    } else if (pubsubMessage.message.data) {
      // Test format: JSON payload in data field
      const decodedData = Buffer.from(pubsubMessage.message.data, 'base64').toString('utf-8');
      console.log(`🔓 [${requestId}] Decoded payload (test format):`, decodedData);

      try {
        payload = JSON.parse(decodedData);
      } catch (parseError: any) {
        console.log(`❌ [${requestId}] Failed to parse payload as JSON:`, {
          error: parseError.message,
          decodedData: decodedData.substring(0, 200),
        });
        return res.status(400).json({
          error: 'Invalid payload format',
          requestId,
          message: 'Payload must be JSON or use attributes format',
        });
      }
    } else {
      console.log(`❌ [${requestId}] Invalid Pub/Sub message: missing both attributes and data`);
      return res.status(400).json({
        error: 'Invalid Pub/Sub message format',
        requestId,
        message: 'Message must have either attributes or data field',
      });
    }
    
    console.log(`📧 [${requestId}] Gmail notification payload:`, {
      emailAddress: payload.emailAddress,
      historyId: payload.historyId,
    });

    // Find the Gmail connection for this email address
    const { data: connection, error: connError } = await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .select('*')
      .eq('email_address', payload.emailAddress)
      .single();

    if (connError || !connection) {
      console.log(`⚠️ [${requestId}] No Gmail connection found for email:`, {
        emailAddress: payload.emailAddress,
        error: connError?.message,
      });
      
      // Return 200 to acknowledge receipt (don't retry)
      return res.status(200).json({ 
        success: true,
        message: 'No connection found for this email address',
        requestId,
        emailAddress: payload.emailAddress
      });
    }

    console.log(`✅ [${requestId}] Gmail connection found:`, {
      connectionId: connection.id,
      userId: connection.user_id,
      emailAddress: connection.email_address,
      autoSyncEnabled: connection.auto_sync_enabled,
    });

    // TODO: Trigger email sync for this connection
    // This will be implemented in the next phase
    console.log(`🔄 [${requestId}] Email sync triggered (placeholder):`, {
      connectionId: connection.id,
      historyId: payload.historyId,
    });

    return res.status(200).json({ 
      success: true,
      requestId,
      message: 'Webhook processed successfully',
      data: {
        emailAddress: payload.emailAddress,
        historyId: payload.historyId,
        connectionId: connection.id,
      }
    });

  } catch (error: any) {
    console.error(`❌ [${requestId}] Webhook processing error:`, {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });

    return res.status(500).json({ 
      error: 'Internal server error',
      requestId,
      message: error.message
    });
  }
}

