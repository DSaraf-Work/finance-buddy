/**
 * Mock AI Configuration Utility
 * Manages user-level Mock AI preferences stored in Supabase auth.users.raw_user_meta_data
 */

import { supabaseAdmin } from '../supabase';

export class MockAIConfig {
  /**
   * Check if mock AI is enabled for a specific user (async - reads from database)
   * @param userId - User ID to check mock AI preference for
   * @returns Promise<boolean> - true if mock AI is enabled for this user
   */
  static async isEnabledForUser(userId: string): Promise<boolean> {
    try {
      // Fetch user's metadata from Supabase
      const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (error || !user) {
        console.error('Error fetching user for mock AI check:', error);
        return true; // Default to mock AI on error
      }

      // Check raw_user_meta_data for mock_ai_enabled flag
      // Default to true if not explicitly set to false
      const mockAIEnabled = user.user.user_metadata?.mock_ai_enabled !== false;

      return mockAIEnabled;
    } catch (error) {
      console.error('Error checking mock AI status for user:', error);
      return true; // Default to mock AI on error
    }
  }

  /**
   * Enable mock AI for a specific user
   * @param userId - User ID to enable mock AI for
   */
  static async enableForUser(userId: string): Promise<void> {
    try {
      const { data: user, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (fetchError || !user) {
        throw new Error(`Failed to fetch user: ${fetchError?.message}`);
      }

      // Update user metadata
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...user.user.user_metadata,
          mock_ai_enabled: true,
        },
      });

      if (updateError) {
        throw new Error(`Failed to enable mock AI: ${updateError.message}`);
      }

      console.log(`🤖 Mock AI enabled for user ${userId}`);
    } catch (error) {
      console.error('Error enabling mock AI for user:', error);
      throw error;
    }
  }

  /**
   * Disable mock AI for a specific user (use real AI)
   * @param userId - User ID to disable mock AI for
   */
  static async disableForUser(userId: string): Promise<void> {
    try {
      const { data: user, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (fetchError || !user) {
        throw new Error(`Failed to fetch user: ${fetchError?.message}`);
      }

      // Update user metadata
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...user.user.user_metadata,
          mock_ai_enabled: false,
        },
      });

      if (updateError) {
        throw new Error(`Failed to disable mock AI: ${updateError.message}`);
      }

      console.log(`🧠 Mock AI disabled for user ${userId} - will use real AI`);
    } catch (error) {
      console.error('Error disabling mock AI for user:', error);
      throw error;
    }
  }

  /**
   * Toggle mock AI state for a specific user
   * @param userId - User ID to toggle mock AI for
   */
  static async toggleForUser(userId: string): Promise<boolean> {
    const currentState = await this.isEnabledForUser(userId);

    if (currentState) {
      await this.disableForUser(userId);
      return false;
    } else {
      await this.enableForUser(userId);
      return true;
    }
  }

  /**
   * Get current status with details for a specific user
   * @param userId - User ID to get status for
   */
  static async getStatusForUser(userId: string): Promise<{
    enabled: boolean;
    source: string;
    description: string;
  }> {
    const enabled = await this.isEnabledForUser(userId);
    return {
      enabled,
      source: 'user-database',
      description: enabled
        ? 'Using mock AI responses for development/testing (default: enabled)'
        : 'Using real AI models (OpenAI, Anthropic, Google)'
    };
  }
}
