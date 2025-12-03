import { NextRequest, NextResponse } from "next/server";
import { FirebaseAuthService } from "@/lib/firebase-auth";
import { FirebaseOrderService } from "@/lib/firebase-admin";
import type { FulfillmentStatus } from "@/types/products";

const authService = new FirebaseAuthService();
const orderService = new FirebaseOrderService();

// Simple admin check (you should implement proper admin role checking in production)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",") || [];

export async function PATCH(request: NextRequest) {
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

    // Check if user is admin
    const userEmail = decodedToken.email || "";
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, message: "Missing orderId or status" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses: FulfillmentStatus[] = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    // Update fulfillment status
    await orderService.updateFulfillmentStatus(orderId, status);

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update order status",
      },
      { status: 500 }
    );
  }
}
