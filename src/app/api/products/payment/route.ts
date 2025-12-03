/**
 * Product Payment Initiation API Endpoint
 * Initiates payment for physical product orders via Paynow
 */

import { NextRequest, NextResponse } from "next/server";
import { PaynowService } from "@/lib/paynow";
import { FirebaseAuthService } from "@/lib/firebase-auth";
import { FirebaseOrderService } from "@/lib/firebase-admin";
import type { InitiateProductPaymentRequest, InitiateProductPaymentResponse } from "@/types/products";

const authService = new FirebaseAuthService();
const orderService = new FirebaseOrderService();

export async function POST(req: NextRequest) {
  try {
    const body: InitiateProductPaymentRequest = await req.json();
    const { idToken, orderId, paymentMethod, phoneNumber } = body;

    // Validate required fields
    if (!idToken || !orderId || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user token
    const verifiedToken = await authService.verifyIdToken(idToken);
    const userId = verifiedToken.uid;

    // Get order details
    const order = await orderService.getOrder(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Verify order belongs to user
    if (order.userId !== userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if order is already paid
    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { success: false, message: "Order is already paid" },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!["ecocash", "onemoney", "card"].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Validate phone number for mobile payments
    if ((paymentMethod === "ecocash" || paymentMethod === "onemoney") && !phoneNumber) {
      return NextResponse.json(
        { success: false, message: `Phone number is required for ${paymentMethod}` },
        { status: 400 }
      );
    }

    // Select Paynow credentials based on currency
    const isZWG = order.currency === "ZWG";
    const integrationId = isZWG
      ? process.env.PAYNOW_ZWG_INTEGRATION_ID || ""
      : process.env.PAYNOW_INTEGRATION_ID || "";
    const integrationKey = isZWG
      ? process.env.PAYNOW_ZWG_INTEGRATION_KEY || ""
      : process.env.PAYNOW_INTEGRATION_KEY || "";

    // Validate credentials exist
    if (!integrationId || !integrationKey) {
      return NextResponse.json(
        { success: false, message: `Paynow credentials not configured for ${order.currency} payments` },
        { status: 500 }
      );
    }

    // Initialize Paynow service
    const paynowService = new PaynowService(
      integrationId,
      integrationKey,
      process.env.PAYNOW_RESULT_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paynow`,
      process.env.PAYNOW_RETURN_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL}/success`
    );

    // Generate payment reference
    const paymentReference = `product_${orderId}_${Date.now()}`;

    // Get product description
    const productDescription = order.productType === "plush_toy"
      ? `Plush Toy - ${order.productDetails.size}`
      : `Framed Picture - ${order.productDetails.frameType}`;

    // Handle different payment methods
    if (paymentMethod === "ecocash" || paymentMethod === "onemoney") {
      // Mobile money payment
      const formattedPhone = paynowService.formatPhoneNumber(phoneNumber!);

      const response = await paynowService.initiateMobilePayment(
        {
          invoiceId: paymentReference,
          items: [
            {
              name: `Animate - ${productDescription}`,
              amount: order.amount,
            },
          ],
          customerEmail: order.userEmail,
        },
        formattedPhone,
        paymentMethod
      );

      if (!response.success) {
        return NextResponse.json(
          { success: false, message: response.error || "Payment initiation failed" },
          { status: 500 }
        );
      }

      // Update order with payment reference
      await orderService.updateOrderPayment(
        orderId,
        paymentMethod,
        paymentReference,
        "pending"
      );

      const apiResponse: InitiateProductPaymentResponse = {
        success: true,
        paymentReference,
        pollUrl: response.pollUrl,
        instructions: response.instructions,
        message: "Payment initiated. Follow the instructions on your phone.",
      };

      return NextResponse.json(apiResponse);
    } else if (paymentMethod === "card") {
      // Card payment via Paynow web
      const response = await paynowService.initiateWebPayment({
        invoiceId: paymentReference,
        items: [
          {
            name: `Animate - ${productDescription}`,
            amount: order.amount,
          },
        ],
        customerEmail: order.userEmail,
      });

      if (!response.success) {
        return NextResponse.json(
          { success: false, message: response.error || "Payment initiation failed" },
          { status: 500 }
        );
      }

      // Update order with payment reference
      await orderService.updateOrderPayment(
        orderId,
        paymentMethod,
        paymentReference,
        "pending"
      );

      const apiResponse: InitiateProductPaymentResponse = {
        success: true,
        paymentReference,
        redirectUrl: response.redirectUrl,
        pollUrl: response.pollUrl,
        message: "Redirecting to Paynow payment page...",
      };

      return NextResponse.json(apiResponse);
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid payment method" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Product payment initiation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to initiate payment",
      },
      { status: 500 }
    );
  }
}
