/**
 * User Signup API Endpoint
 * Creates Firestore user document for an already-authenticated user
 * The user should be created client-side first using Firebase Auth
 */

import { NextRequest, NextResponse } from "next/server";
import { FirebaseAuthService } from "@/lib/firebase-auth";

export async function POST(req: NextRequest) {
  try {
    const { idToken, displayName } = await req.json();

    // Validate required fields
    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    // Verify the ID token and get user info
    const authService = new FirebaseAuthService();
    const tokenResult = await authService.verifyIdToken(idToken);

    if (!tokenResult.success || !tokenResult.uid || !tokenResult.email) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Create user document in Firestore
    const result = await authService.createUserDocument({
      uid: tokenResult.uid,
      email: tokenResult.email,
      displayName,
    });

    return NextResponse.json({
      success: true,
      uid: result.uid,
      email: result.email,
      message: result.alreadyExists
        ? "User document already exists"
        : "User document created successfully",
    });
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create account",
      },
      { status: 500 }
    );
  }
}
