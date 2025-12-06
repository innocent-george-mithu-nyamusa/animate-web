import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Track Order - iconicme AI Image Toy Maker",
  description: "Track your custom toy order from iconicme. Check the status of your plush toys, figurines, and collectibles.",
  openGraph: {
    title: "Track Order - iconicme",
    description: "Track your custom toy order status",
    type: "website",
  },
  robots: {
    index: false, // Don't index order tracking pages
    follow: false,
  },
};

export default function TrackOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
