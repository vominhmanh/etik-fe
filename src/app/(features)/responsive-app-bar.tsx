"use client"
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import RouterLink from 'next/link';
import * as React from 'react';

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
        <Toolbar disableGutters variant="dense" sx={{ minHeight: 30, height: 30 }}>
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
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
              <MenuItem component={RouterLink} href='/marketplace' >
                <Typography sx={{ textAlign: 'center' }}>Sự kiện mới</Typography>
              </MenuItem>
              <MenuItem component={RouterLink} href='/event-studio'>
                <Typography sx={{ textAlign: 'center' }}>Event Studio</Typography>
              </MenuItem>
            </Menu>
          </Box>
          <Typography
            variant="h5"
            noWrap
            component={RouterLink}
            href="/"
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
              component={RouterLink}
              href='/marketplace'
              onClick={handleCloseNavMenu}
              sx={{ my: 0, color: 'white', display: 'block', py: 0 }}
            >
              Sự kiện hot
            </Button>
            <Button
              component={RouterLink}
              href='/event-studio/events'
              onClick={handleCloseNavMenu}
              sx={{ my: 0, color: 'white', display: 'block', py: 0 }}
            >
              Tạo sự kiện của tôi
            </Button>
            <Button
              component={RouterLink}
              sx={{ display: { xs: 'none', md: 'block' }, my: 0, color: 'white', py: 0 }}
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
