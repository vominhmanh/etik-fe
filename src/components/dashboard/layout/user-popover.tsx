import * as React from 'react';
import { LocalizedLink } from '@/components/localized-link';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import { GearSix as GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { SignOut as SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';

import { User } from '@/types/auth';
import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';
import { BuildingOffice, CodesandboxLogo, Invoice, SealCheck, Wallet, House } from '@phosphor-icons/react/dist/ssr';
import { useTranslation } from '@/contexts/locale-context';

export interface UserPopoverProps {
  anchorEl: Element | null;
  onClose: () => void;
  open: boolean;
}

export function UserPopover({ anchorEl, onClose, open }: UserPopoverProps): React.JSX.Element {
  const { tt, locale } = useTranslation();
  const { checkSession, user, setUser } = useUser();
  const [authUser, setAuthUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      const fetchedUser = user;
      setAuthUser(fetchedUser);
    };

    fetchUser();
  }, [user]);

  const router = useRouter();

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

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    try {
      const { error } = await authClient.signOut();

      if (error) {
        logger.error('Sign out error', error);
        return;
      }

      // Clear user from context immediately to avoid guard loops, then navigate
      setUser(null);
      const localizedSignInPath = getLocalizedPath(paths.auth.signIn);
      router.push(localizedSignInPath);
      // After refresh, AuthGuard will handle the redirect
    } catch (err) {
      logger.error('Sign out error', err);
    }
  }, [router, locale, getLocalizedPath, setUser]);

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { width: '240px' } } }}
    >
      <Box sx={{ p: '16px 20px ' }}>
        <Typography variant="subtitle1">{authUser?.fullName}</Typography>
        <Typography color="text.secondary" variant="body2">
          {authUser?.email}
        </Typography>
      </Box>
      <Divider />
      <MenuList disablePadding sx={{ p: '8px', '& .MuiMenuItem-root': { borderRadius: 1 } }}>
        <MenuItem component={LocalizedLink} href={'/dashboard'} onClick={onClose}>
          <ListItemIcon>
            <House fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          {tt('Trang tổng quan', 'Dashboard')}
        </MenuItem>
        
        <MenuItem component={LocalizedLink} href={'/account'} onClick={onClose}>
          <ListItemIcon>
            <UserIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          {tt('Cài đặt tài khoản', 'Account Settings')}
        </MenuItem>
        <MenuItem component={LocalizedLink} href={'/account'} onClick={onClose}>
          <ListItemIcon>
            <Wallet fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          <span>{tt('Ví trả trước: ', 'Prepaid Wallet: ')}</span><b style={{marginLeft: '8px'}}>0</b><span style={{marginLeft: '8px'}}>{tt('VNĐ', 'VND')}</span>
        </MenuItem>
        
        <MenuItem component={LocalizedLink} href={'/account/my-tickets'} onClick={onClose}>
          <ListItemIcon>
            <TicketIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          {tt('Vé của tôi', 'My Tickets')}
        </MenuItem>
        <MenuItem component={LocalizedLink} href={'/account/my-tickets'} onClick={onClose}>
          <ListItemIcon>
            <Invoice fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          {tt('Đơn hàng của tôi', 'My Orders')}
        </MenuItem>
        <MenuItem component={LocalizedLink} href={'/account-event-agency'} onClick={onClose}>
          <ListItemIcon>
            <SealCheck fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          {tt('Tài khoản Event Agency', 'Event Agency Account')}
        </MenuItem>
        <MenuItem component={LocalizedLink} href={'/event-studio/events'} onClick={onClose}>
          <ListItemIcon>
            <CodesandboxLogo fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          {tt('Trang quản trị sự kiện', 'Event Management')}
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <SignOutIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          {tt('Đăng xuất', 'Sign Out')}
        </MenuItem>
      </MenuList>
    </Popover>
  );
}
