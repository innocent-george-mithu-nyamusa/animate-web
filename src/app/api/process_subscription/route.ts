// pages/api/process-subscription.ts (if using Pages Router)
// OR app/api/process-subscription/route.ts (if using App Router)

import { NextRequest, NextResponse } from "next/server";
import { FirebaseSubscriptionService } from "@/lib/firebase-admin";

interface LemonSqueezyWebhookPayload {
  data: {
    type: string;
    id: string;
    attributes: {
      subscription_id: number;
      created_at: string;
      updated_at: string;
      status: string;
      tax_usd: string;
      currency: string;
      total_usd: number;
      user_name: string;
      tax_formatted: string;
      billing_reason: string;
      card_last_four: string;
      total_formatted: string;
      status_formatted: string;
      subtotal_formatted: string;
    };
    relationships: {
      subscription: {
        links: {
          related: string;
          self: string;
        };
      };
      price: {
        links: {
          related: string;
          self: string;
        };
      };
      "usage-records": {
        links: {
          related: string;
          self: string;
        };
      };
    };
    links: {
      self: string;
    };
  };
  meta: {
    test_mode: boolean;
    event_name: string;
    webhook_id: string;
    custom_data: {
      user_data: string;
    };
  };
}

interface LemonSqueezySubscriptionResponse {
  jsonapi: {
    version: string;
  };
  links: {
    self: string;
  };
  data: {
    type: string;
    id: string;
    attributes: {
      store_id: number;
      customer_id: number;
      order_id: number;
      order_item_id: number;
      product_id: number;
      variant_id: number;
      product_name: string;
      variant_name: string;
      user_name: string;
      user_email: string;
      status: string;
      status_formatted: string;
      card_brand: string;
      card_last_four: string;
      payment_processor: string;
      pause: any;
      cancelled: boolean;
      trial_ends_at: string | null;
      billing_anchor: number;
      first_subscription_item: {
        id: number;
        subscription_id: number;
        price_id: number;
        quantity: number;
        is_usage_based: boolean;
        created_at: string;
        updated_at: string;
      };
      urls: {
        update_payment_method: string;
        customer_portal: string;
        customer_portal_update_subscription: string;
      };
      renews_at: string;
      ends_at: string | null;
      created_at: string;
      updated_at: string;
      test_mode: boolean;
    };
    relationships: {
      store: { links: { related: string; self: string } };
      customer: { links: { related: string; self: string } };
      order: { links: { related: string; self: string } };
      "order-item": { links: { related: string; self: string } };
      product: { links: { related: string; self: string } };
      variant: { links: { related: string; self: string } };
      "subscription-items": { links: { related: string; self: string } };
      "subscription-invoices": { links: { related: string; self: string } };
    };
    links: {
      self: string;
    };
  };
}

export async function POST(req: NextRequest) {
  try {
    // Parse the request body - await the json() method
    const body: LemonSqueezyWebhookPayload = await req.json();

    // Extract subscriptionId from the body
    const subscriptionId = body.data.attributes?.subscription_id;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: `Subscription ID is missing` },
        { status: 400 }
      );
    }

    console.log(subscriptionId);

    const subscriptionIdString = subscriptionId.toString();

    // Initialize Firebase service
    const firebaseService = new FirebaseSubscriptionService();

    // Fetch the subscription data from LemonSqueezy API
    const subscriptionResponse =
      await fetchLemonSqueezySubscription(subscriptionIdString);

    if (!subscriptionResponse) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const subscriptionData = subscriptionResponse.data.attributes;

    // Extract user ID from subscription metadata or customer email
    const userId = body.meta.custom_data.user_data; // or get from your user mapping

    // Update user subscription in Firebase
    await firebaseService.updateUserSubscription({
      userId,
      isSubscribed: true,
      subscriptionId: subscriptionResponse.data.id,
      subscriptionType:
        firebaseService.extractSubscriptionTypeFromInterval("monthly"), // You might need to determine this from variant
      subscriptionStartDate: new Date(subscriptionData.created_at),
      subscriptionEndDate: new Date(subscriptionData.renews_at),
      totalUsd: body.data.attributes.total_usd,
      additionalData: {
        productName: subscriptionData.product_name,
        variantName: subscriptionData.variant_name,
        amount:
          body.data.attributes?.total_formatted || "0", // You'll need to get price from another API call
        currency: body.data.attributes?.currency, // You'll need to get this from price/variant data
        customerEmail: subscriptionData.user_email,
        customerName: subscriptionData.user_name,
      },
    });

    // Create subscription record
    await firebaseService.createSubscriptionRecord({
      userId,
      subscriptionId: subscriptionResponse.data.id,
      variantId: subscriptionData.variant_id.toString(),
      status: subscriptionData.status,
      amount: 0, // You'll need to fetch price data separately
      currency: body.data.attributes?.currency, // You'll need to fetch this from price data
      interval: "monthly", // You'll need to determine this from variant/price data
      customerEmail: subscriptionData.user_email,
      trialEndsAt: subscriptionData.trial_ends_at
        ? new Date(subscriptionData.trial_ends_at)
        : undefined,
      renewsAt: new Date(subscriptionData.renews_at),
      metadata: {
        orderId: subscriptionData.order_id.toString(),
        orderNumber: subscriptionData.order_item_id,
        productName: subscriptionData.product_name,
        variantName: subscriptionData.variant_name,
        customerName: subscriptionData.user_name,
        cardBrand: subscriptionData.card_brand,
        cardLastFour: subscriptionData.card_last_four,
        paymentProcessor: subscriptionData.payment_processor,
        testMode: subscriptionData.test_mode,
      },
    });

    // Log the transaction
    await firebaseService.logTransaction({
      userId,
      transactionId: `${subscriptionData.order_id}-${Date.now()}`,
      type: "subscription_payment",
      status: subscriptionData.status,
      amount: 0, // You'll need to fetch the actual amount
      currency: "USD", // You'll need to fetch this
      subscriptionId: subscriptionResponse.data.id,
      orderId: subscriptionData.order_id.toString(),
      metadata: {
        orderNumber: subscriptionData.order_item_id,
        tax: "0.00", // You'll need to fetch this
        productName: subscriptionData.product_name,
        variantName: subscriptionData.variant_name,
      },
    });

    // Return success response with subscription data
    return NextResponse.json(
      {
        success: true,
        subscription: {
          subscriptionId: subscriptionResponse.data.id,
          productName: subscriptionData.product_name,
          variantName: subscriptionData.variant_name,
          amount: "0", // You'll need to fetch price data
          currency: "USD", // You'll need to fetch this
          interval: "monthly", // You'll need to determine this
          userEmail: subscriptionData.user_email,
          status: subscriptionData.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to process subscription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Mock function to simulate LemonSqueezy API call
// Replace this with actual LemonSqueezy API integration
async function fetchLemonSqueezySubscription(
  subscriptionId: string
): Promise<LemonSqueezySubscriptionResponse | null> {
  try {
    // For actual implementation, uncomment and modify this:
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGQ1OWNlZi1kYmI4LTRlYTUtYjE3OC1kMjU0MGZjZDY5MTkiLCJqdGkiOiJlNjAxMzM3YTNmMzc1YjM4ZmEzMTlmZGE3YzRhMDI5NDEyNzQ5NDgwMmI5ZTU5OGU5MTc0NzRlNDUyMDlhZDI3NjczZjdiZWE2ZjFlNzBjOCIsImlhdCI6MTc0ODM1MzEwNy40NTI4NzIsIm5iZiI6MTc0ODM1MzEwNy40NTI4NzQsImV4cCI6MjA2Mzg4NTkwNy40MTUxLCJzdWIiOiI0ODYyMjM4Iiwic2NvcGVzIjpbXX0.xXc0g-WkEmcgDM6WHYT_nB3fwp-B65gTt87Ek-MCa7cHUgPuioDYbO2VPJvqXU3LgXincm3UCu1waToOQRVbfZoS-Q7Xm_nbBhKLu4NlobZbM2eGh7RJGSKAY3NIV7IERVlgjjEr83TZUWlKSqBM7dEg6dagSMC3-cSBIa8cpyPzAQ97WbkE5QWyCmKugT3RBNfSfpKuaIHssRa_Lhm5DHIN_-ot9JJo_q-Voh8EHhJnFD7_PvwkaOrmjPt6LTJ2sd1qLnCmUkZSxtiq-Zu1VxQM4HjBxNlYqR__zPXMuDDgJuGuFl2NdksbYYZx7Meq4uqHFKe4ak3ShwQvuMGmRqocA3uDN1wlz8gBIKPg0FpiFOV2GfYo0gBTNed9UtoX8RAUzZyP01pNvM1LR-Fv6YsvfPZV3CWEzGmoLCcqg6LOFyk1JvaYCT3wFqQhALg-EcrjaHGLQEn7U-UoHdwNs1vdF_n3TMrfV5KPtJuerbAzDaWlugB8m8KL1phrQbWt`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`LemonSqueezy API error: ${response.status}`);
    }

    const data: LemonSqueezySubscriptionResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching subscription from LemonSqueezy:", error);
    return null;
  }
}

// Optional: Add other HTTP methods if needed
export async function GET(req: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT(req: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
