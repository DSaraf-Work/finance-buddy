# Gmail Auto-Sync with AI Processing and Web Notifications - Implementation Plan

## Executive Summary

This document outlines the implementation plan for enhancing the Gmail auto-sync module with:
1. **Automatic AI Processing**: Process synced emails immediately with transaction extraction
2. **Web Notification System**: Alert users of newly extracted transactions
3. **Transaction Detail Page**: Sophisticated UI for viewing and editing transactions

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ Vercel Cron (Every 15 minutes)                                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Auto-Sync Executor                                              │
│ - Calculate sync window: MAX(internal_date) - 10 min           │
│ - Fetch emails from Gmail API                                  │
│ - Store in fb_emails                                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Email Processor (Immediate)                                     │
│ - Process each new email with AI                               │
│ - Extract transaction using SchemaAwareTransactionExtractor    │
│ - Store in fb_extracted_transactions                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ Notification Manager                                            │
│ - Create notification for each successful extraction           │
│ - Store in fb_notifications                                    │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│ User Interface                                                  │
│ - Notification bell with unread count                          │
│ - Notification dropdown/page                                   │
│ - Transaction detail page                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Schema (Week 1, Day 1-2)

### Migration File: `infra/migrations/0002_notifications_and_auto_sync.sql`

```sql
-- ============================================================================
-- Auto-Sync Configuration
-- ============================================================================

-- Add auto-sync columns to fb_gmail_connections
ALTER TABLE fb_gmail_connections
ADD COLUMN IF NOT EXISTS auto_sync_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_sync_interval_minutes INTEGER DEFAULT 15 CHECK (auto_sync_interval_minutes >= 5),
ADD COLUMN IF NOT EXISTS last_auto_sync_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_gmail_connections_auto_sync 
ON fb_gmail_connections(auto_sync_enabled, last_auto_sync_at) 
WHERE auto_sync_enabled = true;

-- ============================================================================
-- Sync Filters Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_sync_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES fb_gmail_connections(id) ON DELETE CASCADE,
  
  -- Filter configuration
  filter_name TEXT NOT NULL,
  filter_type TEXT NOT NULL CHECK (filter_type IN ('sender', 'subject', 'label', 'query')),
  filter_value TEXT NOT NULL,
  gmail_query TEXT NOT NULL,
  
  -- Status
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  sync_count INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(connection_id, filter_name)
);

CREATE INDEX IF NOT EXISTS idx_sync_filters_connection 
ON fb_sync_filters(connection_id) WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_sync_filters_user 
ON fb_sync_filters(user_id);

-- RLS policies for sync filters
ALTER TABLE fb_sync_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync filters"
ON fb_sync_filters FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync filters"
ON fb_sync_filters FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync filters"
ON fb_sync_filters FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync filters"
ON fb_sync_filters FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- Notifications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS fb_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification content
  type TEXT NOT NULL CHECK (type IN ('transaction_processed', 'sync_error', 'system_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  transaction_id UUID REFERENCES fb_extracted_transactions(id) ON DELETE CASCADE,
  email_id UUID REFERENCES fb_emails(id) ON DELETE CASCADE,
  
  -- Action link
  action_url TEXT,
  action_label TEXT,
  
  -- Status
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON fb_notifications(user_id, read, created_at DESC) 
WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_all 
ON fb_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_transaction 
ON fb_notifications(transaction_id) 
WHERE transaction_id IS NOT NULL;

-- RLS policies for notifications
ALTER TABLE fb_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON fb_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON fb_notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON fb_notifications FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- Add missing columns to fb_extracted_transactions (if not exists)
-- ============================================================================

ALTER TABLE fb_extracted_transactions
ADD COLUMN IF NOT EXISTS account_type TEXT,
ADD COLUMN IF NOT EXISTS transaction_type TEXT CHECK (transaction_type IN ('Dr', 'Cr')),
ADD COLUMN IF NOT EXISTS ai_notes TEXT,
ADD COLUMN IF NOT EXISTS user_notes TEXT,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_extracted_transactions_status 
ON fb_extracted_transactions(user_id, status, created_at DESC);

-- ============================================================================
-- Function to auto-delete old notifications (optional)
-- ============================================================================

CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM fb_notifications
  WHERE read = true 
  AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE fb_sync_filters IS 'Email filter configurations for auto-sync';
COMMENT ON TABLE fb_notifications IS 'Web notifications for user alerts';
COMMENT ON COLUMN fb_notifications.type IS 'Notification type: transaction_processed, sync_error, system_alert';
COMMENT ON COLUMN fb_notifications.read IS 'Whether the notification has been read by the user';
```

---

## Phase 2: Notification Module (Week 1, Day 3-5)

### Module Structure

```
src/lib/notifications/
├── index.ts                    # Public API exports
├── types.ts                    # TypeScript types
├── notification-manager.ts     # Core notification CRUD
├── notification-builder.ts     # Build notification content
└── __tests__/                  # Unit tests
    ├── notification-manager.test.ts
    └── notification-builder.test.ts
```

### File: `src/lib/notifications/types.ts`

```typescript
export type NotificationType = 'transaction_processed' | 'sync_error' | 'system_alert';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  transaction_id: string | null;
  email_id: string | null;
  action_url: string | null;
  action_label: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  transactionId?: string;
  emailId?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}
```

### File: `src/lib/notifications/notification-builder.ts`

```typescript
import { CreateNotificationParams } from './types';

export class NotificationBuilder {
  /**
   * Build notification for a successfully processed transaction
   */
  static forTransaction(
    userId: string,
    transaction: any,
    email: any
  ): CreateNotificationParams {
    const merchantName = transaction.merchant_name || 'Unknown Merchant';
    const amount = transaction.amount 
      ? `${transaction.currency || 'INR'} ${transaction.amount.toFixed(2)}`
      : 'Unknown Amount';
    const transactionType = transaction.direction === 'debit' ? 'Debit' : 'Credit';
    const date = transaction.txn_time 
      ? new Date(transaction.txn_time).toLocaleDateString()
      : 'Unknown Date';
    const emailSender = email.from_address || 'Unknown Sender';

    return {
      userId,
      type: 'transaction_processed',
      title: `New Transaction Detected: ${merchantName}`,
      message: `${transactionType} of ${amount} on ${date} from ${emailSender}`,
      transactionId: transaction.id,
      emailId: email.id,
      actionUrl: `/transactions/${transaction.id}`,
      actionLabel: 'View & Edit Transaction',
    };
  }

  /**
   * Build notification for sync error
   */
  static forSyncError(
    userId: string,
    connectionId: string,
    errorMessage: string
  ): CreateNotificationParams {
    return {
      userId,
      type: 'sync_error',
      title: 'Email Sync Failed',
      message: `Failed to sync emails: ${errorMessage}`,
      actionUrl: `/settings?tab=connections`,
      actionLabel: 'Check Connection',
    };
  }

  /**
   * Build notification for system alert
   */
  static forSystemAlert(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionLabel?: string
  ): CreateNotificationParams {
    return {
      userId,
      type: 'system_alert',
      title,
      message,
      actionUrl,
      actionLabel,
    };
  }
}
```

### File: `src/lib/notifications/notification-manager.ts`

```typescript
import { supabaseAdmin } from '../supabase';
import { 
  Notification, 
  CreateNotificationParams, 
  NotificationFilters 
} from './types';

export class NotificationManager {
  /**
   * Create a new notification
   */
  async create(params: CreateNotificationParams): Promise<Notification> {
    const { data, error } = await supabaseAdmin
      .from('fb_notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        transaction_id: params.transactionId || null,
        email_id: params.emailId || null,
        action_url: params.actionUrl || null,
        action_label: params.actionLabel || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }

    console.log('✅ Notification created:', {
      id: data.id,
      type: data.type,
      title: data.title,
    });

    return data;
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    let query = supabaseAdmin
      .from('fb_notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (filters.read !== undefined) {
      query = query.eq('read', filters.read);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }

    return {
      notifications: data || [],
      total: count || 0,
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('fb_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('fb_notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('fb_notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('fb_notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Delete all read notifications
   */
  async deleteAllRead(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('fb_notifications')
      .delete()
      .eq('user_id', userId)
      .eq('read', true);

    if (error) {
      console.error('Failed to delete read notifications:', error);
      throw error;
    }
  }
}
```

### File: `src/lib/notifications/index.ts`

```typescript
export * from './types';
export * from './notification-manager';
export * from './notification-builder';
```

---

## Phase 3: Enhanced Auto-Sync with AI Processing (Week 2, Day 1-3)

### Modify: `src/lib/gmail-auto-sync/sync-executor.ts`

Add AI processing after email sync:

```typescript
import { EmailProcessor } from '../email-processing/processor';
import { NotificationManager } from '../notifications/notification-manager';
import { NotificationBuilder } from '../notifications/notification-builder';

export class SyncExecutor {
  private emailProcessor = new EmailProcessor();
  private notificationManager = new NotificationManager();

  async executeSyncForFilter(
    filter: SyncFilter,
    connection: any
  ): Promise<SyncResult> {
    // ... existing sync logic ...

    // NEW: Process emails with AI immediately after sync
    const processedTransactions = await this.processNewEmails(
      newMessageIds,
      filter.user_id
    );

    // NEW: Create notifications for processed transactions
    await this.createNotificationsForTransactions(
      processedTransactions,
      filter.user_id
    );

    return result;
  }

  /**
   * Process newly synced emails with AI
   */
  private async processNewEmails(
    emailIds: string[],
    userId: string
  ): Promise<any[]> {
    const processedTransactions: any[] = [];

    for (const emailId of emailIds) {
      try {
        // Process email with AI
        const result = await this.emailProcessor.processEmails({
          emailId,
          userId,
          batchSize: 1,
        });

        if (result.success && result.successCount > 0) {
          // Fetch the created transaction
          const { data: transaction } = await supabaseAdmin
            .from('fb_extracted_transactions')
            .select('*')
            .eq('email_row_id', emailId)
            .single();

          if (transaction) {
            processedTransactions.push(transaction);
          }
        }
      } catch (error: any) {
        console.error(`Failed to process email ${emailId}:`, error);
      }
    }

    return processedTransactions;
  }

  /**
   * Create notifications for processed transactions
   */
  private async createNotificationsForTransactions(
    transactions: any[],
    userId: string
  ): Promise<void> {
    for (const transaction of transactions) {
      try {
        // Fetch related email
        const { data: email } = await supabaseAdmin
          .from('fb_emails')
          .select('*')
          .eq('id', transaction.email_row_id)
          .single();

        if (email) {
          // Build and create notification
          const notificationParams = NotificationBuilder.forTransaction(
            userId,
            transaction,
            email
          );

          await this.notificationManager.create(notificationParams);
        }
      } catch (error: any) {
        console.error(`Failed to create notification for transaction ${transaction.id}:`, error);
      }
    }
  }
}
```

---

## Continued in next file...

This plan is comprehensive but exceeds 300 lines. I'll create additional files for the remaining phases.

