import { NextRequest, NextResponse } from "next/server";
import { FirebaseAuthService } from "@/lib/firebase-auth";
import { FirebaseOrderService } from "@/lib/firebase-admin";
import { PaynowService } from "@/lib/paynow";
import type { Order } from "@/types/products";

const authService = new FirebaseAuthService();
const orderService = new FirebaseOrderService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken, orderId, paymentMethod, phoneNumber } = body;

    // Verify user authentication
    const decodedToken = await authService.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get order details
    const orderData = await orderService.getOrder(orderId);

    if (!orderData) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Type assertion after null check
    const order = orderData as Order & { id: string };

    // Verify order belongs to user
    if (order.userId !== userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Verify payment hasn't already been made
    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { success: false, message: "Order already paid" },
        { status: 400 }
      );
    }

    // Select Paynow credentials based on currency
    const paynowIntegrationId =
      order.currency === "USD"
        ? process.env.PAYNOW_INTEGRATION_ID!
        : process.env.PAYNOW_ZWG_INTEGRATION_ID!;

    const paynowIntegrationKey =
      order.currency === "USD"
        ? process.env.PAYNOW_INTEGRATION_KEY!
        : process.env.PAYNOW_ZWG_INTEGRATION_KEY!;

    const paynowService = new PaynowService(
      paynowIntegrationId,
      paynowIntegrationKey,
      process.env.PAYNOW_RESULT_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paynow`,
      process.env.PAYNOW_RETURN_URL ||
        `${process.env.NEXT_PUBLIC_APP_URL}/success`
    );

    // Create payment reference with order ID
    const timestamp = Date.now();
    const paymentReference = `product_${orderId}_${timestamp}`;

    // Create payment request
    const paymentRequest = {
      invoiceId: paymentReference,
      items: [
        {
          name: `${order.productType === "plush_toy" ? "Plush Toy" : "Framed Picture"} - ${order.styleApplied}`,
          amount: order.amount,
        },
      ],
      customerEmail: order.userEmail,
    };

    // Initiate payment based on method
    if (paymentMethod === "ecocash" || paymentMethod === "onemoney") {
      if (!phoneNumber) {
        return NextResponse.json(
          { success: false, message: "Phone number required for mobile payment" },
          { status: 400 }
        );
      }

      const paymentResult = await paynowService.initiateMobilePayment(
        paymentRequest,
        phoneNumber,
        paymentMethod
      );

      if (!paymentResult.success) {
        return NextResponse.json(
          { success: false, message: paymentResult.error },
          { status: 400 }
        );
      }

      // Update order with payment reference
      await orderService.updateOrderPayment(
        orderId,
        paymentMethod,
        paymentReference,
        "pending"
      );

      return NextResponse.json({
        success: true,
        pollUrl: paymentResult.pollUrl,
        instructions: paymentResult.instructions,
      });
    } else if (paymentMethod === "card") {
      // Card payment via Paynow web redirect
      const paymentResult = await paynowService.initiateWebPayment(paymentRequest);

      if (!paymentResult.success) {
        return NextResponse.json(
          { success: false, message: paymentResult.error },
          { status: 400 }
        );
      }

      // Update order with payment reference
      await orderService.updateOrderPayment(
        orderId,
        paymentMethod,
        paymentReference,
        "pending"
      );

      return NextResponse.json({
        success: true,
        redirectUrl: paymentResult.redirectUrl,
        pollUrl: paymentResult.pollUrl,
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid payment method" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Payment initiation failed",
      },
      { status: 500 }
    );
  }
}
