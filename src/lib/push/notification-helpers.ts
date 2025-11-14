/**
 * Notification Helper Functions
 * 
 * Reusable helper functions for common notification scenarios.
 * Provides a simple interface for sending notifications without
 * dealing with low-level push notification details.
 */

import { PushManager } from './push-manager';

export class NotificationHelpers {
  /**
   * Send transaction notification
   */
  static async notifyTransaction(
    userId: string,
    transaction: {
      id: string;
      amount: number;
      merchant: string;
      type: 'debit' | 'credit';
    }
  ) {
    return PushManager.sendToUser(userId, {
      title: `New ${transaction.type === 'debit' ? 'Expense' : 'Income'}`,
      body: `₹${transaction.amount} at ${transaction.merchant}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: `/transactions/${transaction.id}`,
      data: {
        type: 'transaction',
        transactionId: transaction.id,
      },
    });
  }

  /**
   * Send sync completion notification
   */
  static async notifySyncComplete(userId: string, count: number) {
    if (count === 0) return; // Don't notify if no new transactions

    return PushManager.sendToUser(userId, {
      title: 'Sync Complete',
      body: `${count} new transaction${count > 1 ? 's' : ''} extracted`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: '/transactions',
      data: {
        type: 'sync_complete',
        count,
      },
    });
  }

  /**
   * Send error notification
   */
  static async notifyError(userId: string, error: string) {
    return PushManager.sendToUser(userId, {
      title: 'Error',
      body: error,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: '/settings',
      data: {
        type: 'error',
      },
    });
  }

  /**
   * Send bulk notifications to multiple users
   */
  static async notifyMultipleUsers(
    notifications: Array<{ userId: string; title: string; body: string; url?: string }>
  ) {
    const results = await Promise.allSettled(
      notifications.map(({ userId, title, body, url }) =>
        PushManager.sendToUser(userId, {
          title,
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          url: url || '/',
          data: { type: 'bulk_notification' },
        })
      )
    );

    return {
      total: notifications.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
    };
  }
}

