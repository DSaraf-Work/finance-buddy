# Phase 3: Webhook Handler

## 🎯 Objective
Create Pub/Sub webhook endpoint to receive Gmail push notifications and trigger email sync.

---

## 📁 New Files to Create

### **1. Webhook Validator**
**File**: `src/lib/gmail-watch/webhook-validator.ts`

Validates incoming Pub/Sub messages.

```typescript
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
      return false;
    }

    const { message } = body;
    if (!message.data || !message.messageId) {
      return false;
    }

    return true;
  }

  /**
   * Parse Pub/Sub message data
   */
  parseMessage(body: PubSubMessage): GmailNotification {
    const dataStr = Buffer.from(body.message.data, 'base64').toString('utf-8');
    const data = JSON.parse(dataStr);

    return {
      emailAddress: data.emailAddress,
      historyId: data.historyId,
    };
  }

  /**
   * Verify webhook token (optional security)
   */
  verifyToken(token: string): boolean {
    const expectedToken = process.env.PUBSUB_WEBHOOK_TOKEN;
    if (!expectedToken) {
      return true; // Skip verification if not configured
    }
    return token === expectedToken;
  }
}
```

---

### **2. History Sync Service**
**File**: `src/lib/gmail-watch/history-sync.ts`

Handles incremental sync using Gmail history API.

```typescript
import { google } from 'googleapis';
import { createGmailClient, refreshAccessToken } from '../gmail';
import { supabaseAdmin } from '../supabase';
import { EmailProcessor } from '../email-processing/processor';

export interface HistorySyncResult {
  success: boolean;
  newMessages: number;
  processedTransactions: number;
  newHistoryId?: string;
  error?: string;
}

export class HistorySync {
  private emailProcessor = new EmailProcessor();

  /**
   * Sync emails using history.list API
   */
  async syncFromHistory(
    connectionId: string,
    startHistoryId: string
  ): Promise<HistorySyncResult> {
    try {
      console.log(`📜 Starting history sync from ${startHistoryId}`);

      // Step 1: Get connection
      const { data: connection } = await supabaseAdmin
        .from('fb_gmail_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (!connection) {
        throw new Error('Connection not found');
      }

      // Step 2: Refresh token if needed
      let accessToken = connection.access_token;
      if (new Date(connection.token_expiry) <= new Date()) {
        const tokens = await refreshAccessToken(connection.refresh_token);
        accessToken = tokens.access_token;
      }

      // Step 3: Call history.list API
      const gmail = createGmailClient(accessToken);
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: startHistoryId,
        historyTypes: ['messageAdded'], // Only new messages
        labelId: 'INBOX',
      });

      const history = historyResponse.data.history || [];
      const newHistoryId = historyResponse.data.historyId;

      console.log(`📬 Found ${history.length} history records`);

      // Step 4: Extract new message IDs
      const newMessageIds: string[] = [];
      for (const record of history) {
        if (record.messagesAdded) {
          for (const added of record.messagesAdded) {
            if (added.message?.id) {
              newMessageIds.push(added.message.id);
            }
          }
        }
      }

      console.log(`🆕 ${newMessageIds.length} new messages to sync`);

      if (newMessageIds.length === 0) {
        return {
          success: true,
          newMessages: 0,
          processedTransactions: 0,
          newHistoryId,
        };
      }

      // Step 5: Check which messages already exist
      const { data: existingEmails } = await supabaseAdmin
        .from('fb_emails')
        .select('message_id')
        .eq('user_id', connection.user_id)
        .in('message_id', newMessageIds);

      const existingIds = new Set(existingEmails?.map(e => e.message_id) || []);
      const trulyNewIds = newMessageIds.filter(id => !existingIds.has(id));

      console.log(`✨ ${trulyNewIds.length} truly new messages`);

      if (trulyNewIds.length === 0) {
        return {
          success: true,
          newMessages: 0,
          processedTransactions: 0,
          newHistoryId,
        };
      }

      // Step 6: Fetch and process new messages
      // Reuse existing manual-sync logic
      const syncResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/gmail/manual-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: connectionId,
          user_id: connection.user_id,
          message_ids: trulyNewIds,
        }),
      });

      if (!syncResponse.ok) {
        throw new Error('Failed to sync messages');
      }

      const syncData = await syncResponse.json();

      // Step 7: Process with AI
      const processedCount = await this.processNewMessages(
        trulyNewIds,
        connection.user_id
      );

      // Step 8: Update history ID
      await supabaseAdmin
        .from('fb_gmail_connections')
        .update({ last_history_id: newHistoryId })
        .eq('id', connectionId);

      await supabaseAdmin
        .from('fb_gmail_watch_subscriptions')
        .update({ history_id: newHistoryId })
        .eq('connection_id', connectionId);

      return {
        success: true,
        newMessages: trulyNewIds.length,
        processedTransactions: processedCount,
        newHistoryId,
      };
    } catch (error: any) {
      console.error('❌ History sync failed:', error);
      return {
        success: false,
        newMessages: 0,
        processedTransactions: 0,
        error: error.message,
      };
    }
  }

  /**
   * Process new messages with AI
   */
  private async processNewMessages(
    messageIds: string[],
    userId: string
  ): Promise<number> {
    let processedCount = 0;

    for (const messageId of messageIds) {
      try {
        // Get email from database
        const { data: email } = await supabaseAdmin
          .from('fb_emails')
          .select('*')
          .eq('message_id', messageId)
          .eq('user_id', userId)
          .single();

        if (!email) continue;

        // Process with AI
        const result = await this.emailProcessor.processEmails({
          emailId: email.id,
          userId: userId,
          batchSize: 1,
        });

        if (result.success) {
          processedCount++;
        }
      } catch (error) {
        console.error(`Failed to process message ${messageId}:`, error);
      }
    }

    return processedCount;
  }
}
```

---

### **3. Webhook API Endpoint**
**File**: `src/pages/api/gmail/webhook.ts`

Main webhook handler for Pub/Sub notifications.

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { WebhookValidator } from '@/lib/gmail-watch/webhook-validator';
import { HistorySync } from '@/lib/gmail-watch/history-sync';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('📨 Pub/Sub webhook received:', {
    timestamp: new Date().toISOString(),
    headers: req.headers,
  });

  try {
    const validator = new WebhookValidator();

    // Step 1: Validate message structure
    if (!validator.validateMessage(req.body)) {
      console.error('❌ Invalid Pub/Sub message structure');
      return res.status(400).json({ error: 'Invalid message' });
    }

    // Step 2: Verify token (optional)
    const token = req.headers['x-goog-pubsub-token'] as string;
    if (!validator.verifyToken(token)) {
      console.error('❌ Invalid webhook token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Step 3: Parse notification
    const notification = validator.parseMessage(req.body);
    console.log('📧 Gmail notification:', notification);

    // Step 4: Find connection by email address
    const { data: connection } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('*, fb_gmail_watch_subscriptions(*)')
      .eq('email_address', notification.emailAddress)
      .eq('watch_enabled', true)
      .single();

    if (!connection) {
      console.log('⚠️ No active watch for email:', notification.emailAddress);
      return res.status(200).json({ received: true, skipped: true });
    }

    // Step 5: Get last history ID
    const lastHistoryId = connection.last_history_id || 
                          connection.fb_gmail_watch_subscriptions?.[0]?.history_id;

    if (!lastHistoryId) {
      console.error('❌ No history ID found');
      return res.status(200).json({ received: true, error: 'No history ID' });
    }

    // Step 6: Sync from history
    const historySync = new HistorySync();
    const result = await historySync.syncFromHistory(
      connection.id,
      lastHistoryId
    );

    console.log('✅ History sync completed:', result);

    return res.status(200).json({
      received: true,
      success: result.success,
      newMessages: result.newMessages,
      processedTransactions: result.processedTransactions,
    });
  } catch (error: any) {
    console.error('❌ Webhook handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

---

## ✅ Testing Checklist

- [ ] WebhookValidator created
- [ ] HistorySync service created
- [ ] Webhook endpoint created
- [ ] Message validation tested
- [ ] History sync tested
- [ ] Error handling verified
- [ ] Integration with existing sync logic
- [ ] Pub/Sub message parsing tested

---

**Next Phase**: Phase 4 - History-Based Sync Optimization

