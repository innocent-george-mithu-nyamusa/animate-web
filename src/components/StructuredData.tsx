import React from 'react';

export default function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://iconicme.shop/#organization',
        name: 'Pixelspulse Private Limited',
        url: 'https://iconicme.shop',
        logo: {
          '@type': 'ImageObject',
          url: 'https://iconicme.shop/prod-logo.png',
        },
        sameAs: [],
      },
      {
        '@type': 'WebApplication',
        '@id': 'https://iconicme.shop/#webapp',
        name: 'iconicme',
        url: 'https://iconicme.shop',
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web, iOS, Android',
        description:
          'AI-powered image toy maker that transforms photos into custom plush toys, figurines, and collectibles. Choose from 10+ artistic styles including anime figures, Funko Pop, Studio Ghibli, and more.',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: '0',
          highPrice: '19.99',
          offerCount: '3',
        },
        creator: {
          '@id': 'https://iconicme.shop/#organization',
        },
        screenshot: 'https://iconicme.shop/prod-logo.png',
        featureList: [
          'AI-powered toy design generation',
          '10+ artistic styles (plush toys, figurines, anime, Funko Pop)',
          'Custom photo to toy transformation',
          'Physical toy ordering',
          'Digital download options',
          'Zimbabwe payment support (Ecocash, OneMoney)',
          'International card payments',
          'Subscription plans with monthly credits',
        ],
      },
      {
        '@type': 'Service',
        '@id': 'https://iconicme.shop/#service',
        name: 'AI Image Toy Maker Service',
        provider: {
          '@id': 'https://iconicme.shop/#organization',
        },
        description:
          'Create custom toy designs from your photos using AI. Transform images into plush toys, figurines, collectibles, and more.',
        serviceType: 'Custom Toy Design & AI Image Transformation',
        areaServed: {
          '@type': 'Country',
          name: 'Worldwide',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'iconicme Subscription Plans',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: 'Free Plan',
                description: '3 AI toy generations per month with all 10 styles',
              },
              price: '0',
              priceCurrency: 'USD',
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: 'Standard Plan',
                description:
                  '120 AI toy generations per month with high resolution and priority processing',
              },
              price: '9.99',
              priceCurrency: 'USD',
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: 'Premium Plan',
                description:
                  '280 AI toy generations per month with ultra-high resolution, lightning-fast processing, and commercial license',
              },
              price: '19.99',
              priceCurrency: 'USD',
            },
          ],
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://iconicme.shop/#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://iconicme.shop',
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
