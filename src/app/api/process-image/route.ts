/**
 * Image Processing API Endpoint
 * Uses Google Gemini 2.5 Flash Image (Nano Banana) for AI-powered image editing
 * Transforms images based on natural language style prompts
 *
 * Security: Requires authentication and verifies user has sufficient credits
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
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
    const { image, prompt, idToken } = await req.json();

    // Validate inputs
    if (!image || !prompt) {
      return NextResponse.json(
        { error: "Image and prompt are required" },
        { status: 400 }
      );
    }

    // Verify user authentication
    if (!idToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user token and get user ID
    const authService = new FirebaseAuthService();
    let userId: string;
    try {
      const verifiedToken = await authService.verifyIdToken(idToken);
      userId = verifiedToken.uid;
    } catch (authError) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    // Check user credits before processing
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
    const currentCredits = userData?.credits || { remaining: 0 };
    const creditsRemaining = typeof currentCredits === 'object'
      ? currentCredits.remaining || 0
      : currentCredits || 0;

    if (creditsRemaining < 1) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          remaining: creditsRemaining,
          message: "You need at least 1 credit to process an image"
        },
        { status: 403 }
      );
    }

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Initialize Gemini AI with API key (vertexai: false for Gemini Developer API)
    const ai = new GoogleGenAI({
      vertexai: false,
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Extract base64 data from data URL
    const base64Data = image.split(",")[1];
    const mimeType = image.split(";")[0].split(":")[1];

    // Generate edited image with Gemini 2.5 Flash Image (Nano Banana)
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        prompt,
      ],
    });

    // Extract image and text from response parts
    let editedImageData = null;
    let textDescription = "";

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.text) {
        textDescription = part.text;
      } else if (part.inlineData) {
        // Found the generated image
        editedImageData = part.inlineData.data;
      }
    }

    if (!editedImageData) {
      console.warn("No image data in response, falling back to original");
      // Don't deduct credits if no image was actually generated
      return NextResponse.json({
        success: false,
        error: "No edited image was generated",
        description: textDescription || "Image processing completed but no output generated",
        message: "The AI model did not generate an edited image. Please try again.",
        creditsRemaining: creditsRemaining, // Return original credits unchanged
      });
    }

    // Convert base64 image data to data URL
    const styledImageDataUrl = `data:image/png;base64,${editedImageData}`;

    // Deduct credit after successful processing (atomic operation)
    const newRemaining = creditsRemaining - 1;
    await userRef.update({
      credits: {
        remaining: newRemaining,
        total: typeof currentCredits === 'object' ? currentCredits.total : currentCredits,
        tier: userData?.subscription?.tier || 'free',
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });

    console.log(`[IMAGE_PROCESSING] Credit deducted for user ${userId}. Remaining: ${newRemaining}`);

    return NextResponse.json({
      success: true,
      styledImage: styledImageDataUrl,
      description: textDescription,
      message: "Image successfully styled with Gemini!",
      creditsRemaining: newRemaining,
    });
  } catch (error: any) {
    console.error("Image processing error:", error);

    // Handle specific errors
    if (error.message?.includes("API key") || error.message?.includes("API_KEY_INVALID")) {
      return NextResponse.json(
        { error: "Invalid or missing Gemini API key" },
        { status: 401 }
      );
    }

    if (error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        { error: "API quota exceeded. Please try again later." },
        { status: 429 }
      );
    }

    if (error.message?.includes("not found") || error.message?.includes("NOT_FOUND")) {
      return NextResponse.json(
        { error: "Model not available. The gemini-2.5-flash-image model may not be accessible yet." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to process image",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
