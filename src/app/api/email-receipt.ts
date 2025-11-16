// pages/api/email-receipt.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { FirebaseSubscriptionService } from '@/lib/firebase-admin';

// For sending emails, you can use services like:
// - Resend (recommended)
// - SendGrid  
// - Nodemailer with SMTP
// For this example, I'll show integration with Resend

// npm install resend
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscriptionId, orderId, email } = req.body;

    if (!subscriptionId && !orderId) {
      return res.status(400).json({ error: 'Subscription ID or Order ID is required' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const firebaseService = new FirebaseSubscriptionService();

    // Get receipt data
    let subscriptionData = null;
    let transactionData = null;

    if (subscriptionId) {
      const subscriptionDoc = await firebaseService.db
        .collection('subscriptions')
        .doc(subscriptionId)
        .get();

      if (subscriptionDoc.exists) {
        subscriptionData = subscriptionDoc.data();
      }

      const transactionQuery = await firebaseService.db
        .collection('transactions')
        .where('subscriptionId', '==', subscriptionId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      if (!transactionQuery.empty) {
        transactionData = transactionQuery.docs[0].data();
      }
    }

    if (!subscriptionData && !transactionData) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const userId = subscriptionData?.userId || transactionData?.userId;
    const userData = userId ? await firebaseService.getUserDocument(userId) : null;

    const amount = subscriptionData?.amount || transactionData?.amount || 0;
    const tax = transactionData?.metadata?.tax || '0.00';
    const total = transactionData?.amount || amount;

    const receiptData = {
      subscriptionId: subscriptionData?.subscriptionId || transactionData?.subscriptionId || '',
      orderId: transactionData?.orderId || subscriptionData?.metadata?.orderId || '',
      orderNumber: transactionData?.metadata?.orderNumber || Math.floor(Math.random() * 1000000),
      productName: subscriptionData?.metadata?.productName || 'Animate Pro',
      variantName: subscriptionData?.metadata?.variantName || 'Subscription',
      userEmail: email,
      userName: userData?.name || subscriptionData?.metadata?.customerName || 'User',
      amount: amount.toString(),
      currency: subscriptionData?.currency || transactionData?.currency || 'USD',
      tax: tax.toString(),
      total: total.toString(),
      interval: subscriptionData?.interval || 'monthly',
      status: subscriptionData?.status || 'active',
      createdAt: subscriptionData?.createdAt?.toDate?.()?.toISOString() || 
                 transactionData?.timestamp?.toDate?.()?.toISOString() || 
                 new Date().toISOString(),
    };

    // Generate email HTML
    const emailHTML = generateReceiptEmailHTML(receiptData);

    // Send email using your preferred service
    await sendReceiptEmail(email, receiptData.orderNumber, emailHTML);

    res.status(200).json({
      success: true,
      message: 'Receipt sent successfully',
    });

  } catch (error) {
    console.error('Error sending receipt email:', error);
    res.status(500).json({ 
      error: 'Failed to send receipt email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function sendReceiptEmail(email: string, orderNumber: number, htmlContent: string) {
  // Option 1: Using Resend
  /*
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'Animate <receipts@animateapp.com>',
    to: [email],
    subject: `Your Animate Receipt #${orderNumber}`,
    html: htmlContent,
  });
  */

  // Option 2: Using fetch to call an external email service
  // This is a mock implementation - replace with your actual email service
  const emailServiceResponse = await fetch('https://api.your-email-service.com/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.EMAIL_SERVICE_API_KEY}`,
    },
    body: JSON.stringify({
      to: email,
      subject: `Your Animate Receipt #${orderNumber}`,
      html: htmlContent,
      from: 'receipts@animateapp.com',
    }),
  });

  if (!emailServiceResponse.ok) {
    throw new Error('Failed to send email via service');
  }

  // For development/testing, you can just log the email content
  console.log('Email would be sent to:', email);
  console.log('Subject: Your Animate Receipt #' + orderNumber);
  console.log('HTML Content:', htmlContent.substring(0, 200) + '...');
}

function generateReceiptEmailHTML(data: any): string {
  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Animate Receipt</title>
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          margin: 0; 
          padding: 0; 
          background-color: #f8f9fa; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 8px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
        }
        .header { 
          background: gradient-gradient(135deg, #667eea 0%, #764ba2 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
        .content { padding: 30px; }
        .receipt-header { text-align: center; margin-bottom: 30px; }
        .receipt-number { 
          font-size: 24px; 
          font-weight: bold; 
          color: #667eea; 
          margin-bottom: 10px; 
        }
        .info-section { margin: 25px 0; }
        .info-section h3 { 
          color: #333; 
          border-bottom: 2px solid #667eea; 
          padding-bottom: 8px; 
          margin-bottom: 15px; 
        }
        .info-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 8px 0; 
          border-bottom: 1px solid #eee; 
        }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 500; color: #666; }
        .info-value { font-weight: 600; color: #333; }
        .item-box { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
        }
        .status { 
          background: #d4edda; 
          color: #155724; 
          padding: 4px 12px; 
          border-radius: 20px; 
          font-size: 12px; 
          font-weight: 500; 
          text-transform: uppercase; 
        }
        .total-section { 
          border-top: 2px solid #667eea; 
          padding-top: 20px; 
          margin-top: 30px; 
        }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 10px 0; 
          font-size: 18px; 
          font-weight: bold; 
          color: #667eea; 
        }
        .footer { 
          background: #f8f9fa; 
          padding: 30px; 
          text-align: center; 
          border-top: 1px solid #eee; 
        }
        .footer p { margin: 5px 0; color: #666; }
        .footer a { color: #667eea; text-decoration: none; }
        .button { 
          display: inline-block; 
          background: #667eea; 
          color: white; 
          padding: 12px 30px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0; 
          font-weight: 500; 
        }
        @media (max-width: 600px) {
          .info-row { flex-direction: column; }
          .info-label { margin-bottom: 5px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Animate</h1>
          <p>AI Animation Platform</p>
        </div>

        <div class="content">
          <div class="receipt-header">
            <div class="receipt-number">Receipt #${data.orderNumber}</div>
            <p style="color: #666; margin: 0;">Thank you for your subscription!</p>
          </div>

          <div class="info-section">
            <h3>Customer Information</h3>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${data.userName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${data.userEmail}</span>
            </div>
          </div>

          <div class="info-section">
            <h3>Transaction Details</h3>
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span class="info-value">${formatDate(data.createdAt)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Order ID:</span>
              <span class="info-value">${data.orderId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="status">${data.status}</span>
            </div>
          </div>

          <div class="item-box">
            <h3 style="margin-top: 0;">Subscription Details</h3>
            <div class="info-row">
              <span class="info-label">${data.productName}</span>
              <span class="info-value">${formatCurrency(data.amount, data.currency)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">${data.variantName}</span>
              <span class="info-value">per ${data.interval}</span>
            </div>
          </div>

          <div class="total-section">
            <div class="info-row">
              <span class="info-label">Subtotal:</span>
              <span class="info-value">${formatCurrency(data.amount, data.currency)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tax:</span>
              <span class="info-value">${formatCurrency(data.tax, data.currency)}</span>
            </div>
            <div class="total-row">
              <span>Total Paid:</span>
              <span>${formatCurrency(data.total, data.currency)}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="https://animateapp.com/receipt?subscription_id=${data.subscriptionId}" class="button">
              View Full Receipt
            </a>
          </div>
        </div>

        <div class="footer">
          <p><strong>Thank you for choosing Animate!</strong></p>
          <p>Questions? Contact us at <a href="mailto:support@animateapp.com">support@animateapp.com</a></p>
          <p style="font-size: 12px; color: #999; margin-top: 20px;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}