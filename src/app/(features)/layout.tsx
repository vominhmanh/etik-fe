import NotificationContext from '@/contexts/notification-context';
import type { Viewport } from 'next';
import { NotificationProvider } from '@/contexts/notification-context';

import '@/styles/global.css';

import { UserProvider } from '@/contexts/user-context';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import { ResponsiveAppBar } from './responsive-app-bar';
import NotificationBar from '../notification';
import React, { Suspense } from 'react';
import { CircularProgress, Stack, Typography } from '@mui/material';

export default function Layout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <>
      <Suspense fallback={<FallbackUI />}>
        <ResponsiveAppBar />
        {children}
      </Suspense>
    </>
  );
}

// 🔹 Beautiful Fallback Component
function FallbackUI() {
  return (
    <Stack
      height="100vh"
      alignItems="center"
      justifyContent="center"
      spacing={2}
    >
      <CircularProgress size={50} />
      <Typography variant="h6" color="textSecondary">
        Loading, please wait...
      </Typography>
    </Stack>
  );
}
