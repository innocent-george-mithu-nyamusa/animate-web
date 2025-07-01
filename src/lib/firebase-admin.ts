import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = getFirestore();

// Firebase service functions
export class FirebaseSubscriptionService {
   db = adminDb;

  async updateUserSubscription({
    userId,
    isSubscribed,
    subscriptionId,
    subscriptionType,
    subscriptionStartDate,
    subscriptionEndDate,
    additionalData = {},
  }: {
    userId: string;
    isSubscribed: boolean;
    subscriptionId?: string;
    subscriptionType?: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
    additionalData?: Record<string, any>;
  }) {
    try {
      const userDoc = this.db.collection('users').doc(userId);

      const subscriptionData = {
        isSubscribed,
        subscriptionId,
        subscriptionType,
        subscriptionStartDate: subscriptionStartDate?.toISOString(),
        subscriptionEndDate: subscriptionEndDate?.toISOString(),
        subscriptionUpdatedAt: new Date(),
        ...additionalData,
      };

      await userDoc.set(subscriptionData, { merge: true });

      // Update generations count based on subscription status
      if (isSubscribed) {
        await this.setRemainingGenerations(userId, -1); // Unlimited
      } else {
        await this.setRemainingGenerations(userId, 3); // Free tier
      }

      console.log('Successfully updated subscription for user:', userId);
    } catch (error) {
      throw new Error(`Failed to update user subscription: ${error}`);
    }
  }

  async setRemainingGenerations(userId: string, count: number) {
    try {
      await this.db.collection('users').doc(userId).set({
        generations: {
          remaining: count,
          unlimited: count === -1,
          updatedAt: new Date(),
        },
      }, { merge: true });
    } catch (error) {
      throw new Error(`Failed to update generations: ${error}`);
    }
  }

  async createSubscriptionRecord({
    userId,
    subscriptionId,
    variantId,
    status,
    amount,
    currency,
    interval,
    customerEmail,
    trialEndsAt,
    renewsAt,
    metadata = {},
  }: {
    userId: string;
    subscriptionId: string;
    variantId: string;
    status: string;
    amount: number;
    currency: string;
    interval: string;
    customerEmail?: string;
    trialEndsAt?: Date;
    renewsAt?: Date;
    metadata?: Record<string, any>;
  }) {
    try {
      const subscriptionDoc = this.db.collection('subscriptions').doc(subscriptionId);

      const subscriptionData = {
        userId,
        subscriptionId,
        variantId,
        status,
        amount,
        currency,
        interval,
        customerEmail,
        trialEndsAt: "null",
        renewsAt: renewsAt?.toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata,
      };

      await subscriptionDoc.set(subscriptionData, { merge: true });

      console.log('Successfully created subscription record:', subscriptionId);
    } catch (error) {
      throw new Error(`Failed to create subscription record: ${error}`);
    }
  }

  async logTransaction({
    userId,
    transactionId,
    type,
    status,
    amount,
    currency,
    subscriptionId,
    orderId,
    metadata = {},
  }: {
    userId: string;
    transactionId: string;
    type: string;
    status: string;
    amount: number;
    currency: string;
    subscriptionId?: string;
    orderId?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const transactionDoc = this.db.collection('transactions').doc(transactionId);

      const transactionData = {
        userId,
        transactionId,
        type,
        status,
        amount,
        currency,
        subscriptionId,
        orderId,
        timestamp: new Date(),
        metadata,
      };

      await transactionDoc.set(transactionData);

      console.log('Successfully logged transaction:', transactionId);
    } catch (error) {
      throw new Error(`Failed to log transaction: ${error}`);
    }
  }

  async activatePendingSubscription({
    userId,
    actualSubscriptionId,
    pendingSubscriptionId,
    subscriptionStartDate,
    subscriptionEndDate,
    additionalData = {},
  }: {
    userId: string;
    actualSubscriptionId: string;
    pendingSubscriptionId: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
    additionalData?: Record<string, any>;
  }) {
    try {
      // Get pending subscription data
      const pendingDoc = await this.db.collection('subscriptions').doc(pendingSubscriptionId).get();
      if (!pendingDoc.exists) {
        throw new Error('Pending subscription not found');
      }

      const pendingData = pendingDoc.data()!;

      // Create actual subscription record
      await this.createSubscriptionRecord({
        userId,
        subscriptionId: actualSubscriptionId,
        variantId: pendingData.variantId,
        status: 'active',
        amount: pendingData.amount,
        currency: pendingData.currency,
        interval: pendingData.interval,
        customerEmail: pendingData.customerEmail,
        renewsAt: subscriptionEndDate,
        metadata: pendingData.metadata,
      });

      // Update user subscription status
      await this.updateUserSubscription({
        userId,
        isSubscribed: true,
        subscriptionId: actualSubscriptionId,
        subscriptionType: this.extractSubscriptionTypeFromInterval(pendingData.interval),
        subscriptionStartDate,
        subscriptionEndDate,
        additionalData,
      });

      // Remove pending subscription record
      await this.db.collection('subscriptions').doc(pendingSubscriptionId).delete();

      // Remove pending subscription from user document
      await this.db.collection('users').doc(userId).update({
        pendingSubscription: null,
      });

      console.log('Successfully activated subscription:', actualSubscriptionId);
    } catch (error) {
      throw new Error(`Failed to activate pending subscription: ${error}`);
    }
  }

   extractSubscriptionTypeFromInterval(interval: string): string {
    switch (interval.toLowerCase()) {
      case 'yearly':
      case 'annual':
        return 'annual';
      case 'monthly':
        return 'monthly';
      default:
        return 'monthly';
    }
  }

  async getUserDocument(userId: string) {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      return userDoc.exists ? userDoc.data() : null;
    } catch (error) {
      throw new Error(`Failed to get user document: ${error}`);
    }
  }
}