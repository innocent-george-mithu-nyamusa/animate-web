"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import { formatPrice } from "@/lib/product-pricing";
import { Package, Truck, CheckCircle, Clock, MapPin, ArrowLeft } from "lucide-react";

interface Order {
  orderId: string;
  productType: "plush_toy" | "framed_picture";
  productDetails: any;
  styledImageUrl: string;
  styleApplied: string;
  amount: number;
  currency: "USD" | "ZWG";
  paymentStatus: "pending" | "paid" | "failed";
  fulfillmentStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    country: string;
    postalCode?: string;
  };
  createdAt: string;
  updatedAt: string;
}

function TrackOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams.get("id");

  const [orderId, setOrderId] = useState(orderIdFromUrl || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-load order if ID is in URL
  useEffect(() => {
    if (orderIdFromUrl) {
      handleTrackOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderIdFromUrl]);

  const handleTrackOrder = async () => {
    if (!orderId.trim()) {
      setError("Please enter an order ID");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setOrder(null);

      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to track your order");
        return;
      }

      const idToken = await user.getIdToken();
      const response = await fetch(`/api/products/track?orderId=${orderId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        setError(data.message || "Order not found");
      }
    } catch (err: any) {
      console.error("Error tracking order:", err);
      setError(err.message || "Failed to track order");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ["pending", "processing", "shipped", "delivered"];
    return steps.indexOf(status);
  };

  const getStatusIcon = (status: string, currentStatus: string) => {
    const currentStep = getStatusStep(currentStatus);
    const step = getStatusStep(status);

    if (step <= currentStep) {
      return <CheckCircle className="w-8 h-8 text-green-400" />;
    }
    return <Clock className="w-8 h-8 text-purple-300" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      case "processing":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      case "shipped":
        return "bg-purple-500/20 text-purple-300 border-purple-500/50";
      case "delivered":
        return "bg-green-500/20 text-green-300 border-green-500/50";
      case "cancelled":
        return "bg-red-500/20 text-red-300 border-red-500/50";
      default:
        return "bg-white/10 text-white border-white/20";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="/prod-logo.png"
                alt="Animate"
                className="w-10 h-10 rounded-xl object-contain"
              />
              <span className="text-2xl font-bold">Animate</span>
            </div>
            <button
              onClick={() => router.push("/")}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to App</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-20 pb-8 px-4 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Package className="w-16 h-16 mx-auto text-purple-300 mb-4" />
            <h1 className="text-3xl font-bold">Track Your Order</h1>
            <p className="mt-2 text-purple-200">Enter your order ID to see the latest status</p>
          </div>

          {/* Order ID Input */}
          <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-6 mb-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter Order ID (e.g., order_123456...)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrackOrder()}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-purple-300"
              />
              <button
                onClick={handleTrackOrder}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
              >
                {loading ? "Tracking..." : "Track Order"}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Order Details */}
          {order && (
            <div className="space-y-6">
              {/* Status Timeline */}
              <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-6">Order Status</h2>

                <div className="flex justify-between items-start mb-8 relative">
                  {["pending", "processing", "shipped", "delivered"].map((status, index) => (
                    <div key={status} className="flex-1 relative">
                      <div className="flex flex-col items-center">
                        {getStatusIcon(status, order.fulfillmentStatus)}
                        <p className="mt-2 text-sm font-medium capitalize text-white">
                          {status}
                        </p>
                      </div>
                      {index < 3 && (
                        <div
                          className={`absolute top-4 left-1/2 w-full h-0.5 -z-10 ${
                            getStatusStep(order.fulfillmentStatus) > index
                              ? "bg-green-400"
                              : "bg-purple-300/30"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                      order.fulfillmentStatus
                    )}`}
                  >
                    {order.fulfillmentStatus.toUpperCase()}
                  </span>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-medium border ${
                      order.paymentStatus === "paid"
                        ? "bg-green-500/20 text-green-300 border-green-500/50"
                        : "bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
                    }`}
                  >
                    Payment: {order.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Details */}
                <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Product Details</h3>
                  {order.styledImageUrl && (
                    <img
                      src={order.styledImageUrl}
                      alt="Product"
                      className="w-full rounded-lg shadow-lg mb-4"
                    />
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-200">Order ID:</span>
                      <span className="font-medium text-white break-all ml-2">{order.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-200">Product:</span>
                      <span className="font-medium text-white">
                        {order.productType === "plush_toy" ? "Plush Toy" : "Framed Picture"}
                      </span>
                    </div>
                    {order.productType === "plush_toy" && (
                      <div className="flex justify-between">
                        <span className="text-purple-200">Size:</span>
                        <span className="font-medium text-white">{order.productDetails.size}</span>
                      </div>
                    )}
                    {order.productType === "framed_picture" && (
                      <div className="flex justify-between">
                        <span className="text-purple-200">Frame Type:</span>
                        <span className="font-medium text-white">{order.productDetails.frameType}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-purple-200">Style:</span>
                      <span className="font-medium text-white">{order.styleApplied}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/10">
                      <span className="text-purple-200">Total:</span>
                      <span className="font-bold text-lg text-yellow-400">
                        {formatPrice(order.amount, order.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-purple-300" />
                    <h3 className="text-lg font-semibold">Shipping Address</h3>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg text-sm space-y-1">
                    <p className="font-semibold text-white">{order.shippingAddress.fullName}</p>
                    <p className="text-purple-200">{order.shippingAddress.phone}</p>
                    <p className="text-purple-200 mt-2">{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && (
                      <p className="text-purple-200">{order.shippingAddress.addressLine2}</p>
                    )}
                    <p className="text-purple-200">
                      {order.shippingAddress.city}, {order.shippingAddress.country}
                    </p>
                    {order.shippingAddress.postalCode && (
                      <p className="text-purple-200">{order.shippingAddress.postalCode}</p>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/10 text-xs text-purple-300">
                    <p>Ordered: {new Date(order.createdAt).toLocaleString()}</p>
                    <p>Last Updated: {new Date(order.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              {order.fulfillmentStatus === "shipped" && (
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Truck className="w-6 h-6 text-blue-300 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-200">Your Order is On Its Way!</h3>
                      <p className="text-sm text-blue-300 mt-1">
                        Your package has been shipped and should arrive within 5-7 business days.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {order.fulfillmentStatus === "delivered" && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-300 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-green-200">Delivered!</h3>
                      <p className="text-sm text-green-300 mt-1">
                        Your order has been successfully delivered. We hope you enjoy your creation!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg p-6 text-center">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-purple-200">
              If you have any questions about your order, please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 flex items-center justify-center">
        <p className="text-purple-200">Loading...</p>
      </div>
    }>
      <TrackOrderContent />
    </Suspense>
  );
}
