import * as React from 'react';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

import { NotificationProvider } from '@/contexts/notification-context';
import { UserProvider } from '@/contexts/user-context';
import { LocaleProvider } from '@/contexts/locale-context';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import NotificationBar from './notification';

import '@/styles/global.css';
import "seat-picker/dist/index.css";

export const viewport = { width: 'device-width', initialScale: 1 } satisfies Viewport;

export const metadata: Metadata = {
  metadataBase: new URL('https://etik.vn'),
  title: {
    default: 'ETIK - Vé điện tử & Quản lý sự kiện',
    template: '%s | ETIK',
  },
  description:
    'Phần mềm vé điện tử và quản lý sự kiện chuyên nghiệp, hiện đại: tạo vé QR, bán vé online, check-in nhanh, chống gian lận.',
  openGraph: {
    type: 'website',
    url: 'https://etik.vn',
    siteName: 'ETIK',
    title: 'ETIK - Vé điện tử & Quản lý sự kiện',
    description: 'Phần mềm vé điện tử và quản lý sự kiện chuyên nghiệp, hiện đại: tạo vé QR, bán vé online, check-in nhanh, chống gian lận.',
    images: [{ url: '/assets/etik-logo1.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ETIK - Vé điện tử & Quản lý sự kiện',
    description: 'Phần mềm vé điện tử và quản lý sự kiện chuyên nghiệp, hiện đại.',
    images: ['/assets/etik-logo1.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/assets/etik-logo1.png',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=AW-16949452196`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-16949452196');
            `,
          }}
        />
      </head>

      <body>
        <LocaleProvider>
          <LocalizationProvider>
            <UserProvider>
              <NotificationProvider>
                <ThemeProvider>
                  <NotificationBar />
                  {children}
                </ThemeProvider>
              </NotificationProvider>
            </UserProvider>
          </LocalizationProvider>
        </LocaleProvider>

        {/* ✅ SCHEMA */}
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "ETIK",
                url: "https://etik.vn",
                logo: "https://etik.vn/assets/etik-logo1.png",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "ETIK - Vé điện tử & Quản lý sự kiện",
                url: "https://etik.vn",
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "ETIK",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Web",
              },
            ]),
          }}
        />
      </body>
    </html>
  );
}