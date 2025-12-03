export type ProductType = 'plush_toy' | 'framed_picture';
export type PlushSize = 'small' | 'medium' | 'large' | 'xl';
export type FrameType = 'custom_plush' | 'classic_3d' | 'other_designs';
export type PaymentMethod = 'ecocash' | 'onemoney' | 'card';
export type Currency = 'USD' | 'ZWG';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type FulfillmentStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface PlushToyDetails {
  size: PlushSize;
}

export interface FramedPictureDetails {
  frameType: FrameType;
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

export interface Order {
  orderId: string;
  userId: string;
  userEmail: string;
  productType: ProductType;
  productDetails: PlushToyDetails | FramedPictureDetails;
  styledImageUrl: string;
  styleApplied: string;
  amount: number;
  currency: Currency;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
  fulfillmentStatus: FulfillmentStatus;
  shippingAddress: ShippingAddress;
  createdAt: string;
  updatedAt: string;
}
