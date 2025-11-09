/**
 * Ecocash Payment Webhook Handler
 * Receives payment notifications from Ecocash API
 */

import { NextRequest, NextResponse } from "next/server";
import {
  FirebaseSubscriptionService,
  Currency,
} from "@/lib/firebase-admin";
import {
  EcocashService,
  EcocashWebhookPayload,
} from "@/lib/ecocash";

export async function POST(req: NextRequest) {
  try {
    const payload: EcocashWebhookPayload = await req.json();

    // Initialize services
    const ecocashService = new EcocashService(
      process.env.ECOCASH_API_KEY || "",
      process.env.ECOCASH_ENV === "live" ? "live" : "sandbox"
    );
    const firebaseService = new FirebaseSubscriptionService();

    // Validate webhook payload
    if (!ecocashService.validateWebhook(payload)) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // Extract data from payload
    const {
      transactionId,
      sourceReference,
      amount,
      currency,
      status,
      customerMsisdn,
      metadata,
    } = payload;

    // Get user ID from metadata (should be passed when initiating payment)
    const userId = metadata?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in payment metadata" },
        { status: 400 }
      );
    }

    // Only process successful payments
    if (status !== "SUCCESS") {
      console.log(
        `Payment ${transactionId} not successful. Status: ${status}`
      );
      return NextResponse.json({
        message: "Payment not successful",
        status,
      });
    }

    // Determine subscription tier based on amount and currency
    const tier = firebaseService.getSubscriptionTier(
      amount,
      currency as Currency
    );

    // Create subscription dates (1 month from now)
    const startDate = new Date();
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    // Generate subscription ID
    const subscriptionId = `sub_ecocash_${transactionId}_${Date.now()}`;

    // Create subscription record
    await firebaseService.createSubscriptionRecord({
      userId,
      subscriptionId,
      tier,
      status: "active",
      amount,
      currency: currency as Currency,
      paymentMethod: "ecocash",
      transactionReference: transactionId,
      customerPhone: customerMsisdn,
      startDate,
      renewalDate,
      metadata: {
        sourceReference,
        ecocashTransactionId: transactionId,
        ...metadata,
      },
    });

    // Update user subscription
    await firebaseService.updateUserSubscription({
      userId,
      subscriptionId,
      tier,
      status: "active",
      startDate,
      endDate: renewalDate,
      amount,
      currency: currency as Currency,
      paymentMethod: "ecocash",
      metadata: {
        customerPhone: customerMsisdn,
        transactionId,
      },
    });

    // Log transaction
    await firebaseService.logTransaction({
      userId,
      transactionId: sourceReference,
      type: "subscription_payment",
      status: "SUCCESS",
      amount,
      currency: currency as Currency,
      paymentMethod: "ecocash",
      subscriptionId,
      metadata: {
        ecocashTransactionId: transactionId,
        customerMsisdn,
      },
    });

    console.log(
      `Successfully processed Ecocash payment for user: ${userId}, tier: ${tier}`
    );

    return NextResponse.json({
      success: true,
      subscriptionId,
      tier,
      message: "Payment processed successfully",
    });
  } catch (error) {
    console.error("Error processing Ecocash webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Method not allowed for other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
