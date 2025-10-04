import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser, createUserClient } from '@/lib/auth';

export interface TransactionKeyword {
  id: string;
  user_id: string;
  keyword: string;
  is_active: boolean;
  auto_generated: boolean;
  usage_count: number;
  usage_category: 'frequent' | 'common' | 'rare';
  category?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface KeywordCreateRequest {
  keyword: string;
  is_active?: boolean;
  category?: string;
  color?: string;
}

export interface KeywordUpdateRequest {
  keyword?: string;
  is_active?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuthUser(req, res);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create user-authenticated Supabase client for RLS
    const supabase = createUserClient(req, res);

    switch (req.method) {
      case 'GET':
        return handleGetKeywords(req, res, user.id, supabase);
      case 'POST':
        return handleCreateKeyword(req, res, user.id, supabase);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Keywords API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetKeywords(req: NextApiRequest, res: NextApiResponse, userId: string, supabase: any) {
  const { active_only = 'true', include_usage = 'true' } = req.query;

  try {
    // Use the new function that handles initialization and RLS
    const { data: rawKeywords, error } = await supabase.rpc('get_user_keywords', {
      target_user_id: userId
    });

    if (error) {
      console.error('Error fetching keywords:', error);
      return res.status(500).json({ error: 'Failed to fetch keywords' });
    }

    // Filter by active status if requested
    let keywords = rawKeywords || [];
    if (active_only === 'true') {
      keywords = keywords.filter((k: any) => k.is_active);
    }

    // Add usage_category to each keyword
    const keywordsWithCategory = keywords.map((keyword: any) => ({
      ...keyword,
      usage_category: keyword.usage_count > 10 ? 'frequent' :
                     keyword.usage_count > 3 ? 'common' : 'rare'
    }));

    return res.status(200).json({ keywords: keywordsWithCategory });
  } catch (error) {
    console.error('Error in handleGetKeywords:', error);
    return res.status(500).json({ error: 'Failed to fetch keywords' });
  }
}

async function handleCreateKeyword(req: NextApiRequest, res: NextApiResponse, userId: string, supabase: any) {
  const { keyword, is_active = true, category, color }: KeywordCreateRequest = req.body;

  if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
    return res.status(400).json({ error: 'Keyword is required and must be a non-empty string' });
  }

  try {
    // Use the new function that handles RLS properly
    const { data: keywordId, error } = await supabase.rpc('add_user_keyword', {
      target_user_id: userId,
      new_keyword: keyword.trim(),
      new_category: category || 'Other',
      new_color: color || '#6B7280',
      new_is_active: is_active
    });

    if (error) {
      if (error.message && error.message.includes('duplicate key')) {
        return res.status(409).json({ error: 'Keyword already exists' });
      }
      console.error('Error creating keyword:', error);
      return res.status(500).json({ error: 'Failed to create keyword' });
    }

    if (!keywordId) {
      return res.status(500).json({ error: 'Failed to create keyword' });
    }

    // Return the created keyword with ID
    return res.status(201).json({
      keyword: {
        id: keywordId,
        user_id: userId,
        keyword: keyword.trim(),
        is_active,
        auto_generated: false,
        usage_count: 0,
        category: category || 'Other',
        color: color || '#6B7280'
      }
    });
  } catch (error) {
    console.error('Error in handleCreateKeyword:', error);
    return res.status(500).json({ error: 'Failed to create keyword' });
  }
}
