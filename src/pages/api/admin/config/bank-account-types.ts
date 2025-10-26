// API endpoint for managing user-specific bank account types
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const CONFIG_KEY = 'BANK_ACCOUNT_TYPES';

  try {
    console.log('Bank account types API called:', { method: req.method, userId: user.id });

    if (req.method === 'GET') {
      // Get user's bank account types using service role (bypasses RLS)
      const { data, error } = await supabaseAdmin
        .from('fb_config')
        .select('config_value')
        .eq('config_key', CONFIG_KEY)
        .eq('user_id', user.id)
        .maybeSingle<{ config_value: string[] }>();

      if (error) {
        console.error('Error fetching bank account types:', error);
        return res.status(500).json({ error: 'Failed to fetch bank account types', details: error.message });
      }

      const accountTypes = data?.config_value || [];
      console.log('Fetched bank account types:', accountTypes);
      return res.status(200).json({ accountTypes });
    }

    if (req.method === 'POST') {
      // Add a bank account type
      const { accountType } = req.body;

      if (!accountType || typeof accountType !== 'string' || !accountType.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      const normalizedAccountType = accountType.trim().toLowerCase();

      // Get current account types
      const { data: currentData } = await (supabaseAdmin as any)
        .from('fb_config')
        .select('config_value')
        .eq('config_key', CONFIG_KEY)
        .eq('user_id', user.id)
        .single();

      const currentAccountTypes: string[] = (currentData as any)?.config_value || [];

      if (currentAccountTypes.includes(normalizedAccountType)) {
        return res.status(400).json({ error: 'Account type already exists' });
      }

      // Add new account type
      const updatedAccountTypes = [...currentAccountTypes, normalizedAccountType];

      if (currentData) {
        // Update existing config
        const { error } = await (supabaseAdmin as any)
          .from('fb_config')
          .update({
            config_value: updatedAccountTypes,
            updated_at: new Date().toISOString(),
          })
          .eq('config_key', CONFIG_KEY)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Create new config
        const { error } = await (supabaseAdmin as any)
          .from('fb_config')
          .insert({
            user_id: user.id,
            config_key: CONFIG_KEY,
            config_value: updatedAccountTypes,
            description: 'User-specific bank account email addresses for transaction processing',
          });

        if (error) throw error;
      }

      return res.status(200).json({ accountTypes: updatedAccountTypes });
    }

    if (req.method === 'DELETE') {
      // Remove a bank account type
      const { accountType } = req.body;

      if (!accountType || typeof accountType !== 'string') {
        return res.status(400).json({ error: 'Invalid account type' });
      }

      const normalizedAccountType = accountType.trim().toLowerCase();

      // Get current account types
      const { data: currentData } = await (supabaseAdmin as any)
        .from('fb_config')
        .select('config_value')
        .eq('config_key', CONFIG_KEY)
        .eq('user_id', user.id)
        .single();

      if (!currentData) {
        return res.status(404).json({ error: 'No configuration found' });
      }

      const currentAccountTypes: string[] = (currentData as any)?.config_value || [];

      if (!currentAccountTypes.includes(normalizedAccountType)) {
        return res.status(404).json({ error: 'Account type not found' });
      }

      // Remove account type
      const updatedAccountTypes = currentAccountTypes.filter(
        (type: string) => type !== normalizedAccountType
      );

      const { error } = await (supabaseAdmin as any)
        .from('fb_config')
        .update({
          config_value: updatedAccountTypes,
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', CONFIG_KEY)
        .eq('user_id', user.id);

      if (error) throw error;

      return res.status(200).json({ accountTypes: updatedAccountTypes });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Bank account types API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

