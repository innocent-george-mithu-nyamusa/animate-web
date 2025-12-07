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
          width: 512,
          height: 512,
        },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Service',
          email: 'consult@pixels.co.zw',
        },
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
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '127',
          bestRating: '5',
          worstRating: '1',
        },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: '0',
          highPrice: '19.99',
          offerCount: 3,
          url: 'https://iconicme.shop',
          availability: 'https://schema.org/InStock',
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
          name: 'IconicMe Subscription Plans',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: 'IconicMe Free Plan',
                description: '3 AI toy generations per month with all 10 styles',
                brand: {
                  '@type': 'Brand',
                  name: 'IconicMe',
                },
                image: 'https://iconicme.shop/prod-logo.png',
              },
              price: '0',
              priceCurrency: 'USD',
              url: 'https://iconicme.shop',
              availability: 'https://schema.org/InStock',
              validFrom: new Date().toISOString().split('T')[0],
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: 'IconicMe Standard Plan',
                description:
                  '120 AI toy generations per month with high resolution and priority processing',
                brand: {
                  '@type': 'Brand',
                  name: 'IconicMe',
                },
                image: 'https://iconicme.shop/prod-logo.png',
              },
              price: '9.99',
              priceCurrency: 'USD',
              url: 'https://iconicme.shop',
              availability: 'https://schema.org/InStock',
              validFrom: new Date().toISOString().split('T')[0],
              priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Product',
                name: 'IconicMe Premium Plan',
                description:
                  '280 AI toy generations per month with ultra-high resolution, lightning-fast processing, and commercial license',
                brand: {
                  '@type': 'Brand',
                  name: 'IconicMe',
                },
                image: 'https://iconicme.shop/prod-logo.png',
              },
              price: '19.99',
              priceCurrency: 'USD',
              url: 'https://iconicme.shop',
              availability: 'https://schema.org/InStock',
              validFrom: new Date().toISOString().split('T')[0],
              priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
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
