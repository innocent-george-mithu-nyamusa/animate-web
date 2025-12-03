import type { ProductPrice, PlushSize, FrameType, PlushToyDetails, FramedPictureDetails } from '@/types/products';

// Plush Toy Pricing
export const PLUSH_TOY_PRICING: Record<PlushSize, ProductPrice> = {
  small: { usd: 15, zwg: 450 },
  medium: { usd: 25, zwg: 750 },
  large: { usd: 35, zwg: 1050 },
  xl: { usd: 70, zwg: 2100 },
};

// Framed Picture Pricing
export const FRAMED_PICTURE_PRICING: Record<FrameType, ProductPrice> = {
  custom_plush: { usd: 10.5, zwg: 315 },
  classic_3d: { usd: 12, zwg: 360 },
  other_designs: { usd: 15, zwg: 450 },
};

// Product Labels
export const PLUSH_SIZE_LABELS: Record<PlushSize, string> = {
  small: 'Small/Mini (6-10 inches)',
  medium: 'Medium (12-16 inches)',
  large: 'Large (18-24 inches)',
  xl: 'Extra Large (30-36 inches)',
};

export const FRAME_TYPE_LABELS: Record<FrameType, string> = {
  custom_plush: 'Custom Plush Design',
  classic_3d: 'Classic 3D Design',
  other_designs: 'Other Designs (Studio Ghibli, Superhero)',
};

// Calculate product price based on details and currency
export function calculateProductPrice(
  productType: 'plush_toy' | 'framed_picture',
  productDetails: PlushToyDetails | FramedPictureDetails,
  currency: 'USD' | 'ZWG'
): number {
  if (productType === 'plush_toy') {
    const details = productDetails as PlushToyDetails;
    return PLUSH_TOY_PRICING[details.size][currency.toLowerCase() as 'usd' | 'zwg'];
  } else {
    const details = productDetails as FramedPictureDetails;
    return FRAMED_PICTURE_PRICING[details.frameType][currency.toLowerCase() as 'usd' | 'zwg'];
  }
}

// Format price for display
export function formatPrice(amount: number, currency: 'USD' | 'ZWG'): string {
  if (currency === 'USD') {
    return `$${amount.toFixed(2)}`;
  } else {
    return `ZWG ${amount.toFixed(2)}`;
  }
}

// Get all available plush sizes with pricing
export function getPlushSizeOptions(currency: 'USD' | 'ZWG') {
  return Object.entries(PLUSH_TOY_PRICING).map(([size, price]) => ({
    value: size as PlushSize,
    label: PLUSH_SIZE_LABELS[size as PlushSize],
    price: price[currency.toLowerCase() as 'usd' | 'zwg'],
    formattedPrice: formatPrice(price[currency.toLowerCase() as 'usd' | 'zwg'], currency),
  }));
}

// Get all available frame types with pricing
export function getFrameTypeOptions(currency: 'USD' | 'ZWG') {
  return Object.entries(FRAMED_PICTURE_PRICING).map(([type, price]) => ({
    value: type as FrameType,
    label: FRAME_TYPE_LABELS[type as FrameType],
    price: price[currency.toLowerCase() as 'usd' | 'zwg'],
    formattedPrice: formatPrice(price[currency.toLowerCase() as 'usd' | 'zwg'], currency),
  }));
}
