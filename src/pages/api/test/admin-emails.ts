// Test endpoint for admin email functionality (no auth required)
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailProcessor } from '@/lib/email-processing/processor';
import {
  TABLE_CONFIG,
  TABLE_EMAILS_FETCHED,
  TABLE_GMAIL_CONNECTIONS
} from '@/lib/constants/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  try {
    // Get test user
    const { data: users } = await (supabaseAdmin as any)
      .from(TABLE_GMAIL_CONNECTIONS)
      .select('user_id')
      .limit(1)
      .single();

    if (!users) {
      return res.status(404).json({ error: 'No users found' });
    }

    const userId = (users as any).user_id;

    if (action === 'config') {
      // Test: Get whitelisted senders
      const { data: configData } = await (supabaseAdmin as any)
        .from(TABLE_CONFIG)
        .select('config_value')
        .eq('config_key', 'WHITELISTED_SENDERS')
        .single();

      return res.status(200).json({
        whitelistedSenders: configData?.config_value || [],
      });
    }

    if (action === 'count-fetched') {
      // Test: Count fetched emails
      const { count } = await (supabaseAdmin as any)
        .from(TABLE_EMAILS_FETCHED)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'Fetched');

      return res.status(200).json({
        userId,
        fetchedCount: count || 0,
      });
    }

    if (action === 'process-one') {
      // Test: Process one email
      const { data: emails } = await (supabaseAdmin as any)
        .from(TABLE_EMAILS_FETCHED)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'Fetched')
        .order('internal_date', { ascending: false })
        .limit(1);

      if (!emails || emails.length === 0) {
        return res.status(200).json({ message: 'No fetched emails to process' });
      }

      const email = (emails as any[])[0];
      const processor = new EmailProcessor();

      try {
        await processor.processEmail({
          id: email.id,
          from_address: email.from_address,
          to_address: email.to_address,
          subject: email.subject,
          plain_body: email.plain_body,
          email_date: email.email_date,
          internal_date: email.internal_date,
          user_id: userId,
          google_user_id: email.google_user_id,
          connection_id: email.connection_id,
        });

        // Email status will be automatically updated to 'Processed' by database trigger
        return res.status(200).json({
          success: true,
          emailId: email.id,
          subject: email.subject,
          message: 'Email processed successfully - status auto-updated by trigger',
        });
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error: error.message,
          emailId: email.id,
        });
      }
    }

    if (action === 'list-emails') {
      // Test: List emails
      const { data: emails } = await (supabaseAdmin as any)
        .from(TABLE_EMAILS_FETCHED)
        .select('id, from_address, subject, status, internal_date')
        .eq('user_id', userId)
        .order('internal_date', { ascending: false })
        .limit(10);

      return res.status(200).json({
        userId,
        emails: emails || [],
      });
    }

    return res.status(400).json({ 
      error: 'Invalid action',
      validActions: ['config', 'count-fetched', 'process-one', 'list-emails']
    });
  } catch (error: any) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}

