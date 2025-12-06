import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "iconicme - AI Image Toy Maker | Turn Photos into Custom Toys & Figurines",
    template: "%s | iconicme"
  },
  description: "Transform your photos into custom toy designs with iconicme's AI technology. Create plush toys, figurines, anime collectibles, action figures & more. Order physical toys or download designs. Try 3 free generations!",
  keywords: [
    "AI toy maker",
    "custom plush toys",
    "photo to figurine",
    "3D image model toys",
    "custom teddy bears",
    "personalized action figures",
    "AI figurine creator",
    "anime figure maker",
    "custom collectibles",
    "photo to toy",
    "plush toy design",
    "Funko Pop creator",
    "Studio Ghibli style",
    "retro action figure",
    "pet companion figurine",
    "classic figure toys",
    "16-bit character toys",
    "pen sketch toys",
    "superhero collectible",
    "AI-powered toy design",
    "iconicme",
    "Gemini AI",
    "Zimbabwe payments",
    "Ecocash",
    "OneMoney",
    "custom toy subscription"
  ],
  authors: [{ name: "Pixelspulse Private Limited" }],
  creator: "Pixelspulse Private Limited",
  publisher: "Pixelspulse Private Limited",
  applicationName: "iconicme",
  category: "Arts & Crafts",

  // Open Graph metadata for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://iconicme.shop",
    siteName: "iconicme",
    title: "iconicme - AI Image Toy Maker | Custom Plush Toys & Figurines",
    description: "Turn your photos into custom toy designs with AI. Create plush toys, figurines, anime collectibles & more. Order physical toys or download designs instantly.",
    images: [
      {
        url: "/prod-logo.png",
        width: 1200,
        height: 630,
        alt: "iconicme - AI Image Toy Maker & Custom Figurine Creator",
      },
    ],
  },

  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "iconicme - AI Image Toy Maker",
    description: "Turn your photos into custom plush toys, figurines & collectibles with AI. Create personalized toys in 10+ styles!",
    images: ["/prod-logo.png"],
    creator: "@iconicme",
  },

  // Mobile app metadata
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "iconicme",
  },

  // Verification and alternate languages
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || "https://iconicme.shop",
  },

  // Robots and indexing
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Additional metadata
  icons: {
    icon: "/favicon.png",
    apple: "/prod-logo.png",
  },

  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <title>iconicme</title>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
