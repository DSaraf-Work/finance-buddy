# Auto-Sync API Endpoints Implementation

## Notification API Endpoints

### 1. List Notifications

**File**: `src/pages/api/notifications/index.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { NotificationManager } from '@/lib/notifications';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      read, 
      type, 
      limit = '20', 
      offset = '0' 
    } = req.query;

    const notificationManager = new NotificationManager();
    
    const filters = {
      read: read === 'true' ? true : read === 'false' ? false : undefined,
      type: type as any,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const result = await notificationManager.getNotifications(user.id, filters);

    return res.status(200).json({
      notifications: result.notifications,
      total: result.total,
      limit: filters.limit,
      offset: filters.offset,
    });
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch notifications',
      details: error.message 
    });
  }
});
```

### 2. Get Unread Count

**File**: `src/pages/api/notifications/unread-count.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { NotificationManager } from '@/lib/notifications';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const notificationManager = new NotificationManager();
    const count = await notificationManager.getUnreadCount(user.id);

    return res.status(200).json({ count });
  } catch (error: any) {
    console.error('Failed to get unread count:', error);
    return res.status(500).json({ 
      error: 'Failed to get unread count',
      details: error.message 
    });
  }
});
```

### 3. Mark Notification as Read

**File**: `src/pages/api/notifications/[id]/mark-read.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { NotificationManager } from '@/lib/notifications';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const notificationManager = new NotificationManager();
    await notificationManager.markAsRead(id, user.id);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Failed to mark notification as read:', error);
    return res.status(500).json({ 
      error: 'Failed to mark notification as read',
      details: error.message 
    });
  }
});
```

### 4. Mark All as Read

**File**: `src/pages/api/notifications/mark-all-read.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { NotificationManager } from '@/lib/notifications';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const notificationManager = new NotificationManager();
    await notificationManager.markAllAsRead(user.id);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Failed to mark all notifications as read:', error);
    return res.status(500).json({ 
      error: 'Failed to mark all notifications as read',
      details: error.message 
    });
  }
});
```

### 5. Delete Notification

**File**: `src/pages/api/notifications/[id]/index.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { NotificationManager } from '@/lib/notifications';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const notificationManager = new NotificationManager();
    await notificationManager.delete(id, user.id);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete notification:', error);
    return res.status(500).json({ 
      error: 'Failed to delete notification',
      details: error.message 
    });
  }
});
```

---

## Transaction API Endpoints

### 1. Get Transaction Details

**File**: `src/pages/api/transactions/[id]/index.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid transaction ID' });
  }

  if (req.method === 'GET') {
    try {
      // Fetch transaction with related email
      const { data: transaction, error: txnError } = await supabaseAdmin
        .from('fb_extracted_transactions')
        .select(`
          *,
          email:fb_emails!email_row_id (
            id,
            message_id,
            from_address,
            to_addresses,
            subject,
            snippet,
            internal_date,
            plain_body,
            status
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (txnError || !transaction) {
        return res.status(404).json({ 
          error: 'Transaction not found',
          details: txnError?.message 
        });
      }

      return res.status(200).json({ transaction });
    } catch (error: any) {
      console.error('Failed to fetch transaction:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch transaction',
        details: error.message 
      });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const updates = req.body;

      // Validate updates
      const allowedFields = [
        'txn_time',
        'amount',
        'currency',
        'direction',
        'merchant_name',
        'merchant_normalized',
        'category',
        'account_hint',
        'reference_id',
        'location',
        'account_type',
        'transaction_type',
        'user_notes',
        'status',
      ];

      const filteredUpdates: any = {};
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      }

      filteredUpdates.updated_at = new Date().toISOString();

      // Update transaction
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('fb_extracted_transactions')
        .update(filteredUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ 
          error: 'Failed to update transaction',
          details: updateError.message 
        });
      }

      return res.status(200).json({ transaction: updated });
    } catch (error: any) {
      console.error('Failed to update transaction:', error);
      return res.status(500).json({ 
        error: 'Failed to update transaction',
        details: error.message 
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error: deleteError } = await supabaseAdmin
        .from('fb_extracted_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) {
        return res.status(500).json({ 
          error: 'Failed to delete transaction',
          details: deleteError.message 
        });
      }

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Failed to delete transaction:', error);
      return res.status(500).json({ 
        error: 'Failed to delete transaction',
        details: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});
```

---

## Auto-Sync Control Endpoints

### 1. Enable/Disable Auto-Sync

**File**: `src/pages/api/gmail/auto-sync/toggle.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { connection_id, enabled } = req.body;

    if (!connection_id || typeof enabled !== 'boolean') {
      return res.status(400).json({ 
        error: 'connection_id and enabled are required' 
      });
    }

    // Verify connection ownership
    const { data: connection, error: connError } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('id')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Update auto-sync settings
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('fb_gmail_connections')
      .update({
        auto_sync_enabled: enabled,
        auto_sync_interval_minutes: 15, // Fixed at 15 minutes
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection_id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ 
        error: 'Failed to update auto-sync settings',
        details: updateError.message 
      });
    }

    return res.status(200).json({ 
      success: true,
      connection: updated 
    });
  } catch (error: any) {
    console.error('Failed to toggle auto-sync:', error);
    return res.status(500).json({ 
      error: 'Failed to toggle auto-sync',
      details: error.message 
    });
  }
});
```

### 2. Get Auto-Sync Status

**File**: `src/pages/api/gmail/auto-sync/status.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { connection_id } = req.query;

    if (!connection_id || typeof connection_id !== 'string') {
      return res.status(400).json({ error: 'connection_id is required' });
    }

    // Fetch connection with auto-sync settings
    const { data: connection, error: connError } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('id, auto_sync_enabled, auto_sync_interval_minutes, last_auto_sync_at')
      .eq('id', connection_id)
      .eq('user_id', user.id)
      .single();

    if (connError || !connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    return res.status(200).json({ 
      auto_sync_enabled: connection.auto_sync_enabled,
      interval_minutes: connection.auto_sync_interval_minutes,
      last_sync_at: connection.last_auto_sync_at,
    });
  } catch (error: any) {
    console.error('Failed to get auto-sync status:', error);
    return res.status(500).json({ 
      error: 'Failed to get auto-sync status',
      details: error.message 
    });
  }
});
```

---

## Cron Endpoint for Auto-Sync

**File**: `src/pages/api/cron/gmail-auto-sync.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { SyncExecutor } from '@/lib/gmail-auto-sync/sync-executor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret (for security)
  const cronSecret = req.headers['authorization'];
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🕐 Auto-sync cron job started:', new Date().toISOString());

  try {
    // Find all connections with auto-sync enabled
    const { data: connections, error: connError } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('*')
      .eq('auto_sync_enabled', true);

    if (connError) {
      throw connError;
    }

    if (!connections || connections.length === 0) {
      console.log('ℹ️ No connections with auto-sync enabled');
      return res.status(200).json({ 
        success: true,
        message: 'No connections to sync' 
      });
    }

    console.log(`📧 Found ${connections.length} connections with auto-sync enabled`);

    const syncExecutor = new SyncExecutor();
    const results = [];

    // Process each connection
    for (const connection of connections) {
      try {
        // Check if sync is due
        const lastSync = connection.last_auto_sync_at 
          ? new Date(connection.last_auto_sync_at)
          : new Date(0);
        const now = new Date();
        const minutesSinceLastSync = (now.getTime() - lastSync.getTime()) / (1000 * 60);

        if (minutesSinceLastSync < connection.auto_sync_interval_minutes) {
          console.log(`⏭️ Skipping connection ${connection.id} (synced ${minutesSinceLastSync.toFixed(1)} minutes ago)`);
          continue;
        }

        console.log(`🔄 Syncing connection ${connection.id}...`);

        // Execute sync
        const result = await syncExecutor.executeAutoSync(connection);

        results.push({
          connection_id: connection.id,
          success: result.success,
          emails_synced: result.emails_synced,
          transactions_processed: result.transactions_processed,
          notifications_created: result.notifications_created,
        });

        // Update last sync time
        await supabaseAdmin
          .from('fb_gmail_connections')
          .update({
            last_auto_sync_at: new Date().toISOString(),
          })
          .eq('id', connection.id);

      } catch (error: any) {
        console.error(`❌ Failed to sync connection ${connection.id}:`, error);
        results.push({
          connection_id: connection.id,
          success: false,
          error: error.message,
        });
      }
    }

    console.log('✅ Auto-sync cron job completed:', {
      total_connections: connections.length,
      results,
    });

    return res.status(200).json({ 
      success: true,
      results 
    });

  } catch (error: any) {
    console.error('❌ Auto-sync cron job failed:', error);
    return res.status(500).json({ 
      error: 'Auto-sync failed',
      details: error.message 
    });
  }
}
```

---

## Vercel Cron Configuration

**File**: `vercel.json` (add to existing configuration)

```json
{
  "crons": [
    {
      "path": "/api/cron/gmail-auto-sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Environment Variable** (add to `.env.local` and Vercel):
```
CRON_SECRET=your-random-secret-here
```

