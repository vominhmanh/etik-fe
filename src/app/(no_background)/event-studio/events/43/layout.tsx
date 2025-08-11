'use client';

import Box from '@mui/material/Box';
import { useParams } from 'next/navigation';
import * as React from 'react';

import { AuthGuard } from '@/components/auth/auth-guard';
import { CircularProgress, Typography } from '@mui/material';
import { Stack } from '@mui/system';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  const params = useParams();
  const eventId = params.event_id as string;

  React.useEffect(() => {
    if (eventId) {
      localStorage.setItem('event_id', eventId);
    }
  }, [eventId]);

  return (
    <AuthGuard>
      <Box sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column', pl: { lg: 'var(--SideNav-width)' } }}>
        <React.Suspense fallback={<FallbackUI />}>
          {children}
        </React.Suspense>
      </Box>
    </AuthGuard>
  );

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
}
