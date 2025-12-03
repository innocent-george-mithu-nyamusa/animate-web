"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import { formatPrice } from "@/lib/product-pricing";
import type { FulfillmentStatus } from "@/types/products";
import { Package, Download, ArrowLeft } from "lucide-react";

interface Order {
  id: string;
  orderId: string;
  userId: string;
  userEmail: string;
  productType: "plush_toy" | "framed_picture";
  productDetails: any;
  styledImageUrl: string;
  styleApplied: string;
  amount: number;
  currency: "USD" | "ZWG";
  paymentMethod?: string;
  paymentStatus: "pending" | "paid" | "failed";
  paymentReference?: string;
  fulfillmentStatus: FulfillmentStatus;
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

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setError("Please sign in to view orders");
        return;
      }

      const idToken = await user.getIdToken();
      const response = await fetch("/api/admin/orders", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.message || "Failed to fetch orders");
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const updateFulfillmentStatus = async (orderId: string, status: FulfillmentStatus) => {
    try {
      setUpdatingStatus(true);
      const user = auth.currentUser;
      if (!user) {
        alert("Please sign in");
        return;
      }

      const idToken = await user.getIdToken();
      const response = await fetch("/api/admin/orders/update-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ orderId, status }),
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setOrders(orders.map(order =>
          order.orderId === orderId
            ? { ...order, fulfillmentStatus: status }
            : order
        ));
        if (selectedOrder?.orderId === orderId) {
          setSelectedOrder({ ...selectedOrder, fulfillmentStatus: status });
        }
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: FulfillmentStatus) => {
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/20 text-green-300 border-green-500/50";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      case "failed":
        return "bg-red-500/20 text-red-300 border-red-500/50";
      default:
        return "bg-white/10 text-white border-white/20";
    }
  };

  const exportToCSV = () => {
    if (orders.length === 0) {
      alert("No orders to export");
      return;
    }

    // Prepare CSV headers
    const headers = [
      "Order ID",
      "Date",
      "Customer Email",
      "Customer Name",
      "Product Type",
      "Product Details",
      "Style",
      "Amount",
      "Currency",
      "Payment Status",
      "Fulfillment Status",
      "Phone",
      "Address",
      "City",
      "Country",
    ];

    // Prepare CSV rows
    const rows = orders.map((order) => [
      order.orderId,
      new Date(order.createdAt).toLocaleDateString(),
      order.userEmail,
      order.shippingAddress.fullName,
      order.productType === "plush_toy" ? "Plush Toy" : "Framed Picture",
      order.productType === "plush_toy"
        ? order.productDetails.size
        : order.productDetails.frameType,
      order.styleApplied,
      order.amount,
      order.currency,
      order.paymentStatus,
      order.fulfillmentStatus,
      order.shippingAddress.phone,
      `"${order.shippingAddress.addressLine1}${
        order.shippingAddress.addressLine2 ? " " + order.shippingAddress.addressLine2 : ""
      }"`,
      order.shippingAddress.city,
      order.shippingAddress.country,
    ]);

    // Convert to CSV format
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-purple-950 flex items-center justify-center">
        <p className="text-purple-200">Loading orders...</p>
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
                alt="Animate"
                className="w-10 h-10 rounded-xl object-contain"
              />
              <span className="text-2xl font-bold">Animate Admin</span>
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-8 h-8 text-purple-300" />
                <h1 className="text-3xl font-bold">Order Management</h1>
              </div>
              <p className="text-purple-200">View and manage product orders</p>
            </div>
            <button
              onClick={exportToCSV}
              disabled={orders.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export to CSV
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders List */}
            <div className="lg:col-span-2 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold">Orders ({orders.length})</h2>
              </div>
              <div className="divide-y divide-white/10 max-h-[calc(100vh-300px)] overflow-y-auto">
                {orders.length === 0 ? (
                  <div className="p-8 text-center text-purple-300">
                    No orders found
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-4 cursor-pointer hover:bg-white/5 transition ${
                        selectedOrder?.id === order.id ? "bg-purple-500/20" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-white">
                            {order.orderId}
                          </p>
                          <p className="text-sm text-purple-200">{order.userEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">
                            {formatPrice(order.amount, order.currency)}
                          </p>
                          <p className="text-xs text-purple-300">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.fulfillmentStatus)}`}>
                          {order.fulfillmentStatus}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/10 text-white border border-white/20">
                          {order.productType === "plush_toy" ? "Plush Toy" : "Framed Picture"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
              {selectedOrder ? (
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Order Details</h2>

                  {/* Product Image */}
                  <div className="mb-4">
                    <img
                      src={selectedOrder.styledImageUrl}
                      alt="Product"
                      className="w-full rounded-lg shadow-lg"
                    />
                    <p className="text-sm text-purple-200 mt-2 text-center">
                      Style: {selectedOrder.styleApplied}
                    </p>
                  </div>

                  {/* Product Details */}
                  <div className="mb-6 space-y-2">
                    <div>
                      <p className="text-sm font-medium text-purple-200">Product Type</p>
                      <p className="text-sm text-white">
                        {selectedOrder.productType === "plush_toy" ? "Plush Toy" : "Framed Picture"}
                      </p>
                    </div>
                    {selectedOrder.productType === "plush_toy" && (
                      <div>
                        <p className="text-sm font-medium text-purple-200">Size</p>
                        <p className="text-sm text-white">{selectedOrder.productDetails.size}</p>
                      </div>
                    )}
                    {selectedOrder.productType === "framed_picture" && (
                      <div>
                        <p className="text-sm font-medium text-purple-200">Frame Type</p>
                        <p className="text-sm text-white">{selectedOrder.productDetails.frameType}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-purple-200">Amount</p>
                      <p className="text-sm text-white">
                        {formatPrice(selectedOrder.amount, selectedOrder.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="mb-6">
                    <p className="text-sm font-medium text-purple-200 mb-2">Shipping Address</p>
                    <div className="bg-white/5 p-3 rounded-lg text-sm text-white">
                      <p className="font-medium">{selectedOrder.shippingAddress.fullName}</p>
                      <p className="text-purple-200">{selectedOrder.shippingAddress.phone}</p>
                      <p className="text-purple-200">{selectedOrder.shippingAddress.addressLine1}</p>
                      {selectedOrder.shippingAddress.addressLine2 && (
                        <p className="text-purple-200">{selectedOrder.shippingAddress.addressLine2}</p>
                      )}
                      <p className="text-purple-200">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.country}</p>
                      {selectedOrder.shippingAddress.postalCode && (
                        <p className="text-purple-200">{selectedOrder.shippingAddress.postalCode}</p>
                      )}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="mb-6">
                    <p className="text-sm font-medium text-purple-200 mb-2">Payment Information</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-white">Status: <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus}
                      </span></p>
                      {selectedOrder.paymentMethod && (
                        <p className="text-purple-200">Method: {selectedOrder.paymentMethod}</p>
                      )}
                      {selectedOrder.paymentReference && (
                        <p className="text-xs text-purple-300">Ref: {selectedOrder.paymentReference}</p>
                      )}
                    </div>
                  </div>

                  {/* Fulfillment Status Update */}
                  <div>
                    <p className="text-sm font-medium text-purple-200 mb-2">Update Fulfillment Status</p>
                    <select
                      value={selectedOrder.fulfillmentStatus}
                      onChange={(e) => updateFulfillmentStatus(selectedOrder.orderId, e.target.value as FulfillmentStatus)}
                      disabled={updatingStatus}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                    >
                      <option value="pending" className="bg-purple-900">Pending</option>
                      <option value="processing" className="bg-purple-900">Processing</option>
                      <option value="shipped" className="bg-purple-900">Shipped</option>
                      <option value="delivered" className="bg-purple-900">Delivered</option>
                      <option value="cancelled" className="bg-purple-900">Cancelled</option>
                    </select>
                    {updatingStatus && (
                      <p className="text-xs text-purple-300 mt-1">Updating...</p>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="mt-6 pt-6 border-t border-white/10 text-xs text-purple-300">
                    <p>Created: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                    <p>Updated: {new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-purple-300">
                  Select an order to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
