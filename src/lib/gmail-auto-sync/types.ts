// Gmail Auto-Sync Types

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
  filter_id?: string;
  gmail_query?: string;
  trigger: 'manual' | 'scheduled';
}

export interface SyncResult {
  success: boolean;
  emails_found: number;
  emails_synced: number;
  transactions_processed: number;
  notifications_created: number;
  errors: string[];
}

export interface GmailConnection {
  id: string;
  user_id: string;
  google_user_id: string;
  email_address: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  auto_sync_enabled: boolean;
  auto_sync_interval_minutes: number;
  last_auto_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

