export interface PubSubMessage {
  message: {
    data: string; // base64-encoded
    messageId: string;
    publishTime: string;
    attributes?: Record<string, string>;
  };
  subscription: string;
}

export interface GmailNotification {
  emailAddress: string;
  messageId: string;
  subject?: string;
  from?: string;
  historyId?: string;
}

export class WebhookValidator {
  /**
   * Validate Pub/Sub message structure
   */
  validateMessage(body: any): boolean {
    if (!body || !body.message) {
      console.error('❌ Invalid message: missing body or message');
      return false;
    }

    const { message } = body;
    if (!message.data || !message.messageId) {
      console.error('❌ Invalid message: missing data or messageId');
      return false;
    }

    return true;
  }

  /**
   * Parse Pub/Sub message data
   * Supports both new format (attributes) and old format (base64 data)
   */
  parseMessage(body: PubSubMessage): GmailNotification {
    try {
      // NEW FORMAT: Check if attributes exist (Gmail Apps Script format)
      if (body.message.attributes) {
        const attrs = body.message.attributes as any;

        if (!attrs.emailAddress || !attrs.messageId) {
          throw new Error('Missing emailAddress or messageId in attributes');
        }

        console.log('📨 Using new message format (attributes)');
        return {
          emailAddress: attrs.emailAddress,
          messageId: attrs.messageId,
          subject: attrs.subject,
          from: attrs.from,
          historyId: attrs.historyId,
        };
      }

      // OLD FORMAT: Fallback to base64 data
      const dataStr = Buffer.from(body.message.data, 'base64').toString('utf-8');

      // Check if this is a test message from GCP Console
      if (dataStr.includes('test') || dataStr.includes('Test') || dataStr.includes('TEST')) {
        console.log('📨 Detected test message from GCP Console:', dataStr);
        throw new Error(`Test message detected: "${dataStr}". This is not a Gmail notification.`);
      }

      const data = JSON.parse(dataStr);

      if (!data.emailAddress) {
        throw new Error('Missing emailAddress in notification');
      }

      console.log('📨 Using old message format (base64 data)');
      return {
        emailAddress: data.emailAddress,
        messageId: data.messageId || '',
        historyId: data.historyId,
      };
    } catch (error: any) {
      console.error('❌ Failed to parse message:', error);
      throw new Error(`Failed to parse Pub/Sub message: ${error.message}`);
    }
  }

  /**
   * Verify webhook token (optional security)
   */
  verifyToken(token: string | undefined): boolean {
    const expectedToken = process.env.PUBSUB_WEBHOOK_TOKEN;
    
    // If no token is configured, skip verification
    if (!expectedToken) {
      console.warn('⚠️ PUBSUB_WEBHOOK_TOKEN not set, skipping token verification');
      return true;
    }

    // If token is configured, verify it matches
    if (!token) {
      console.error('❌ No token provided in request');
      return false;
    }

    const isValid = token === expectedToken;
    if (!isValid) {
      console.error('❌ Invalid webhook token');
    }

    return isValid;
  }
}

