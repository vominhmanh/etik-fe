import * as React from 'react';
import NotificationContext from '@/contexts/notification-context';
import type { Viewport } from 'next';
import { NotificationProvider } from '@/contexts/notification-context';

import '@/styles/global.css';

import { UserProvider } from '@/contexts/user-context';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import { ResponsiveAppBar } from './responsive-app-bar';
import NotificationBar from './notification';

export const viewport = { width: 'device-width', initialScale: 1 } satisfies Viewport;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <LocalizationProvider>
          <UserProvider>
            <NotificationProvider>
              <ThemeProvider>
                <NotificationBar />
                <ResponsiveAppBar />
                {children}
              </ThemeProvider>
            </NotificationProvider>
          </UserProvider>
        </LocalizationProvider>
      </body>
    </html>
  );
}
