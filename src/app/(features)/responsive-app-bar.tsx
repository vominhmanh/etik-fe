"use client"
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import RouterLink from 'next/link';
import * as React from 'react';

const pages = ['Sự kiện mới', 'Event Studio'];

// Small down-arrow icon for language select
const LanguageSelectIcon = (props: any) => (
  <span {...props}>▾</span>
);

export function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const [lang, setLang] = React.useState<'vi' | 'en'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('lang');
      if (saved === 'vi' || saved === 'en') return saved;
    }
    return 'vi';
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', lang);
    }
  }, [lang]);

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
          {/* <Typography
            variant="h6"
            noWrap
            component={RouterLink}
            href="/"
            scroll={false}
            sx={{
              // mr: 2,
              display: { xs: 'flex', md: 'flex' },
              // fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: '16px',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            ETIK
          </Typography>
           */}
          <Box sx={{ flexGrow: 1, display: 'flex', my: 0, justifyContent: 'flex-start' }}>
            {/* <Button
              component={RouterLink}
              href='/marketplace'
              scroll={false}
              onClick={handleCloseNavMenu}
              sx={{ my: 0, color: 'white', display: 'block', py: 0 }}
            >
              Sự kiện hot
            </Button> */}
            <Button
              component={RouterLink}
              href='/event-studio/events'
              scroll={false}
              onClick={handleCloseNavMenu}
              sx={{ my: 0, color: 'white', display: 'block', py: 0, fontSize: { xs: '11px', md: '13px' }, p:0 }}
            >
              🎉 Bán vé, Quản lý sự kiện chuyên nghiệp với ETIK
            </Button>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Select
              value={lang}
              onChange={(e: SelectChangeEvent) => {
                const value = e.target.value as 'vi' | 'en';
                setLang(value);
              }}
              variant="outlined"
              size="small"
              IconComponent={LanguageSelectIcon}
              sx={{
                ml: 1,
                minWidth: 44,
                height: 24,
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.2)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.7)'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#fff'
                },
                '& .MuiSelect-select': {
                  py: 0,
                  px: 1,
                  minHeight: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                },
                '& .MuiSelect-icon': {
                  color: 'rgba(255,255,255,0.8)',
                  right: 2,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 14,
                },
              }}
              MenuProps={{
                MenuListProps: { dense: true },
                PaperProps: {
                  sx: {
                    mt: 0.5,
                    '& .MuiMenuItem-root': {
                      minHeight: 26,
                      py: 0.25,
                      px: 1,
                      fontSize: 12,
                    },
                  },
                },
              }}
              renderValue={(value) => (
                <span role="img" aria-label={(value as string) === 'vi' ? 'Vietnamese' : 'English'}>
                  {(value as string) === 'vi' ? '🇻🇳' : '🇬🇧'}
                </span>
              )}
              inputProps={{ 'aria-label': 'Select language' }}
            >
              <MenuItem value="en" sx={{ minHeight: 26, py: 0.25, px: 1 }}>
                <span role="img" aria-label="English" style={{ marginRight: 6, fontSize: 14 }}>🇬🇧</span>
                <Typography variant="caption" sx={{ fontSize: 11 }}>EN</Typography>
              </MenuItem>
              <MenuItem value="vi" sx={{ minHeight: 26, py: 0.25, px: 1 }}>
                <span role="img" aria-label="Vietnamese" style={{ marginRight: 6, fontSize: 14 }}>🇻🇳</span>
                <Typography variant="caption" sx={{ fontSize: 11 }}>VI</Typography>
              </MenuItem>
            </Select>
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
}
