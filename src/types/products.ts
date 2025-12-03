// Product and Order Type Definitions

export type ProductType = 'plush_toy' | 'framed_picture';

export type PlushSize = 'small' | 'medium' | 'large' | 'xl';

export type FrameType = 'custom_plush' | 'classic_3d' | 'other_designs';

export type PaymentMethod = 'ecocash' | 'onemoney' | 'card';

export type Currency = 'USD' | 'ZWG';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export type FulfillmentStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface ProductPrice {
  usd: number;
  zwg: number;
}

export interface PlushToyDetails {
  size: PlushSize;
  customDesign?: boolean;
}

export interface FramedPictureDetails {
  frameType: FrameType;
  customNotes?: string;
}

export interface Order {
  orderId: string;
  userId: string;
  userEmail: string;
  productType: ProductType;
  productDetails: PlushToyDetails | FramedPictureDetails;
  styledImageUrl: string;
  styleApplied: string; // Which AI style was used
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string; // Paynow reference
  fulfillmentStatus: FulfillmentStatus;
  shippingAddress?: ShippingAddress;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface CreateOrderRequest {
  idToken: string;
  productType: ProductType;
  productDetails: PlushToyDetails | FramedPictureDetails;
  styledImageData: string; // Base64 data URL
  styleApplied: string;
  currency: Currency;
  shippingAddress?: ShippingAddress;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  amount: number;
  currency: Currency;
  message: string;
}

export interface InitiateProductPaymentRequest {
  idToken: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  phoneNumber?: string; // Required for mobile payments
}

export interface InitiateProductPaymentResponse {
  success: boolean;
  paymentReference: string;
  pollUrl?: string;
  redirectUrl?: string; // For card payments
  instructions?: string;
  message: string;
}
