import React from 'react';

export default function SoftwareApplicationSchema() {
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'IconicMe - AI Image Toy Maker',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web, iOS, Android',
    description:
      'Transform your photos into custom toy designs with AI. Create plush toys, figurines, anime collectibles, action figures & more. Order physical toys or download designs.',
    url: 'https://iconicme.shop',
    image: 'https://iconicme.shop/prod-logo.png',
    screenshot: 'https://iconicme.shop/prod-logo.png',
    author: {
      '@type': 'Organization',
      name: 'Pixelspulse Private Limited',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://iconicme.shop',
        description: '3 AI toy generations per month',
      },
      {
        '@type': 'Offer',
        name: 'Standard Plan',
        price: '9.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://iconicme.shop',
        description: '120 AI toy generations per month with high resolution',
        priceValidUntil: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        )
          .toISOString()
          .split('T')[0],
      },
      {
        '@type': 'Offer',
        name: 'Premium Plan',
        price: '19.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://iconicme.shop',
        description:
          '280 AI toy generations per month with commercial license',
        priceValidUntil: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        )
          .toISOString()
          .split('T')[0],
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    featureList: [
      'AI-powered toy design generation',
      '10+ artistic styles (plush toys, figurines, anime, Funko Pop)',
      'Custom photo to toy transformation',
      'Physical toy ordering',
      'Digital download options',
      'Zimbabwe payment support (Ecocash, OneMoney)',
      'International card payments',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
    />
  );
}
