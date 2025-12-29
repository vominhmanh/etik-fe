'use client';

import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { LocalizedLink } from '@/components/homepage/localized-link';

import { usePathname, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { UserPopover } from '@/components/dashboard/layout/user-popover';
import { usePopover } from '@/hooks/use-popover';
import { useUser } from '@/hooks/use-user';
import { paths } from '@/paths';
import { buildReturnUrl } from '@/lib/auth/urls';
import { Container } from '@mui/material';
import { useTranslation } from '@/contexts/locale-context';

export function MainNav(): React.JSX.Element {
  const { tt, locale } = useTranslation();
  const userPopover = usePopover<HTMLDivElement>();

  const { user } = useUser();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Helper to make path locale-aware
  const getLocalizedPath = React.useCallback((path: string): string => {
    if (locale === 'en' && !path.startsWith('/en')) {
      return `/en${path}`;
    }
    if (locale === 'vi' && path.startsWith('/en')) {
      return path.substring(3) || '/';
    }
    return path;
  }, [locale]);
  
  const encodedReturnUrl = React.useMemo(() => {
    // Ensure pathname includes locale if needed for returnUrl
    const pathForReturnUrl = locale === 'en' && !pathname?.startsWith('/en') 
      ? `/en${pathname || '/'}` 
      : (pathname || '/');
    const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';
    return buildReturnUrl(pathForReturnUrl, search);
  }, [pathname, searchParams, locale]);


  return (
    <React.Fragment>
      <Box
        component="header"
        sx={{
          borderBottom: '1px solid var(--mui-palette-divider)',
          backgroundColor: 'var(--mui-palette-background-paper)',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--mui-zIndex-appBar)',
        }}
      >
        <Container maxWidth="xl">
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: '64px' }}
          >
            <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
              <Button
                component={LocalizedLink}
                href="/"
                sx={{
                  width: '45px',
                  minWidth: '45px',
                  padding: 0,
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                }}
              >
                <Box component="img" src='/assets/etik-logo.png' sx={{ width: '100%' }} />
              </Button>
            </Stack>
            {user ? (
              <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                <Tooltip title={tt('Liên hệ', 'Contacts')}>
                  <IconButton>
                    <UsersIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={tt('Thông báo', 'Notifications')}>
                  <Badge badgeContent={4} color="success" variant="dot">
                    <IconButton>
                      <BellIcon />
                    </IconButton>
                  </Badge>
                </Tooltip>
                <Avatar onClick={userPopover.handleOpen} ref={userPopover.anchorRef} sx={{ cursor: 'pointer' }}>
                  {(user?.email[0] || "").toUpperCase()}
                </Avatar>
              </Stack>
            ) : (
              <Button component={LocalizedLink} variant="contained" href={`${paths.auth.signIn}?returnUrl=${encodedReturnUrl}`}>
                {tt('Đăng nhập', 'Sign In')}
              </Button>
            )}
          </Stack>
        </Container>
      </Box>
      <UserPopover anchorEl={userPopover.anchorRef.current} onClose={userPopover.handleClose} open={userPopover.open} />
    </React.Fragment>
  );
}
