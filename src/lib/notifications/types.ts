// Notification Types and Interfaces

export type NotificationType = 'transaction_processed' | 'sync_error' | 'system_alert';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  transaction_id: string | null;
  email_id: string | null;
  action_url: string | null;
  action_label: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  transactionId?: string;
  emailId?: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationFilters {
  read?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

