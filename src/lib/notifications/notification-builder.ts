// Notification Builder - Creates notification content

import { CreateNotificationParams } from './types';

export class NotificationBuilder {
  /**
   * Build notification for a successfully processed transaction
   */
  static forTransaction(
    userId: string,
    transaction: any,
    email: any
  ): CreateNotificationParams {
    const merchantName = transaction.merchant_name || 'Unknown Merchant';
    const amount = transaction.amount 
      ? `${transaction.currency || 'INR'} ${transaction.amount.toFixed(2)}`
      : 'Unknown Amount';
    const transactionType = transaction.direction === 'debit' ? 'Debit' : 'Credit';
    const date = transaction.txn_time 
      ? new Date(transaction.txn_time).toLocaleDateString()
      : 'Unknown Date';
    const emailSender = email.from_address || 'Unknown Sender';

    return {
      userId,
      type: 'transaction_processed',
      title: `New Transaction Detected: ${merchantName}`,
      message: `${transactionType} of ${amount} on ${date} from ${emailSender}`,
      transactionId: transaction.id,
      emailId: email.id,
      actionUrl: `/transactions/${transaction.id}`,
      actionLabel: 'View & Edit Transaction',
    };
  }

  /**
   * Build notification for sync error
   */
  static forSyncError(
    userId: string,
    connectionId: string,
    errorMessage: string
  ): CreateNotificationParams {
    return {
      userId,
      type: 'sync_error',
      title: 'Email Sync Failed',
      message: `Failed to sync emails: ${errorMessage}`,
      actionUrl: `/settings?tab=connections`,
      actionLabel: 'Check Connection',
    };
  }

  /**
   * Build notification for system alert
   */
  static forSystemAlert(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionLabel?: string
  ): CreateNotificationParams {
    return {
      userId,
      type: 'system_alert',
      title,
      message,
      actionUrl,
      actionLabel,
    };
  }
}

