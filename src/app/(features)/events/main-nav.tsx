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
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { buildReturnUrl } from '@/lib/auth/urls';
import { Container, ButtonGroup } from '@mui/material';
import { useLocale } from '@/contexts/locale-context';
import { LocalizedLink } from '@/components/localized-link';

export function MainNav(): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState<boolean>(false);
  const userPopover = usePopover<HTMLDivElement>();
  const { user } = useUser();
  const { locale } = useLocale();
  const router = useRouter();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const encodedReturnUrl = React.useMemo(() => {
    const search = searchParams?.toString() ? `?${searchParams.toString()}` : '';
    return buildReturnUrl(pathname || '/', search);
  }, [pathname, searchParams]);

  const switchLocale = (newLocale: 'vi' | 'en') => {
    if (newLocale === locale) return;

    let newPath = pathname;
    
    if (newLocale === 'en') {
      // Switch to English: add /en prefix
      if (!pathname.startsWith('/en')) {
        newPath = `/en${pathname}`;
      }
    } else {
      // Switch to Vietnamese: remove /en prefix
      if (pathname.startsWith('/en')) {
        newPath = pathname.substring(3) || '/';
      }
    }

    router.push(newPath);
  };

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
            <div style={{width: '45px'}}>
              <Box component="img" src='/assets/etik-logo.png' sx={{width: '100%'}}/>
            </div>
          </Stack>
          {user ? (
            <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
              <ButtonGroup size="small" variant="outlined">
                <Button 
                  variant={locale === 'vi' ? 'contained' : 'outlined'}
                  onClick={() => switchLocale('vi')}
                  sx={{ minWidth: '50px' }}
                >
                  VI
                </Button>
                <Button 
                  variant={locale === 'en' ? 'contained' : 'outlined'}
                  onClick={() => switchLocale('en')}
                  sx={{ minWidth: '50px' }}
                >
                  EN
                </Button>
              </ButtonGroup>
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
            <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
              <ButtonGroup size="small" variant="outlined">
                <Button 
                  variant={locale === 'vi' ? 'contained' : 'outlined'}
                  onClick={() => switchLocale('vi')}
                  sx={{ minWidth: '50px' }}
                >
                  VI
                </Button>
                <Button 
                  variant={locale === 'en' ? 'contained' : 'outlined'}
                  onClick={() => switchLocale('en')}
                  sx={{ minWidth: '50px' }}
                >
                  EN
                </Button>
              </ButtonGroup>
              <Button variant="contained"  component={LocalizedLink} href={`${paths.auth.signIn}?returnUrl=${encodedReturnUrl}`}>
                Đăng nhập
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
