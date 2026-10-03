import type { Metadata } from 'next';
import Script from 'next/script';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Saigon Whispers | Thì Thầm Sài Gòn',
  description: 'Trải nghiệm du lịch và khám phá những âm thanh, hương vị bí ẩn của Sài Gòn.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-gray-50 min-h-screen">
        {/* Google Identity Services SDK */}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
