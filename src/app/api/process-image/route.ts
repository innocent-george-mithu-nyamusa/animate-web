/**
 * Image Processing API Endpoint
 * Uses Google Gemini 2.5 Flash Image (Nano Banana) for AI-powered image editing
 * Transforms images based on natural language style prompts
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = await req.json();

    // Validate inputs
    if (!image || !prompt) {
      return NextResponse.json(
        { error: "Image and prompt are required" },
        { status: 400 }
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
      return NextResponse.json({
        success: true,
        styledImage: image,
        description: textDescription || "Image processing completed",
        message: "No edited image was generated. Returning original.",
      });
    }

    // Convert base64 image data to data URL
    const styledImageDataUrl = `data:image/png;base64,${editedImageData}`;

    return NextResponse.json({
      success: true,
      styledImage: styledImageDataUrl,
      description: textDescription,
      message: "Image successfully styled with Gemini!",
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
