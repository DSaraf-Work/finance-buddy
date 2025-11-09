// API endpoint for managing whitelisted senders
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  TABLE_CONFIG
} from '@/lib/constants/database';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  const CONFIG_KEY = 'WHITELISTED_SENDERS';

  try {
    if (req.method === 'GET') {
      // Get whitelisted senders
      const { data, error } = await (supabaseAdmin as any)
        .from(TABLE_CONFIG)
        .select('config_value')
        .eq('config_key', CONFIG_KEY)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const senders = (data as any)?.config_value || [];
      return res.status(200).json({ senders });
    }

    if (req.method === 'POST') {
      // Add a sender to whitelist
      const { sender } = req.body;

      if (!sender || typeof sender !== 'string' || !sender.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      const normalizedSender = sender.trim().toLowerCase();

      // Get current senders
      const { data: currentData } = await (supabaseAdmin as any)
        .from(TABLE_CONFIG)
        .select('config_value')
        .eq('config_key', CONFIG_KEY)
        .single();

      const currentSenders: string[] = (currentData as any)?.config_value || [];

      if (currentSenders.includes(normalizedSender)) {
        return res.status(400).json({ error: 'Sender already whitelisted' });
      }

      // Add new sender
      const updatedSenders = [...currentSenders, normalizedSender];

      const { error } = await (supabaseAdmin as any)
        .from(TABLE_CONFIG)
        .update({
          config_value: updatedSenders,
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', CONFIG_KEY);

      if (error) throw error;

      return res.status(200).json({ senders: updatedSenders });
    }

    if (req.method === 'DELETE') {
      // Remove a sender from whitelist
      const { sender } = req.body;

      if (!sender || typeof sender !== 'string') {
        return res.status(400).json({ error: 'Invalid sender' });
      }

      // Get current senders
      const { data: currentData } = await (supabaseAdmin as any)
        .from(TABLE_CONFIG)
        .select('config_value')
        .eq('config_key', CONFIG_KEY)
        .single();

      const currentSenders: string[] = (currentData as any)?.config_value || [];

      // Remove sender
      const updatedSenders = currentSenders.filter(s => s !== sender);

      const { error } = await (supabaseAdmin as any)
        .from(TABLE_CONFIG)
        .update({
          config_value: updatedSenders,
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', CONFIG_KEY);

      if (error) throw error;

      return res.status(200).json({ senders: updatedSenders });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Whitelisted senders API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
});

