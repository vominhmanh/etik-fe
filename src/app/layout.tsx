import * as React from 'react';
import NotificationContext from '@/contexts/notification-context';
import type { Viewport } from 'next';
import { NotificationProvider } from '@/contexts/notification-context';

import '@/styles/global.css';

import { UserProvider } from '@/contexts/user-context';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import NotificationBar from './notification';
import Script from 'next/script';

export const viewport = { width: 'device-width', initialScale: 1 } satisfies Viewport;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <html lang="vi">
      <head>
        {/* Google Tag Manager Script */}
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
              gtag('config', 'AW-16949452196', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body>
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
      </body>
    </html>
  );
}
