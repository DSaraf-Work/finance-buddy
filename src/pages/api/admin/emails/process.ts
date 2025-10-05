// API endpoint for processing fetched emails with AI
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailProcessor } from '@/lib/email-processing/processor';

const BATCH_SIZE = 10;

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Count total fetched emails
    const { count } = await supabaseAdmin
      .from('fb_emails')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'Fetched');

    const totalEmails = count || 0;

    if (totalEmails === 0) {
      return res.status(200).json({ 
        total: 0, 
        message: 'No fetched emails to process' 
      });
    }

    // Start processing in background (fire and forget)
    // We return immediately and let the processing happen asynchronously
    processEmailsInBackground(user.id, totalEmails);

    return res.status(200).json({ 
      total: totalEmails,
      message: `Processing ${totalEmails} emails in background`
    });
  } catch (error: any) {
    console.error('Process emails error:', error);
    return res.status(500).json({
      error: 'Failed to start email processing',
      details: error.message,
    });
  }
});

// Background processing function
async function processEmailsInBackground(userId: string, totalEmails: number) {
  console.log(`Starting background processing of ${totalEmails} emails for user ${userId}`);
  
  let processedCount = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      // Fetch batch of fetched emails
      const { data: emails, error } = await (supabaseAdmin as any)
        .from('fb_emails')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'Fetched')
        .order('internal_date', { ascending: false })
        .limit(BATCH_SIZE);

      if (error) {
        console.error('Error fetching emails batch:', error);
        break;
      }

      if (!emails || emails.length === 0) {
        hasMore = false;
        break;
      }

      // Process each email sequentially
      for (const email of (emails as any[])) {
        try {
          console.log(`Processing email ${email.id} (${processedCount + 1}/${totalEmails})`);

          // Initialize email processor
          const processor = new EmailProcessor();

          // Process the email with the correct field names
          await processor.processEmail({
            id: email.id,
            from_address: email.from_email,
            to_address: email.to_email,
            subject: email.subject,
            plain_body: email.body,
            email_date: email.email_date,
            internal_date: email.internal_date,
            user_id: userId,
            google_user_id: email.google_user_id,
            connection_id: email.connection_id,
          });

          // Update email status to Processed
          await (supabaseAdmin as any)
            .from('fb_emails')
            .update({
              status: 'Processed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', email.id);

          console.log(`✅ Successfully processed email ${email.id}`);

          processedCount++;
        } catch (error: any) {
          console.error(`Error processing email ${email.id}:`, error);
          
          // Mark as failed
          try {
            await (supabaseAdmin as any)
              .from('fb_emails')
              .update({
                status: 'Failed',
                updated_at: new Date().toISOString(),
              })
              .eq('id', email.id);
          } catch (updateError) {
            console.error('Error updating email status:', updateError);
          }
        }
      }

      // Check if there are more emails to process
      const { count } = await (supabaseAdmin as any)
        .from('fb_emails')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'Fetched');

      hasMore = (count || 0) > 0;
    } catch (error: any) {
      console.error('Error in processing loop:', error);
      break;
    }
  }

  console.log(`✅ Background processing complete. Processed ${processedCount} emails.`);
}

