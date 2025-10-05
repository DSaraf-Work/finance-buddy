// Notification Manager - CRUD operations for notifications

import { supabaseAdmin } from '../supabase';
import { 
  Notification, 
  CreateNotificationParams, 
  NotificationFilters 
} from './types';

export class NotificationManager {
  /**
   * Create a new notification
   */
  async create(params: CreateNotificationParams): Promise<Notification> {
    const { data, error } = await supabaseAdmin
      .from('fb_notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        transaction_id: params.transactionId || null,
        email_id: params.emailId || null,
        action_url: params.actionUrl || null,
        action_label: params.actionLabel || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }

    console.log('✅ Notification created:', {
      id: data.id,
      type: data.type,
      title: data.title,
    });

    return data;
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    let query = supabaseAdmin
      .from('fb_notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply filters
    if (filters.read !== undefined) {
      query = query.eq('read', filters.read);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    // Pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }

    return {
      notifications: data || [],
      total: count || 0,
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('fb_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('fb_notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('fb_notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('fb_notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Delete all read notifications
   */
  async deleteAllRead(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('fb_notifications')
      .delete()
      .eq('user_id', userId)
      .eq('read', true);

    if (error) {
      console.error('Failed to delete read notifications:', error);
      throw error;
    }
  }
}

