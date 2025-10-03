// Finance Buddy API DTOs - Generated from OpenAPI and Database Schema

// Base types
export type UUID = string;
export type EmailStatus = 'Fetched' | 'Processed' | 'Failed' | 'Invalid' | 'NON_TRANSACTIONAL' | 'REJECT';
export type TransactionDirection = 'debit' | 'credit';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';
export type SortOrder = 'asc' | 'desc';

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
  status: EmailStatus;
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
  status: EmailStatus;
  error_reason?: string;
  processed_at?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
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
