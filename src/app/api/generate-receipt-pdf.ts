// pages/api/generate-receipt-pdf.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { FirebaseSubscriptionService } from '@/lib/firebase-admin';

// Note: For PDF generation, you'll need to install jsPDF or similar
// npm install jspdf html2canvas
// For this example, I'll show a simple HTML-to-PDF approach

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscriptionId, orderId } = req.body;

    if (!subscriptionId && !orderId) {
      return res.status(400).json({ error: 'Subscription ID or Order ID is required' });
    }

    const firebaseService = new FirebaseSubscriptionService();

    // Get receipt data (reuse logic from get-receipt)
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

    // Generate HTML for PDF
    const receiptHTML = generateReceiptHTML({
      subscriptionId: subscriptionData?.subscriptionId || transactionData?.subscriptionId || '',
      orderId: transactionData?.orderId || subscriptionData?.metadata?.orderId || '',
      orderNumber: transactionData?.metadata?.orderNumber || Math.floor(Math.random() * 1000000),
      productName: subscriptionData?.metadata?.productName || 'IconicMe Pro',
      variantName: subscriptionData?.metadata?.variantName || 'Subscription',
      userEmail: userData?.email || subscriptionData?.customerEmail || '',
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
    });

    // For production, you'd use a proper PDF generation library like Puppeteer
    // For now, we'll return the HTML as a mock PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=receipt.pdf');
    
    // In a real implementation, you'd convert HTML to PDF here
    // For this example, we'll just return the HTML
    res.status(200).send(receiptHTML);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function generateReceiptHTML(data: any): string {
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
      <title>Receipt - ${data.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { background: gradient-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 32px; }
        .header p { margin: 5px 0 0 0; opacity: 0.8; }
        .receipt-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .receipt-info div { flex: 1; }
        .receipt-info h3 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
        .item-details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .summary { border-top: 2px solid #667eea; padding-top: 20px; margin-top: 30px; }
        .total { font-size: 18px; font-weight: bold; color: #667eea; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px 0; }
        .text-right { text-align: right; }
        .status { background: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>IconicMe</h1>
        <p>AI Animation Platform</p>
        <p style="margin-top: 20px; font-size: 18px;">Receipt #${data.orderNumber}</p>
      </div>

      <div class="receipt-info">
        <div>
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> ${data.userName}</p>
          <p><strong>Email:</strong> ${data.userEmail}</p>
        </div>
        <div>
          <h3>Transaction Details</h3>
          <p><strong>Date:</strong> ${formatDate(data.createdAt)}</p>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Subscription ID:</strong> ${data.subscriptionId}</p>
          <p><strong>Status:</strong> <span class="status">${data.status}</span></p>
        </div>
      </div>

      <div class="item-details">
        <h3>Subscription Details</h3>
        <table>
          <tr>
            <td><strong>${data.productName}</strong></td>
            <td class="text-right"><strong>${formatCurrency(data.amount, data.currency)}</strong></td>
          </tr>
          <tr>
            <td>${data.variantName}</td>
            <td class="text-right">per ${data.interval}</td>
          </tr>
        </table>
      </div>

      <div class="summary">
        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">${formatCurrency(data.amount, data.currency)}</td>
          </tr>
          <tr>
            <td>Tax:</td>
            <td class="text-right">${formatCurrency(data.tax, data.currency)}</td>
          </tr>
          <tr class="total">
            <td>Total Paid:</td>
            <td class="text-right">${formatCurrency(data.total, data.currency)}</td>
          </tr>
        </table>
      </div>

      <div class="footer">
        <p>Thank you for your subscription to IconicMe!</p>
        <p>Questions? Contact support at support@iconicme.shop</p>
      </div>
    </body>
    </html>
  `;
}