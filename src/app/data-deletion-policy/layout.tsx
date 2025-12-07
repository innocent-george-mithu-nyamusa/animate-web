import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Data Deletion Policy - IconicMe AI Image Toy Maker",
  description: "Request deletion of your personal data from IconicMe. Learn about our data retention periods and what information we delete or retain for custom toy creation services.",
  openGraph: {
    title: "Data Deletion Policy - IconicMe",
    description: "Request deletion of your personal data from IconicMe",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DataDeletionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
