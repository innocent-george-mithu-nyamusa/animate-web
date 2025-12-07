// pages/api/get-receipt.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { FirebaseSubscriptionService } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscriptionId, orderId } = req.body;

    if (!subscriptionId && !orderId) {
      return res.status(400).json({ error: 'Subscription ID or Order ID is required' });
    }

    const firebaseService = new FirebaseSubscriptionService();

    // Get subscription data from Firebase
    let subscriptionData = null;
    let transactionData = null;

    if (subscriptionId) {
      // Get subscription document
      const subscriptionDoc = await firebaseService.db
        .collection('subscriptions')
        .doc(subscriptionId)
        .get();

      if (subscriptionDoc.exists) {
        subscriptionData = subscriptionDoc.data();
      }

      // Get related transaction
      const transactionQuery = await firebaseService.db
        .collection('transactions')
        .where('subscriptionId', '==', subscriptionId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      if (!transactionQuery.empty) {
        transactionData = transactionQuery.docs[0].data();
      }
    }

    if (orderId && !subscriptionData) {
      // Get transaction by order ID
      const transactionQuery = await firebaseService.db
        .collection('transactions')
        .where('orderId', '==', orderId)
        .limit(1)
        .get();

      if (!transactionQuery.empty) {
        transactionData = transactionQuery.docs[0].data();
        
        // Get subscription data if available
        if (transactionData.subscriptionId) {
          const subscriptionDoc = await firebaseService.db
            .collection('subscriptions')
            .doc(transactionData.subscriptionId)
            .get();

          if (subscriptionDoc.exists) {
            subscriptionData = subscriptionDoc.data();
          }
        }
      }
    }

    if (!subscriptionData && !transactionData) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Get user data
    const userId = subscriptionData?.userId || transactionData?.userId;
    let userData = null;
    
    if (userId) {
      userData = await firebaseService.getUserDocument(userId);
    }

    // Calculate tax and total
    const amount = subscriptionData?.amount || transactionData?.amount || 0;
    const tax = transactionData?.metadata?.tax || '0.00';
    const total = transactionData?.amount || amount;

    // Build receipt data
    const receiptData = {
      subscriptionId: subscriptionData?.subscriptionId || transactionData?.subscriptionId || '',
      orderId: transactionData?.orderId || subscriptionData?.metadata?.orderId || '',
      orderNumber: transactionData?.metadata?.orderNumber || Math.floor(Math.random() * 1000000),
      productName: subscriptionData?.metadata?.productName || transactionData?.metadata?.productName || 'IconicMe Pro',
      variantName: subscriptionData?.metadata?.variantName || transactionData?.metadata?.variantName || 'Subscription',
      userEmail: userData?.email || subscriptionData?.customerEmail || transactionData?.metadata?.customerEmail || '',
      userName: userData?.name || subscriptionData?.metadata?.customerName || transactionData?.metadata?.customerName || 'User',
      amount: amount.toString(),
      currency: subscriptionData?.currency || transactionData?.currency || 'USD',
      tax: tax.toString(),
      total: total.toString(),
      interval: subscriptionData?.interval || 'monthly',
      status: subscriptionData?.status || transactionData?.status || 'active',
      createdAt: subscriptionData?.createdAt?.toDate?.()?.toISOString() || 
                 transactionData?.timestamp?.toDate?.()?.toISOString() || 
                 new Date().toISOString(),
      paymentMethod: transactionData?.metadata?.paymentMethod || 'Card',
      billingAddress: userData?.billingAddress || null,
    };

    res.status(200).json({
      success: true,
      receipt: receiptData,
    });

  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ 
      error: 'Failed to fetch receipt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}