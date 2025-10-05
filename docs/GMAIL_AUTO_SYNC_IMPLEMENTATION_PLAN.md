# Gmail Auto-Sync Implementation Plan

## Executive Summary

This document provides a step-by-step implementation plan for adding automatic Gmail email synchronization to Finance Buddy. The implementation follows a modular, incremental approach to minimize risk and ensure reliability.

---

## Implementation Strategy

### Recommended Approach: **Polling-First, Push-Later**

**Phase 1 (MVP)**: Implement polling-based auto-sync
- Simpler to implement and test
- No external infrastructure dependencies
- Sufficient for small user base
- Can be deployed and validated quickly

**Phase 2 (Enhancement)**: Add Gmail push notifications
- Reduces latency and API calls
- Requires Google Cloud Pub/Sub setup
- Can be added without disrupting existing functionality

---

## Phase 1: Polling-Based Auto-Sync (MVP)

### 1.1 Database Schema Setup

**File**: `infra/migrations/0002_auto_sync.sql`

```sql
-- Add auto-sync configuration to connections
ALTER TABLE fb_gmail_connections
ADD COLUMN auto_sync_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN auto_sync_interval_minutes INTEGER DEFAULT 15 CHECK (auto_sync_interval_minutes >= 5),
ADD COLUMN last_auto_sync_at TIMESTAMPTZ;

CREATE INDEX idx_gmail_connections_auto_sync 
ON fb_gmail_connections(auto_sync_enabled, last_auto_sync_at) 
WHERE auto_sync_enabled = true;

-- Sync filters table
CREATE TABLE fb_sync_filters (
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

CREATE INDEX idx_sync_filters_connection ON fb_sync_filters(connection_id) WHERE enabled = true;
CREATE INDEX idx_sync_filters_user ON fb_sync_filters(user_id);

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
```

### 1.2 Core Module Structure

Create a new module: `src/lib/gmail-auto-sync/`

```
src/lib/gmail-auto-sync/
├── index.ts                    # Public API exports
├── types.ts                    # TypeScript types
├── filter-manager.ts           # Filter CRUD operations
├── sync-scheduler.ts           # Scheduling logic
├── sync-executor.ts            # Email fetching and storage
├── query-builder.ts            # Gmail query construction
└── __tests__/                  # Unit tests
    ├── filter-manager.test.ts
    ├── query-builder.test.ts
    └── sync-executor.test.ts
```

### 1.3 Implementation Steps

#### Step 1: Type Definitions (`types.ts`)

```typescript
export interface SyncFilter {
  id: string;
  user_id: string;
  connection_id: string;
  filter_name: string;
  filter_type: 'sender' | 'subject' | 'label' | 'query';
  filter_value: string;
  gmail_query: string;
  enabled: boolean;
  last_sync_at: string | null;
  last_error: string | null;
  sync_count: number;
  created_at: string;
  updated_at: string;
}

export interface AutoSyncConfig {
  connection_id: string;
  enabled: boolean;
  interval_minutes: number;
  last_sync_at: string | null;
}

export interface SyncJob {
  connection_id: string;
  filter_id: string;
  gmail_query: string;
  trigger: 'manual' | 'scheduled';
}

export interface SyncResult {
  success: boolean;
  emails_found: number;
  emails_synced: number;
  errors: string[];
}
```

#### Step 2: Query Builder (`query-builder.ts`)

```typescript
export class GmailQueryBuilder {
  static buildQuery(filter: SyncFilter): string {
    switch (filter.filter_type) {
      case 'sender':
        return `from:${filter.filter_value}`;
      case 'subject':
        return `subject:${filter.filter_value}`;
      case 'label':
        return `label:${filter.filter_value}`;
      case 'query':
        return filter.filter_value; // User-provided query
      default:
        throw new Error(`Unknown filter type: ${filter.filter_type}`);
    }
  }

  static validateQuery(query: string): boolean {
    // Basic validation to prevent injection
    // Gmail queries are safe, but we should still validate
    const dangerousPatterns = [';', '--', '/*', '*/'];
    return !dangerousPatterns.some(pattern => query.includes(pattern));
  }

  static combineQueries(queries: string[]): string {
    // Combine multiple queries with OR
    return queries.map(q => `(${q})`).join(' OR ');
  }
}
```

#### Step 3: Filter Manager (`filter-manager.ts`)

```typescript
import { supabaseAdmin } from '../supabase';
import { SyncFilter } from './types';
import { GmailQueryBuilder } from './query-builder';

export class FilterManager {
  async createFilter(
    userId: string,
    connectionId: string,
    filterName: string,
    filterType: SyncFilter['filter_type'],
    filterValue: string
  ): Promise<SyncFilter> {
    // Build Gmail query
    const gmailQuery = GmailQueryBuilder.buildQuery({
      filter_type: filterType,
      filter_value: filterValue,
    } as SyncFilter);

    // Validate query
    if (!GmailQueryBuilder.validateQuery(gmailQuery)) {
      throw new Error('Invalid filter query');
    }

    // Insert into database
    const { data, error } = await supabaseAdmin
      .from('fb_sync_filters')
      .insert({
        user_id: userId,
        connection_id: connectionId,
        filter_name: filterName,
        filter_type: filterType,
        filter_value: filterValue,
        gmail_query: gmailQuery,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getFilters(connectionId: string): Promise<SyncFilter[]> {
    const { data, error } = await supabaseAdmin
      .from('fb_sync_filters')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('enabled', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateFilter(
    filterId: string,
    updates: Partial<SyncFilter>
  ): Promise<SyncFilter> {
    const { data, error } = await supabaseAdmin
      .from('fb_sync_filters')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', filterId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteFilter(filterId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('fb_sync_filters')
      .delete()
      .eq('id', filterId);

    if (error) throw error;
  }
}
```

#### Step 4: Sync Executor (`sync-executor.ts`)

```typescript
import { supabaseAdmin } from '../supabase';
import { listMessages, getMessage, getEnhancedMessage, refreshAccessToken } from '../gmail';
import { SyncFilter, SyncResult } from './types';

export class SyncExecutor {
  async executeSyncForFilter(
    filter: SyncFilter,
    connection: any
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      emails_found: 0,
      emails_synced: 0,
      errors: [],
    };

    try {
      // Refresh token if needed
      let accessToken = connection.access_token;
      if (new Date(connection.token_expiry) <= new Date()) {
        const newTokens = await refreshAccessToken(connection.refresh_token);
        accessToken = newTokens.access_token!;
        
        // Update token in database
        await supabaseAdmin
          .from('fb_gmail_connections')
          .update({
            access_token: accessToken,
            token_expiry: new Date(Date.now() + 3600000).toISOString(),
          })
          .eq('id', connection.id);
      }

      // Build time-based query to only fetch recent emails
      const timeQuery = this.buildTimeQuery(filter.last_sync_at);
      const fullQuery = `${filter.gmail_query} ${timeQuery}`;

      // Fetch messages from Gmail
      const gmailResponse = await listMessages(accessToken, {
        q: fullQuery,
        maxResults: 50, // Limit to prevent timeout
      });

      const messageIds = gmailResponse.messages?.map(m => m.id) || [];
      result.emails_found = messageIds.length;

      if (messageIds.length === 0) {
        result.success = true;
        return result;
      }

      // Check which messages already exist
      const { data: existingMessages } = await supabaseAdmin
        .from('fb_emails')
        .select('message_id')
        .eq('user_id', filter.user_id)
        .eq('google_user_id', connection.google_user_id)
        .in('message_id', messageIds);

      const existingIds = new Set(existingMessages?.map(e => e.message_id) || []);
      const newMessageIds = messageIds.filter(id => !existingIds.has(id));

      // Fetch and store new messages
      for (const messageId of newMessageIds) {
        try {
          await this.fetchAndStoreMessage(
            messageId,
            accessToken,
            filter.user_id,
            connection
          );
          result.emails_synced++;
        } catch (error: any) {
          result.errors.push(`Failed to sync ${messageId}: ${error.message}`);
        }
      }

      // Update filter sync status
      await supabaseAdmin
        .from('fb_sync_filters')
        .update({
          last_sync_at: new Date().toISOString(),
          sync_count: filter.sync_count + 1,
          last_error: result.errors.length > 0 ? result.errors[0] : null,
        })
        .eq('id', filter.id);

      result.success = true;
      return result;
    } catch (error: any) {
      result.errors.push(error.message);
      return result;
    }
  }

  private buildTimeQuery(lastSyncAt: string | null): string {
    if (!lastSyncAt) {
      // First sync: get emails from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return `after:${sevenDaysAgo.toISOString().split('T')[0]}`;
    }

    // Subsequent syncs: get emails since last sync
    const lastSync = new Date(lastSyncAt);
    return `after:${lastSync.toISOString().split('T')[0]}`;
  }

  private async fetchAndStoreMessage(
    messageId: string,
    accessToken: string,
    userId: string,
    connection: any
  ): Promise<void> {
    // Reuse existing email fetching logic
    const enhancedResult = await getEnhancedMessage(accessToken, messageId);
    
    // Extract email data (same as manual-sync.ts)
    const headers = enhancedResult.message.payload?.headers || [];
    const fromAddress = this.extractEmailFromHeaders(headers);
    const subject = this.extractSubjectFromHeaders(headers);
    // ... (rest of extraction logic)

    // Upsert into fb_emails
    await supabaseAdmin
      .from('fb_emails')
      .upsert({
        user_id: userId,
        google_user_id: connection.google_user_id,
        connection_id: connection.id,
        email_address: connection.email_address,
        message_id: messageId,
        // ... (rest of fields)
      }, {
        onConflict: 'user_id,google_user_id,message_id',
      });
  }
}
```

---

## API Endpoints Implementation

### 1. Filter Management Endpoints

**File**: `src/pages/api/gmail/sync-filters/index.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { FilterManager } from '@/lib/gmail-auto-sync/filter-manager';

export default withAuth(async (req, res, user) => {
  const filterManager = new FilterManager();

  if (req.method === 'GET') {
    const { connection_id } = req.query;
    const filters = await filterManager.getFilters(connection_id as string);
    return res.json({ filters });
  }

  if (req.method === 'POST') {
    const { connection_id, filter_name, filter_type, filter_value } = req.body;
    const filter = await filterManager.createFilter(
      user.id,
      connection_id,
      filter_name,
      filter_type,
      filter_value
    );
    return res.json({ filter });
  }

  res.status(405).json({ error: 'Method not allowed' });
});
```

### 2. Auto-Sync Control Endpoint

**File**: `src/pages/api/gmail/auto-sync/toggle.ts`

### 3. Cron Endpoint

**File**: `src/pages/api/cron/gmail-auto-sync.ts`

---

## Deployment Checklist

- [ ] Run database migration
- [ ] Deploy API endpoints
- [ ] Set up Vercel Cron Job (if using Vercel)
- [ ] Test with a single user
- [ ] Monitor logs for errors
- [ ] Gradually enable for more users

---

## Testing Strategy

1. **Unit Tests**: Filter manager, query builder
2. **Integration Tests**: End-to-end sync flow
3. **Load Tests**: Multiple users, multiple filters
4. **Manual Tests**: UI interaction, error scenarios

---

## Monitoring & Alerts

- Track sync job success/failure rates
- Monitor Gmail API quota usage
- Alert on repeated failures
- Log all sync operations

---

## Next Steps

1. Review and approve this implementation plan
2. Create database migration file
3. Implement core modules (types, query builder, filter manager)
4. Implement API endpoints
5. Add UI for filter management
6. Test and deploy

