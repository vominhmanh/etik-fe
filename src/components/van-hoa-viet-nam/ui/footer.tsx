'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MenuItem, Select, SelectChangeEvent, Typography } from '@mui/material';

import { useLocale, useTranslation } from '@/contexts/locale-context';

import LogoFooter from './logo-footer';

// Small down-arrow icon for language select
const LanguageSelectIcon = (props: any) => <span {...props}>▾</span>;

export default function Footer({ border = false }: { border?: boolean }) {
  const { tt } = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();

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
  return (
    <footer>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Top area: Blocks */}
        <div
          className={`grid gap-10 py-8 sm:grid-cols-12 md:py-12 ${border ? 'border-t [border-image:linear-gradient(to_right,transparent,theme(colors.slate.200),transparent)1]' : ''}`}
        >
          {/* 1st block */}
          <div className="space-y-2 sm:col-span-12 lg:col-span-4">
            <div>
              <LogoFooter />
            </div>
            <div className="text-sm text-gray-600">
              &copy; {tt('Công ty TNHH Tiên Phong Thông Minh', 'Tien Phong Smart Co., Ltd.')} - All rights reserved.
              <br />
              {tt('Giấy phép đăng ký kinh doanh số:', 'Business Registration Number:')} 0110765139
              <br />
              {tt('Số điện thoại:', 'Phone:')} 0333.247.242
              <br />
              Email: Tienphongsmart@gmail.com
            </div>
          </div>

          {/* 2nd block */}
          <div className="space-y-2 sm:col-span-6 md:col-span-3 lg:col-span-2">
            <h3 className="text-sm font-medium">{tt('Sản phẩm:', 'Products:')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="text-gray-600 transition hover:text-gray-900" href="#0">
                  ETIK
                </Link>
              </li>
              <li>
                <Link className="text-gray-600 transition hover:text-gray-900" href="#0">
                  {tt('Chìa khóa thông minh', 'Smart Key')}
                </Link>
              </li>
              <li>
                <Link className="text-gray-600 transition hover:text-gray-900" href="#0">
                  Tien Phong AI
                </Link>
              </li>
              <li>
                <Link className="text-gray-600 transition hover:text-gray-900" href="#0">
                  Tien Phong Oursourcing
                </Link>
              </li>
            </ul>
          </div>

          {/* 3rd block */}
          <div className="space-y-2 sm:col-span-6 md:col-span-3 lg:col-span-2">
            <h3 className="text-sm font-medium">{tt('Công ty:', 'Company:')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="text-gray-600 transition hover:text-gray-900" href="#0">
                  {tt('Về chúng tôi', 'About Us')}
                </Link>
              </li>
              <li>
                <Link className="text-gray-600 transition hover:text-gray-900" href="#0">
                  Blog
                </Link>
              </li>
              <li>
                <Link className="text-gray-600 transition hover:text-gray-900" href="#0">
                  {tt('Tuyển dụng', 'Careers')}
                </Link>
              </li>
            </ul>
          </div>

          {/* 4th block */}
          <div className="space-y-2 sm:col-span-6 md:col-span-3 lg:col-span-2">
            <h3 className="text-sm font-medium">{tt('Tài nguyên:', 'Resources:')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="text-gray-600 transition hover:text-gray-900" href="#0">
                  {tt('Điều khoản dịch vụ', 'Terms of Service')}
                </Link>
              </li>
              <li>
                <Link className="text-gray-600 transition hover:text-gray-900" href="#0">
                  {tt('Nguyên tắc bảo mật', 'Privacy Policy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* 5th block */}
          <div className="space-y-2 sm:col-span-6 md:col-span-3 lg:col-span-2">
            <h3 className="text-sm font-medium">{tt('Mạng xã hội:', 'Social Media:')}</h3>
            <ul className="flex gap-1">
              <li>
                <Link
                  className="flex items-center justify-center text-blue-500 transition hover:text-blue-600"
                  href="#0"
                  aria-label="Facebook"
                >
                  <svg className="h-8 w-8 fill-current" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 6h-3a5 5 0 0 0-5 5v3H8v4h3v9h4v-9h3l1-4h-4v-3a1 1 0 0 1 1-1h3V6Z"></path>
                  </svg>
                </Link>
              </li>
            </ul>

            {/* Language Selector */}
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">{tt('Ngôn ngữ:', 'Language:')}</h3>
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
                  minWidth: 120,
                  height: 36,
                  color: 'rgb(75, 85, 99)',
                  backgroundColor: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(156, 163, 175, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(156, 163, 175, 0.7)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgb(75, 85, 99)',
                  },
                  '& .MuiSelect-select': {
                    py: 0.75,
                    px: 1.5,
                    minHeight: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                  },
                  '& .MuiSelect-icon': {
                    color: 'rgba(75, 85, 99, 0.8)',
                    right: 4,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 16,
                  },
                }}
                MenuProps={{
                  MenuListProps: { dense: true },
                  PaperProps: {
                    sx: {
                      mt: 0.5,
                      '& .MuiMenuItem-root': {
                        minHeight: 36,
                        py: 0.75,
                        px: 1.5,
                        fontSize: 13,
                      },
                    },
                  },
                }}
                renderValue={(value) => (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span role="img" aria-label={(value as string) === 'vi' ? 'Vietnamese' : 'English'}>
                      {(value as string) === 'vi' ? '🇻🇳' : '🇬🇧'}
                    </span>
                    <Typography variant="caption" sx={{ fontSize: 13 }}>
                      {(value as string) === 'vi' ? 'Tiếng Việt' : 'English'}
                    </Typography>
                  </span>
                )}
                inputProps={{ 'aria-label': 'Select language' }}
              >
                <MenuItem value="en" sx={{ minHeight: 36, py: 0.75, px: 1.5 }}>
                  <span role="img" aria-label="English" style={{ marginRight: 8, fontSize: 16 }}>
                    🇬🇧
                  </span>
                  <Typography variant="caption" sx={{ fontSize: 13 }}>
                    English
                  </Typography>
                </MenuItem>
                <MenuItem value="vi" sx={{ minHeight: 36, py: 0.75, px: 1.5 }}>
                  <span role="img" aria-label="Vietnamese" style={{ marginRight: 8, fontSize: 16 }}>
                    🇻🇳
                  </span>
                  <Typography variant="caption" sx={{ fontSize: 13 }}>
                    Tiếng Việt
                  </Typography>
                </MenuItem>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Big text */}
      <div className="relative -mt-16 h-60 w-full" aria-hidden="true">
        <div className="pointer-events-none absolute left-1/2 -z-10 -translate-x-1/2 text-center text-[348px] font-bold leading-none before:bg-gradient-to-b before:from-gray-200 before:to-gray-100/30 before:to-80% before:bg-clip-text before:text-transparent before:content-['ETIK'] after:absolute after:inset-0 after:bg-gray-300/70 after:bg-clip-text after:text-transparent after:mix-blend-darken after:content-['ETIK'] after:[text-shadow:0_1px_0_white]"></div>
        {/* Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2/3" aria-hidden="true">
          <div className="h-56 w-56 rounded-full border-[20px] border-blue-700 blur-[80px]"></div>
        </div>
      </div>
    </footer>
  );
}
