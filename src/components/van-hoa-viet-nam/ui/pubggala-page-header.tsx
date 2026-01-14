'use client';

// If using Next.js App Router
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import logo from '@/images/pubg/logo.png';
import headerBackground from '@/images/pubg/header-background.png';
import userLoginIcon from '@/images/user-login.svg';
import { Avatar, Button, IconButton, MenuItem, Select, SelectChangeEvent, Typography, Menu } from '@mui/material';
import { SignOut as SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { List as MenuIcon } from '@phosphor-icons/react/dist/ssr/List';

import { useLocale, useTranslation } from '@/contexts/locale-context';
import { LocalizedLink } from '@/components/pubggala/localized-link';
import { useSSO } from '@/hooks/use-sso';
import { useSSOContext } from '@/contexts/sso-context';
import { Stack } from '@mui/material';
// SSO User Response Interface
interface SSOUserResponse {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  authCode: string;
  expiresIn: number;
}

// User Info Interface for component state
interface UserInfo {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string;
}

// Small down-arrow icon for language select
const LanguageSelectIcon = (props: any) => <span {...props}>▾</span>;

export default function PubgGalaPageHeader() {
  const { tt } = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Get SSO config from context (set in layout)
  const ssoConfig = useSSOContext();
  const { handleSSOLogin, isSSOEnabled } = useSSO(ssoConfig);

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

    router.push(newPath, { scroll: false });
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setMobileMenuOpen(true);
  };

  const handleMobileMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuOpen(false);
  };

  // Handle SSO logout
  const handleLogout = () => {
    // Clear tokens and user info from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // Clear user state
    setUser(null);

    // Reload page to reset state
    window.location.href = pathname || '/';
  };

  // Fetch user info from SSO API
  const fetchUserFromSSO = async (accessToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.etik.vn';
      const response = await fetch(`${apiUrl}/sso/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData: SSOUserResponse = await response.json();
        // Map SSO user data to UserInfo format
        const userInfo: UserInfo = {
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName,
          phoneNumber: userData.phoneNumber,
        };
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(userInfo));
        setUser(userInfo);
        return userInfo;
      }
    } catch (error) {
      console.error('Failed to fetch user from SSO:', error);
    }
    return null;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadUser = async () => {
        // Check if we have accessToken from SSO login
        const accessToken = localStorage.getItem('accessToken');

        if (accessToken) {
          // Try to get user from localStorage first
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser: UserInfo = JSON.parse(storedUser);
              setUser(parsedUser);
              setIsLoading(false);
              return;
            } catch (e) {
              // If parsing fails, fetch from API
            }
          }

          // If no user in localStorage, fetch from SSO API
          await fetchUserFromSSO(accessToken);
        }

        setIsLoading(false);
      };

      loadUser();
    }
  }, []);

  return (
    <header
      className="absolute left-2 right-2 md:left-4 md:right-4 top-4 md:top-[30px] h-12 md:h-14 w-[calc(100%-16px)] md:w-[calc(100%-32px)] px-3 md:px-6 lg:px-12"
      style={{
        backgroundImage: `url(${headerBackground.src})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backdropFilter: 'blur(2.5px)',
        zIndex: 30,
        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
      }}
    >
      <div className="mx-auto relative h-full">
        <div className="relative flex h-full items-center justify-between gap-2 md:gap-3 px-1 md:px-3">
          {/* Site branding and Navigation */}
          <div className="flex flex-1 items-center min-w-0">
            <LocalizedLink
              href="/events/pubggala"
              style={{ textDecoration: 'none', width: '100%' }}
            >
              <Stack direction="row" spacing={4} style={{ width: '100%' }}>
                <Stack direction="row" spacing={2}>
                  <Image
                    src={logo}
                    alt="PUBG GALA 2025"
                    width={40}
                    height={40}
                    className="object-contain w-10 h-auto md:w-[40px] md:h-[40px]"
                  />
                  <div style={{ width: '200px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '1rem',
                        lineHeight: '1.2rem',
                        color: 'rgb(255 255 255 / var(--tw-text-opacity, 1))',
                      }}
                    >
                      VĂN HÓA
                    </span>
                    <br />
                    <span
                      style={{
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontWeight: 700,
                        fontSize: '1rem',
                        lineHeight: '1.2rem',
                        background: 'linear-gradient(90deg, #E1C693 0%, #FFFFFF 100%)',
                      }}
                    >
                      VIỆT NAM
                    </span>
                  </div>
                </Stack>


              </Stack>
            </LocalizedLink>

          </div>

          {/* Mobile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={mobileMenuOpen}
            onClose={handleMobileMenuClose}
            PaperProps={{
              sx: {
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(225, 198, 147, 0.3)',
                minWidth: '200px',
                mt: 1,
              },
            }}
            transformOrigin={{ horizontal: 'left', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          >
            <MenuItem
              onClick={handleMobileMenuClose}
              sx={{
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: 'rgba(225, 198, 147, 0.1)',
                  color: '#E1C693',
                },
              }}
            >
              <LocalizedLink
                href="/events/pubggala/hall-of-fame"
                className="w-full text-white hover:text-[#E1C693] transition-colors text-sm font-medium"
                style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', textDecoration: 'none' }}
              >
                {tt('Lịch chiếu', 'Schedule')}
              </LocalizedLink>
            </MenuItem>
            {/* <MenuItem
              onClick={handleMobileMenuClose}
              sx={{
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: 'rgba(225, 198, 147, 0.1)',
                  color: '#E1C693',
                },
              }}
            >
              <LocalizedLink
                href="/events/pubggala/judging-panel"
                className="w-full text-white hover:text-[#E1C693] transition-colors text-sm font-medium"
                style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', textDecoration: 'none' }}
              >
                {tt('Hội đồng thẩm định', 'Judging Panel')}
              </LocalizedLink>
            </MenuItem> */}
            {/* <MenuItem
              onClick={handleMobileMenuClose}
              sx={{
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: 'rgba(225, 198, 147, 0.1)',
                  color: '#E1C693',
                },
              }}
            >
              <LocalizedLink
                href="/events/pubggala/news"
                className="w-full text-white hover:text-[#E1C693] transition-colors text-sm font-medium"
                style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', textDecoration: 'none' }}
              >
                {tt('Tin tức', 'News')}
              </LocalizedLink>
            </MenuItem> */}
            <MenuItem
              onClick={handleMobileMenuClose}
              sx={{
                fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: 'rgba(225, 198, 147, 0.1)',
                  color: '#E1C693',
                },
              }}
            >
              <LocalizedLink
                href="/events/pubggala/terms-and-conditions#terms-and-conditions"
                className="w-full text-white hover:text-[#E1C693] transition-colors text-sm font-medium"
                style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', textDecoration: 'none' }}
              >
                {tt('Thể lệ', 'Terms and Conditions')}
              </LocalizedLink>
            </MenuItem>
          </Menu>

          {/* Desktop sign in links */}
          <ul className="flex flex-1 items-center justify-end gap-1 md:gap-3 min-w-0">
            {/* Mobile Menu Button - Only visible on mobile */}
            <IconButton
              onClick={handleMobileMenuOpen}
              className="flex md:hidden"
              sx={{
                color: '#E1C693',
                padding: '4px',
                display: { xs: 'flex', md: 'none' },
                '&:hover': {
                  backgroundColor: 'rgba(225, 198, 147, 0.1)',
                },
              }}
              aria-label="menu"
            >
              <MenuIcon size={24} />
            </IconButton>
            {/* Desktop Navigation Tabs */}
            <nav
              className="hidden md:flex items-center gap-5"
              style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
            >
              <LocalizedLink
                href="/events/pubggala/hall-of-fame"
                className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
                style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
              >
                {tt('Bảng vinh danh', 'Hall of Fame')}
              </LocalizedLink>
              {/* <LocalizedLink
                href="/events/pubggala/judging-panel"
                className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
                style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
              >
                {tt('Hội đồng thẩm định', 'Judging Panel')}
              </LocalizedLink> */}
              {/* <LocalizedLink
                href="/events/pubggala/news"
                className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
                style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
              >
                {tt('Tin tức', 'News')}
              </LocalizedLink> */}
              <LocalizedLink
                href="/events/pubggala/terms-and-conditions#terms-and-conditions"
                className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
                style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
              >
                {tt('Thể lệ', 'Terms and Conditions')}
              </LocalizedLink>
            </nav>
            {/* {isLoading ? (
              <li>
                <LocalizedLink
                  href="/auth/login"
                  className="btn-sm bg-white text-gray-800 shadow hover:bg-gray-50"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Typography variant="body2" sx={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
                    {tt('Đang tải...', 'Loading...')}
                  </Typography>
                </LocalizedLink>
              </li>
            ) : user ? (
              <>
                <li className="hidden sm:block">
                  <LocalizedLink
                    href="/dashboard"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      textDecoration: 'none',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontStyle: 'normal',
                      fontWeight: 600,
                      fontSize: '12px',
                      lineHeight: '14px',
                      textTransform: 'uppercase',
                      color: '#E1C693',
                      gap: '4px',
                    }}
                    className="md:text-sm md:gap-1.5"
                  >
                    <Typography
                      variant="body2"
                      sx={{ 
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '12px',
                        '@media (min-width: 640px)': { fontSize: '14px' },
                      }}
                    >
                      {tt('Xin chào,', 'Hi,')}
                    </Typography>
                    <Avatar sx={{ width: '20px', height: '20px', '@media (min-width: 640px)': { width: '25px', height: '25px' } }}>
                      {user.fullName?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        maxWidth: { xs: '100px', sm: '120px', md: '170px' },
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        display: 'block',
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                        fontSize: '12px',
                        '@media (min-width: 640px)': { fontSize: '14px' },
                      }}
                    >
                      {user.fullName || tt('Người dùng', 'User')}
                    </Typography>
                  </LocalizedLink>
                </li>
                <li className="sm:hidden">
                  <LocalizedLink
                    href="/dashboard"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      textDecoration: 'none',
                    }}
                  >
                    <Avatar sx={{ width: '24px', height: '24px' }}>
                      {user.fullName?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  </LocalizedLink>
                </li>
                <li>
                  <IconButton
                    onClick={handleLogout}
                    sx={{
                      width: { xs: '28px', sm: '32px' },
                      height: { xs: '28px', sm: '32px' },
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(225, 198, 147, 0.3)',
                      color: '#E1C693',
                      '&:hover': {
                        borderColor: 'rgba(225, 198, 147, 0.5)',
                        backgroundColor: 'rgba(225, 198, 147, 0.1)',
                      },
                    }}
                    title={tt('Đăng xuất', 'Sign Out')}
                  >
                    <SignOutIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </IconButton>
                </li>
              </>
            ) : (
              <li>
                <Button
                  variant="outlined"
                  onClick={handleSSOLogin}
                  disabled={!isSSOEnabled}
                  sx={{
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    fontSize: { xs: '11px', sm: '12px', md: '14px' },
                    lineHeight: { xs: '13px', sm: '14px', md: '16px' },
                    textTransform: 'uppercase',
                    color: '#E1C693',
                    borderColor: 'rgba(225, 198, 147, 0.3)',
                    height: { xs: '28px', sm: '30px', md: '32px' },
                    minWidth: 'auto',
                    px: { xs: 1, sm: 1.25, md: 1.5 },
                    gap: { xs: '4px', sm: '5px', md: '6px' },
                    '&:hover': {
                      borderColor: 'rgba(225, 198, 147, 0.5)',
                      backgroundColor: 'rgba(225, 198, 147, 0.1)',
                    },
                    '&.Mui-disabled': {
                      borderColor: 'rgba(225, 198, 147, 0.2)',
                      color: 'rgba(225, 198, 147, 0.5)',
                    },
                  }}
                  startIcon={
                    <Image
                      src={userLoginIcon}
                      alt="Login"
                      width={14}
                      height={14}
                      className="md:w-4 md:h-4"
                      style={{ flexShrink: 0 }}
                    />
                  }
                >
                  <span className="hidden sm:inline">{tt('Đăng nhập', 'Login')}</span>
                  <span className="sm:hidden">{tt('Đăng nhập', 'Login').substring(0, 3)}</span>
                </Button>
              </li>
            )} */}

            {/* Language Selector */}
            <li>
              <Select
                value={locale}
                onChange={(e: SelectChangeEvent) => {
                  const value = e.target.value as 'vi' | 'en';
                  switchLocale(value);
                }}
                variant="outlined"
                size="small"
                IconComponent={LanguageSelectIcon}
                sx={{
                  minWidth: { xs: 36, sm: 40, md: 44 },
                  height: { xs: '28px', sm: '30px', md: '32px' },
                  color: 'rgb(31, 41, 55)',
                  fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(156, 163, 175, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(156, 163, 175, 0.7)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgb(31, 41, 55)',
                  },
                  '& .MuiSelect-select': {
                    py: 0.5,
                    px: 1,
                    minHeight: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                  },
                  '& .MuiSelect-icon': {
                    color: 'rgba(31, 41, 55, 0.8)',
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
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      '& .MuiMenuItem-root': {
                        minHeight: 32,
                        py: 0.5,
                        px: 1.5,
                        fontSize: 13,
                        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      },
                    },
                  },
                }}
                renderValue={(value) => (
                  <span
                    role="img"
                    aria-label={(value as string) === 'vi' ? 'Vietnamese' : 'English'}
                    style={{ color: '#E1C693' }}
                  >
                    {(value as string) === 'vi' ? '🇻🇳 VN' : '🇬🇧 US'}
                  </span>
                )}
                inputProps={{ 'aria-label': 'Select language' }}
              >
                <MenuItem
                  value="en"
                  sx={{ minHeight: 32, py: 0.5, px: 1.5, fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
                >
                  <span role="img" aria-label="English" style={{ marginRight: 8, fontSize: 16 }}>
                    🇬🇧
                  </span>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: 12, fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
                  >
                    EN
                  </Typography>
                </MenuItem>
                <MenuItem
                  value="vi"
                  sx={{ minHeight: 32, py: 0.5, px: 1.5, fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
                >
                  <span role="img" aria-label="Vietnamese" style={{ marginRight: 8, fontSize: 16 }}>
                    🇻🇳
                  </span>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: 12, fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
                  >
                    VI
                  </Typography>
                </MenuItem>
              </Select>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
