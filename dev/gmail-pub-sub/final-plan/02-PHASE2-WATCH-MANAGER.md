# Phase 2: Gmail Watch Management

## 🎯 Objective
Implement Gmail watch lifecycle management including setup, renewal, and status tracking.

---

## 📁 New Files to Create

### **1. Watch Manager Service**
**File**: `src/lib/gmail-watch/watch-manager.ts`

Core service for managing Gmail watch subscriptions.

```typescript
import { google } from 'googleapis';
import { supabaseAdmin } from '../supabase';
import { createGmailClient, refreshAccessToken } from '../gmail';

export interface WatchSetupResult {
  success: boolean;
  historyId?: string;
  expiration?: Date;
  error?: string;
}

export interface WatchRenewalResult {
  success: boolean;
  newExpiration?: Date;
  error?: string;
}

export class WatchManager {
  private readonly TOPIC_NAME: string;
  
  constructor() {
    // Format: projects/{PROJECT_ID}/topics/{TOPIC_NAME}
    this.TOPIC_NAME = `projects/${process.env.GCP_PROJECT_ID}/topics/gmail-notifications`;
  }

  /**
   * Set up Gmail watch for a connection
   */
  async setupWatch(connectionId: string): Promise<WatchSetupResult> {
    // Implementation details in next section
  }

  /**
   * Renew an existing watch subscription
   */
  async renewWatch(subscriptionId: string): Promise<WatchRenewalResult> {
    // Implementation details in next section
  }

  /**
   * Stop watch for a connection
   */
  async stopWatch(connectionId: string): Promise<void> {
    // Implementation details in next section
  }

  /**
   * Check watch status
   */
  async getWatchStatus(connectionId: string): Promise<any> {
    // Implementation details in next section
  }

  /**
   * Find watches expiring soon (within 24 hours)
   */
  async findExpiringSoon(): Promise<any[]> {
    // Implementation details in next section
  }
}
```

---

## 🔧 Implementation Details

### **1. Setup Watch Method**

```typescript
async setupWatch(connectionId: string): Promise<WatchSetupResult> {
  try {
    console.log(`🔔 Setting up watch for connection ${connectionId}`);

    // Step 1: Get connection details
    const { data: connection, error: connError } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connError || !connection) {
      throw new Error('Connection not found');
    }

    // Step 2: Refresh access token if needed
    let accessToken = connection.access_token;
    if (new Date(connection.token_expiry) <= new Date()) {
      console.log('🔄 Refreshing access token...');
      const tokens = await refreshAccessToken(connection.refresh_token);
      accessToken = tokens.access_token;
      
      // Update token in database
      await supabaseAdmin
        .from('fb_gmail_connections')
        .update({
          access_token: tokens.access_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('id', connectionId);
    }

    // Step 3: Call Gmail API users.watch
    const gmail = createGmailClient(accessToken);
    const watchResponse = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: this.TOPIC_NAME,
        labelIds: ['INBOX'], // Only watch INBOX
      },
    });

    const historyId = watchResponse.data.historyId!;
    const expiration = new Date(parseInt(watchResponse.data.expiration!));

    console.log('✅ Watch setup successful:', {
      historyId,
      expiration: expiration.toISOString(),
    });

    // Step 4: Store watch subscription in database
    await supabaseAdmin
      .from('fb_gmail_watch_subscriptions')
      .upsert({
        user_id: connection.user_id,
        connection_id: connectionId,
        history_id: historyId,
        expiration: expiration.toISOString(),
        status: 'active',
        last_renewed_at: new Date().toISOString(),
        renewal_attempts: 0,
      });

    // Step 5: Update connection
    await supabaseAdmin
      .from('fb_gmail_connections')
      .update({
        watch_enabled: true,
        watch_setup_at: new Date().toISOString(),
        last_history_id: historyId,
        last_watch_error: null,
      })
      .eq('id', connectionId);

    return {
      success: true,
      historyId,
      expiration,
    };
  } catch (error: any) {
    console.error('❌ Watch setup failed:', error);
    
    // Update error in database
    await supabaseAdmin
      .from('fb_gmail_connections')
      .update({
        last_watch_error: error.message,
      })
      .eq('id', connectionId);

    return {
      success: false,
      error: error.message,
    };
  }
}
```

### **2. Renew Watch Method**

```typescript
async renewWatch(subscriptionId: string): Promise<WatchRenewalResult> {
  try {
    console.log(`🔄 Renewing watch subscription ${subscriptionId}`);

    // Step 1: Get subscription details
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('fb_gmail_watch_subscriptions')
      .select('*, fb_gmail_connections(*)')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      throw new Error('Subscription not found');
    }

    // Step 2: Update status to 'renewing'
    await supabaseAdmin
      .from('fb_gmail_watch_subscriptions')
      .update({ status: 'renewing' })
      .eq('id', subscriptionId);

    // Step 3: Setup new watch (Gmail doesn't have explicit renewal)
    const result = await this.setupWatch(subscription.connection_id);

    if (!result.success) {
      // Mark as failed
      await supabaseAdmin
        .from('fb_gmail_watch_subscriptions')
        .update({
          status: 'failed',
          last_error: result.error,
          renewal_attempts: subscription.renewal_attempts + 1,
        })
        .eq('id', subscriptionId);

      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      newExpiration: result.expiration,
    };
  } catch (error: any) {
    console.error('❌ Watch renewal failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### **3. Stop Watch Method**

```typescript
async stopWatch(connectionId: string): Promise<void> {
  try {
    console.log(`🛑 Stopping watch for connection ${connectionId}`);

    // Step 1: Get connection
    const { data: connection } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (!connection) {
      throw new Error('Connection not found');
    }

    // Step 2: Call Gmail API users.stop
    const gmail = createGmailClient(connection.access_token);
    await gmail.users.stop({ userId: 'me' });

    // Step 3: Update database
    await supabaseAdmin
      .from('fb_gmail_watch_subscriptions')
      .update({ status: 'expired' })
      .eq('connection_id', connectionId);

    await supabaseAdmin
      .from('fb_gmail_connections')
      .update({
        watch_enabled: false,
        last_watch_error: null,
      })
      .eq('id', connectionId);

    console.log('✅ Watch stopped successfully');
  } catch (error: any) {
    console.error('❌ Failed to stop watch:', error);
    throw error;
  }
}
```

---

## 🔄 Watch Renewal Cron Job

**File**: `src/pages/api/cron/gmail-watch-renewal.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { WatchManager } from '@/lib/gmail-watch/watch-manager';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret
  const cronSecret = req.headers['authorization'];
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🔄 Watch renewal cron started');

  try {
    const watchManager = new WatchManager();

    // Find watches expiring in next 24 hours
    const expiringDate = new Date();
    expiringDate.setHours(expiringDate.getHours() + 24);

    const { data: expiring } = await supabaseAdmin
      .from('fb_gmail_watch_subscriptions')
      .select('*')
      .eq('status', 'active')
      .lt('expiration', expiringDate.toISOString());

    console.log(`📋 Found ${expiring?.length || 0} watches to renew`);

    const results = [];
    for (const subscription of expiring || []) {
      const result = await watchManager.renewWatch(subscription.id);
      results.push({
        subscription_id: subscription.id,
        success: result.success,
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      renewed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error: any) {
    console.error('❌ Watch renewal cron failed:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

---

## ✅ Testing Checklist

- [ ] WatchManager class created
- [ ] setupWatch method implemented
- [ ] renewWatch method implemented
- [ ] stopWatch method implemented
- [ ] Cron job created
- [ ] Unit tests written
- [ ] Integration tests with Gmail API
- [ ] Error handling verified
- [ ] Database updates verified

---

**Next Phase**: Phase 3 - Webhook Handler

