/**
 * Paynow Payment Webhook Handler
 * Receives payment notifications from Paynow payment gateway
 * Handles:
 * - Subscription payments (reference format: userId_currency_timestamp)
 * - Product orders (reference format: product_orderId_timestamp)
 * Documentation: https://developers.paynow.co.zw/docs/test_mode.html
 */

import { NextRequest, NextResponse } from "next/server";
import {
  FirebaseSubscriptionService,
  FirebaseOrderService,
  Currency,
} from "@/lib/firebase-admin";
import { PaynowService, PaynowWebhookPayload } from "@/lib/paynow";
import { EmailService } from "@/lib/email";

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

    console.log(
      `[PAYNOW_WEBHOOK] Received webhook - Reference: ${payload.reference}, Status: ${payload.status}, Amount: ${payload.amount}`
    );

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
    const orderService = new FirebaseOrderService();

    // Validate webhook payload
    if (!paynowService.validateWebhook(payload)) {
      console.error(
        `[PAYNOW_WEBHOOK] Invalid webhook payload - Reference: ${payload.reference}`
      );
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // Determine payment type based on reference format
    // Product orders: product_orderId_timestamp
    // Subscriptions: userId_currency_timestamp
    const isProductOrder = payload.reference.startsWith("product_");

    if (isProductOrder) {
      // Handle product order payment
      return handleProductOrderPayment(payload, orderService, paynowService);
    }

    // Extract user ID and currency from reference
    // Reference format: userId_currency_timestamp
    const referenceParts = payload.reference.split("_");
    const userId = referenceParts[0];
    const currency = (referenceParts[1] || "USD").toUpperCase() as Currency;

    if (!userId) {
      console.error(
        `[PAYNOW_WEBHOOK] User ID not found in reference: ${payload.reference}`
      );
      return NextResponse.json(
        { error: "User ID not found in payment reference" },
        { status: 400 }
      );
    }

    // Parse payment status
    const parsedStatus = paynowService.parsePaymentStatus(payload.status);
    const amount = parseFloat(payload.amount);

    console.log(
      `[PAYNOW_WEBHOOK] Parsed status: ${parsedStatus}, User: ${userId}, Amount: ${amount} ${currency}`
    );

    // Check for existing transaction (idempotency for delayed success scenario)
    const existingTransaction = await firebaseService.getTransactionByReference(
      payload.reference
    );

    if (existingTransaction.exists) {
      const existingStatus = existingTransaction.data?.status;
      console.log(
        `[PAYNOW_WEBHOOK] Transaction already exists - Reference: ${payload.reference}, Existing Status: ${existingStatus}, New Status: ${parsedStatus}`
      );

      // If transaction already succeeded, don't process again
      if (existingStatus === "SUCCESS") {
        return NextResponse.json({
          success: true,
          message: "Transaction already processed successfully",
          status: parsedStatus,
        });
      }

      // If previous status was PENDING and now it's SUCCESS, update it
      if (existingStatus === "PENDING" && parsedStatus === "SUCCESS") {
        console.log(
          `[PAYNOW_WEBHOOK] Updating PENDING transaction to SUCCESS - Reference: ${payload.reference}`
        );
        // Continue processing to create subscription
      } else if (existingStatus === "PENDING" && parsedStatus === "FAILED") {
        // Update pending transaction to failed
        await firebaseService.logTransaction({
          userId,
          transactionId: payload.reference,
          type: "subscription_payment",
          status: "FAILED",
          amount,
          currency,
          paymentMethod: "paynow",
          metadata: {
            paynowReference: payload.paynowreference,
            pollUrl: payload.pollurl,
            rawStatus: payload.status,
            failureReason: paynowService.getFailureReason(payload.status),
          },
        });

        console.log(
          `[PAYNOW_WEBHOOK] Updated PENDING transaction to FAILED - Reference: ${payload.reference}`
        );

        return NextResponse.json({
          success: false,
          message: "Payment failed",
          status: parsedStatus,
          reason: paynowService.getFailureReason(payload.status),
        });
      }
    }

    // Handle based on parsed status
    switch (parsedStatus) {
      case "SUCCESS": {
        // Check if subscription already exists by payment reference (additional idempotency check)
        const existingSubscription =
          await firebaseService.getSubscriptionByPaymentReference(
            payload.paynowreference
          );

        if (existingSubscription.exists) {
          console.log(
            `[PAYNOW_WEBHOOK] Subscription already exists for payment reference: ${payload.paynowreference}`
          );
          return NextResponse.json({
            success: true,
            subscriptionId: existingSubscription.subscriptionId,
            message: "Subscription already exists",
          });
        }

        // Determine subscription tier based on amount and currency
        const tier = firebaseService.getSubscriptionTier(amount, currency);

        // SECURITY: Validate that the amount paid matches the expected price for the tier
        // Prevents users from paying $1 and getting premium by tampering with payment data
        const expectedAmount = firebaseService.getExpectedAmount(tier, currency);
        const amountDifference = Math.abs(amount - expectedAmount);
        const tolerance = 0.01; // Allow 1 cent difference for floating point issues

        if (tier !== "free" && amountDifference > tolerance) {
          console.error(
            `[PAYNOW_WEBHOOK] SECURITY ALERT: Amount mismatch detected! Tier: ${tier}, Expected: ${expectedAmount}, Received: ${amount}, Currency: ${currency}`
          );

          // Log suspicious transaction
          await firebaseService.logTransaction({
            userId,
            transactionId: payload.reference,
            type: "subscription_payment",
            status: "FAILED",
            amount,
            currency,
            paymentMethod: "paynow",
            metadata: {
              paynowReference: payload.paynowreference,
              pollUrl: payload.pollurl,
              rawStatus: payload.status,
              failureReason: `Amount tampering detected - Expected ${expectedAmount} ${currency}, received ${amount} ${currency}`,
              detectedTier: tier,
              expectedAmount,
              receivedAmount: amount,
            },
          });

          return NextResponse.json({
            success: false,
            error: "Payment amount does not match subscription tier",
            message: "Payment validation failed",
          }, { status: 400 });
        }

        console.log(
          `[PAYNOW_WEBHOOK] Amount validation PASSED - Tier: ${tier}, Amount: ${amount} ${currency}`
        );

        // Check if user has an existing active subscription (for upgrades/renewals)
        const userActiveSubscription =
          await firebaseService.getUserActiveSubscription(userId);

        let transactionType: "subscription_payment" | "subscription_renewal" =
          "subscription_payment";

        if (userActiveSubscription.exists) {
          const oldTier = userActiveSubscription.data.tier;
          const oldSubscriptionId = userActiveSubscription.subscriptionId;

          if (oldTier === tier) {
            transactionType = "subscription_renewal";
            console.log(
              `[PAYNOW_WEBHOOK] Renewal detected - User: ${userId}, Tier: ${tier}, Old Subscription: ${oldSubscriptionId}`
            );
          } else {
            console.log(
              `[PAYNOW_WEBHOOK] Upgrade/Downgrade detected - User: ${userId}, Old Tier: ${oldTier}, New Tier: ${tier}, Old Subscription: ${oldSubscriptionId}`
            );
          }

          // Mark old subscription as expired
          await firebaseService.updateSubscriptionStatus(
            oldSubscriptionId!,
            "expired"
          );
          console.log(
            `[PAYNOW_WEBHOOK] Marked old subscription ${oldSubscriptionId} as expired`
          );
        } else {
          console.log(
            `[PAYNOW_WEBHOOK] First paid subscription for user: ${userId}`
          );
        }

        // Create subscription dates (1 month from now)
        const startDate = new Date();
        const renewalDate = new Date();
        renewalDate.setMonth(renewalDate.getMonth() + 1);

        // Generate subscription ID
        const subscriptionId = `sub_paynow_${payload.paynowreference}_${Date.now()}`;

        console.log(
          `[PAYNOW_WEBHOOK] Creating subscription - ID: ${subscriptionId}, Tier: ${tier}, User: ${userId}`
        );

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
            rawStatus: payload.status,
            previousSubscriptionId: userActiveSubscription.subscriptionId,
            isRenewal: transactionType === "subscription_renewal",
          },
        });

        // Update user subscription (always reset credits for new billing cycle)
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
          resetCredits: true, // Always reset credits for new subscription/renewal
          metadata: {
            paynowReference: payload.paynowreference,
            reference: payload.reference,
          },
        });

        // Log successful transaction
        await firebaseService.logTransaction({
          userId,
          transactionId: payload.reference,
          type: transactionType,
          status: "SUCCESS",
          amount,
          currency,
          paymentMethod: "paynow",
          subscriptionId,
          metadata: {
            paynowReference: payload.paynowreference,
            pollUrl: payload.pollurl,
            rawStatus: payload.status,
            tier,
            previousSubscriptionId: userActiveSubscription.subscriptionId,
          },
        });

        console.log(
          `[PAYNOW_WEBHOOK] Successfully processed ${transactionType} - User: ${userId}, Tier: ${tier}, Subscription: ${subscriptionId}`
        );

        return NextResponse.json({
          success: true,
          subscriptionId,
          tier,
          message: "Payment processed successfully",
          transactionType,
        });
      }

      case "PENDING": {
        // Log pending transaction for tracking
        await firebaseService.logTransaction({
          userId,
          transactionId: payload.reference,
          type: "subscription_payment",
          status: "PENDING",
          amount,
          currency,
          paymentMethod: "paynow",
          metadata: {
            paynowReference: payload.paynowreference,
            pollUrl: payload.pollurl,
            rawStatus: payload.status,
          },
        });

        console.log(
          `[PAYNOW_WEBHOOK] Payment pending - Reference: ${payload.reference}, User: ${userId}`
        );

        return NextResponse.json({
          success: true,
          message: "Payment is pending",
          status: "PENDING",
          pollUrl: payload.pollurl,
        });
      }

      case "FAILED": {
        // Log failed transaction with failure reason
        await firebaseService.logTransaction({
          userId,
          transactionId: payload.reference,
          type: "subscription_payment",
          status: "FAILED",
          amount,
          currency,
          paymentMethod: "paynow",
          metadata: {
            paynowReference: payload.paynowreference,
            pollUrl: payload.pollurl,
            rawStatus: payload.status,
            failureReason: paynowService.getFailureReason(payload.status),
          },
        });

        console.log(
          `[PAYNOW_WEBHOOK] Payment failed - Reference: ${payload.reference}, User: ${userId}, Reason: ${paynowService.getFailureReason(payload.status)}`
        );

        return NextResponse.json({
          success: false,
          message: "Payment failed",
          status: "FAILED",
          reason: paynowService.getFailureReason(payload.status),
        });
      }

      default:
        console.warn(
          `[PAYNOW_WEBHOOK] Unknown payment status: ${payload.status}`
        );
        return NextResponse.json({
          success: false,
          message: "Unknown payment status",
          status: payload.status,
        });
    }
  } catch (error) {
    console.error("[PAYNOW_WEBHOOK] Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Handle product order payment webhook
 */
async function handleProductOrderPayment(
  payload: PaynowWebhookPayload,
  orderService: FirebaseOrderService,
  paynowService: PaynowService
) {
  const emailService = new EmailService();
  try {
    // Extract order ID from reference (format: product_orderId_timestamp)
    const referenceParts = payload.reference.split("_");
    const orderId = referenceParts[1]; // orderId is the second part

    if (!orderId) {
      console.error(
        `[PAYNOW_WEBHOOK_PRODUCT] Order ID not found in reference: ${payload.reference}`
      );
      return NextResponse.json(
        { error: "Order ID not found in payment reference" },
        { status: 400 }
      );
    }

    console.log(
      `[PAYNOW_WEBHOOK_PRODUCT] Processing product order payment - Order: ${orderId}, Status: ${payload.status}`
    );

    // Get order from Firestore
    const order = await orderService.getOrder(orderId) as any;
    if (!order) {
      console.error(
        `[PAYNOW_WEBHOOK_PRODUCT] Order not found: ${orderId}`
      );
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Parse payment status
    const parsedStatus = paynowService.parsePaymentStatus(payload.status);

    // Handle based on parsed status
    switch (parsedStatus) {
      case "SUCCESS": {
        // Check if order is already paid (idempotency)
        if (order.paymentStatus === "paid") {
          console.log(
            `[PAYNOW_WEBHOOK_PRODUCT] Order already paid: ${orderId}`
          );
          return NextResponse.json({
            success: true,
            message: "Order already paid",
            orderId,
          });
        }

        // Update order payment status to paid
        await orderService.updateOrderPayment(
          orderId,
          order.paymentMethod || "unknown",
          payload.paynowreference,
          "paid"
        );

        console.log(
          `[PAYNOW_WEBHOOK_PRODUCT] Successfully processed product order payment - Order: ${orderId}, Amount: ${payload.amount}`
        );

        // Send payment confirmation email (non-blocking)
        if (order.userEmail && order.shippingAddress) {
          emailService.sendPaymentConfirmation({
            orderId,
            customerEmail: order.userEmail,
            customerName: order.shippingAddress.fullName,
            productType: order.productType,
            productDetails: order.productDetails,
            amount: order.amount,
            currency: order.currency,
            shippingAddress: order.shippingAddress,
            styleApplied: order.styleApplied,
            styledImageUrl: order.styledImageUrl,
          }).catch(err => console.error("Failed to send payment confirmation email:", err));
        }

        return NextResponse.json({
          success: true,
          orderId,
          message: "Product order payment processed successfully",
        });
      }

      case "PENDING": {
        console.log(
          `[PAYNOW_WEBHOOK_PRODUCT] Product order payment pending - Order: ${orderId}`
        );
        return NextResponse.json({
          success: true,
          message: "Payment is pending",
          status: "PENDING",
          orderId,
        });
      }

      case "FAILED": {
        // Update order payment status to failed
        await orderService.updateOrderPayment(
          orderId,
          order.paymentMethod || "unknown",
          payload.paynowreference,
          "failed"
        );

        console.log(
          `[PAYNOW_WEBHOOK_PRODUCT] Product order payment failed - Order: ${orderId}, Reason: ${paynowService.getFailureReason(payload.status)}`
        );

        return NextResponse.json({
          success: false,
          message: "Payment failed",
          status: "FAILED",
          reason: paynowService.getFailureReason(payload.status),
          orderId,
        });
      }

      default:
        console.warn(
          `[PAYNOW_WEBHOOK_PRODUCT] Unknown payment status: ${payload.status}`
        );
        return NextResponse.json({
          success: false,
          message: "Unknown payment status",
          status: payload.status,
        });
    }
  } catch (error) {
    console.error("[PAYNOW_WEBHOOK_PRODUCT] Error processing product order payment:", error);
    return NextResponse.json(
      {
        error: "Failed to process product order payment",
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
