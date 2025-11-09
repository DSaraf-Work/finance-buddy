export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      fb_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          description: string | null
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      fb_emails_fetched: {
        Row: {
          connection_id: string | null
          created_at: string
          email_address: string
          error_reason: string | null
          from_address: string | null
          google_user_id: string
          id: string
          internal_date: string | null
          message_id: string
          plain_body: string | null
          processed_at: string | null
          snippet: string | null
          status: string
          subject: string | null
          thread_id: string
          to_addresses: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          email_address: string
          error_reason?: string | null
          from_address?: string | null
          google_user_id: string
          id?: string
          internal_date?: string | null
          message_id: string
          plain_body?: string | null
          processed_at?: string | null
          snippet?: string | null
          status?: string
          subject?: string | null
          thread_id: string
          to_addresses?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          email_address?: string
          error_reason?: string | null
          from_address?: string | null
          google_user_id?: string
          id?: string
          internal_date?: string | null
          message_id?: string
          plain_body?: string | null
          processed_at?: string | null
          snippet?: string | null
          status?: string
          subject?: string | null
          thread_id?: string
          to_addresses?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fb_emails_processed: {
        Row: {
          account_hint: string | null
          account_type: string | null
          ai_notes: string | null
          amount: number | null
          category: string | null
          confidence: number | null
          connection_id: string | null
          created_at: string
          currency: string | null
          direction: string | null
          email_row_id: string
          extraction_version: string | null
          google_user_id: string
          id: string
          location: string | null
          merchant_name: string | null
          merchant_normalized: string | null
          reference_id: string | null
          status: string
          transaction_type: string | null
          txn_time: string | null
          updated_at: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          account_hint?: string | null
          account_type?: string | null
          ai_notes?: string | null
          amount?: number | null
          category?: string | null
          confidence?: number | null
          connection_id?: string | null
          created_at?: string
          currency?: string | null
          direction?: string | null
          email_row_id: string
          extraction_version?: string | null
          google_user_id: string
          id?: string
          location?: string | null
          merchant_name?: string | null
          merchant_normalized?: string | null
          reference_id?: string | null
          status?: string
          transaction_type?: string | null
          txn_time?: string | null
          updated_at?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          account_hint?: string | null
          account_type?: string | null
          ai_notes?: string | null
          amount?: number | null
          category?: string | null
          confidence?: number | null
          connection_id?: string | null
          created_at?: string
          currency?: string | null
          direction?: string | null
          email_row_id?: string
          extraction_version?: string | null
          google_user_id?: string
          id?: string
          location?: string | null
          merchant_name?: string | null
          merchant_normalized?: string | null
          reference_id?: string | null
          status?: string
          transaction_type?: string | null
          txn_time?: string | null
          updated_at?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: []
      }
      fb_gmail_connections: {
        Row: {
          access_token: string
          auto_sync_enabled: boolean
          auto_sync_interval_minutes: number | null
          created_at: string
          email_address: string
          google_user_id: string
          granted_scopes: string[]
          id: string
          last_auto_sync_at: string | null
          last_error: string | null
          last_sync_at: string | null
          refresh_token: string
          token_expiry: string
          token_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          auto_sync_enabled?: boolean
          auto_sync_interval_minutes?: number | null
          created_at?: string
          email_address: string
          google_user_id: string
          granted_scopes: string[]
          id?: string
          last_auto_sync_at?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          refresh_token: string
          token_expiry: string
          token_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          auto_sync_enabled?: boolean
          auto_sync_interval_minutes?: number | null
          created_at?: string
          email_address?: string
          google_user_id?: string
          granted_scopes?: string[]
          id?: string
          last_auto_sync_at?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          refresh_token?: string
          token_expiry?: string
          token_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fb_rejected_emails: {
        Row: {
          connection_id: string
          created_at: string
          email_row_id: string
          error_details: Json | null
          google_user_id: string
          id: string
          rejected_at: string
          rejection_reason: string
          rejection_type: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          email_row_id: string
          error_details?: Json | null
          google_user_id: string
          id?: string
          rejected_at?: string
          rejection_reason: string
          rejection_type: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          email_row_id?: string
          error_details?: Json | null
          google_user_id?: string
          id?: string
          rejected_at?: string
          rejection_reason?: string
          rejection_type?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fb_transaction_keywords: {
        Row: {
          auto_generated: boolean
          category: string | null
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          keyword: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          auto_generated?: boolean
          category?: string | null
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          keyword: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          auto_generated?: boolean
          category?: string | null
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          keyword?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      fb_user_active_keywords: {
        Row: {
          auto_generated: boolean | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          keyword: string | null
          updated_at: string | null
          usage_category: string | null
          usage_count: number | null
          user_id: string | null
        }
      }
    }
    Functions: {}
    Enums: {}
  }
}
