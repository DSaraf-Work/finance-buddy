import { NextApiRequest, NextApiResponse } from 'next';
import { MigrationManager } from '@/lib/gmail-watch/migration-manager';

/**
 * Admin endpoint to migrate connections to Pub/Sub
 * POST /api/admin/migrate-to-pubsub
 * 
 * Body:
 * - connectionId (optional): Migrate specific connection
 * - action: 'migrate' | 'status' | 'rollback'
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple admin authentication (use proper auth in production)
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { action, connectionId } = req.body;
    const migrationManager = new MigrationManager();

    switch (action) {
      case 'migrate':
        if (connectionId) {
          // Migrate single connection
          const result = await migrationManager.migrateConnection(connectionId);
          return res.status(200).json({
            success: result.success,
            connectionId,
            error: result.error,
          });
        } else {
          // Migrate all connections
          const result = await migrationManager.migrateAllConnections();
          return res.status(200).json(result);
        }

      case 'status':
        const status = await migrationManager.getMigrationStatus();
        return res.status(200).json({
          success: true,
          ...status,
        });

      case 'rollback':
        const rollbackResult = await migrationManager.rollbackMigration();
        return res.status(200).json(rollbackResult);

      default:
        return res.status(400).json({ 
          error: 'Invalid action. Use: migrate, status, or rollback' 
        });
    }
  } catch (error: any) {
    console.error('❌ Migration endpoint error:', error);
    return res.status(500).json({ 
      error: error.message,
      success: false,
    });
  }
}

