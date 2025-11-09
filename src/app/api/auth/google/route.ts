/**
 * Google Sign-In API Endpoint
 * Handles Google authentication
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

    // Verify the ID token
    const authService = new FirebaseAuthService();
    const verifiedToken = await authService.verifyIdToken(idToken);

    // Get user info from token
    const user = await authService.getUserByUid(verifiedToken.uid);

    // Handle Google sign-in (create or update user)
    const result = await authService.handleGoogleSignIn({
      uid: verifiedToken.uid,
      email: user.email!,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
    });

    return NextResponse.json({
      success: true,
      uid: result.uid,
      email: result.email,
      isNewUser: result.isNewUser,
      message: result.isNewUser
        ? "Account created successfully"
        : "Signed in successfully",
    });
  } catch (error) {
    console.error("Google sign-in error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to authenticate with Google",
      },
      { status: 500 }
    );
  }
}
