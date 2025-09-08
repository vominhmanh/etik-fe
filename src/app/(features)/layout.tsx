
import '@/styles/global.css';

import { CircularProgress, Stack, Typography } from '@mui/material';
import React, { Suspense } from 'react';
import { ResponsiveAppBar } from './responsive-app-bar';

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
