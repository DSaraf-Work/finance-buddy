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
  historyId: string;
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
   */
  parseMessage(body: PubSubMessage): GmailNotification {
    try {
      const dataStr = Buffer.from(body.message.data, 'base64').toString('utf-8');
      const data = JSON.parse(dataStr);

      if (!data.emailAddress || !data.historyId) {
        throw new Error('Missing emailAddress or historyId in notification');
      }

      return {
        emailAddress: data.emailAddress,
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

