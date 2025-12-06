import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Payment Success - iconicme AI Image Toy Maker",
  description: "Your iconicme subscription payment was successful! Start creating custom plush toys, figurines, and collectibles with AI.",
  openGraph: {
    title: "Payment Success - iconicme",
    description: "Your subscription is now active!",
    type: "website",
  },
  robots: {
    index: false, // Don't index success pages
    follow: false,
  },
};

export default function SuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
