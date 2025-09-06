'use client';

import { UserPopover } from '@/components/dashboard/layout/user-popover';
import { usePopover } from '@/hooks/use-popover';
import { useUser } from '@/hooks/use-user';
import { paths } from '@/paths';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import RouterLink from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { buildReturnUrl } from '@/lib/auth/urls';

export function MainNav(): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState<boolean>(false);
  const userPopover = usePopover<HTMLDivElement>();
  const { user } = useUser();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const encodedReturnUrl = React.useMemo(() => {
    const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';
    return buildReturnUrl(pathname || '/', search);
  }, [pathname, searchParams]);

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
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between', minHeight: '64px', px: 2 }}
        >
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
            <div style={{width: '45px'}}>
              <Box component="img" src='/assets/etik-logo.png' sx={{width: '100%'}}/>
            </div>
          </Stack>
          {user ? (
            <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
              <Tooltip title="Contacts">
                <IconButton>
                  <UsersIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Notifications">
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
            <Button variant="contained"  component={RouterLink} href={`${paths.auth.signIn}?returnUrl=${encodedReturnUrl}`}>
              Đăng nhập
            </Button>
          )}
        </Stack>
      </Box>
      <UserPopover anchorEl={userPopover.anchorRef.current} onClose={userPopover.handleClose} open={userPopover.open} />
    </React.Fragment>
  );
}
