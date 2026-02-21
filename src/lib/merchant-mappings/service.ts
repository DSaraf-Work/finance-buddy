/**
 * Merchant mapping service.
 *
 * Stores user-level merchant_name → merchant_normalized overrides.
 * Applied at AI-extraction and manual-creation time so the user's preference
 * always wins over the AI-extracted value.
 *
 * Matching is case-insensitive: keys are stored LOWER(TRIM(merchant_name))
 * so lookups are simple equality checks — no regex or fuzzy logic.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { TABLE_MERCHANT_MAPPINGS } from '@/lib/constants/database';

function toKey(merchantName: string): string {
  return merchantName.trim().toLowerCase();
}

/**
 * Look up a saved merchant_normalized override for the given merchant_name.
 * Returns null if no mapping exists for this user.
 */
export async function lookupMerchantNormalized(
  userId: string,
  merchantName: string | null | undefined
): Promise<string | null> {
  if (!merchantName?.trim()) return null;

  const { data } = await (supabaseAdmin as any)
    .from(TABLE_MERCHANT_MAPPINGS)
    .select('merchant_normalized')
    .eq('user_id', userId)
    .eq('merchant_name_key', toKey(merchantName))
    .maybeSingle();

  return data?.merchant_normalized ?? null;
}

/**
 * Save (upsert) a merchant_name → merchant_normalized mapping for a user.
 * Overwrites any existing mapping for the same merchant_name.
 */
export async function saveMerchantMapping(
  userId: string,
  merchantName: string,
  merchantNormalized: string
): Promise<void> {
  const { error } = await (supabaseAdmin as any)
    .from(TABLE_MERCHANT_MAPPINGS)
    .upsert(
      {
        user_id: userId,
        merchant_name_key: toKey(merchantName),
        merchant_normalized: merchantNormalized.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,merchant_name_key' }
    );

  if (error) {
    throw new Error(`Failed to save merchant mapping: ${error.message}`);
  }
}
