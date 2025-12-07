/**
 * Payment Initiation API Endpoint
 * All payments are processed via Paynow (mobile money and card payments)
 */

import { NextRequest, NextResponse } from "next/server";
import { PaynowService } from "@/lib/paynow";
import { FirebaseAuthService } from "@/lib/firebase-auth";
import { rateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const identifier = getClientIdentifier(req);
    const rateLimitResult = rateLimit(identifier, RATE_LIMITS.PAYMENT);

    if (!rateLimitResult.allowed) {
      console.warn(`[RATE_LIMIT] Payment initiation blocked for ${identifier}`);
      return NextResponse.json(
        {
          error: "Too many payment requests. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfter),
            "X-RateLimit-Limit": String(RATE_LIMITS.PAYMENT.maxRequests),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          },
        }
      );
    }

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

    // SECURITY: Input validation to prevent injection attacks

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate amount is a positive number
    if (typeof amount !== 'number' || amount <= 0 || amount > 100000) {
      return NextResponse.json(
        { error: "Invalid amount - must be a positive number less than 100,000" },
        { status: 400 }
      );
    }

    // Validate currency
    if (currency !== "USD" && currency !== "ZWG") {
      return NextResponse.json(
        { error: "Invalid currency - must be USD or ZWG" },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!["ecocash", "onemoney", "card"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Validate phone number format if provided
    if (phoneNumber) {
      // Remove spaces and check if it's a valid phone number
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
      const phoneRegex = /^[\d+]{10,15}$/;
      if (!phoneRegex.test(cleanPhone)) {
        return NextResponse.json(
          { error: "Invalid phone number format" },
          { status: 400 }
        );
      }
    }

    // Verify user token
    const authService = new FirebaseAuthService();
    const verifiedToken = await authService.verifyIdToken(idToken);

    // Select Paynow credentials based on currency
    const isZWG = currency === "ZWG";
    const integrationId = isZWG
      ? process.env.PAYNOW_ZWG_INTEGRATION_ID || ""
      : process.env.PAYNOW_INTEGRATION_ID || "";
    const integrationKey = isZWG
      ? process.env.PAYNOW_ZWG_INTEGRATION_KEY || ""
      : process.env.PAYNOW_INTEGRATION_KEY || "";

    // Validate that credentials exist for the selected currency
    if (!integrationId || !integrationKey) {
      return NextResponse.json(
        { error: `Paynow credentials not configured for ${currency} payments` },
        { status: 500 }
      );
    }

    // Initialize Paynow service with currency-specific credentials
    const paynowService = new PaynowService(
      integrationId,
      integrationKey,
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
              name: `IconicMe Subscription - ${currency} ${amount}`,
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
            name: `IconicMe Subscription - ${currency} ${amount}`,
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
