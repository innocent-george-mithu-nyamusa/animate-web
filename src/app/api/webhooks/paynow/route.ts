/**
 * Paynow Payment Webhook Handler
 * Receives payment notifications from Paynow payment gateway
 */

import { NextRequest, NextResponse } from "next/server";
import {
  FirebaseSubscriptionService,
  Currency,
} from "@/lib/firebase-admin";
import { PaynowService, PaynowWebhookPayload } from "@/lib/paynow";

export async function POST(req: NextRequest) {
  try {
    // Paynow sends data as form-urlencoded or query parameters
    const formData = await req.formData();

    // Parse webhook payload
    const payload: PaynowWebhookPayload = {
      reference: formData.get("reference") as string,
      paynowreference: formData.get("paynowreference") as string,
      amount: formData.get("amount") as string,
      status: formData.get("status") as string,
      pollurl: formData.get("pollurl") as string,
      hash: formData.get("hash") as string,
    };

    // Initialize services
    const paynowService = new PaynowService(
      process.env.PAYNOW_INTEGRATION_ID || "",
      process.env.PAYNOW_INTEGRATION_KEY || "",
      process.env.PAYNOW_RESULT_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paynow`,
      process.env.PAYNOW_RETURN_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL}/success`
    );
    const firebaseService = new FirebaseSubscriptionService();

    // Validate webhook payload
    if (!paynowService.validateWebhook(payload)) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // Parse payment status
    const parsedStatus = paynowService.parsePaymentStatus(payload.status);

    // Only process successful payments
    if (parsedStatus !== "SUCCESS") {
      console.log(
        `Payment ${payload.reference} not successful. Status: ${payload.status}`
      );
      return NextResponse.json({
        message: "Payment not successful",
        status: payload.status,
      });
    }

    // Extract user ID and currency from reference
    // Reference format should be: userId_currency_timestamp
    const referenceParts = payload.reference.split("_");
    const userId = referenceParts[0];
    const currency = (referenceParts[1] || "USD").toUpperCase() as Currency;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in payment reference" },
        { status: 400 }
      );
    }

    // Parse amount
    const amount = parseFloat(payload.amount);

    // Determine subscription tier based on amount and currency
    const tier = firebaseService.getSubscriptionTier(amount, currency);

    // Create subscription dates (1 month from now)
    const startDate = new Date();
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    // Generate subscription ID
    const subscriptionId = `sub_paynow_${payload.paynowreference}_${Date.now()}`;

    // Create subscription record
    await firebaseService.createSubscriptionRecord({
      userId,
      subscriptionId,
      tier,
      status: "active",
      amount,
      currency,
      paymentMethod: "paynow",
      transactionReference: payload.paynowreference,
      startDate,
      renewalDate,
      metadata: {
        reference: payload.reference,
        paynowReference: payload.paynowreference,
        pollUrl: payload.pollurl,
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
      currency,
      paymentMethod: "paynow",
      metadata: {
        paynowReference: payload.paynowreference,
        reference: payload.reference,
      },
    });

    // Log transaction
    await firebaseService.logTransaction({
      userId,
      transactionId: payload.reference,
      type: "subscription_payment",
      status: "SUCCESS",
      amount,
      currency,
      paymentMethod: "paynow",
      subscriptionId,
      metadata: {
        paynowReference: payload.paynowreference,
        pollUrl: payload.pollurl,
      },
    });

    console.log(
      `Successfully processed Paynow payment for user: ${userId}, tier: ${tier}`
    );

    return NextResponse.json({
      success: true,
      subscriptionId,
      tier,
      message: "Payment processed successfully",
    });
  } catch (error) {
    console.error("Error processing Paynow webhook:", error);
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
