import { Resend } from 'resend';
import { rebrandingEmailPlainText } from './email-templates/rebranding-email';

const resend = new Resend(process.env.RESEND_API_KEY);

// HTML template function (avoiding react-dom/server for Next.js compatibility)
function generateRebrandingEmailHTML(userName: string = 'Valued Customer'): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>We're Now IconicMe!</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <tr>
              <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 32px; margin: 0 0 10px 0; font-weight: bold;">🎉 Exciting News!</h1>
                <p style="color: #ffffff; font-size: 18px; margin: 0; opacity: 0.9;">We have a new name and home</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <p style="font-size: 16px; margin-bottom: 20px; color: #333;">Dear ${userName},</p>
                <p style="font-size: 16px; margin-bottom: 20px; color: #555;">We're thrilled to share some exciting news with you! <strong>Animate</strong> is now <strong style="color: #7c3aed;">IconicMe</strong>! 🎨✨</p>

                <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #7c3aed; margin-bottom: 20px;">
                  <h2 style="font-size: 20px; margin-top: 0; margin-bottom: 15px; color: #7c3aed;">What's Changed?</h2>
                  <ul style="margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 10px;"><strong>New Name:</strong> Animate → <strong>IconicMe</strong></li>
                    <li style="margin-bottom: 10px;"><strong>New Website:</strong> <a href="https://iconicme.shop" style="color: #7c3aed; text-decoration: none;">https://iconicme.shop</a></li>
                    <li style="margin-bottom: 10px;"><strong>New Email:</strong> no-reply@iconicme.shop</li>
                  </ul>
                </div>

                <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 20px;">
                  <h2 style="font-size: 20px; margin-top: 0; margin-bottom: 15px; color: #059669;">What Stays the Same?</h2>
                  <ul style="margin: 0; padding-left: 20px;">
                    <li style="margin-bottom: 10px;">✅ Your account and subscription details</li>
                    <li style="margin-bottom: 10px;">✅ All 10 amazing AI toy styles you love</li>
                    <li style="margin-bottom: 10px;">✅ Your generation credits and history</li>
                    <li style="margin-bottom: 10px;">✅ Same great service and support</li>
                    <li>✅ Payment methods (Ecocash, OneMoney, Cards)</li>
                  </ul>
                </div>

                <p style="font-size: 16px; margin-bottom: 20px; color: #555;">This rebrand reflects our commitment to making your photos truly iconic! We've also improved our platform with faster processing, better AI models, and an enhanced user experience.</p>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://iconicme.shop" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 14px 30px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;">Visit IconicMe.shop Now →</a>
                </div>

                <p style="font-size: 14px; color: #666; font-style: italic; margin-top: 30px;"><strong>Important:</strong> Please update your bookmarks to <a href="https://iconicme.shop" style="color: #7c3aed; text-decoration: none;">iconicme.shop</a>. The old domain will redirect for a limited time.</p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 16px; margin-bottom: 15px; color: #333;">Thank you for being part of our journey! 💜</p>
                <p style="font-size: 14px; color: #666; margin: 10px 0;"><strong>IconicMe Team</strong><br/>Pixelspulse Private Limited</p>
                <div style="margin-top: 20px;">
                  <a href="https://iconicme.shop" style="color: #7c3aed; text-decoration: none; font-size: 14px; margin-right: 15px;">Website</a>
                  <a href="https://iconicme.shop/privacy-policy" style="color: #7c3aed; text-decoration: none; font-size: 14px; margin-right: 15px;">Privacy Policy</a>
                  <a href="mailto:consult@pixels.co.zw" style="color: #7c3aed; text-decoration: none; font-size: 14px;">Contact Us</a>
                </div>
                <p style="font-size: 12px; color: #999; margin-top: 20px;">© 2024 Pixelspulse Private Limited. All rights reserved.<br/>Made with ❤️ in Zimbabwe</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export class EmailService {
  private static defaultFrom = 'no-reply@iconicme.shop';
  private static defaultReplyTo = 'consult@pixels.co.zw';

  /**
   * Send a generic email
   */
  static async sendEmail(options: SendEmailOptions) {
    try {
      const { to, subject, html, text, from, replyTo } = options;

      const emailPayload: any = {
        from: from || this.defaultFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        replyTo: replyTo || this.defaultReplyTo,
      };

      // Add html or text content
      if (html) {
        emailPayload.html = html;
      }
      if (text) {
        emailPayload.text = text;
      }

      const data = await resend.emails.send(emailPayload);

      console.log('Email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }
  }

  /**
   * Send rebranding announcement email
   */
  static async sendRebrandingEmail(to: string, userName?: string) {
    try {
      // Generate HTML email content
      const htmlContent = generateRebrandingEmailHTML(userName || 'Valued Customer');

      const result = await this.sendEmail({
        to,
        subject: '🎉 We\'re Now IconicMe! - Important Update',
        html: htmlContent,
        text: rebrandingEmailPlainText(userName),
      });

      return result;
    } catch (error) {
      console.error('Failed to send rebranding email:', error);
      return { success: false, error };
    }
  }

  /**
   * Send bulk rebranding emails to multiple users
   */
  static async sendBulkRebrandingEmails(
    users: Array<{ email: string; displayName?: string }>
  ) {
    const results = {
      total: users.length,
      successful: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: any }>,
    };

    for (const user of users) {
      const result = await this.sendRebrandingEmail(user.email, user.displayName);

      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push({
          email: user.email,
          error: result.error,
        });
      }

      // Add delay to avoid rate limiting (Resend allows 10 emails/second on free plan)
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    return results;
  }

  /**
   * Send test email
   */
  static async sendTestEmail(to: string) {
    return this.sendEmail({
      to,
      subject: 'Test Email from IconicMe',
      html: '<h1>Test Email</h1><p>This is a test email from IconicMe.</p>',
      text: 'Test Email\n\nThis is a test email from IconicMe.',
    });
  }
}
