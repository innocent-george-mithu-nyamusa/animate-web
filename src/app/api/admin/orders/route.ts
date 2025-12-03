import { NextRequest, NextResponse } from "next/server";
import { FirebaseAuthService } from "@/lib/firebase-auth";
import { FirebaseOrderService } from "@/lib/firebase-admin";

const authService = new FirebaseAuthService();
const orderService = new FirebaseOrderService();

// Simple admin check (you should implement proper admin role checking in production)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",") || [];

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

    // Check if user is admin
    const userEmail = decodedToken.email || "";
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Get all orders
    const orders = await orderService.getAllOrders(100);

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: any) {
    console.error("Error fetching admin orders:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch orders",
      },
      { status: 500 }
    );
  }
}
