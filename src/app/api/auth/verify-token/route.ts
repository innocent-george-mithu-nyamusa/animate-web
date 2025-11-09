/**
 * Token Verification API Endpoint
 * Verifies Firebase ID tokens
 */

import { NextRequest, NextResponse } from "next/server";
import { FirebaseAuthService } from "@/lib/firebase-auth";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    const authService = new FirebaseAuthService();
    const result = await authService.verifyIdToken(idToken);

    return NextResponse.json({
      success: true,
      uid: result.uid,
      email: result.email,
    });
  } catch (error) {
    console.error("Token verification error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid or expired token",
      },
      { status: 401 }
    );
  }
}
