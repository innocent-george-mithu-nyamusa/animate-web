"use client";
import { useEffect, useState } from "react";

import {
  CheckCircle,
  AlertCircle,
  Smartphone,
  ArrowRight,
} from "lucide-react";

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

interface PageProps {
  params: {
    subscription_id: string;
  };
  SearchParams: {};
}

export default function Success() {
  //  const router = useRouter();
  const [loading, setLoading] = useState(true);


  const handleReturnToApp = () => {
    // Deep link back to the Flutter app
    const appScheme = "iconicme://success";
    window.location.href = appScheme;

    // Fallback: show instructions after a delay
    setTimeout(() => {
      alert(
        "Please return to the IconicMe app to continue using your subscription."
      );
    }, 2000);
  };



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

        

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleReturnToApp}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 animate-slide-up"
            >
              <Smartphone className="w-5 h-5" />
              Return to IconicMe App
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Questions? Contact our support team at{" "}
              <a
                href="mailto:support@iconicme.shop"
                className="text-blue-500 hover:underline"
              >
                consult@iconicme.shop
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
