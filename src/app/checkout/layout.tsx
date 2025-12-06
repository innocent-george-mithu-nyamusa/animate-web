import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Checkout - iconicme AI Image Toy Maker",
  description: "Complete your purchase and start creating custom toy designs with iconicme. Choose from flexible subscription plans and payment options.",
  openGraph: {
    title: "Checkout - iconicme",
    description: "Complete your purchase and start creating custom toys with AI",
    type: "website",
  },
  robots: {
    index: false, // Don't index checkout pages
    follow: false,
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
