// Keyword Management Service
// Handles dynamic keyword management, auto-generation, and AI integration

import { supabaseAdmin } from '@/lib/supabase';
import { TransactionKeyword } from '@/pages/api/keywords';

export interface KeywordUsageStats {
  frequent: TransactionKeyword[];
  common: TransactionKeyword[];
  rare: TransactionKeyword[];
}

export class KeywordService {
  /**
   * Get active keywords for a user, organized by usage frequency
   */
  static async getUserKeywords(userId: string): Promise<TransactionKeyword[]> {
    try {
      const { data: rawKeywords, error } = await (supabaseAdmin as any)
        .from('fb_transaction_keywords')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('Error fetching user keywords:', error);
        throw new Error('Failed to fetch keywords');
      }

      // Add usage_category to each keyword
      const keywords = (rawKeywords as any[])?.map((keyword: any) => ({
        ...keyword,
        usage_category: keyword.usage_count > 10 ? 'frequent' :
                       keyword.usage_count > 3 ? 'common' : 'rare'
      })) || [];

      // Initialize default keywords if user has none
      if (!keywords || keywords.length === 0) {
        await this.initializeDefaultKeywords(userId);
        return this.getUserKeywords(userId); // Recursive call after initialization
      }

      return keywords;
    } catch (error) {
      console.error('Error in getUserKeywords:', error);
      throw error;
    }
  }

  /**
   * Get keywords organized by usage frequency
   */
  static async getKeywordsByUsage(userId: string): Promise<KeywordUsageStats> {
    const keywords = await this.getUserKeywords(userId);
    
    return {
      frequent: keywords.filter(k => k.usage_category === 'frequent'),
      common: keywords.filter(k => k.usage_category === 'common'),
      rare: keywords.filter(k => k.usage_category === 'rare')
    };
  }

  /**
   * Get active keywords as a simple string array for AI prompts
   */
  static async getActiveKeywordsForAI(userId: string): Promise<string[]> {
    const keywords = await this.getUserKeywords(userId);
    return keywords.map(k => k.keyword);
  }

  /**
   * Process AI-generated keywords and auto-add new ones
   */
  static async processAIKeywords(userId: string, aiKeywords: string): Promise<string[]> {
    if (!aiKeywords || aiKeywords.trim().length === 0) {
      return [];
    }

    // Parse comma-separated keywords
    const keywordList = aiKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .map(k => k.charAt(0).toUpperCase() + k.slice(1).toLowerCase());

    // Get existing keywords to avoid duplicates
    const existingKeywords = await this.getUserKeywords(userId);
    const existingKeywordSet = new Set(existingKeywords.map(k => k.keyword.toLowerCase()));

    const processedKeywords: string[] = [];

    for (const keyword of keywordList) {
      processedKeywords.push(keyword);

      // Check if keyword exists
      if (!existingKeywordSet.has(keyword.toLowerCase())) {
        try {
          // Auto-add new keyword
          await (supabaseAdmin as any).rpc('add_auto_generated_keyword', {
            target_user_id: userId,
            new_keyword: keyword
          });

          console.log(`✨ Auto-added new keyword: ${keyword} for user ${userId}`);
        } catch (error) {
          console.error(`Error auto-adding keyword ${keyword}:`, error);
        }
      } else {
        try {
          // Increment usage count for existing keyword
          await (supabaseAdmin as any).rpc('increment_keyword_usage', {
            target_user_id: userId,
            keyword_text: keyword
          });
        } catch (error) {
          console.error(`Error incrementing usage for keyword ${keyword}:`, error);
        }
      }
    }

    return processedKeywords;
  }

  /**
   * Initialize default keywords for a new user
   */
  static async initializeDefaultKeywords(userId: string): Promise<void> {
    try {
      const { error } = await (supabaseAdmin as any).rpc('initialize_default_keywords', {
        target_user_id: userId
      });

      if (error) {
        console.error('Error initializing default keywords:', error);
        throw new Error('Failed to initialize default keywords');
      }

      console.log(`🎯 Initialized default keywords for user ${userId}`);
    } catch (error) {
      console.error('Error in initializeDefaultKeywords:', error);
      throw error;
    }
  }

  /**
   * Create AI prompt with dynamic keywords
   */
  static async createKeywordAwarePrompt(userId: string, basePrompt: string): Promise<string> {
    try {
      const keywords = await this.getActiveKeywordsForAI(userId);
      
      if (keywords.length === 0) {
        return basePrompt;
      }

      const keywordSection = `
PREFERRED KEYWORDS:
Use these existing keywords when possible: ${keywords.join(', ')}

KEYWORD INSTRUCTIONS:
1. Prioritize using keywords from the preferred list above
2. If none of the preferred keywords fit, generate new appropriate keywords
3. Use 3-6 keywords maximum, comma-separated
4. Keep keywords concise and relevant to the transaction
5. Capitalize the first letter of each keyword

`;

      return keywordSection + basePrompt;
    } catch (error) {
      console.error('Error creating keyword-aware prompt:', error);
      return basePrompt; // Fallback to base prompt
    }
  }

  /**
   * Validate and normalize keyword
   */
  static normalizeKeyword(keyword: string): string {
    return keyword.trim().charAt(0).toUpperCase() + keyword.trim().slice(1).toLowerCase();
  }

  /**
   * Bulk update keyword usage from transaction processing
   */
  static async updateKeywordUsage(userId: string, keywords: string[]): Promise<void> {
    try {
      for (const keyword of keywords) {
        await (supabaseAdmin as any).rpc('increment_keyword_usage', {
          target_user_id: userId,
          keyword_text: keyword
        });
      }
    } catch (error) {
      console.error('Error updating keyword usage:', error);
    }
  }

  /**
   * Get keyword suggestions based on transaction context
   */
  static async getKeywordSuggestions(userId: string, merchantName?: string, category?: string): Promise<string[]> {
    try {
      const allKeywords = await this.getUserKeywords(userId);
      
      // Filter keywords based on context
      let suggestions = allKeywords.map(k => k.keyword);

      // Add context-based suggestions
      if (merchantName) {
        const merchant = merchantName.toLowerCase();
        if (merchant.includes('swiggy') || merchant.includes('zomato') || merchant.includes('food')) {
          suggestions.unshift('Food', 'Delivery');
        } else if (merchant.includes('uber') || merchant.includes('ola')) {
          suggestions.unshift('Transport', 'Travel');
        } else if (merchant.includes('amazon') || merchant.includes('flipkart')) {
          suggestions.unshift('Shopping', 'Online');
        }
      }

      if (category) {
        const cat = category.toLowerCase();
        if (cat === 'food') {
          suggestions.unshift('Food', 'Dining', 'Groceries');
        } else if (cat === 'transport') {
          suggestions.unshift('Transport', 'Travel', 'Fuel');
        }
      }

      // Remove duplicates and limit to top 10
      return [...new Set(suggestions)].slice(0, 10);
    } catch (error) {
      console.error('Error getting keyword suggestions:', error);
      return [];
    }
  }
}
