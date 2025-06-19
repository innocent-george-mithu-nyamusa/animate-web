import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, Loader2, AlertCircle, Smartphone, ArrowRight } from 'lucide-react';

interface SubscriptionData {
  subscriptionId: string;
  productName: string;
  variantName: string;
  amount: string;
  currency: string;
  interval: string;
  userEmail: string;
  status: string;
}

export default function SuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [processingSubscription, setProcessingSubscription] = useState(false);

  useEffect(() => {
    const processSubscription = async () => {
      const { subscription_id, order_id } = router.query;

      if (!subscription_id) {
        setError('Missing subscription information');
        setLoading(false);
        return;
      }

      try {
        setProcessingSubscription(true);
        
        // Call our API to process the subscription
        const response = await fetch('/api/process-subscription', {
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
          throw new Error('Failed to process subscription');
        }

        const data = await response.json();
        setSubscriptionData(data.subscription);
      } catch (err) {
        console.error('Error processing subscription:', err);
        setError('Failed to process your subscription. Please contact support.');
      } finally {
        setLoading(false);
        setProcessingSubscription(false);
      }
    };

    if (router.isReady) {
      processSubscription();
    }
  }, [router.isReady, router.query]);

  const handleReturnToApp = () => {
    // Deep link back to the Flutter app
    const appScheme = 'animate://success';
    window.location.href = appScheme;
    
    // Fallback: show instructions after a delay
    setTimeout(() => {
      alert('Please return to the Animate app to continue using your subscription.');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {processingSubscription ? 'Activating Your Subscription...' : 'Loading...'}
          </h2>
          <p className="text-gray-600">
            {processingSubscription 
              ? 'We\'re setting up your account. This will just take a moment.'
              : 'Please wait while we process your payment.'
            }
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.reload()}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2 animate-slide-up">
            Payment Successful! 🎉
          </h1>
          <p className="text-gray-600 mb-8 animate-slide-up">
            Your subscription has been activated successfully.
          </p>

          {/* Subscription Details */}
          {subscriptionData && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left animate-fade-in">
              <h3 className="font-semibold text-gray-800 mb-4">Subscription Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium text-gray-800">{subscriptionData.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-800">{subscriptionData.variantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-gray-800">
                    {subscriptionData.amount} {subscriptionData.currency.toUpperCase()}/{subscriptionData.interval}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-800">{subscriptionData.userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {subscriptionData.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleReturnToApp}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 animate-slide-up"
            >
              <Smartphone className="w-5 h-5" />
              Return to Animate App
              <ArrowRight className="w-5 h-5" />
            </button>

            <a
              href={`/receipt?subscription_id=${router.query.subscription_id}`}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 animate-slide-up"
            >
              View Receipt
            </a>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Questions? Contact our support team at{' '}
              <a href="mailto:support@animateapp.com" className="text-blue-500 hover:underline">
                support@animateapp.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}