import type { PlushSize, FrameType, PlushToyDetails, FramedPictureDetails } from '@/types/products';

export interface ProductPrice {
  usd: number;
  zwg: number;
}

export const PLUSH_TOY_PRICING: Record<PlushSize, ProductPrice> = {
  small: { usd: 15, zwg: 450 },
  medium: { usd: 25, zwg: 750 },
  large: { usd: 35, zwg: 1050 },
  xl: { usd: 70, zwg: 2100 },
};

export const FRAMED_PICTURE_PRICING: Record<FrameType, ProductPrice> = {
  custom_plush: { usd: 10.5, zwg: 315 },
  classic_3d: { usd: 12, zwg: 360 },
  other_designs: { usd: 15, zwg: 450 },
};

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

export function formatPrice(amount: number, currency: 'USD' | 'ZWG'): string {
  return `${currency} ${amount.toFixed(2)}`;
}

export function getPlushSizeOptions(currency: 'USD' | 'ZWG') {
  const currencyKey = currency.toLowerCase() as 'usd' | 'zwg';
  return [
    {
      value: 'small',
      label: 'Small',
      price: PLUSH_TOY_PRICING.small[currencyKey],
      formattedPrice: formatPrice(PLUSH_TOY_PRICING.small[currencyKey], currency)
    },
    {
      value: 'medium',
      label: 'Medium',
      price: PLUSH_TOY_PRICING.medium[currencyKey],
      formattedPrice: formatPrice(PLUSH_TOY_PRICING.medium[currencyKey], currency)
    },
    {
      value: 'large',
      label: 'Large',
      price: PLUSH_TOY_PRICING.large[currencyKey],
      formattedPrice: formatPrice(PLUSH_TOY_PRICING.large[currencyKey], currency)
    },
    {
      value: 'xl',
      label: 'Extra Large',
      price: PLUSH_TOY_PRICING.xl[currencyKey],
      formattedPrice: formatPrice(PLUSH_TOY_PRICING.xl[currencyKey], currency)
    },
  ];
}

export function getFrameTypeOptions(currency: 'USD' | 'ZWG') {
  const currencyKey = currency.toLowerCase() as 'usd' | 'zwg';
  return [
    {
      value: 'custom_plush',
      label: 'Custom Plush Frame',
      price: FRAMED_PICTURE_PRICING.custom_plush[currencyKey],
      formattedPrice: formatPrice(FRAMED_PICTURE_PRICING.custom_plush[currencyKey], currency)
    },
    {
      value: 'classic_3d',
      label: 'Classic 3D Frame',
      price: FRAMED_PICTURE_PRICING.classic_3d[currencyKey],
      formattedPrice: formatPrice(FRAMED_PICTURE_PRICING.classic_3d[currencyKey], currency)
    },
    {
      value: 'other_designs',
      label: 'Other Designs',
      price: FRAMED_PICTURE_PRICING.other_designs[currencyKey],
      formattedPrice: formatPrice(FRAMED_PICTURE_PRICING.other_designs[currencyKey], currency)
    },
  ];
}
