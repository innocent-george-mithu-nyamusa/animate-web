/**
 * Payment Status Check API Endpoint
 * Allows checking the status of a payment (primarily for Paynow polling)
 */

import { NextRequest, NextResponse } from "next/server";
import { PaynowService } from "@/lib/paynow";
import { FirebaseAuthService } from "@/lib/firebase-auth";

export async function POST(req: NextRequest) {
  try {
    const { idToken, pollUrl } = await req.json();

    // Validate required fields
    if (!idToken || !pollUrl) {
      return NextResponse.json(
        { error: "ID token and poll URL are required" },
        { status: 400 }
      );
    }

    // Verify user token
    const authService = new FirebaseAuthService();
    await authService.verifyIdToken(idToken);

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
