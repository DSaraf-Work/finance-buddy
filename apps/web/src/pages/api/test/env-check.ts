import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const envCheck = {
    openai: {
      exists: !!process.env.OPENAI_API_KEY,
      length: process.env.OPENAI_API_KEY?.length || 0,
      prefix: process.env.OPENAI_API_KEY?.substring(0, 10) || 'none'
    },
    anthropic: {
      exists: !!process.env.ANTHROPIC_API_KEY,
      length: process.env.ANTHROPIC_API_KEY?.length || 0
    },
    google: {
      exists: !!process.env.GOOGLE_AI_API_KEY,
      length: process.env.GOOGLE_AI_API_KEY?.length || 0
    },
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };

  console.log('🔍 Environment check:', envCheck);

  res.status(200).json(envCheck);
}
