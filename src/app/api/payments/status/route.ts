/**
 * Payment Status Check API Endpoint
 * Allows checking the status of a payment (primarily for Paynow polling)
 */

import { NextRequest, NextResponse } from "next/server";
import { PaynowService } from "@/lib/paynow";
import { FirebaseAuthService } from "@/lib/firebase-auth";

export async function POST(req: NextRequest) {
  try {
    const { idToken, pollUrl, reference } = await req.json();

    // Validate required fields
    if (!idToken || !pollUrl) {
      return NextResponse.json(
        { error: "ID token and poll URL are required" },
        { status: 400 }
      );
    }

    // Verify user token
    const authService = new FirebaseAuthService();
    const verifiedToken = await authService.verifyIdToken(idToken);
    const userId = verifiedToken.uid;

    // SECURITY: Validate that the payment reference belongs to the authenticated user
    // Reference format: userId_currency_timestamp
    if (reference) {
      const referenceParts = reference.split("_");
      const referenceUserId = referenceParts[0];

      if (referenceUserId !== userId) {
        console.error(
          `[PAYMENT_STATUS] SECURITY: User ${userId} attempted to check status of payment belonging to ${referenceUserId}`
        );
        return NextResponse.json(
          { error: "Unauthorized: You can only check your own payments" },
          { status: 403 }
        );
      }
    }

    // Check payment status via Paynow
    const paynowService = new PaynowService(
      process.env.PAYNOW_INTEGRATION_ID || "",
      process.env.PAYNOW_INTEGRATION_KEY || "",
      process.env.PAYNOW_RESULT_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paynow`,
      process.env.PAYNOW_RETURN_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL}/success`
    );

    const status = await paynowService.checkPaymentStatus(pollUrl);

    // Double-check the reference from the status response
    if (status.reference) {
      const statusReferenceParts = status.reference.split("_");
      const statusUserId = statusReferenceParts[0];

      if (statusUserId !== userId) {
        console.error(
          `[PAYMENT_STATUS] SECURITY: Mismatch - User ${userId} tried accessing payment ${status.reference}`
        );
        return NextResponse.json(
          { error: "Unauthorized: Payment does not belong to you" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      paid: status.paid,
      status: status.status,
      amount: status.amount,
      reference: status.reference,
    });
  } catch (error) {
    console.error("Payment status check error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check payment status",
      },
      { status: 500 }
    );
  }
}
