import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Download, Mail, ArrowLeft, Calendar, CreditCard, User, Package, FileText, Loader2, AlertCircle } from 'lucide-react';

interface ReceiptData {
  subscriptionId: string;
  orderId: string;
  orderNumber: number;
  productName: string;
  variantName: string;
  userEmail: string;
  userName: string;
  amount: string;
  currency: string;
  tax: string;
  total: string;
  interval: string;
  status: string;
  createdAt: string;
  receiptUrl?: string;
  paymentMethod?: string;
  billingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export default function ReceiptPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    const fetchReceipt = async () => {
      const { subscription_id, order_id } = router.query;

      if (!subscription_id && !order_id) {
        setError('Missing receipt information');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/get-receipt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptionId: subscription_id,
            orderId: order_id,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch receipt');
        }

        const data = await response.json();
        setReceiptData(data.receipt);
      } catch (err) {
        console.error('Error fetching receipt:', err);
        setError('Failed to load receipt. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      fetchReceipt();
    }
  }, [router.isReady, router.query]);

  const handleDownloadReceipt = async () => {
    if (!receiptData) return;
    
    setDownloadLoading(true);
    try {
      const response = await fetch('/api/generate-receipt-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: receiptData.subscriptionId,
          orderId: receiptData.orderId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `iconicme-receipt-${receiptData.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading receipt:', err);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleEmailReceipt = async () => {
    if (!receiptData) return;
    
    setEmailLoading(true);
    try {
      const response = await fetch('/api/email-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: receiptData.subscriptionId,
          orderId: receiptData.orderId,
          email: receiptData.userEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      alert('Receipt sent to your email successfully!');
    } catch (err) {
      console.error('Error emailing receipt:', err);
      alert('Failed to send receipt via email. Please try again.');
    } finally {
      setEmailLoading(false);
    }
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

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(parseFloat(amount));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Receipt...</h2>
          <p className="text-gray-600">Please wait while we fetch your receipt details.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Receipt</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => router.reload()}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Receipt Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the receipt you're looking for.</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Receipt</h1>
        </div>

        {/* Receipt Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Receipt Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Animate</h2>
                <p className="text-blue-100">AI Animation Platform</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Receipt #</p>
                <p className="text-xl font-bold">{receiptData.orderNumber}</p>
              </div>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </h3>
                <div className="space-y-2 text-gray-600">
                  <p><span className="font-medium">Name:</span> {receiptData.userName}</p>
                  <p><span className="font-medium">Email:</span> {receiptData.userEmail}</p>
                  {receiptData.billingAddress && (
                    <div>
                      <p className="font-medium">Billing Address:</p>
                      <div className="text-sm">
                        {receiptData.billingAddress.line1 && <p>{receiptData.billingAddress.line1}</p>}
                        {receiptData.billingAddress.line2 && <p>{receiptData.billingAddress.line2}</p>}
                        <p>
                          {receiptData.billingAddress.city}, {receiptData.billingAddress.state} {receiptData.billingAddress.postalCode}
                        </p>
                        <p>{receiptData.billingAddress.country}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Transaction Details
                </h3>
                <div className="space-y-2 text-gray-600">
                  <p><span className="font-medium">Date:</span> {formatDate(receiptData.createdAt)}</p>
                  <p><span className="font-medium">Order ID:</span> {receiptData.orderId}</p>
                  <p><span className="font-medium">Subscription ID:</span> {receiptData.subscriptionId}</p>
                  <p><span className="font-medium">Payment Method:</span> {receiptData.paymentMethod || 'Card'}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {receiptData.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Subscription Details
              </h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-800">{receiptData.productName}</h4>
                    <p className="text-gray-600">{receiptData.variantName}</p>
                    <p className="text-sm text-gray-500">Billing: {receiptData.interval}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-800">
                      {formatCurrency(receiptData.amount, receiptData.currency)}
                    </p>
                    <p className="text-sm text-gray-500">per {receiptData.interval}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(receiptData.amount, receiptData.currency)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax:</span>
                  <span>{formatCurrency(receiptData.tax, receiptData.currency)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold text-gray-800">
                  <span>Total Paid:</span>
                  <span>{formatCurrency(receiptData.total, receiptData.currency)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDownloadReceipt}
                  disabled={downloadLoading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {downloadLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {downloadLoading ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={handleEmailReceipt}
                  disabled={emailLoading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {emailLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                  {emailLoading ? 'Sending...' : 'Email Receipt'}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6">
            <div className="text-center text-sm text-gray-500">
              <p className="mb-2">Thank you for your subscription to IconicMe!</p>
              <p>
                Questions? Contact support at{' '}
                <a href="mailto:support@iconicme.shop" className="text-blue-500 hover:underline">
                  support@iconicme.shop
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}