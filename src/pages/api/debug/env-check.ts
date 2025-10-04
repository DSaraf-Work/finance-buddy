import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check which environment variables are set (without exposing their values)
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    GMAIL_CLIENT_ID: !!process.env.GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET: !!process.env.GMAIL_CLIENT_SECRET,
    COOKIE_NAME: !!process.env.COOKIE_NAME,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    GOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
    // Show partial values for debugging (first 10 chars)
    SUPABASE_URL_PREFIX: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
    SERVICE_ROLE_KEY_PREFIX: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20),
  };

  res.status(200).json(envCheck);
}

