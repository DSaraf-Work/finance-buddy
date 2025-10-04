import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser, createUserSupabaseClient } from '@/lib/auth';

export interface KeywordUpdateRequest {
  keyword?: string;
  is_active?: boolean;
  usage_count?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Keyword ID is required' });
    }

    // Create user-authenticated Supabase client for RLS
    const supabase = await createUserSupabaseClient(req);

    switch (req.method) {
      case 'GET':
        return handleGetKeyword(req, res, user.id, id, supabase);
      case 'PUT':
        return handleUpdateKeyword(req, res, user.id, id, supabase);
      case 'DELETE':
        return handleDeleteKeyword(req, res, user.id, id, supabase);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Keyword API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetKeyword(req: NextApiRequest, res: NextApiResponse, userId: string, keywordId: string, supabase: any) {
  try {
    const { data: keyword, error } = await supabase
      .from('fb_transaction_keywords')
      .select('*')
      .eq('id', keywordId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Keyword not found' });
      }
      console.error('Error fetching keyword:', error);
      return res.status(500).json({ error: 'Failed to fetch keyword' });
    }

    return res.status(200).json({ keyword });
  } catch (error) {
    console.error('Error in handleGetKeyword:', error);
    return res.status(500).json({ error: 'Failed to fetch keyword' });
  }
}

async function handleUpdateKeyword(req: NextApiRequest, res: NextApiResponse, userId: string, keywordId: string, supabase: any) {
  const { keyword, is_active, usage_count }: KeywordUpdateRequest = req.body;

  const updates: any = {};

  if (keyword !== undefined) {
    if (typeof keyword !== 'string' || keyword.trim().length === 0) {
      return res.status(400).json({ error: 'Keyword must be a non-empty string' });
    }
    updates.keyword = keyword.trim().charAt(0).toUpperCase() + keyword.trim().slice(1).toLowerCase();
  }

  if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be a boolean' });
    }
    updates.is_active = is_active;
  }

  if (usage_count !== undefined) {
    if (typeof usage_count !== 'number' || usage_count < 0) {
      return res.status(400).json({ error: 'usage_count must be a non-negative number' });
    }
    updates.usage_count = usage_count;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    const { data: updatedKeyword, error } = await supabase
      .from('fb_transaction_keywords')
      .update(updates)
      .eq('id', keywordId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Keyword not found' });
      }
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ error: 'Keyword already exists' });
      }
      console.error('Error updating keyword:', error);
      return res.status(500).json({ error: 'Failed to update keyword' });
    }

    return res.status(200).json({ keyword: updatedKeyword });
  } catch (error) {
    console.error('Error in handleUpdateKeyword:', error);
    return res.status(500).json({ error: 'Failed to update keyword' });
  }
}

async function handleDeleteKeyword(req: NextApiRequest, res: NextApiResponse, userId: string, keywordId: string, supabase: any) {
  try {
    const { error } = await supabase
      .from('fb_transaction_keywords')
      .delete()
      .eq('id', keywordId);

    if (error) {
      console.error('Error deleting keyword:', error);
      return res.status(500).json({ error: 'Failed to delete keyword' });
    }

    return res.status(204).end();
  } catch (error) {
    console.error('Error in handleDeleteKeyword:', error);
    return res.status(500).json({ error: 'Failed to delete keyword' });
  }
}
