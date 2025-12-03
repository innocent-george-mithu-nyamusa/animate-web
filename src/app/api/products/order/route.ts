import { NextRequest, NextResponse } from "next/server";
import { FirebaseAuthService } from "@/lib/firebase-auth";
import { FirebaseOrderService } from "@/lib/firebase-admin";
import { calculateProductPrice } from "@/lib/product-pricing";
import { EmailService } from "@/lib/email";
import type { CreateOrderRequest, CreateOrderResponse } from "@/types/products";

const authService = new FirebaseAuthService();
const orderService = new FirebaseOrderService();
const emailService = new EmailService();

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const {
      idToken,
      productType,
      productDetails,
      styledImageData,
      styleApplied,
      currency,
      shippingAddress,
    } = body;

    // Validate required fields
    if (!idToken) {
      return NextResponse.json(
        { success: false, message: "Authentication token is required" },
        { status: 401 }
      );
    }

    if (!productType || !productDetails || !styledImageData || !styleApplied) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify Firebase ID token and get user
    const decodedToken = await authService.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || "";

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1) {
      return NextResponse.json(
        { success: false, message: "Complete shipping address is required" },
        { status: 400 }
      );
    }

    // Calculate product price
    const amount = calculateProductPrice(productType, productDetails, currency);

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${userId.substring(0, 8)}`;

    // Upload styled image to Firebase Storage
    const styledImageUrl = await orderService.uploadStyledImage(
      userId,
      orderId,
      styledImageData
    );

    // Create order in Firestore
    await orderService.createOrder({
      orderId,
      userId,
      userEmail,
      productType,
      productDetails,
      styledImageUrl,
      styleApplied,
      amount,
      currency,
      shippingAddress,
      metadata: {
        createdVia: "web",
        userAgent: request.headers.get("user-agent") || "unknown",
      },
    });

    // Send order confirmation email (non-blocking)
    emailService.sendOrderConfirmation({
      orderId,
      customerEmail: userEmail,
      customerName: shippingAddress.fullName,
      productType,
      productDetails,
      amount,
      currency,
      shippingAddress,
      styleApplied,
      styledImageUrl,
    }).catch(err => console.error("Failed to send order confirmation email:", err));

    const response: CreateOrderResponse = {
      success: true,
      orderId,
      amount,
      currency,
      message: "Order created successfully",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create order",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Authentication token is required" },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    const decodedToken = await authService.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get user's orders
    const orders = await orderService.getUserOrders(userId);

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}
