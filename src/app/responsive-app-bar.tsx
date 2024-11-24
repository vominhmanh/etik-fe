"use client"
import * as React from 'react';
import NotificationContext from '@/contexts/notification-context';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import {List as MenuIcon} from '@phosphor-icons/react/dist/ssr/List';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import {Acorn as AdbIcon} from '@phosphor-icons/react/dist/ssr/Acorn';
import { Link } from '@mui/material';

const pages = ['Sự kiện mới', 'Event Studio', 'Blog'];

export function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar disableGutters variant="dense"  sx={{ minHeight: 30, height: 30 }}>
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            ETIK
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
                <MenuItem component={'a'} href='/marketplace' >
                  <Typography sx={{ textAlign: 'center' }}>Sự kiện mới</Typography>
                </MenuItem>
                <MenuItem component={'a'} href='/event-studio'>
                  <Typography sx={{ textAlign: 'center' }}>Event Studio</Typography>
                </MenuItem>
            </Menu>
          </Box>
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            ETIK
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'flex', my: 0 } }}>
              <Button
                href='/marketplace'
                onClick={handleCloseNavMenu}
                sx={{ my: 0, color: 'white', display: 'block', py: 0 }}
              >
                Sự kiện hot
              </Button>
              <Button
                href='/event-studio/events'
                onClick={handleCloseNavMenu}
                sx={{ my: 0, color: 'white', display: 'block', py: 0 }}
              >
                Tạo sự kiện của tôi
              </Button>
              <Button
                sx={{ display: { xs: 'none', md: 'block'}, my: 0, color: 'white', py: 0 }}
                href='/blogs'
                onClick={handleCloseNavMenu}
              >
                Blogs
              </Button>
          </Box>
          
        </Toolbar>
      </Container>
    </AppBar>
  );
}
