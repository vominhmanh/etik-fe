"use client"; // If using Next.js App Router

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./logo";
import { Avatar, Box, Typography, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import { useTranslation, useLocale } from '@/contexts/locale-context';
import { useRouter, usePathname } from 'next/navigation';

// Small down-arrow icon for language select
const LanguageSelectIcon = (props: any) => (
  <span {...props}>▾</span>
);

export default function Header() {
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
    if (typeof window !== "undefined") {
      // Ensure code runs only on the client
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    }
  }, []);


  return (
    <header className="fixed top-2 z-30 w-full md:top-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-white/90 px-3 shadow-lg shadow-black/[0.03] backdrop-blur-sm before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(theme(colors.gray.100),theme(colors.gray.200))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]">
          {/* Site branding */}
          <div className="flex flex-1 items-center">
            <Logo />
          </div>

          {/* Desktop sign in links */}
          <ul className="flex flex-1 items-center justify-end gap-3">

            {isLoading ? (
              <li>
                <Link
                  href="/auth/login"
                  className="btn-sm bg-white text-gray-800 shadow hover:bg-gray-50"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Typography variant="body2">{tt("Đang tải...", "Loading...")}</Typography>
                </Link>
              </li>
            ) : user ? (
              <li>
                <Link
                  href="/event-studio/events"
                  className="btn-sm bg-white text-gray-800 shadow hover:bg-gray-50"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Typography variant="body2" sx={{ marginRight: '8px' }}>
                    {tt("Xin chào,", "Hi,")}
                  </Typography>
                  <Avatar sx={{ width: '25px', height: '25px', marginRight: '8px' }}>
                    {user.fullName?.charAt(0).toUpperCase() || "U"}
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
                    }}
                  >
                    {user.fullName || tt("Người dùng", "User")}
                  </Typography>
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link
                    href="/auth/login"
                    className="btn-sm bg-white text-gray-800 shadow hover:bg-gray-50"
                  >
                    {tt("Đăng nhập", "Login")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/sign-up"
                    className="btn-sm bg-gray-800 text-gray-200 shadow hover:bg-gray-900"
                  >
                    {tt("Đăng ký", "Sign Up")}
                  </Link>
                </li>
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
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(156, 163, 175, 0.3)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(156, 163, 175, 0.7)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgb(31, 41, 55)'
                  },
                  '& .MuiSelect-select': {
                    py: 0.5,
                    px: 1,
                    minHeight: 'auto',
                    display: 'flex',
                    alignItems: 'center',
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
                      '& .MuiMenuItem-root': {
                        minHeight: 32,
                        py: 0.5,
                        px: 1.5,
                        fontSize: 13,
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
                <MenuItem value="en" sx={{ minHeight: 32, py: 0.5, px: 1.5 }}>
                  <span role="img" aria-label="English" style={{ marginRight: 8, fontSize: 16 }}>🇬🇧</span>
                  <Typography variant="caption" sx={{ fontSize: 12 }}>EN</Typography>
                </MenuItem>
                <MenuItem value="vi" sx={{ minHeight: 32, py: 0.5, px: 1.5 }}>
                  <span role="img" aria-label="Vietnamese" style={{ marginRight: 8, fontSize: 16 }}>🇻🇳</span>
                  <Typography variant="caption" sx={{ fontSize: 12 }}>VI</Typography>
                </MenuItem>
              </Select>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
