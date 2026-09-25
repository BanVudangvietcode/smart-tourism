import type { Metadata } from 'next';
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
        {children}
      </body>
    </html>
  );
}
