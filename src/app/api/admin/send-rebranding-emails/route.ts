import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';
import { firebaseSubscriptionService } from '@/lib/firebase-admin';

/**
 * API Route: Send Rebranding Emails
 * POST /api/admin/send-rebranding-emails
 *
 * Sends rebranding announcement emails to all users
 *
 * Security: Requires ADMIN_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Resend API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { mode = 'all', testEmail } = body;

    // Test mode: Send to a single test email
    if (mode === 'test') {
      if (!testEmail) {
        return NextResponse.json(
          { error: 'Test email address required for test mode' },
          { status: 400 }
        );
      }

      const result = await EmailService.sendRebrandingEmail(
        testEmail,
        'Test User'
      );

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `Test email sent to ${testEmail}`
          : 'Failed to send test email',
        result,
      });
    }

    // Production mode: Send to all users
    if (mode === 'all') {
      // Fetch all users from Firebase
      const users = await firebaseSubscriptionService.getAllUsers();

      if (!users || users.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No users found',
        });
      }

      // Prepare user list with email and display name
      const userList = users.map((user: any) => ({
        email: user.email,
        displayName: user.displayName || 'Valued Customer',
      }));

      // Send bulk emails
      const results = await EmailService.sendBulkRebrandingEmails(userList);

      return NextResponse.json({
        success: true,
        message: `Sent ${results.successful} out of ${results.total} emails`,
        results,
      });
    }

    // Single user mode: Send to specific email
    if (mode === 'single') {
      const { email, displayName } = body;

      if (!email) {
        return NextResponse.json(
          { error: 'Email address required' },
          { status: 400 }
        );
      }

      const result = await EmailService.sendRebrandingEmail(
        email,
        displayName || 'Valued Customer'
      );

      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `Email sent to ${email}`
          : 'Failed to send email',
        result,
      });
    }

    return NextResponse.json(
      { error: 'Invalid mode. Use "test", "single", or "all"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error sending rebranding emails:', error);
    return NextResponse.json(
      {
        error: 'Failed to send rebranding emails',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Helper method to get CORS headers
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
