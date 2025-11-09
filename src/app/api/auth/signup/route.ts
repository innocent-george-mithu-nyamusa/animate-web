/**
 * User Signup API Endpoint
 * Creates a new user with email and password
 */

import { NextRequest, NextResponse } from "next/server";
import { FirebaseAuthService } from "@/lib/firebase-auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Create user
    const authService = new FirebaseAuthService();
    const result = await authService.createUserWithEmail({
      email,
      password,
      displayName,
    });

    return NextResponse.json({
      success: true,
      uid: result.uid,
      email: result.email,
      message: "User created successfully",
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
