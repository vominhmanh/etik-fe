import * as React from 'react';
import RouterLink from 'next/link';
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
import { BuildingOffice, Wallet } from '@phosphor-icons/react/dist/ssr';

export interface UserPopoverProps {
  anchorEl: Element | null;
  onClose: () => void;
  open: boolean;
}

export function UserPopover({ anchorEl, onClose, open }: UserPopoverProps): React.JSX.Element {
  const { checkSession, getUser } = useUser();
  const [user, setUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      const fetchedUser = getUser();
      setUser(fetchedUser);
    };

    fetchUser();
  }, [getUser]);

  const router = useRouter();

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    try {
      const { error } = await authClient.signOut();

      if (error) {
        logger.error('Sign out error', error);
        return;
      }

      // UserProvider, for this case, will not refresh the router and we need to do it manually
      router.push(paths.auth.signIn); // After refresh, AuthGuard will handle the redirect
      // After refresh, AuthGuard will handle the redirect
    } catch (err) {
      logger.error('Sign out error', err);
    }
  }, [router]);

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { width: '240px' } } }}
    >
      <Box sx={{ p: '16px 20px ' }}>
        <Typography variant="subtitle1">{user?.fullName}</Typography>
        <Typography color="text.secondary" variant="body2">
          {user?.email}
        </Typography>
      </Box>
      <Divider />
      <MenuList disablePadding sx={{ p: '8px', '& .MuiMenuItem-root': { borderRadius: 1 } }}>
        <MenuItem component={RouterLink} href={'/account/settings'} onClick={onClose}>
          <ListItemIcon>
            <GearSixIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          Quyền riêng tư
        </MenuItem>
        <MenuItem component={RouterLink} href={'/account'} onClick={onClose}>
          <ListItemIcon>
            <UserIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          Cài đặt tài khoản
        </MenuItem>
        <MenuItem component={RouterLink} href={'/account'} onClick={onClose}>
          <ListItemIcon>
            <Wallet fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          <span>Ví trả trước: </span><b style={{marginLeft: '8px'}}>0</b><span style={{marginLeft: '8px'}}>VNĐ</span>
        </MenuItem>
        
        <MenuItem component={RouterLink} href={'/account/my-tickets'} onClick={onClose}>
          <ListItemIcon>
            <TicketIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          Vé của tôi
        </MenuItem>
        <MenuItem component={RouterLink} href={'/account-event-agency'} onClick={onClose}>
          <ListItemIcon>
            <BuildingOffice fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          Tài khoản Event Agency
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <SignOutIcon fontSize="var(--icon-fontSize-md)" />
          </ListItemIcon>
          Đăng xuất
        </MenuItem>
      </MenuList>
    </Popover>
  );
}
