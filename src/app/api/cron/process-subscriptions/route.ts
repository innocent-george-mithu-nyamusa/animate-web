/**
 * Subscription Lifecycle Management Cron Job
 * Processes expired subscriptions and handles auto-renewals
 *
 * This endpoint should be called periodically (e.g., daily) by a cron service like:
 * - Vercel Cron Jobs
 * - Google Cloud Scheduler
 * - External cron service (cron-job.org, etc.)
 *
 * To secure this endpoint, add a secret token in environment variables
 * and validate it in the request header
 */

import { NextRequest, NextResponse } from "next/server";
import { FirebaseSubscriptionService } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    // Validate cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const firebaseService = new FirebaseSubscriptionService();

    // Process expired subscriptions
    await firebaseService.processExpiredSubscriptions();

    return NextResponse.json({
      success: true,
      message: "Subscription lifecycle processed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing subscription lifecycle:", error);

    return NextResponse.json(
      {
        error: "Failed to process subscriptions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility with different cron services
export async function POST(req: NextRequest) {
  return GET(req);
}
