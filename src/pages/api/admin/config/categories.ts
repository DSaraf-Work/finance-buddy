import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

const CONFIG_KEY = 'TRANSACTION_CATEGORIES';

export default withAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {

  try {
    console.log('Categories API called:', { method: req.method, userId: user.id });

    if (req.method === 'GET') {
      // Get user's transaction categories using service role (bypasses RLS)
      const { data, error } = await supabaseAdmin
        .from('fb_config')
        .select('config_value')
        .eq('config_key', CONFIG_KEY)
        .eq('user_id', user.id)
        .maybeSingle<{ config_value: string[] }>();

      if (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
      }

      const categories = data?.config_value || [];
      console.log('Fetched categories:', categories);
      return res.status(200).json({ categories });
    }

    if (req.method === 'POST') {
      const { category } = req.body;

      if (!category || typeof category !== 'string') {
        return res.status(400).json({ error: 'Category is required and must be a string' });
      }

      // Normalize the category (lowercase, replace spaces with underscores)
      const normalizedCategory = category.trim().toLowerCase().replace(/\s+/g, '_');

      // Get current categories
      const { data: currentData, error: fetchError } = await supabaseAdmin
        .from('fb_config')
        .select('config_value')
        .eq('config_key', CONFIG_KEY)
        .eq('user_id', user.id)
        .maybeSingle<{ config_value: string[] }>();

      if (fetchError) {
        console.error('Error fetching current categories:', fetchError);
        return res.status(500).json({ error: 'Failed to fetch current categories' });
      }

      const currentCategories = currentData?.config_value || [];

      // Check if category already exists
      if (currentCategories.includes(normalizedCategory)) {
        return res.status(400).json({ error: 'Category already exists' });
      }

      // Add new category
      const updatedCategories = [...currentCategories, normalizedCategory];

      if (currentData) {
        // Update existing config
        const { error } = await (supabaseAdmin as any)
          .from('fb_config')
          .update({
            config_value: updatedCategories,
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
            config_value: updatedCategories,
            description: 'Transaction categories for AI classification',
          });

        if (error) throw error;
      }

      return res.status(200).json({ categories: updatedCategories });
    }

    if (req.method === 'DELETE') {
      const { category } = req.body;

      if (!category || typeof category !== 'string') {
        return res.status(400).json({ error: 'Category is required and must be a string' });
      }

      // Get current categories
      const { data: currentData, error: fetchError } = await supabaseAdmin
        .from('fb_config')
        .select('config_value')
        .eq('config_key', CONFIG_KEY)
        .eq('user_id', user.id)
        .maybeSingle<{ config_value: string[] }>();

      if (fetchError || !currentData) {
        return res.status(404).json({ error: 'Categories not found' });
      }

      const currentCategories = currentData.config_value || [];

      // Remove the category
      const updatedCategories = currentCategories.filter(
        (cat: string) => cat !== category
      );

      // Update config
      const { error } = await (supabaseAdmin as any)
        .from('fb_config')
        .update({
          config_value: updatedCategories,
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', CONFIG_KEY)
        .eq('user_id', user.id);

      if (error) throw error;

      return res.status(200).json({ categories: updatedCategories });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Categories API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

