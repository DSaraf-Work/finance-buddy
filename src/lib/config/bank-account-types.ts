// Helper functions for managing user-specific bank account types
import { supabaseAdmin } from '../supabase';

const CONFIG_KEY = 'BANK_ACCOUNT_TYPES';

export interface BankAccountTypeConfig {
  accountTypes: string[];
  accountTypeEnums: string[];
  customAccountTypes?: string[]; // Custom account type identifiers (e.g., KIWI_YES_0421)
}

/**
 * Fetch user's bank account types from the database
 */
export async function getUserBankAccountTypes(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('fb_config')
      .select('config_value')
      .eq('config_key', CONFIG_KEY)
      .eq('user_id', userId)
      .maybeSingle<{ config_value: string[] }>();

    if (error) {
      console.error('Error fetching bank account types:', error);
      return [];
    }

    const accountTypes = data?.config_value || [];
    console.log(`📧 Fetched ${accountTypes.length} bank account types for user ${userId}:`, accountTypes);
    return accountTypes;
  } catch (error) {
    console.error('Failed to fetch bank account types:', error);
    return [];
  }
}

/**
 * Fetch user's custom account type identifiers from the database
 */
export async function getUserCustomAccountTypes(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('fb_config')
      .select('config_value')
      .eq('config_key', 'CUSTOM_ACCOUNT_TYPES')
      .eq('user_id', userId)
      .maybeSingle<{ config_value: string[] }>();

    if (error) {
      console.error('Error fetching custom account types:', error);
      return [];
    }

    const customTypes = data?.config_value || [];
    console.log(`🏷️ Fetched ${customTypes.length} custom account types for user ${userId}:`, customTypes);
    return customTypes;
  } catch (error) {
    console.error('Failed to fetch custom account types:', error);
    return [];
  }
}

/**
 * Generate account type enums based on user's bank account types
 * This creates specific account type identifiers from email addresses
 *
 * Example:
 * - alerts@hdfcbank.net -> HDFC_BANK
 * - alerts@dcbbank.com -> DCB_BANK
 * - alerts@yes.bank.in -> YES_BANK
 * - alerts@icicibank.com -> ICICI_BANK
 */
export function generateAccountTypeEnums(bankAccountTypes: string[], customAccountTypes: string[] = []): string[] {
  const enums: string[] = [];

  for (const email of bankAccountTypes) {
    // Extract bank name from email address
    // Example: alerts@hdfcbank.net -> hdfcbank
    const match = email.match(/@([^.]+)/);
    if (match) {
      const bankName = match[1].toUpperCase();

      // Create enum variations
      enums.push(`${bankName}_DEBIT`);
      enums.push(`${bankName}_CREDIT`);
      enums.push(`${bankName}_BANK`);

      // Also add specific card identifiers if they exist in common patterns
      // This allows for more specific classification like HDFC_SWIGGY_7712
      enums.push(bankName);
    }
  }

  // Add custom account types (e.g., KIWI_YES_0421, HDFC_SWIGGY_7712)
  enums.push(...customAccountTypes);

  // Always include OTHER as a fallback
  enums.push('OTHER');

  // Remove duplicates and return
  return Array.from(new Set(enums));
}

/**
 * Get user's bank account configuration including both raw types and generated enums
 */
export async function getUserBankAccountConfig(userId: string): Promise<BankAccountTypeConfig> {
  const accountTypes = await getUserBankAccountTypes(userId);
  const customAccountTypes = await getUserCustomAccountTypes(userId);
  const accountTypeEnums = generateAccountTypeEnums(accountTypes, customAccountTypes);

  console.log('🏦 User bank account config:', {
    userId,
    accountTypes,
    customAccountTypes,
    accountTypeEnums,
  });

  return {
    accountTypes,
    accountTypeEnums,
    customAccountTypes,
  };
}

/**
 * Determine the best matching account type enum for a given email address
 */
export function matchAccountTypeFromEmail(
  fromAddress: string,
  accountTypeEnums: string[]
): string {
  const email = fromAddress.toLowerCase();

  // Try to find a matching bank from the email address
  for (const enumValue of accountTypeEnums) {
    const bankName = enumValue.split('_')[0].toLowerCase();
    if (email.includes(bankName)) {
      // Prefer more specific matches (e.g., HDFC_CREDIT over HDFC_BANK)
      const creditMatch = accountTypeEnums.find(e => e.startsWith(enumValue.split('_')[0]) && e.includes('CREDIT'));
      const debitMatch = accountTypeEnums.find(e => e.startsWith(enumValue.split('_')[0]) && e.includes('DEBIT'));
      
      // Return the first specific match, or the generic bank enum
      return creditMatch || debitMatch || enumValue;
    }
  }

  return 'OTHER';
}

