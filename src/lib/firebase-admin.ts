// src/lib/pages/

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const adminDb = getFirestore();

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
   * Create or update user subscription
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
      await this.setGenerationCredits(userId, tier);

      console.log(
        `Successfully updated subscription for user: ${userId}, tier: ${tier}`
      );
    } catch (error) {
      throw new Error(`Failed to update user subscription: ${error}`);
    }
  }

  /**
   * Set generation credits based on subscription tier
   */
  async setGenerationCredits(userId: string, tier: SubscriptionTier) {
    try {
      const generations = this.getGenerationsForTier(tier);

      await this.db
        .collection("users")
        .doc(userId)
        .set(
          {
            credits: {
              remaining: generations,
              total: generations,
              tier,
              updatedAt: new Date().toISOString(),
            },
          },
          { merge: true }
        );

      console.log(
        `Set ${generations} generation credits for user: ${userId}`
      );
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
   * Mark subscription as expired
   */
  async expireSubscription(subscriptionId: string) {
    await this.updateSubscriptionStatus(subscriptionId, "expired");

    // Reset user to free tier
    const subscriptionDoc = await this.db
      .collection("subscriptions")
      .doc(subscriptionId)
      .get();

    if (subscriptionDoc.exists) {
      const data = subscriptionDoc.data()!;
      await this.setGenerationCredits(data.userId, "free");
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
   * Check for expired subscriptions and update status
   * Should be run as a scheduled Cloud Function
   */
  async processExpiredSubscriptions() {
    try {
      const now = new Date();
      const subscriptionsSnapshot = await this.db
        .collection("subscriptions")
        .where("status", "in", ["active", "past_due", "cancelled"])
        .get();

      const expiredSubscriptions = subscriptionsSnapshot.docs.filter((doc) => {
        const data = doc.data();
        const renewalDate = new Date(data.renewalDate);
        return renewalDate < now;
      });

      for (const doc of expiredSubscriptions) {
        await this.expireSubscription(doc.id);
      }

      console.log(
        `Processed ${expiredSubscriptions.length} expired subscriptions`
      );
    } catch (error) {
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
