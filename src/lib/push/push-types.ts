/**
 * Push Notification Type Definitions
 * 
 * This module defines TypeScript interfaces for push notification functionality.
 */

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expiration_time: number | null;
  created_at: string;
  updated_at: string;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

export interface SendPushResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  results: Array<any>;
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

