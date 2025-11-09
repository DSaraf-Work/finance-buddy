/**
 * Database Table Name Constants
 * 
 * Centralized constants for all database table and view names.
 * Use these constants instead of hardcoded strings throughout the codebase.
 * 
 * Last Updated: 2025-11-09
 */

// ============================================================================
// ACTIVE TABLES (Used in Application Code)
// ============================================================================

/**
 * Emails fetched from Gmail
 * Renamed from: fb_emails
 */
export const TABLE_EMAILS_FETCHED = 'fb_emails_fetched' as const;

/**
 * Processed emails with extracted transaction data
 * Renamed from: fb_extracted_transactions
 */
export const TABLE_EMAILS_PROCESSED = 'fb_emails_processed' as const;

/**
 * Gmail OAuth connections
 */
export const TABLE_GMAIL_CONNECTIONS = 'fb_gmail_connections' as const;

/**
 * System configuration key-value store
 */
export const TABLE_CONFIG = 'fb_config' as const;

/**
 * Transaction keywords for categorization
 */
export const TABLE_TRANSACTION_KEYWORDS = 'fb_transaction_keywords' as const;

/**
 * Rejected emails (non-transactional)
 */
export const TABLE_REJECTED_EMAILS = 'fb_rejected_emails' as const;

// ============================================================================
// VIEWS
// ============================================================================

/**
 * View combining emails with their processing status
 * Joins fb_emails_fetched with fb_emails_processed and fb_rejected_emails
 */
export const VIEW_EMAILS_WITH_STATUS = 'fb_emails_with_status' as const;

/**
 * View of user's active keywords
 */
export const VIEW_USER_ACTIVE_KEYWORDS = 'fb_user_active_keywords' as const;

// ============================================================================
// TABLE NAME COLLECTIONS
// ============================================================================

/**
 * All active table names used in the application
 */
export const ACTIVE_TABLES = [
  TABLE_EMAILS_FETCHED,
  TABLE_EMAILS_PROCESSED,
  TABLE_GMAIL_CONNECTIONS,
  TABLE_CONFIG,
  TABLE_TRANSACTION_KEYWORDS,
  TABLE_REJECTED_EMAILS,
] as const;

/**
 * All view names
 */
export const VIEWS = [
  VIEW_EMAILS_WITH_STATUS,
  VIEW_USER_ACTIVE_KEYWORDS,
] as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Union type of all active table names
 */
export type ActiveTableName = typeof ACTIVE_TABLES[number];

/**
 * Union type of all view names
 */
export type ViewName = typeof VIEWS[number];

/**
 * Union type of all table and view names
 */
export type DatabaseObjectName = ActiveTableName | ViewName;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a table name is active (used in code)
 */
export function isActiveTable(tableName: string): tableName is ActiveTableName {
  return ACTIVE_TABLES.includes(tableName as ActiveTableName);
}

/**
 * Check if a name is a view
 */
export function isView(name: string): name is ViewName {
  return VIEWS.includes(name as ViewName);
}

// ============================================================================
// MIGRATION NOTES
// ============================================================================

/**
 * Table Rename History:
 * 
 * Migration 0005_rename_tables.sql (2025-11-09):
 * - fb_emails → fb_emails_fetched
 * - fb_extracted_transactions → fb_emails_processed
 * 
 * Old tables kept in database for data archive but not used in code.
 */

