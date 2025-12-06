import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Data Deletion Policy - iconicme AI Image Toy Maker",
  description: "Request deletion of your personal data from iconicme. Learn about our data retention periods and what information we delete or retain for custom toy creation services.",
  openGraph: {
    title: "Data Deletion Policy - iconicme",
    description: "Request deletion of your personal data from iconicme",
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
