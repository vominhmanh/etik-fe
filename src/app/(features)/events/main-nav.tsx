'use client';

import * as React from 'react';
import { Avatar, Badge, Box, Button, CircularProgress, Container, IconButton, Stack, Tooltip } from '@mui/material';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { useRouter } from 'next/navigation';

import { paths } from '@/paths';
import { useTranslation } from '@/contexts/locale-context';
import { usePopover } from '@/hooks/use-popover';
import { useUser } from '@/hooks/use-user';
import { UserPopover } from '@/components/dashboard/layout/user-popover';
import { LocalizedLink } from '@/components/homepage/localized-link';

export function MainNav(): React.JSX.Element {
  const { tt, locale } = useTranslation();
  const router = useRouter();
  const userPopover = usePopover<HTMLDivElement>();
  const { user, checkSession } = useUser();
  const [isChecking, setIsChecking] = React.useState(false);

  const handleSignIn = async () => {
    setIsChecking(true);
    try {
      const loggedUser = await checkSession();
      if (!loggedUser?.email) {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        const loginPath = locale === 'en' ? `/en${paths.auth.signIn}` : paths.auth.signIn;
        router.push(`${loginPath}?returnUrl=${returnUrl}`);
      }
    } catch {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      const loginPath = locale === 'en' ? `/en${paths.auth.signIn}` : paths.auth.signIn;
      router.push(`${loginPath}?returnUrl=${returnUrl}`);
    } finally {
      setIsChecking(false);
    }
  };

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
                prefetch={false}
                sx={{
                  width: '45px',
                  minWidth: '45px',
                  padding: 0,
                  '&:hover': {
                    backgroundColor: 'transparent',
                  },
                }}
              >
                <Box component="img" src="/assets/etik-logo.png" sx={{ width: '100%' }} />
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
                  {(user?.email[0] || '').toUpperCase()}
                </Avatar>
              </Stack>
            ) : (
              <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                <Button
                  variant="contained"
                  onClick={handleSignIn}
                  disabled={isChecking}
                  startIcon={isChecking ? <CircularProgress size={16} color="inherit" /> : null}
                >
                  {isChecking ? tt('Đang kiểm tra...', 'Checking...') : tt('Đăng nhập', 'Sign In')}
                </Button>
              </Stack>
            )}
          </Stack>
        </Container>
      </Box>
      <UserPopover anchorEl={userPopover.anchorRef.current} onClose={userPopover.handleClose} open={userPopover.open} />
    </React.Fragment>
  );
}
