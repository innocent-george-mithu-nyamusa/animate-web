import { Resend } from "resend";
import { formatPrice } from "./product-pricing";

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderEmailData {
  orderId: string;
  customerEmail: string;
  customerName: string;
  productType: "plush_toy" | "framed_picture";
  productDetails: any;
  amount: number;
  currency: "USD" | "ZWG";
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    country: string;
    postalCode?: string;
  };
  styleApplied: string;
  styledImageUrl?: string;
}

export class EmailService {
  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(data: OrderEmailData) {
    try {
      const productName =
        data.productType === "plush_toy"
          ? `Plush Toy (${data.productDetails.size})`
          : `Framed Picture (${data.productDetails.frameType})`;

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Animate</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .order-details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
    .detail-label { font-weight: 600; color: #666; }
    .detail-value { color: #333; }
    .total { font-size: 1.2em; font-weight: bold; color: #667eea; margin-top: 15px; padding-top: 15px; border-top: 2px solid #667eea; }
    .product-image { width: 100%; max-width: 300px; margin: 20px auto; display: block; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .shipping-address { background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
    .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🎨 Thank You for Your Order!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your AI-generated creation is on its way</p>
    </div>

    <div class="content">
      <h2>Order Confirmation</h2>
      <p>Hi ${data.customerName},</p>
      <p>We've received your order and we're excited to bring your AI-generated creation to life! Here are your order details:</p>

      ${data.styledImageUrl ? `<img src="${data.styledImageUrl}" alt="Your styled image" class="product-image">` : ''}

      <div class="order-details">
        <h3 style="margin-top: 0;">Order Details</h3>
        <div class="detail-row">
          <span class="detail-label">Order ID:</span>
          <span class="detail-value">${data.orderId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Product:</span>
          <span class="detail-value">${productName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Style Applied:</span>
          <span class="detail-value">${data.styleApplied}</span>
        </div>
        <div class="detail-row total">
          <span>Total:</span>
          <span>${formatPrice(data.amount, data.currency)}</span>
        </div>
      </div>

      <div class="shipping-address">
        <h3 style="margin-top: 0;">📦 Shipping Address</h3>
        <p style="margin: 5px 0;"><strong>${data.shippingAddress.fullName}</strong></p>
        <p style="margin: 5px 0;">${data.shippingAddress.phone}</p>
        <p style="margin: 5px 0;">${data.shippingAddress.addressLine1}</p>
        ${data.shippingAddress.addressLine2 ? `<p style="margin: 5px 0;">${data.shippingAddress.addressLine2}</p>` : ''}
        <p style="margin: 5px 0;">${data.shippingAddress.city}, ${data.shippingAddress.country}</p>
        ${data.shippingAddress.postalCode ? `<p style="margin: 5px 0;">${data.shippingAddress.postalCode}</p>` : ''}
      </div>

      <p><strong>What happens next?</strong></p>
      <ul>
        <li>We'll process your order within 1-2 business days</li>
        <li>You'll receive a shipping confirmation once your item ships</li>
        <li>Track your order anytime at: <a href="${process.env.NEXT_PUBLIC_APP_URL}/track-order?id=${data.orderId}">Track Order</a></li>
      </ul>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/track-order?id=${data.orderId}" class="button">Track Your Order</a>
      </div>

      <p>If you have any questions about your order, please don't hesitate to contact us.</p>
      <p>Thank you for choosing Animate!</p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Pixelspulse Private Limited. All rights reserved.</p>
      <p>This email was sent to ${data.customerEmail}</p>
    </div>
  </div>
</body>
</html>
      `;

      const result = await resend.emails.send({
        from: "Animate <orders@pixels.co.zw>", // Update with your verified domain
        to: data.customerEmail,
        subject: `Order Confirmation - ${data.orderId}`,
        html,
      });

      console.log(`Order confirmation email sent: ${result.id}`);
      return { success: true, emailId: result.id };
    } catch (error) {
      console.error("Failed to send order confirmation email:", error);
      // Don't throw - email failures shouldn't break the order flow
      return { success: false, error };
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(data: OrderEmailData) {
    try {
      const productName =
        data.productType === "plush_toy"
          ? `Plush Toy (${data.productDetails.size})`
          : `Framed Picture (${data.productDetails.frameType})`;

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received - Animate</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .success-badge { background: #d1fae5; color: #065f46; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: 600; margin: 20px 0; }
    .order-summary { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✅ Payment Received!</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your order is now being processed</p>
    </div>

    <div class="content">
      <div style="text-align: center;">
        <div class="success-badge">Payment Confirmed</div>
      </div>

      <h2>Hi ${data.customerName},</h2>
      <p>Great news! We've received your payment of <strong>${formatPrice(data.amount, data.currency)}</strong> for order <strong>${data.orderId}</strong>.</p>

      <div class="order-summary">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <p><strong>Product:</strong> ${productName}</p>
        <p><strong>Style:</strong> ${data.styleApplied}</p>
        <p><strong>Amount Paid:</strong> ${formatPrice(data.amount, data.currency)}</p>
      </div>

      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Our team is now preparing your custom creation</li>
        <li>You'll receive a shipping notification with tracking details soon</li>
        <li>Estimated processing time: 1-3 business days</li>
      </ul>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/track-order?id=${data.orderId}" class="button">Track Your Order</a>
      </div>

      <p>Thank you for your purchase!</p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Pixelspulse Private Limited. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `;

      const result = await resend.emails.send({
        from: "Animate <orders@pixels.co.zw>",
        to: data.customerEmail,
        subject: `Payment Confirmed - ${data.orderId}`,
        html,
      });

      console.log(`Payment confirmation email sent: ${result.id}`);
      return { success: true, emailId: result.id };
    } catch (error) {
      console.error("Failed to send payment confirmation email:", error);
      return { success: false, error };
    }
  }

  /**
   * Send shipping notification email
   */
  async sendShippingNotification(
    orderId: string,
    customerEmail: string,
    customerName: string,
    trackingNumber?: string
  ) {
    try {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Order Has Shipped - Animate</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
    .tracking-box { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .tracking-number { font-size: 1.2em; font-weight: bold; color: #8b5cf6; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📦 Your Order Has Shipped!</h1>
    </div>

    <div class="content">
      <h2>Hi ${customerName},</h2>
      <p>Exciting news! Your custom creation is on its way to you.</p>

      <div class="tracking-box">
        <p style="margin: 0; font-weight: 600;">Order ID</p>
        <p class="tracking-number">${orderId}</p>
        ${trackingNumber ? `<p style="margin: 10px 0 0 0; font-weight: 600;">Tracking Number</p><p class="tracking-number">${trackingNumber}</p>` : ''}
      </div>

      <p>Your package should arrive within 5-7 business days. You can track your order anytime using the link below.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/track-order?id=${orderId}" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; text-decoration: none; border-radius: 6px;">Track Your Order</a>
      </div>

      <p>Thank you for choosing Animate!</p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Pixelspulse Private Limited. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `;

      const result = await resend.emails.send({
        from: "Animate <orders@pixels.co.zw>",
        to: customerEmail,
        subject: `Your Order Has Shipped - ${orderId}`,
        html,
      });

      console.log(`Shipping notification email sent: ${result.id}`);
      return { success: true, emailId: result.id };
    } catch (error) {
      console.error("Failed to send shipping notification email:", error);
      return { success: false, error };
    }
  }
}
