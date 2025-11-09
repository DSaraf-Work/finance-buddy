import { supabaseAdmin } from '../supabase';
import { WatchManager } from './watch-manager';
import type { Database } from '@/types/database';

type GmailConnection = Database['public']['Tables']['fb_gmail_connections']['Row'];

export interface MigrationResult {
  success: boolean;
  totalConnections: number;
  watchesSetup: number;
  failed: number;
  errors: Array<{ connectionId: string; error: string }>;
}

export class MigrationManager {
  private watchManager = new WatchManager();

  /**
   * Migrate all active connections to Pub/Sub watch
   */
  async migrateAllConnections(): Promise<MigrationResult> {
    console.log('🔄 Starting migration to Pub/Sub watch...');

    const result: MigrationResult = {
      success: false,
      totalConnections: 0,
      watchesSetup: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Get all active connections without watch enabled
      const { data: connectionsData } = await supabaseAdmin
        .from('fb_gmail_connections')
        .select('*')
        .eq('watch_enabled', false);

      const connections = (connectionsData || []) as GmailConnection[];

      if (connections.length === 0) {
        console.log('✅ No connections to migrate');
        result.success = true;
        return result;
      }

      result.totalConnections = connections.length;
      console.log(`📋 Found ${connections.length} connections to migrate`);

      // Migrate each connection
      for (const connection of connections) {
        try {
          console.log(`🔔 Setting up watch for ${connection.email_address}...`);
          
          const setupResult = await this.watchManager.setupWatch(connection.id);
          
          if (setupResult.success) {
            result.watchesSetup++;
            console.log(`✅ Watch setup for ${connection.email_address}`);
          } else {
            result.failed++;
            result.errors.push({
              connectionId: connection.id,
              error: setupResult.error || 'Unknown error',
            });
            console.error(`❌ Failed to setup watch for ${connection.email_address}:`, setupResult.error);
          }
        } catch (error: any) {
          result.failed++;
          result.errors.push({
            connectionId: connection.id,
            error: error.message,
          });
          console.error(`❌ Error migrating ${connection.email_address}:`, error);
        }
      }

      result.success = result.failed === 0;
      console.log(`✅ Migration complete: ${result.watchesSetup} successful, ${result.failed} failed`);

      return result;
    } catch (error: any) {
      console.error('❌ Migration failed:', error);
      result.success = false;
      return result;
    }
  }

  /**
   * Migrate a single connection to Pub/Sub watch
   */
  async migrateConnection(connectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 Migrating connection ${connectionId}...`);

      const setupResult = await this.watchManager.setupWatch(connectionId);

      if (setupResult.success) {
        console.log(`✅ Connection ${connectionId} migrated successfully`);
        return { success: true };
      } else {
        console.error(`❌ Failed to migrate connection ${connectionId}:`, setupResult.error);
        return { success: false, error: setupResult.error };
      }
    } catch (error: any) {
      console.error(`❌ Error migrating connection ${connectionId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<{
    totalConnections: number;
    watchEnabled: number;
    watchDisabled: number;
    percentageMigrated: number;
  }> {
    const { data: allConnectionsData } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('watch_enabled');

    const allConnections = (allConnectionsData || []) as Array<{ watch_enabled: boolean }>;

    const total = allConnections.length;
    const enabled = allConnections.filter(c => c.watch_enabled).length;
    const disabled = total - enabled;

    return {
      totalConnections: total,
      watchEnabled: enabled,
      watchDisabled: disabled,
      percentageMigrated: total > 0 ? Math.round((enabled / total) * 100) : 0,
    };
  }

  /**
   * Rollback: Disable watch for all connections
   */
  async rollbackMigration(): Promise<{ success: boolean; disabled: number }> {
    console.log('⏪ Rolling back migration...');

    const { data: connectionsData } = await supabaseAdmin
      .from('fb_gmail_connections')
      .select('*')
      .eq('watch_enabled', true);

    const connections = (connectionsData || []) as GmailConnection[];
    let disabled = 0;

    for (const connection of connections) {
      try {
        await this.watchManager.stopWatch(connection.id);
        disabled++;
      } catch (error) {
        console.error(`Failed to stop watch for ${connection.id}:`, error);
      }
    }

    console.log(`✅ Rollback complete: ${disabled} watches disabled`);

    return { success: true, disabled };
  }
}

