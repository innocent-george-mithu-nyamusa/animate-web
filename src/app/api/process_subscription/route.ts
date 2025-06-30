// pages/api/process-subscription.ts (if using Pages Router)
// OR app/api/process-subscription/route.ts (if using App Router)

import { NextRequest, NextResponse } from 'next/server';
import { FirebaseSubscriptionService } from "@/lib/firebase-admin";

interface LemonSqueezyWebhookData {
  subscription: {
    id: string;
    status: string;
    variant_id: string;
    customer_email: string;
    user_name: string;
    product_name: string;
    variant_name: string;
    price: string;
    currency: string;
    interval: string;
    trial_ends_at: string | null;
    renews_at: string;
    created_at: string;
    updated_at: string;
  };
  order: {
    id: string;
    order_number: number;
    total: string;
    tax: string;
    status: string;
  };
  customer: {
    id: string;
    email: string;
    name: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body - await the json() method
    const body = await req.json();

    // Extract subscriptionId from the body
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' }, 
        { status: 400 }
      );
    }

    console.log(subscriptionId);
    // Initialize Firebase service
    const firebaseService = new FirebaseSubscriptionService();

    // Fetch the subscription data from LemonSqueezy API
    const subscriptionData = await fetchLemonSqueezySubscription(subscriptionId);
    
    if (!subscriptionData) {
      return NextResponse.json(
        { error: 'Subscription not found' }, 
        { status: 404 }
      );
    }

    // Extract user ID from subscription metadata or customer email
    const userId = subscriptionData.subscription.customer_email; // or get from your user mapping

    // Update user subscription in Firebase
    await firebaseService.updateUserSubscription({
      userId,
      isSubscribed: true,
      subscriptionId: subscriptionData.subscription.id,
      subscriptionType: firebaseService.extractSubscriptionTypeFromInterval(subscriptionData.subscription.interval),
      subscriptionStartDate: new Date(subscriptionData.subscription.created_at),
      subscriptionEndDate: new Date(subscriptionData.subscription.renews_at),
      additionalData: {
        productName: subscriptionData.subscription.product_name,
        variantName: subscriptionData.subscription.variant_name,
        amount: subscriptionData.subscription.price,
        currency: subscriptionData.subscription.currency,
        customerEmail: subscriptionData.subscription.customer_email,
        customerName: subscriptionData.customer.name,
      },
    });

    // Create subscription record
    await firebaseService.createSubscriptionRecord({
      userId,
      subscriptionId: subscriptionData.subscription.id,
      variantId: subscriptionData.subscription.variant_id,
      status: subscriptionData.subscription.status,
      amount: parseFloat(subscriptionData.subscription.price),
      currency: subscriptionData.subscription.currency,
      interval: subscriptionData.subscription.interval,
      customerEmail: subscriptionData.subscription.customer_email,
      trialEndsAt: subscriptionData.subscription.trial_ends_at 
        ? new Date(subscriptionData.subscription.trial_ends_at) 
        : undefined,
      renewsAt: new Date(subscriptionData.subscription.renews_at),
      metadata: {
        orderId: subscriptionData.order.id,
        orderNumber: subscriptionData.order.order_number,
        productName: subscriptionData.subscription.product_name,
        variantName: subscriptionData.subscription.variant_name,
        customerName: subscriptionData.customer.name,
      },
    });

    // Log the transaction
    await firebaseService.logTransaction({
      userId,
      transactionId: `${subscriptionData.order.id}-${Date.now()}`,
      type: 'subscription_payment',
      status: subscriptionData.order.status,
      amount: parseFloat(subscriptionData.order.total),
      currency: subscriptionData.subscription.currency,
      subscriptionId: subscriptionData.subscription.id,
      orderId: subscriptionData.order.id,
      metadata: {
        orderNumber: subscriptionData.order.order_number,
        tax: subscriptionData.order.tax,
        productName: subscriptionData.subscription.product_name,
        variantName: subscriptionData.subscription.variant_name,
      },
    });

    // Return success response with subscription data
    return NextResponse.json({
      success: true,
      subscription: {
        subscriptionId: subscriptionData.subscription.id,
        productName: subscriptionData.subscription.product_name,
        variantName: subscriptionData.subscription.variant_name,
        amount: subscriptionData.subscription.price,
        currency: subscriptionData.subscription.currency,
        interval: subscriptionData.subscription.interval,
        userEmail: subscriptionData.subscription.customer_email,
        status: subscriptionData.subscription.status,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to process subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Mock function to simulate LemonSqueezy API call
// Replace this with actual LemonSqueezy API integration
async function fetchLemonSqueezySubscription(subscriptionId: string): Promise<LemonSqueezyWebhookData | null> {
  try {
    // This is where you would make the actual API call to LemonSqueezy
    // const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    //     'Accept': 'application/vnd.api+json',
    //     'Content-Type': 'application/vnd.api+json',
    //   },
    // });
    
    // For now, return mock data
    // const mockData: LemonSqueezyWebhookData = {
    //   subscription: {
    //     id: subscriptionId,
    //     status: 'active',
    //     variant_id: 'variant_123',
    //     customer_email: 'user@example.com',
    //     user_name: 'John Doe',
    //     product_name: 'Animate Pro',
    //     variant_name: 'Monthly',
    //     price: '9.99',
    //     currency: 'USD',
    //     interval: 'monthly',
    //     trial_ends_at: null,
    //     renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    //     created_at: new Date().toISOString(),
    //     updated_at: new Date().toISOString(),
    //   },
    //   order: {
    //     id: `order_${Date.now()}`,
    //     order_number: Math.floor(Math.random() * 1000000),
    //     total: '9.99',
    //     tax: '0.00',
    //     status: 'paid',
    //   },
    //   customer: {
    //     id: 'customer_123',
    //     email: 'user@example.com',
    //     name: 'John Doe',
    //   },
    // };

    // return response.json();
    
    // For actual implementation, uncomment and modify this:
    const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`LemonSqueezy API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error fetching subscription from LemonSqueezy:', error);
    return null;
  }
}

// Optional: Add other HTTP methods if needed
export async function GET(req: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT(req: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}