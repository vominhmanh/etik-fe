'use client';

// If using Next.js App Router
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import fchoiceLogo from '@/images/pubg/fcoice-2025.png';
import headerBackground from '@/images/pubg/header-background.png';
import userLoginIcon from '@/images/user-login.svg';
import { Avatar, MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';

import { useLocale, useTranslation } from '@/contexts/locale-context';
import { LocalizedLink } from '@/components/pubggala/localized-link';

// Small down-arrow icon for language select
const LanguageSelectIcon = (props: any) => <span {...props}>▾</span>;

export default function PubgGalaPageHeader() {
  const { tt } = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Ensure code runs only on the client
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    }
  }, []);

  return (
    <header
      style={{
        position: 'absolute',
        left: '16px',
        right: '16px',
        top: '30px',
        height: '56px',
        width: 'calc(100% - 32px)',
        backgroundImage: `url(${headerBackground.src})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backdropFilter: 'blur(2.5px)',
        zIndex: 30,
        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
        padding: '0 48px',
      }}
    >
      <div className="mx-auto relative">
        <div className="relative flex h-14 items-center justify-between gap-3 px-3">
          {/* Site branding and Navigation */}
          <div className="flex flex-1 items-center gap-6">
            <Image src={fchoiceLogo} alt="FChoice Logo" width={120} height={40} className="object-contain" />
            {/* Navigation Tabs */}
            <nav
              className="hidden md:flex items-center gap-4"
              style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
            >
              <LocalizedLink
                href="/events/pubggala/hall-of-fame"
                className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
                style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
              >
                {tt('Bảng vinh danh', 'Hall of Fame')}
              </LocalizedLink>
              <LocalizedLink
                href="/events/pubggala/judging-panel"
                className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
                style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
              >
                {tt('Hội đồng thẩm định', 'Judging Panel')}
              </LocalizedLink>
              <LocalizedLink
                href="/events/pubggala/news"
                className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
                style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
              >
                {tt('Tin tức', 'News')}
              </LocalizedLink>
              <LocalizedLink
                href="/events/pubggala/rules"
                className="text-white hover:text-gray-300 transition-colors text-sm font-medium"
                style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
              >
                {tt('Thể lệ', 'Rules')}
              </LocalizedLink>
            </nav>
          </div>

          {/* Desktop sign in links */}
          <ul className="flex flex-1 items-center justify-end gap-3">
            {isLoading ? (
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
              <li>
                <LocalizedLink
                  href="/dashboard"
                  className="btn-sm bg-white text-gray-800 shadow hover:bg-gray-50"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Typography
                    variant="body2"
                    sx={{ marginRight: '8px', fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
                  >
                    {tt('Xin chào,', 'Hi,')}
                  </Typography>
                  <Avatar sx={{ width: '25px', height: '25px', marginRight: '8px' }}>
                    {user.fullName?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 'bold',
                      maxWidth: '170px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      display: 'block',
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                    }}
                  >
                    {user.fullName || tt('Người dùng', 'User')}
                  </Typography>
                </LocalizedLink>
              </li>
            ) : (
              <>
                <li>
                  <LocalizedLink
                    href="/auth/login"
                    style={{
                      fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
                      fontStyle: 'normal',
                      fontWeight: 600,
                      fontSize: '14px',
                      lineHeight: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      textTransform: 'uppercase',
                      color: '#E1C693',
                      flex: 'none',
                      order: 0,
                      flexGrow: 0,
                      textDecoration: 'none',
                      gap: '6px',
                    }}
                  >
                    <Image
                      src={userLoginIcon}
                      alt="Login"
                      width={16}
                      height={16}
                      style={{ flexShrink: 0 }}
                    />
                    {tt('Đăng nhập', 'Login')}
                  </LocalizedLink>
                </li>
                {/* <li>
                  <LocalizedLink
                    href="/auth/sign-up"
                    className="btn-sm bg-gray-800 text-gray-200 shadow hover:bg-gray-900"
                    style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}
                  >
                    {tt("Đăng ký", "Sign Up")}
                  </LocalizedLink>
                </li> */}
              </>
            )}

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
                  minWidth: 44,
                  height: 32,
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
