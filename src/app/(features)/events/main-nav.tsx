'use client';

import * as React from 'react';
import { Container } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';

import { paths } from '@/paths';
import { useTranslation } from '@/contexts/locale-context';
import { usePopover } from '@/hooks/use-popover';
import { useUser } from '@/hooks/use-user';
import { UserPopover } from '@/components/dashboard/layout/user-popover';
import { LocalizedLink } from '@/components/localized-link';

export function MainNav(): React.JSX.Element {
  const { tt } = useTranslation();
  const userPopover = usePopover<HTMLDivElement>();
  const { user } = useUser();

  React.useEffect(() => {
    const fetchUser = async () => {
      const fetchedUser = user;
    };

    fetchUser();
  }, [user]);

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
                <Button variant="contained" component={LocalizedLink} href={`${paths.auth.signIn}`}>
                  {tt('Đăng nhập', 'Sign In')}
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
