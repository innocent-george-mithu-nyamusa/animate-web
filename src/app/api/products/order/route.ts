import { NextRequest, NextResponse } from "next/server";
import { FirebaseAuthService } from "@/lib/firebase-auth";
import { FirebaseOrderService } from "@/lib/firebase-admin";
import { calculateProductPrice } from "@/lib/product-pricing";
import type {
  ProductType,
  PlushToyDetails,
  FramedPictureDetails,
  ShippingAddress,
} from "@/types/products";

const authService = new FirebaseAuthService();
const orderService = new FirebaseOrderService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      idToken,
      productType,
      productDetails,
      styledImageDataUrl,
      styleApplied,
      currency,
      shippingAddress,
    } = body;

    // Verify user authentication
    const decodedToken = await authService.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || "";

    // Validate shipping address
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.city ||
      !shippingAddress.country
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid shipping address" },
        { status: 400 }
      );
    }

    // Calculate product price
    const amount = calculateProductPrice(
      productType,
      productDetails,
      currency
    );

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Upload styled image to Firebase Storage
    const styledImageUrl = await orderService.uploadStyledImage(
      userId,
      orderId,
      styledImageDataUrl
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
    });

    console.log(`Order created: ${orderId} for user: ${userId}`);

    return NextResponse.json({
      success: true,
      orderId,
      amount,
      currency,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create order",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idToken = searchParams.get("idToken");

    if (!idToken) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user authentication
    const decodedToken = await authService.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Get user's orders
    const orders = await orderService.getUserOrders(userId);

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get orders",
      },
      { status: 500 }
    );
  }
}
