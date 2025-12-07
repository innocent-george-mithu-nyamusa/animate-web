import React from 'react';

export default function FAQSchema() {
  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is IconicMe?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'IconicMe is an AI-powered image toy maker that transforms your photos into custom toy designs. You can create plush toys, figurines, anime collectibles, Funko Pop-style figures, and more using our 10+ artistic styles.',
        },
      },
      {
        '@type': 'Question',
        name: 'How many toy styles does IconicMe offer?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'IconicMe offers 10+ unique toy styles including Classic Figure, Plush Toy, Retro Action Hero, Superhero Collectible, Pet Companion, Studio Ghibli, 16-Bit Character, Anime Figure, Funko Pop, and Pen Sketch styles.',
        },
      },
      {
        '@type': 'Question',
        name: 'What payment methods does IconicMe accept?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'IconicMe accepts Ecocash, OneMoney, and Visa/Mastercard payments. We support both USD and ZWG currencies for Zimbabwe customers, with international card payments available worldwide.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does IconicMe cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'IconicMe offers three plans: Free (3 generations/month), Standard ($9.99 USD / 297 ZWG per month for 120 generations), and Premium ($19.99 USD / 620 ZWG per month for 280 generations with commercial license).',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I order physical toys from my designs?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Once you create your custom toy design with IconicMe, you can order physical versions of your plush toys, figurines, or collectibles. You can also download the digital designs instantly.',
        },
      },
      {
        '@type': 'Question',
        name: 'What AI technology powers IconicMe?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'IconicMe uses Google Gemini 2.5 Flash Image AI technology to transform your photos into professional toy designs. Our AI models are trained on various toy styles and collectibles.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I get commercial rights to my toy designs?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Commercial rights are included with the Premium plan ($19.99/month). Free and Standard plans are for personal use only. Premium subscribers can use their designs for commercial purposes.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does it take to generate a toy design?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Design generation is instant! Simply upload your photo, choose a style, and iconicme will create your custom toy design in seconds. Premium members get priority processing for even faster results.',
        },
      },
      {
        '@type': 'Question',
        name: 'What image formats are supported?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'IconicMe supports all common image formats including JPG, JPEG, PNG, and WEBP. For best results, use clear, well-lit photos with good resolution.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is there a free trial?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! iconicme offers a free plan with 3 toy design generations per month. You get access to all 10 styles and standard resolution. No credit card required to start.',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
    />
  );
}
