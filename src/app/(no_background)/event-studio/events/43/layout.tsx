'use client';

import * as React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import GlobalStyles from '@mui/material/GlobalStyles';

import NotificationContext from '@/contexts/notification-context';
import { AuthGuard } from '@/components/auth/auth-guard';
import { MainNav } from '@/components/dashboard/layout/main-nav';
import { SideNav } from '@/components/dashboard/layout/side-nav';

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
            {children}
        </Box>
    </AuthGuard>
  );
}
