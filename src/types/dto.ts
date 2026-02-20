// Finance Buddy API DTOs - Generated from OpenAPI and Database Schema

// Base types
export type UUID = string;
// Derived email status - computed from FK presence (processed_id, rejected_id)
// Uppercase is the canonical format for enum values
export type EmailStatus = 'FETCHED' | 'PROCESSED' | 'REJECTED';
export type TransactionDirection = 'debit' | 'credit';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';
export type SortOrder = 'asc' | 'desc';

/**
 * Transaction workflow status.
 * - REVIEW: Needs user review
 * - APPROVED: User confirmed transaction
 * - INVALID: Transaction is invalid/erroneous
 * - REJECTED: User rejected the transaction
 * - split: Parent transaction has been split into sub-transactions (hidden from main list)
 */
export type TransactionStatus = 'REVIEW' | 'APPROVED' | 'INVALID' | 'REJECTED' | 'split';

/**
 * Record type discriminator for unified view (v_all_transactions).
 * Named 'record_type' to avoid collision with existing 'transaction_type' (Dr/Cr) field.
 * - parent: Regular transaction from fb_emails_processed
 * - sub: Sub-transaction from fb_sub_transactions
 */
export type RecordType = 'parent' | 'sub';

// Gmail API types
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: any;
  sizeEstimate?: number;
  historyId?: string;
  internalDate?: string;
}

export interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
  expires_in?: number;
}

// Gmail Connection DTOs
export interface GmailConnection {
  id: UUID;
  user_id: UUID;
  email_address: string;
  google_user_id: string;
  granted_scopes: string[];
  access_token: string;
  refresh_token: string;
  token_expiry: string; // ISO timestamp
  token_type?: string;
  last_sync_at?: string; // ISO timestamp
  last_error?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface GmailConnectionPublic {
  id: UUID;
  email_address: string;
  google_user_id: string;
  granted_scopes: string[];
  last_sync_at?: string;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

// Email DTOs
export interface Email {
  id: UUID;
  user_id: UUID;
  google_user_id: string;
  connection_id?: UUID;
  email_address: string;
  message_id: string;
  thread_id: string;
  from_address?: string;
  to_addresses?: string[];
  subject?: string;
  snippet?: string;
  internal_date?: string; // ISO timestamp
  plain_body?: string;
  // Status is derived from FK presence:
  // - processed_id set = 'Processed'
  // - rejected_id set = 'Rejected'
  // - neither set = 'Fetched'
  processed_id?: UUID | null;
  rejected_id?: UUID | null;
  status?: EmailStatus; // Derived field, not stored in DB
  error_reason?: string;
  processed_at?: string; // ISO timestamp
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface EmailPublic {
  id: UUID;
  google_user_id: string;
  connection_id?: UUID;
  email_address: string;
  message_id: string;
  thread_id: string;
  from_address?: string;
  to_addresses?: string[];
  subject?: string;
  snippet?: string;
  internal_date?: string;
  // Status is derived from FK presence
  processed_id?: UUID | null;
  rejected_id?: UUID | null;
  status?: EmailStatus; // Derived field, not stored in DB
  error_reason?: string;
  processed_at?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  fb_extracted_transactions?: { id: UUID }[] | null; // Transaction ID from join
}

// Transaction DTOs
export interface ExtractedTransaction {
  id: UUID;
  user_id: UUID;
  google_user_id: string;
  connection_id?: UUID;
  email_row_id: UUID;
  txn_time?: string; // ISO timestamp
  amount?: number;
  currency?: string;
  direction?: TransactionDirection;
  merchant_name?: string;
  merchant_normalized?: string;
  category?: string;
  account_hint?: string;
  reference_id?: string;
  location?: string;
  confidence?: number;
  extraction_version?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface ExtractedTransactionPublic {
  id: UUID;
  google_user_id: string;
  connection_id?: UUID;
  email_row_id: UUID;
  txn_time?: string;
  amount?: number;
  currency?: string;
  direction?: TransactionDirection;
  merchant_name?: string;
  merchant_normalized?: string;
  category?: string;
  account_hint?: string;
  reference_id?: string;
  location?: string;
  confidence?: number;
  extraction_version?: string;
  created_at: string;
  updated_at: string;
}

// Job DTOs
export interface Job {
  id: UUID;
  user_id: UUID;
  type: string;
  payload: Record<string, any>;
  status: JobStatus;
  attempts: number;
  last_error?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface JobPublic {
  id: UUID;
  type: string;
  payload: Record<string, any>;
  status: JobStatus;
  attempts: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

// API Request DTOs
export interface DisconnectRequest {
  connection_id: UUID;
  revoke?: boolean;
}

export interface ManualSyncRequest {
  connection_id: UUID;
  date_from: string; // YYYY-MM-DD format
  date_to: string; // YYYY-MM-DD format
  senders?: string[];
  page?: number;
  pageSize?: number;
  sort?: SortOrder;
}

export interface BackfillRequest {
  connection_id: UUID;
  date_from: string; // YYYY-MM-DD format
  date_to: string; // YYYY-MM-DD format
  senders?: string[];
  chunk_size_days?: number;
}

export interface EmailSearchRequest {
  google_user_id?: string;
  email_address?: string;
  date_from?: string; // YYYY-MM-DD format
  date_to?: string; // YYYY-MM-DD format
  sender?: string;
  status?: EmailStatus;
  q?: string; // search query
  page?: number;
  pageSize?: number;
  sort?: SortOrder;
  db_only?: boolean; // if true, fetch only from Supabase DB, not Gmail
  ignore_defaults?: boolean; // if true, bypass default email_address and sender filters
}

export interface TransactionSearchRequest {
  google_user_id?: string;
  date_from?: string; // YYYY-MM-DD format
  date_to?: string; // YYYY-MM-DD format
  direction?: TransactionDirection;
  category?: string;
  merchant?: string;
  min_amount?: number;
  max_amount?: number;
  min_confidence?: number;
  page?: number;
  pageSize?: number;
  sort?: SortOrder;
}

// API Response DTOs
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ManualSyncResponse {
  items: EmailPublic[];
  nextPageToken?: string;
  stats: {
    probed: number;
    fetched: number;
    upserts: number;
  };
}

export interface ConnectionsResponse {
  connections: GmailConnectionPublic[];
}

export interface BackfillResponse {
  job_id: UUID;
  status: JobStatus;
  message: string;
}

// ============================================================================
// UNIFIED TRANSACTION TYPES (for v_all_transactions view)
// ============================================================================

/**
 * Unified transaction from v_all_transactions view.
 * Includes both regular transactions (type='parent') and sub-transactions (type='sub').
 * Sub-transactions inherit metadata fields from their parent via JOIN.
 */
export interface UnifiedTransaction {
  id: UUID;
  user_id: UUID;
  email_row_id: UUID | null;
  txn_time: string | null;
  amount: number | null;
  currency: string | null;
  direction: TransactionDirection | null;
  merchant_name: string | null;
  category: string | null;
  status: TransactionStatus;
  /** Discriminator: 'parent' for regular transactions, 'sub' for sub-transactions */
  record_type: RecordType;
  /** NULL for parents, UUID for sub-transactions (points to parent) */
  parent_transaction_id: UUID | null;
  created_at: string;
  updated_at: string;
  splitwise_expense_id: string | null;
  user_notes: string | null;
  /** Original transaction type: 'Dr' (debit) or 'Cr' (credit) - inherited from parent for sub-txns */
  transaction_type: 'Dr' | 'Cr' | null;
  // Inherited parent fields (sub-transactions get these via JOIN)
  google_user_id: string | null;
  connection_id: UUID | null;
  merchant_normalized: string | null;
  account_hint: string | null;
  reference_id: string | null;
  location: string | null;
  confidence: number | null;
  extraction_version: string | null;
  account_type: string | null;
  ai_notes: string | null;
  /** TRUE for manually created transactions (no source email) */
  is_manual?: boolean;
}

