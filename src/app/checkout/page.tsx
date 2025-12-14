"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import {
  getPlushSizeOptions,
  getFrameTypeOptions,
  formatPrice,
  calculateProductPrice,
} from "@/lib/product-pricing";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import type {
  ProductType,
  PlushSize,
  FrameType,
  Currency,
  PaymentMethod,
  ShippingAddress,
} from "@/types/products";

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Order data from session storage
  const [styledImageData, setStyledImageData] = useState<string>("");
  const [styleApplied, setStyleApplied] = useState<string>("");

  // Product selection
  const [productType, setProductType] = useState<ProductType>("plush_toy");
  const [plushSize, setPlushSize] = useState<PlushSize>("medium");
  const [frameType, setFrameType] = useState<FrameType>("custom_plush");
  const [currency, setCurrency] = useState<Currency>("USD");

  // Shipping address
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    country: "Zimbabwe",
    postalCode: "",
  });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ecocash");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Load order data from session storage
  useEffect(() => {
    const imageData = sessionStorage.getItem("checkoutImageData");
    const style = sessionStorage.getItem("checkoutStyle");

    if (!imageData || !style) {
      setError("No order data found. Please generate an image first.");
      setTimeout(() => router.push("/"), 3000);
      return;
    }

    setStyledImageData(imageData);
    setStyleApplied(style);
  }, [router]);

  // Calculate total price
  const totalPrice = calculateProductPrice(
    productType,
    productType === "plush_toy"
      ? { size: plushSize }
      : { frameType },
    currency
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate user is authenticated
      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to place an order");
        setLoading(false);
        return;
      }

      // Get ID token
      const idToken = await user.getIdToken();

      console.log(`Styled image data from checkout: ${styledImageData}`);

      // Create order
      const orderResponse = await fetch("/api/products/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          productType,
          productDetails: productType === "plush_toy"
            ? { size: plushSize }
            : { frameType },
          styledImageData,
          styleApplied,
          currency,
          shippingAddress,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.message || "Failed to create order");
      }

      const orderId = orderData.orderId;

      // Initiate payment
      const paymentResponse = await fetch("/api/products/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          orderId,
          paymentMethod,
          phoneNumber: (paymentMethod === "ecocash" || paymentMethod === "onemoney")
            ? phoneNumber
            : undefined,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        throw new Error(paymentData.message || "Failed to initiate payment");
      }

      // Handle payment redirect/instructions
      if (paymentData.redirectUrl) {
        // Card payment - redirect to Paynow
        window.location.href = paymentData.redirectUrl;
      } else {
        // Mobile payment - show instructions
        alert(paymentData.instructions || "Payment initiated. Please check your phone.");
        router.push("/");
      }

      // Clear session storage
      sessionStorage.removeItem("checkoutImageData");
      sessionStorage.removeItem("checkoutStyle");
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Failed to process order");
    } finally {
      setLoading(false);
    }
  };

  if (!styledImageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 flex items-center justify-center text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="/prod-logo.png"
                alt="IconicMe"
                className="w-10 h-10 rounded-xl object-contain"
              />
              <span className="text-2xl font-bold">IconicMe</span>
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
      <div className="pt-20 pb-8 px-4 h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <ShoppingCart className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Order Your Creation</h1>
            </div>
            <p className="text-purple-200">Transform your AI-generated image into a physical product</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Image Preview */}
            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Your Creation</h2>
              <div className="flex justify-center mb-4">
                <img
                  src={styledImageData}
                  alt="Styled creation"
                  className="max-w-full h-auto rounded-lg shadow-2xl"
                />
              </div>
              <p className="text-center text-purple-200">Style: <span className="font-semibold text-white">{styleApplied}</span></p>

              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-200">Product:</span>
                    <span className="font-medium">
                      {productType === "plush_toy" ? "Plush Toy" : "Framed Picture"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-200">
                      {productType === "plush_toy" ? "Size:" : "Frame Type:"}
                    </span>
                    <span className="font-medium">
                      {productType === "plush_toy" ? plushSize : frameType}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                    <span>Total:</span>
                    <span className="text-yellow-400">{formatPrice(totalPrice, currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Form */}
            <form onSubmit={handleSubmit} className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6 space-y-5">
              {/* Product Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Product Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setProductType("plush_toy")}
                    className={`p-3 border-2 rounded-lg text-center transition ${
                      productType === "plush_toy"
                        ? "border-purple-400 bg-purple-500/20"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    <div className="font-semibold">🧸 Plush Toy</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductType("framed_picture")}
                    className={`p-3 border-2 rounded-lg text-center transition ${
                      productType === "framed_picture"
                        ? "border-purple-400 bg-purple-500/20"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    <div className="font-semibold">🖼️ Framed Picture</div>
                  </button>
                </div>
              </div>

              {/* Product Options */}
              {productType === "plush_toy" ? (
                <div>
                  <label className="block text-sm font-medium mb-2">Size</label>
                  <select
                    value={plushSize}
                    onChange={(e) => setPlushSize(e.target.value as PlushSize)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  >
                    {getPlushSizeOptions(currency).map((option) => (
                      <option key={option.value} value={option.value} className="bg-gray-900">
                        {option.label} - {option.formattedPrice}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Frame Type</label>
                  <select
                    value={frameType}
                    onChange={(e) => setFrameType(e.target.value as FrameType)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                  >
                    {getFrameTypeOptions(currency).map((option) => (
                      <option key={option.value} value={option.value} className="bg-gray-900">
                        {option.label} - {option.formattedPrice}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={`p-2 border-2 rounded-lg transition ${
                      currency === "USD"
                        ? "border-purple-400 bg-purple-500/20"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("ZWG")}
                    className={`p-2 border-2 rounded-lg transition ${
                      currency === "ZWG"
                        ? "border-purple-400 bg-purple-500/20"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    ZWG
                  </button>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="pt-4 border-t border-white/10">
                <h3 className="font-semibold mb-3">Shipping Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                    required
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-purple-300"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                    required
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-purple-300"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 1 *"
                    value={shippingAddress.addressLine1}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                    required
                    className="md:col-span-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-purple-300"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 2"
                    value={shippingAddress.addressLine2}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })}
                    className="md:col-span-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-purple-300"
                  />
                  <input
                    type="text"
                    placeholder="City *"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    required
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-purple-300"
                  />
                  <input
                    type="text"
                    placeholder="Country *"
                    value={shippingAddress.country}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                    required
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-purple-300"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="pt-4 border-t border-white/10">
                <h3 className="font-semibold mb-3">Payment Method</h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("ecocash")}
                    className={`p-2 border-2 rounded-lg transition text-sm ${
                      paymentMethod === "ecocash"
                        ? "border-purple-400 bg-purple-500/20"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    Ecocash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("onemoney")}
                    className={`p-2 border-2 rounded-lg transition text-sm ${
                      paymentMethod === "onemoney"
                        ? "border-purple-400 bg-purple-500/20"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    OneMoney
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-2 border-2 rounded-lg transition text-sm ${
                      paymentMethod === "card"
                        ? "border-purple-400 bg-purple-500/20"
                        : "border-white/20 hover:border-white/40"
                    }`}
                  >
                    Card
                  </button>
                </div>

                {(paymentMethod === "ecocash" || paymentMethod === "onemoney") && (
                  <input
                    type="tel"
                    placeholder="Mobile Number for Payment"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-purple-300"
                  />
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
              >
                {loading ? "Processing..." : `Place Order - ${formatPrice(totalPrice, currency)}`}
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
