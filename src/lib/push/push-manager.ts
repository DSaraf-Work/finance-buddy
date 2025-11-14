/**
 * Push Notification Manager
 * 
 * Core module for managing web push notifications using the web-push library.
 * Handles subscription management and sending push notifications to users.
 */

import webpush from 'web-push';
import { supabaseAdmin } from '../supabase';
import { PushSubscription, PushPayload, SendPushResult } from './push-types';
import type { Database } from '@/types/database';

// Configure web-push with VAPID keys
if (process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export class PushManager {
  /**
   * Save a push subscription to the database
   */
  static async saveSubscription(
    userId: string,
    subscription: PushSubscriptionJSON
  ): Promise<void> {
    const { endpoint, keys } = subscription;

    if (!endpoint || !keys) {
      throw new Error('Invalid subscription object');
    }

    // First, try to delete any existing subscription for this user and endpoint
    // This ensures we don't hit RLS issues with upsert
    await (supabaseAdmin
      .from('fb_push_subscriptions') as any)
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    // Then insert the new subscription
    const { error } = await (supabaseAdmin
      .from('fb_push_subscriptions') as any)
      .insert({
        user_id: userId,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        expiration_time: subscription.expirationTime || null,
      });

    if (error) {
      console.error('Failed to save push subscription:', error);
      throw error;
    }

    console.log('✅ Push subscription saved:', { userId, endpoint: endpoint.substring(0, 50) });
  }

  /**
   * Remove a push subscription from the database
   */
  static async removeSubscription(endpoint: string): Promise<void> {
    const { error } = await (supabaseAdmin
      .from('fb_push_subscriptions') as any)
      .delete()
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Failed to remove push subscription:', error);
      throw error;
    }

    console.log('✅ Push subscription removed:', { endpoint: endpoint.substring(0, 50) });
  }

  /**
   * Get all push subscriptions for a user
   */
  static async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
    const { data, error } = await (supabaseAdmin
      .from('fb_push_subscriptions') as any)
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to get user subscriptions:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Send push notification to all user's devices
   */
  static async sendToUser(
    userId: string,
    payload: PushPayload
  ): Promise<SendPushResult> {
    const subscriptions = await this.getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      console.log('⚠️ No push subscriptions found for user:', userId);
      return { success: true, successCount: 0, failureCount: 0, results: [] };
    }

    const promiseResults = await Promise.allSettled(
      subscriptions.map((sub) => this.sendToSubscription(sub, payload))
    );

    const successCount = promiseResults.filter((r) => r.status === 'fulfilled').length;
    const failureCount = promiseResults.filter((r) => r.status === 'rejected').length;

    console.log(`📤 Push sent to ${successCount}/${subscriptions.length} devices`);

    return { success: true, successCount, failureCount, results: promiseResults };
  }

  /**
   * Send push notification to a single subscription
   */
  private static async sendToSubscription(
    subscription: PushSubscription,
    payload: PushPayload
  ): Promise<void> {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    };

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload)
      );
      console.log('✅ Push sent to:', subscription.endpoint.substring(0, 50));
    } catch (error: any) {
      // Handle expired/invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log('🗑️ Removing expired subscription:', subscription.endpoint.substring(0, 50));
        await this.removeSubscription(subscription.endpoint);
      }
      throw error;
    }
  }

  /**
   * Get VAPID public key for client-side subscription
   */
  static getPublicKey(): string {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      throw new Error('VAPID_PUBLIC_KEY not configured');
    }
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  }
}

