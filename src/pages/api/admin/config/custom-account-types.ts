import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_CONFIG
} from '@/lib/constants/database';

const CONFIG_KEY = 'CUSTOM_ACCOUNT_TYPES';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  try {
    console.log('Custom account types API called:', { method: req.method, userId: user.id });

    if (req.method === 'GET') {
      // Get user's custom account types using service role (bypasses RLS)
      const { data, error } = await supabaseAdmin
        .from(TABLE_CONFIG)
        .select('config_value')
        .eq('config_key', CONFIG_KEY)
        .eq('user_id', user.id)
        .maybeSingle<{ config_value: string[] }>();

      if (error) {
        console.error('Error fetching custom account types:', error);
        return res.status(500).json({ error: 'Failed to fetch custom account types', details: error.message });
      }

      const customAccountTypes = data?.config_value || [];
      console.log('Fetched custom account types:', customAccountTypes);
      return res.status(200).json({ customAccountTypes });
    }

    if (req.method === 'POST') {
      const { accountType } = req.body;

      if (!accountType || typeof accountType !== 'string') {
        return res.status(400).json({ error: 'Account type is required and must be a string' });
      }

      // Normalize the account type (uppercase, replace spaces with underscores)
      const normalizedAccountType = accountType.trim().toUpperCase().replace(/\s+/g, '_');

      // Get current custom account types
      const { data: currentData, error: fetchError } = await supabaseAdmin
        .from(TABLE_CONFIG)
        .select('config_value')
        .eq('config_key', CONFIG_KEY)
        .eq('user_id', user.id)
        .maybeSingle<{ config_value: string[] }>();

      if (fetchError) {
        console.error('Error fetching current custom account types:', fetchError);
        return res.status(500).json({ error: 'Failed to fetch current custom account types' });
      }

      const currentCustomAccountTypes = currentData?.config_value || [];

      // Check if account type already exists
      if (currentCustomAccountTypes.includes(normalizedAccountType)) {
        return res.status(400).json({ error: 'Account type already exists' });
      }

      // Add new account type
      const updatedCustomAccountTypes = [...currentCustomAccountTypes, normalizedAccountType];

      if (currentData) {
        // Update existing config
        const { error } = await (supabaseAdmin as any)
          .from(TABLE_CONFIG)
          .update({
            config_value: updatedCustomAccountTypes,
            updated_at: new Date().toISOString(),
          })
          .eq('config_key', CONFIG_KEY)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new config
        const { error } = await (supabaseAdmin as any)
          .from(TABLE_CONFIG)
          .insert({
            user_id: user.id,
            config_key: CONFIG_KEY,
            config_value: updatedCustomAccountTypes,
            description: 'Custom account type identifiers for specific cards/accounts',
          });

        if (error) throw error;
      }

      return res.status(200).json({ customAccountTypes: updatedCustomAccountTypes });
    }

    if (req.method === 'DELETE') {
      const { accountType } = req.body;

      if (!accountType || typeof accountType !== 'string') {
        return res.status(400).json({ error: 'Account type is required and must be a string' });
      }

      // Get current custom account types
      const { data: currentData, error: fetchError } = await supabaseAdmin
        .from(TABLE_CONFIG)
        .select('config_value')
        .eq('config_key', CONFIG_KEY)
        .eq('user_id', user.id)
        .maybeSingle<{ config_value: string[] }>();

      if (fetchError || !currentData) {
        return res.status(404).json({ error: 'Custom account types not found' });
      }

      const currentCustomAccountTypes = currentData.config_value || [];

      // Remove the account type
      const updatedCustomAccountTypes = currentCustomAccountTypes.filter(
        (type: string) => type !== accountType
      );

      // Update config
      const { error } = await (supabaseAdmin as any)
        .from(TABLE_CONFIG)
        .update({
          config_value: updatedCustomAccountTypes,
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', CONFIG_KEY)
        .eq('user_id', user.id);

      if (error) throw error;

      return res.status(200).json({ customAccountTypes: updatedCustomAccountTypes });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Custom account types API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

