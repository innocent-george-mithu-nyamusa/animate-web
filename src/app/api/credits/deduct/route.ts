/**
 * Credits Deduction API Endpoint
 * Deducts credits from user's account after successful image processing
 */

import { NextRequest, NextResponse } from "next/server";
import { FirebaseAuthService } from "@/lib/firebase-auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { idToken, amount = 1 } = await req.json();

    // Validate required fields
    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    // Verify user token
    const authService = new FirebaseAuthService();
    const verifiedToken = await authService.verifyIdToken(idToken);
    const userId = verifiedToken.uid;

    // Get Firestore instance
    const db = getFirestore();
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const currentCredits = userData?.credits || { remaining: 0, total: 0 };

    // Check if user has enough credits
    const creditsRemaining = typeof currentCredits === 'object'
      ? currentCredits.remaining || 0
      : currentCredits || 0;

    if (creditsRemaining < amount) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          remaining: creditsRemaining
        },
        { status: 403 }
      );
    }

    // Deduct credits
    const newRemaining = creditsRemaining - amount;

    // Update credits in Firestore
    await userRef.update({
      credits: {
        remaining: newRemaining,
        total: typeof currentCredits === 'object' ? currentCredits.total : currentCredits,
        tier: userData?.subscription?.tier || 'free',
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      remaining: newRemaining,
      deducted: amount,
      message: `${amount} credit(s) deducted successfully`,
    });
  } catch (error) {
    console.error("Credits deduction error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to deduct credits",
      },
      { status: 500 }
    );
  }
}
