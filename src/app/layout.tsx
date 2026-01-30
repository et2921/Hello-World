import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hello World',
  description: 'Simple Hello World page.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
