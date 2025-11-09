/**
 * Payment Initiation API Endpoint
 * All payments are processed via Paynow (mobile money and card payments)
 */

import { NextRequest, NextResponse } from "next/server";
import { PaynowService } from "@/lib/paynow";
import { FirebaseAuthService } from "@/lib/firebase-auth";

export async function POST(req: NextRequest) {
  try {
    const {
      idToken,
      paymentMethod,
      amount,
      currency,
      phoneNumber,
      email,
    } = await req.json();

    // Validate required fields
    if (!idToken || !paymentMethod || !amount || !currency || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user token
    const authService = new FirebaseAuthService();
    const verifiedToken = await authService.verifyIdToken(idToken);

    // Initialize Paynow service
    const paynowService = new PaynowService(
      process.env.PAYNOW_INTEGRATION_ID || "",
      process.env.PAYNOW_INTEGRATION_KEY || "",
      process.env.PAYNOW_RESULT_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paynow`,
      process.env.PAYNOW_RETURN_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL}/success`
    );

    // Generate unique reference with userId and currency
    const reference = `${verifiedToken.uid}_${currency}_${Date.now()}`;

    // Handle different payment methods
    if (paymentMethod === "ecocash" || paymentMethod === "onemoney") {
      // Mobile money payment (Ecocash or OneMoney via Paynow)
      if (!phoneNumber) {
        return NextResponse.json(
          { error: `Phone number is required for ${paymentMethod}` },
          { status: 400 }
        );
      }

      const formattedPhone = paynowService.formatPhoneNumber(phoneNumber);

      const response = await paynowService.initiateMobilePayment(
        {
          invoiceId: reference,
          items: [
            {
              name: `Animate Subscription - ${currency} ${amount}`,
              amount,
            },
          ],
          customerEmail: email,
        },
        formattedPhone,
        paymentMethod
      );

      if (!response.success) {
        return NextResponse.json(
          { error: response.error || "Payment initiation failed" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        paymentMethod,
        reference,
        pollUrl: response.pollUrl,
        instructions: response.instructions,
        message: "Payment initiated. Follow the instructions on your phone.",
      });
    } else if (paymentMethod === "card") {
      // Card payment via Paynow web (redirects to Paynow website)
      const response = await paynowService.initiateWebPayment({
        invoiceId: reference,
        items: [
          {
            name: `Animate Subscription - ${currency} ${amount}`,
            amount,
          },
        ],
        customerEmail: email,
      });

      if (!response.success) {
        return NextResponse.json(
          { error: response.error || "Payment initiation failed" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        paymentMethod: "card",
        reference,
        redirectUrl: response.redirectUrl,
        pollUrl: response.pollUrl,
        message: "Redirecting to Paynow payment page...",
      });
    } else {
      return NextResponse.json(
        { error: "Invalid payment method. Use 'ecocash', 'onemoney', or 'card'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Payment initiation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initiate payment",
      },
      { status: 500 }
    );
  }
}
