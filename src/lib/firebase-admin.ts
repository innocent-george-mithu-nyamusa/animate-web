// src/lib/pages/

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "animate-e8bc7.firebasestorage.app",
  });
}

export const adminDb = getFirestore();
export const adminStorage = getStorage();

/**
 * Subscription States
 * - active: The subscription is active and valid
 * - paused: Payment collection has been paused and the subscription is still active
 * - past_due: A renewal payment has failed, system will attempt retries
 * - unpaid: All renewal retries have failed
 * - cancelled: Future payment collection cancelled, valid until end of billing period
 * - expired: The subscription has ended
 */
export type SubscriptionStatus =
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired";

/**
 * Subscription Tiers
 * - free: USD 0 / ZWG 0 - 3 generations/month
 * - standard: USD 9.99 / ZWG 297 - 120 generations/month
 * - premium: USD 19.99 / ZWG 620 - 280 generations/month
 */
export type SubscriptionTier = "free" | "standard" | "premium";

export type Currency = "USD" | "ZWG";
export type PaymentMethod = "ecocash" | "paynow";

export interface SubscriptionTierConfig {
  usd: number;
  zwg: number;
  generations: number;
}

// Subscription tier configurations
export const SUBSCRIPTION_TIERS: Record<
  SubscriptionTier,
  SubscriptionTierConfig
> = {
  free: { usd: 0, zwg: 0, generations: 3 },
  standard: { usd: 9.99, zwg: 297, generations: 120 },
  premium: { usd: 19.99, zwg: 620, generations: 280 },
};

// Firebase service functions
export class FirebaseSubscriptionService {
  db = adminDb;

  /**
   * Determine subscription tier based on amount and currency
   */
  getSubscriptionTier(amount: number, currency: Currency): SubscriptionTier {
    const tiers = Object.entries(SUBSCRIPTION_TIERS);

    for (const [tier, config] of tiers) {
      const expectedAmount =
        currency === "USD" ? config.usd : config.zwg;

      // Allow small variance for floating point comparison
      if (Math.abs(amount - expectedAmount) < 0.01) {
        return tier as SubscriptionTier;
      }
    }

    return "free"; // Default to free if amount doesn't match
  }

  /**
   * Get generation credits for a subscription tier
   */
  getGenerationsForTier(tier: SubscriptionTier): number {
    return SUBSCRIPTION_TIERS[tier].generations;
  }

  /**
   * Get expected amount for a subscription tier and currency
   * Used for amount validation in webhooks
   */
  getExpectedAmount(tier: SubscriptionTier, currency: Currency): number {
    return currency === "USD"
      ? SUBSCRIPTION_TIERS[tier].usd
      : SUBSCRIPTION_TIERS[tier].zwg;
  }

  /**
   * Create or update user subscription
   * @param resetCredits - If true, resets credits to full amount (for new subscriptions/renewals)
   */
  async updateUserSubscription({
    userId,
    subscriptionId,
    tier,
    status,
    startDate,
    endDate,
    amount,
    currency,
    paymentMethod,
    metadata = {},
    resetCredits = true,
  }: {
    userId: string;
    subscriptionId: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    amount: number;
    currency: Currency;
    paymentMethod: PaymentMethod;
    metadata?: Record<string, any>;
    resetCredits?: boolean;
  }) {
    try {
      const userDoc = this.db.collection("users").doc(userId);

      const subscriptionData = {
        subscription: {
          subscriptionId,
          tier,
          status,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          amount,
          currency,
          paymentMethod,
          updatedAt: new Date().toISOString(),
          ...metadata,
        },
      };

      await userDoc.set(subscriptionData, { merge: true });

      // Update generation credits based on tier
      // Only reset credits if explicitly requested (e.g., new subscription or renewal)
      await this.setGenerationCredits(userId, tier, resetCredits);

      console.log(
        `Successfully updated subscription for user: ${userId}, tier: ${tier}, credits reset: ${resetCredits}`
      );
    } catch (error) {
      throw new Error(`Failed to update user subscription: ${error}`);
    }
  }

  /**
   * Set generation credits based on subscription tier
   * @param resetCredits - If true, resets remaining credits to full amount (for renewals/new subscriptions)
   *                       If false, only updates tier and total (preserves remaining credits)
   */
  async setGenerationCredits(
    userId: string,
    tier: SubscriptionTier,
    resetCredits: boolean = true
  ) {
    try {
      const generations = this.getGenerationsForTier(tier);
      const userRef = this.db.collection("users").doc(userId);

      if (resetCredits) {
        // Reset credits to full amount (for new subscriptions or renewals)
        await userRef.set(
          {
            credits: {
              remaining: generations,
              total: generations,
              tier,
              updatedAt: new Date().toISOString(),
              lastReset: new Date().toISOString(),
            },
          },
          { merge: true }
        );

        console.log(
          `Reset ${generations} generation credits for user: ${userId}`
        );
      } else {
        // Just update tier and total, preserve remaining credits
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const currentRemaining = userData?.credits?.remaining || 0;

        await userRef.set(
          {
            credits: {
              remaining: currentRemaining, // Preserve current credits
              total: generations,
              tier,
              updatedAt: new Date().toISOString(),
            },
          },
          { merge: true }
        );

        console.log(
          `Updated tier to ${tier} for user: ${userId}, preserved ${currentRemaining} remaining credits`
        );
      }
    } catch (error) {
      throw new Error(`Failed to update generation credits: ${error}`);
    }
  }

  /**
   * Create subscription record in Firestore
   */
  async createSubscriptionRecord({
    userId,
    subscriptionId,
    tier,
    status,
    amount,
    currency,
    paymentMethod,
    transactionReference,
    customerEmail,
    customerPhone,
    startDate,
    renewalDate,
    metadata = {},
  }: {
    userId: string;
    subscriptionId: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    amount: number;
    currency: Currency;
    paymentMethod: PaymentMethod;
    transactionReference: string;
    customerEmail?: string;
    customerPhone?: string;
    startDate: Date;
    renewalDate: Date;
    metadata?: Record<string, any>;
  }) {
    try {
      const subscriptionDoc = this.db
        .collection("subscriptions")
        .doc(subscriptionId);

      const subscriptionData = {
        userId,
        subscriptionId,
        tier,
        status,
        amount,
        currency,
        paymentMethod,
        transactionReference,
        customerEmail,
        customerPhone,
        startDate: startDate.toISOString(),
        renewalDate: renewalDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata,
      };

      await subscriptionDoc.set(subscriptionData, { merge: true });

      console.log(
        "Successfully created subscription record:",
        subscriptionId
      );
    } catch (error) {
      throw new Error(`Failed to create subscription record: ${error}`);
    }
  }

  /**
   * Update subscription status (for lifecycle management)
   */
  async updateSubscriptionStatus(
    subscriptionId: string,
    status: SubscriptionStatus
  ) {
    try {
      const subscriptionDoc = this.db
        .collection("subscriptions")
        .doc(subscriptionId);

      await subscriptionDoc.update({
        status,
        updatedAt: new Date().toISOString(),
      });

      // Also update user's subscription status
      const subscription = await subscriptionDoc.get();
      if (subscription.exists) {
        const data = subscription.data()!;
        await this.db
          .collection("users")
          .doc(data.userId)
          .update({
            "subscription.status": status,
            "subscription.updatedAt": new Date().toISOString(),
          });
      }

      console.log(
        `Updated subscription ${subscriptionId} status to: ${status}`
      );
    } catch (error) {
      throw new Error(`Failed to update subscription status: ${error}`);
    }
  }

  /**
   * Cancel subscription (sets status to cancelled, valid until end date)
   */
  async cancelSubscription(subscriptionId: string) {
    await this.updateSubscriptionStatus(subscriptionId, "cancelled");
  }

  /**
   * Mark subscription as expired and reset user to free tier
   */
  async expireSubscription(subscriptionId: string) {
    try {
      const subscriptionDoc = await this.db
        .collection("subscriptions")
        .doc(subscriptionId)
        .get();

      if (!subscriptionDoc.exists) {
        console.warn(`Subscription ${subscriptionId} not found`);
        return;
      }

      const data = subscriptionDoc.data()!;
      const userId = data.userId;

      // Update subscription status to expired
      await this.db.collection("subscriptions").doc(subscriptionId).update({
        status: "expired",
        updatedAt: new Date().toISOString(),
      });

      // Reset user to free tier with proper subscription info
      await this.updateUserSubscription({
        userId,
        subscriptionId: "free_tier",
        tier: "free",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        amount: 0,
        currency: "USD",
        paymentMethod: "paynow",
        resetCredits: true, // Reset to 3 credits
      });

      console.log(
        `[EXPIRE] Successfully expired subscription ${subscriptionId} and reset user ${userId} to free tier`
      );
    } catch (error) {
      console.error(`[EXPIRE] Failed to expire subscription:`, error);
      throw new Error(`Failed to expire subscription: ${error}`);
    }
  }

  /**
   * Log payment transaction
   */
  async logTransaction({
    userId,
    transactionId,
    type,
    status,
    amount,
    currency,
    paymentMethod,
    subscriptionId,
    metadata = {},
  }: {
    userId: string;
    transactionId: string;
    type: "subscription_payment" | "subscription_renewal" | "refund";
    status: "SUCCESS" | "FAILED" | "PENDING";
    amount: number;
    currency: Currency;
    paymentMethod: PaymentMethod;
    subscriptionId?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const transactionDoc = this.db
        .collection("transactions")
        .doc(transactionId);

      const transactionData = {
        userId,
        transactionId,
        type,
        status,
        amount,
        currency,
        paymentMethod,
        subscriptionId,
        timestamp: new Date().toISOString(),
        metadata,
      };

      await transactionDoc.set(transactionData);

      console.log("Successfully logged transaction:", transactionId);
    } catch (error) {
      throw new Error(`Failed to log transaction: ${error}`);
    }
  }

  /**
   * Get user document by Firebase UID
   */
  async getUserDocument(userId: string) {
    try {
      const userDoc = await this.db.collection("users").doc(userId).get();
      return userDoc.exists ? userDoc.data() : null;
    } catch (error) {
      throw new Error(`Failed to get user document: ${error}`);
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string) {
    try {
      const subscriptionDoc = await this.db
        .collection("subscriptions")
        .doc(subscriptionId)
        .get();
      return subscriptionDoc.exists ? subscriptionDoc.data() : null;
    } catch (error) {
      throw new Error(`Failed to get subscription: ${error}`);
    }
  }

  /**
   * Get user's active paid subscription (excludes free tier)
   * Returns the most recent active/past_due/cancelled subscription
   */
  async getUserActiveSubscription(
    userId: string
  ): Promise<{ exists: boolean; subscriptionId?: string; data?: any }> {
    try {
      const subscriptionsSnapshot = await this.db
        .collection("subscriptions")
        .where("userId", "==", userId)
        .where("status", "in", ["active", "past_due", "cancelled"])
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (subscriptionsSnapshot.empty) {
        return { exists: false };
      }

      const doc = subscriptionsSnapshot.docs[0];
      const data = doc.data();

      // Don't return free tier subscriptions
      if (data.tier === "free") {
        return { exists: false };
      }

      return {
        exists: true,
        subscriptionId: doc.id,
        data,
      };
    } catch (error) {
      console.error("Error getting user active subscription:", error);
      throw new Error(`Failed to get user active subscription: ${error}`);
    }
  }

  /**
   * Check if subscription exists by payment reference (for idempotency)
   */
  async getSubscriptionByPaymentReference(
    paymentReference: string
  ): Promise<{ exists: boolean; subscriptionId?: string; data?: any }> {
    try {
      const subscriptionsSnapshot = await this.db
        .collection("subscriptions")
        .where("transactionReference", "==", paymentReference)
        .limit(1)
        .get();

      if (subscriptionsSnapshot.empty) {
        return { exists: false };
      }

      const doc = subscriptionsSnapshot.docs[0];
      return {
        exists: true,
        subscriptionId: doc.id,
        data: doc.data(),
      };
    } catch (error) {
      console.error("Error checking subscription by payment reference:", error);
      throw new Error(
        `Failed to check subscription by payment reference: ${error}`
      );
    }
  }

  /**
   * Check if transaction exists by reference (for idempotency)
   */
  async getTransactionByReference(
    transactionReference: string
  ): Promise<{ exists: boolean; data?: any }> {
    try {
      const transactionDoc = await this.db
        .collection("transactions")
        .doc(transactionReference)
        .get();

      if (!transactionDoc.exists) {
        return { exists: false };
      }

      return {
        exists: true,
        data: transactionDoc.data(),
      };
    } catch (error) {
      console.error("Error checking transaction by reference:", error);
      throw new Error(`Failed to check transaction by reference: ${error}`);
    }
  }

  /**
   * Check for expired subscriptions and update status
   * Should be run as a scheduled Cloud Function
   */
  async processExpiredSubscriptions() {
    try {
      const now = new Date();
      console.log(`[CRON] Processing subscriptions at ${now.toISOString()}`);

      const subscriptionsSnapshot = await this.db
        .collection("subscriptions")
        .where("status", "in", ["active", "past_due", "cancelled"])
        .get();

      console.log(
        `[CRON] Found ${subscriptionsSnapshot.docs.length} active/past_due/cancelled subscriptions`
      );

      const expiredSubscriptions = subscriptionsSnapshot.docs.filter((doc) => {
        const data = doc.data();
        const renewalDate = new Date(data.renewalDate);
        const isExpired = renewalDate < now;

        if (isExpired) {
          console.log(
            `[CRON] Subscription ${doc.id} expired - renewalDate: ${renewalDate.toISOString()}, now: ${now.toISOString()}, user: ${data.userId}`
          );
        }

        return isExpired;
      });

      console.log(
        `[CRON] Found ${expiredSubscriptions.length} expired subscriptions to process`
      );

      for (const doc of expiredSubscriptions) {
        const data = doc.data();
        console.log(
          `[CRON] Expiring subscription ${doc.id} for user ${data.userId}`
        );
        await this.expireSubscription(doc.id);
      }

      console.log(
        `[CRON] Successfully processed ${expiredSubscriptions.length} expired subscriptions`
      );
    } catch (error) {
      console.error(`[CRON] Failed to process expired subscriptions:`, error);
      throw new Error(`Failed to process expired subscriptions: ${error}`);
    }
  }

  /**
   * Renew subscription (for auto-renewal)
   */
  async renewSubscription(subscriptionId: string, transactionReference: string) {
    try {
      const subscription = await this.getSubscription(subscriptionId);

      if (!subscription) {
        throw new Error("Subscription not found");
      }

      const newStartDate = new Date();
      const newRenewalDate = new Date();
      newRenewalDate.setMonth(newRenewalDate.getMonth() + 1);

      await this.db.collection("subscriptions").doc(subscriptionId).update({
        status: "active",
        startDate: newStartDate.toISOString(),
        renewalDate: newRenewalDate.toISOString(),
        transactionReference,
        updatedAt: new Date().toISOString(),
      });

      // Reset generation credits
      await this.setGenerationCredits(
        subscription.userId,
        subscription.tier
      );

      console.log(`Successfully renewed subscription: ${subscriptionId}`);
    } catch (error) {
      throw new Error(`Failed to renew subscription: ${error}`);
    }
  }
}

/**
 * Firebase Order Service for product orders
 */
export class FirebaseOrderService {
  db = adminDb;
  storage = adminStorage;

  /**
   * Upload styled image to Firebase Storage
   * @param userId - User ID
   * @param orderId - Order ID
   * @param imageDataUrl - Base64 data URL of the image
   * @returns Public URL of uploaded image
   */
  async uploadStyledImage(
    userId: string,
    orderId: string,
    imageDataUrl: string
  ): Promise<string> {
    try {
      // Extract base64 data from data URL
      const matches = imageDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new Error("Invalid image data URL");
      }

      const contentType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // Create file path
      const fileName = `orders/${userId}/${orderId}.png`;
      const bucket = this.storage.bucket();
      const file = bucket.file(fileName);

      // Upload file
      await file.save(buffer, {
        metadata: {
          contentType,
        },
        public: true,
      });

      // Make file publicly accessible
      await file.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      return publicUrl;
    } catch (error) {
      console.error("Failed to upload styled image:", error);
      throw new Error(`Failed to upload styled image: ${error}`);
    }
  }

  /**
   * Create a new product order
   */
  async createOrder({
    orderId,
    userId,
    userEmail,
    productType,
    productDetails,
    styledImageUrl,
    styleApplied,
    amount,
    currency,
    shippingAddress,
  }: {
    orderId: string;
    userId: string;
    userEmail: string;
    productType: "plush_toy" | "framed_picture";
    productDetails: any;
    styledImageUrl: string;
    styleApplied: string;
    amount: number;
    currency: "USD" | "ZWG";
    shippingAddress: any;
  }) {
    try {
      const orderDoc = this.db.collection("orders").doc(orderId);

      const orderData = {
        orderId,
        userId,
        userEmail,
        productType,
        productDetails,
        styledImageUrl,
        styleApplied,
        amount,
        currency,
        paymentStatus: "pending",
        fulfillmentStatus: "pending",
        shippingAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await orderDoc.set(orderData);

      console.log("Successfully created order:", orderId);
      return orderData;
    } catch (error) {
      console.error("Failed to create order:", error);
      throw new Error(`Failed to create order: ${error}`);
    }
  }

  /**
   * Update order payment information
   */
  async updateOrderPayment(
    orderId: string,
    paymentMethod: string,
    paymentReference: string,
    paymentStatus: "pending" | "paid" | "failed"
  ) {
    try {
      const orderDoc = this.db.collection("orders").doc(orderId);

      await orderDoc.update({
        paymentMethod,
        paymentReference,
        paymentStatus,
        updatedAt: new Date().toISOString(),
      });

      console.log(
        `Updated payment for order ${orderId}: ${paymentStatus}`
      );
    } catch (error) {
      console.error("Failed to update order payment:", error);
      throw new Error(`Failed to update order payment: ${error}`);
    }
  }

  /**
   * Update order fulfillment status
   */
  async updateFulfillmentStatus(
    orderId: string,
    status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  ) {
    try {
      const orderDoc = this.db.collection("orders").doc(orderId);

      await orderDoc.update({
        fulfillmentStatus: status,
        updatedAt: new Date().toISOString(),
      });

      console.log(`Updated fulfillment status for order ${orderId}: ${status}`);
    } catch (error) {
      console.error("Failed to update fulfillment status:", error);
      throw new Error(`Failed to update fulfillment status: ${error}`);
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string) {
    try {
      const orderDoc = await this.db.collection("orders").doc(orderId).get();

      if (!orderDoc.exists) {
        return null;
      }

      return { id: orderDoc.id, ...orderDoc.data() };
    } catch (error) {
      console.error("Failed to get order:", error);
      throw new Error(`Failed to get order: ${error}`);
    }
  }

  /**
   * Get user's orders
   */
  async getUserOrders(userId: string, limit: number = 50) {
    try {
      const ordersSnapshot = await this.db
        .collection("orders")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Failed to get user orders:", error);
      throw new Error(`Failed to get user orders: ${error}`);
    }
  }

  /**
   * Get all orders (for admin dashboard)
   */
  async getAllOrders(limit: number = 50) {
    try {
      const ordersSnapshot = await this.db
        .collection("orders")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Failed to get all orders:", error);
      throw new Error(`Failed to get all orders: ${error}`);
    }
  }

  /**
   * Get order by payment reference
   */
  async getOrderByPaymentReference(paymentReference: string) {
    try {
      const ordersSnapshot = await this.db
        .collection("orders")
        .where("paymentReference", "==", paymentReference)
        .limit(1)
        .get();

      if (ordersSnapshot.empty) {
        return null;
      }

      const doc = ordersSnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error("Failed to get order by payment reference:", error);
      throw new Error(`Failed to get order by payment reference: ${error}`);
    }
  }
}
