import type { Metadata } from 'next';
import { Inter, Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  variable: '--font-noto-sans-kr',
  weight: ['400', '500', '700', '900'],
});

export const metadata: Metadata = {
  title: 'Game Admin Panel',
  description: '통합 게임 관리자 패널',
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';
const wsUrl = apiUrl.replace(/^http/, 'ws');
const isDev = process.env.NODE_ENV === 'development';
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline'";
// Added fonts.googleapis.com and fonts.gstatic.com for Google Fonts support
const cspContent = `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' ${apiUrl} ${wsUrl};`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content={cspContent}
        />
      </head>
      {/* TODO: Migrate sensitive tokens from localStorage to httpOnly cookies for production */}
      <body className={`${inter.variable} ${notoSansKr.variable} font-sans antialiased text-slate-800 bg-[#f4f7fa] selection:bg-blue-200 selection:text-blue-900`}>
        {children}
      </body>
    </html>
  );
}
