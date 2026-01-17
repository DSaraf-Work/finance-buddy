export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
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
          processed_id: string | null
          rejected_id: string | null
          snippet: string | null
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
          processed_id?: string | null
          rejected_id?: string | null
          snippet?: string | null
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
          processed_id?: string | null
          rejected_id?: string | null
          snippet?: string | null
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
      fb_push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          expiration_time: number | null
          id: string
          keys: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          expiration_time?: number | null
          id?: string
          keys: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          expiration_time?: number | null
          id?: string
          keys?: Json
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
      fb_sub_transactions: {
        Row: {
          id: string
          parent_transaction_id: string
          user_id: string
          email_row_id: string
          currency: string
          direction: string
          txn_time: string | null
          amount: number
          category: string | null
          merchant_name: string | null
          user_notes: string | null
          sub_transaction_order: number
          splitwise_expense_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parent_transaction_id: string
          user_id: string
          email_row_id: string
          currency: string
          direction: string
          txn_time?: string | null
          amount: number
          category?: string | null
          merchant_name?: string | null
          user_notes?: string | null
          sub_transaction_order?: number
          splitwise_expense_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parent_transaction_id?: string
          user_id?: string
          email_row_id?: string
          currency?: string
          direction?: string
          txn_time?: string | null
          amount?: number
          category?: string | null
          merchant_name?: string | null
          user_notes?: string | null
          sub_transaction_order?: number
          splitwise_expense_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_sub_transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "fb_emails_processed"
            referencedColumns: ["id"]
          }
        ]
      }
      fb_receipts: {
        Row: {
          id: string
          user_id: string
          transaction_id: string
          file_path: string
          file_name: string
          file_type: string
          store_name: string | null
          receipt_date: string | null
          receipt_total: number | null
          parsing_status: string
          confidence: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_id: string
          file_path: string
          file_name: string
          file_type: string
          store_name?: string | null
          receipt_date?: string | null
          receipt_total?: number | null
          parsing_status?: string
          confidence?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_id?: string
          file_path?: string
          file_name?: string
          file_type?: string
          store_name?: string | null
          receipt_date?: string | null
          receipt_total?: number | null
          parsing_status?: string
          confidence?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_receipts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "fb_emails_processed"
            referencedColumns: ["id"]
          }
        ]
      }
      fb_receipt_items: {
        Row: {
          id: string
          receipt_id: string
          user_id: string
          item_name: string
          quantity: number
          unit_price: number
          total_price: number
          category: string | null
          is_tax: boolean
          is_discount: boolean
          is_excluded: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          receipt_id: string
          user_id: string
          item_name: string
          quantity?: number
          unit_price: number
          total_price: number
          category?: string | null
          is_tax?: boolean
          is_discount?: boolean
          is_excluded?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          receipt_id?: string
          user_id?: string
          item_name?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          category?: string | null
          is_tax?: boolean
          is_discount?: boolean
          is_excluded?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "fb_receipts"
            referencedColumns: ["id"]
          }
        ]
      }
      fb_receipt_item_links: {
        Row: {
          id: string
          user_id: string
          receipt_item_id: string
          sub_transaction_id: string
          link_method: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          receipt_item_id: string
          sub_transaction_id: string
          link_method?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          receipt_item_id?: string
          sub_transaction_id?: string
          link_method?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_receipt_item_links_receipt_item_id_fkey"
            columns: ["receipt_item_id"]
            isOneToOne: true
            referencedRelation: "fb_receipt_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fb_receipt_item_links_sub_transaction_id_fkey"
            columns: ["sub_transaction_id"]
            isOneToOne: true
            referencedRelation: "fb_sub_transactions"
            referencedColumns: ["id"]
          }
        ]
      }
      fb_refund_links: {
        Row: {
          id: string
          user_id: string
          refund_transaction_id: string
          original_transaction_id: string | null
          original_sub_transaction_id: string | null
          allocated_amount: number
          refund_type: string
          match_confidence_score: number | null
          match_method: string
          match_reasons: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          refund_transaction_id: string
          original_transaction_id?: string | null
          original_sub_transaction_id?: string | null
          allocated_amount: number
          refund_type?: string
          match_confidence_score?: number | null
          match_method?: string
          match_reasons?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          refund_transaction_id?: string
          original_transaction_id?: string | null
          original_sub_transaction_id?: string | null
          allocated_amount?: number
          refund_type?: string
          match_confidence_score?: number | null
          match_method?: string
          match_reasons?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fb_refund_links_refund_transaction_id_fkey"
            columns: ["refund_transaction_id"]
            isOneToOne: false
            referencedRelation: "fb_emails_processed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fb_refund_links_original_transaction_id_fkey"
            columns: ["original_transaction_id"]
            isOneToOne: false
            referencedRelation: "fb_emails_processed"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fb_refund_links_original_sub_transaction_id_fkey"
            columns: ["original_sub_transaction_id"]
            isOneToOne: false
            referencedRelation: "fb_sub_transactions"
            referencedColumns: ["id"]
          }
        ]
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
      fb_receipt_summary: {
        Row: {
          transaction_id: string | null
          user_id: string | null
          receipt_count: number | null
          total_receipt_items: number | null
          linked_items_count: number | null
        }
      }
      fb_refund_link_aggregates: {
        Row: {
          original_id: string | null
          original_transaction_id: string | null
          original_sub_transaction_id: string | null
          user_id: string | null
          total_refunded: number | null
          refund_count: number | null
          refund_transaction_ids: string[] | null
        }
      }
    }
    Functions: {}
    Enums: {}
  }
}
