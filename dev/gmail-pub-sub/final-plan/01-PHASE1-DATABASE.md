# Phase 1: Database Schema & Types

## 🎯 Objective
Create database schema and TypeScript types to support Gmail watch subscriptions and history-based syncing.

---

## 📊 Database Changes

### **1. New Table: `fb_gmail_watch_subscriptions`**

Tracks active Gmail watch subscriptions for each connection.

```sql
CREATE TABLE IF NOT EXISTS fb_gmail_watch_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES fb_gmail_connections(id) ON DELETE CASCADE,
  
  -- Gmail watch details
  history_id TEXT NOT NULL,
  expiration TIMESTAMPTZ NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'expired', 'failed', 'renewing')),
  last_renewed_at TIMESTAMPTZ,
  renewal_attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(connection_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_watch_subscriptions_user 
  ON fb_gmail_watch_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_watch_subscriptions_status 
  ON fb_gmail_watch_subscriptions(status, expiration);

CREATE INDEX IF NOT EXISTS idx_watch_subscriptions_expiring 
  ON fb_gmail_watch_subscriptions(expiration) 
  WHERE status = 'active';

-- RLS Policies
ALTER TABLE fb_gmail_watch_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch subscriptions"
  ON fb_gmail_watch_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch subscriptions"
  ON fb_gmail_watch_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);
```

### **2. Update Table: `fb_gmail_connections`**

Add columns for history tracking and watch management.

```sql
ALTER TABLE fb_gmail_connections
  ADD COLUMN IF NOT EXISTS last_history_id TEXT,
  ADD COLUMN IF NOT EXISTS watch_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS watch_setup_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_watch_error TEXT;

-- Index for watch-enabled connections
CREATE INDEX IF NOT EXISTS idx_gmail_connections_watch_enabled 
  ON fb_gmail_connections(watch_enabled) 
  WHERE watch_enabled = true;
```

### **3. Comments for Documentation**

```sql
COMMENT ON TABLE fb_gmail_watch_subscriptions IS 
  'Tracks Gmail push notification watch subscriptions';

COMMENT ON COLUMN fb_gmail_watch_subscriptions.history_id IS 
  'Gmail history ID from watch response - used for incremental sync';

COMMENT ON COLUMN fb_gmail_watch_subscriptions.expiration IS 
  'Watch expiration time (Gmail watches expire after 7 days)';

COMMENT ON COLUMN fb_gmail_watch_subscriptions.status IS 
  'Watch status: active, expired, failed, renewing';

COMMENT ON COLUMN fb_gmail_connections.last_history_id IS 
  'Last processed history ID for incremental sync';

COMMENT ON COLUMN fb_gmail_connections.watch_enabled IS 
  'Whether Gmail push notifications are enabled for this connection';
```

---

## 📝 TypeScript Types

### **1. Update `src/types/database.ts`**

Add new table types:

```typescript
export interface Database {
  public: {
    Tables: {
      // ... existing tables ...
      
      fb_gmail_watch_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          connection_id: string;
          history_id: string;
          expiration: string;
          status: 'active' | 'expired' | 'failed' | 'renewing';
          last_renewed_at: string | null;
          renewal_attempts: number;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          connection_id: string;
          history_id: string;
          expiration: string;
          status?: 'active' | 'expired' | 'failed' | 'renewing';
          last_renewed_at?: string | null;
          renewal_attempts?: number;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          connection_id?: string;
          history_id?: string;
          expiration?: string;
          status?: 'active' | 'expired' | 'failed' | 'renewing';
          last_renewed_at?: string | null;
          renewal_attempts?: number;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
```

### **2. Update `fb_gmail_connections` type**

```typescript
fb_gmail_connections: {
  Row: {
    // ... existing fields ...
    last_history_id: string | null;
    watch_enabled: boolean;
    watch_setup_at: string | null;
    last_watch_error: string | null;
  };
  Insert: {
    // ... existing fields ...
    last_history_id?: string | null;
    watch_enabled?: boolean;
    watch_setup_at?: string | null;
    last_watch_error?: string | null;
  };
  Update: {
    // ... existing fields ...
    last_history_id?: string | null;
    watch_enabled?: boolean;
    watch_setup_at?: string | null;
    last_watch_error?: string | null;
  };
}
```

---

## 📄 Migration File

**File**: `infra/migrations/0003_gmail_watch_subscriptions.sql`

```sql
-- Migration: Add Gmail Watch Subscriptions Support
-- Created: 2025-11-08
-- Description: Adds tables and columns for Gmail push notification support

-- [Include all SQL from sections 1, 2, and 3 above]
```

---

## ✅ Verification Checklist

- [ ] Migration file created
- [ ] Database types updated in `src/types/database.ts`
- [ ] Migration tested locally
- [ ] RLS policies verified
- [ ] Indexes created
- [ ] Comments added
- [ ] No breaking changes to existing schema
- [ ] Backward compatible with existing code

---

## 🔄 Rollback Plan

If issues arise, rollback with:

```sql
-- Rollback migration
DROP TABLE IF EXISTS fb_gmail_watch_subscriptions CASCADE;

ALTER TABLE fb_gmail_connections
  DROP COLUMN IF EXISTS last_history_id,
  DROP COLUMN IF EXISTS watch_enabled,
  DROP COLUMN IF EXISTS watch_setup_at,
  DROP COLUMN IF EXISTS last_watch_error;
```

---

**Next Phase**: Phase 2 - Gmail Watch Management

