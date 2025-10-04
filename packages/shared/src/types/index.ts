// Shared types for Finance Buddy

export interface Database {
  public: {
    Tables: {
      fb_gmail_connections: {
        Row: {
          id: string;
          user_id: string;
          email_address: string;
          google_user_id: string;
          granted_scopes: string[];
          access_token: string;
          refresh_token: string;
          token_expiry: string;
          token_type: string | null;
          last_sync_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_address: string;
          google_user_id: string;
          granted_scopes: string[];
          access_token: string;
          refresh_token: string;
          token_expiry: string;
          token_type?: string | null;
          last_sync_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_address?: string;
          google_user_id?: string;
          granted_scopes?: string[];
          access_token?: string;
          refresh_token?: string;
          token_expiry?: string;
          token_type?: string | null;
          last_sync_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      fb_emails: {
        Row: {
          id: string;
          user_id: string;
          google_user_id: string;
          connection_id: string | null;
          email_address: string;
          message_id: string;
          thread_id: string;
          from_address: string | null;
          to_addresses: string[] | null;
          subject: string | null;
          snippet: string | null;
          internal_date: string | null;
          plain_body: string | null;
          status: string;
          error_reason: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          google_user_id: string;
          connection_id?: string | null;
          email_address: string;
          message_id: string;
          thread_id: string;
          from_address?: string | null;
          to_addresses?: string[] | null;
          subject?: string | null;
          snippet?: string | null;
          internal_date?: string | null;
          plain_body?: string | null;
          status?: string;
          error_reason?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          google_user_id?: string;
          connection_id?: string | null;
          email_address?: string;
          message_id?: string;
          thread_id?: string;
          from_address?: string | null;
          to_addresses?: string[] | null;
          subject?: string | null;
          snippet?: string | null;
          internal_date?: string | null;
          plain_body?: string | null;
          status?: string;
          error_reason?: string | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      fb_extracted_transactions: {
        Row: {
          id: string;
          user_id: string;
          google_user_id: string;
          connection_id: string | null;
          email_row_id: string;
          txn_time: string | null;
          amount: number | null;
          currency: string | null;
          direction: string | null;
          merchant_name: string | null;
          merchant_normalized: string | null;
          category: string | null;
          account_hint: string | null;
          reference_id: string | null;
          location: string | null;
          confidence: number | null;
          extraction_version: string | null;
          created_at: string;
          updated_at: string;
          ai_notes: string | null;
          user_notes: string | null;
          account_type: string | null;
          transaction_type: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          google_user_id: string;
          connection_id?: string | null;
          email_row_id: string;
          txn_time?: string | null;
          amount?: number | null;
          currency?: string | null;
          direction?: string | null;
          merchant_name?: string | null;
          merchant_normalized?: string | null;
          category?: string | null;
          account_hint?: string | null;
          reference_id?: string | null;
          location?: string | null;
          confidence?: number | null;
          extraction_version?: string | null;
          created_at?: string;
          updated_at?: string;
          ai_notes?: string | null;
          user_notes?: string | null;
          account_type?: string | null;
          transaction_type?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          google_user_id?: string;
          connection_id?: string | null;
          email_row_id?: string;
          txn_time?: string | null;
          amount?: number | null;
          currency?: string | null;
          direction?: string | null;
          merchant_name?: string | null;
          merchant_normalized?: string | null;
          category?: string | null;
          account_hint?: string | null;
          reference_id?: string | null;
          location?: string | null;
          confidence?: number | null;
          extraction_version?: string | null;
          created_at?: string;
          updated_at?: string;
          ai_notes?: string | null;
          user_notes?: string | null;
          account_type?: string | null;
          transaction_type?: string | null;
        };
      };
      fb_jobs: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          payload: any;
          status: string;
          attempts: number;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          payload: any;
          status?: string;
          attempts?: number;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          payload?: any;
          status?: string;
          attempts?: number;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Gmail API types
export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
  sizeEstimate?: number;
  raw?: string;
}

export interface GmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: GmailMessagePartBody;
  parts?: GmailMessagePart[];
}

export interface GmailHeader {
  name: string;
  value: string;
}

export interface GmailMessagePartBody {
  attachmentId?: string;
  size?: number;
  data?: string;
}

export interface GmailListResponse {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

// OAuth types
export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  expires_in?: number;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}
