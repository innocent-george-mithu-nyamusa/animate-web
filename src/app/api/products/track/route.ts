import { NextRequest, NextResponse } from "next/server";
import { FirebaseAuthService } from "@/lib/firebase-auth";
import { FirebaseOrderService } from "@/lib/firebase-admin";

const authService = new FirebaseAuthService();
const orderService = new FirebaseOrderService();

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

    // Get order ID from query params
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get order from Firestore
    const order = await orderService.getOrder(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Verify order belongs to user
    if ((order as any).userId !== userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - This order does not belong to you" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error("Error tracking order:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to track order",
      },
      { status: 500 }
    );
  }
}
