"use client"; // If using Next.js App Router

import { useEffect, useState } from "react";
import Logo from "./logo";
import { Avatar, Box, Typography, Select, MenuItem, SelectChangeEvent, Button, IconButton } from "@mui/material";
import { SignOut as SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { useTranslation, useLocale } from '@/contexts/locale-context';
import { useRouter, usePathname } from 'next/navigation';
import { LocalizedLink } from '@/components/homepage/localized-link';
import { useSSO } from '@/hooks/use-sso';
import { useSSOContext } from '@/contexts/sso-context';

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
const LanguageSelectIcon = (props: any) => (
  <span {...props}>▾</span>
);

export default function Header() {
  const { tt } = useTranslation();
  const { locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
          'Authorization': `Bearer ${accessToken}`,
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
    if (typeof window !== "undefined") {
      const loadUser = async () => {
        // Check if we have accessToken from SSO login
        const accessToken = localStorage.getItem('accessToken');
        
        if (accessToken) {
          // Try to get user from localStorage first
          const storedUser = localStorage.getItem("user");
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
                <LocalizedLink
                  href="/auth/login"
                  className="btn-sm bg-white text-gray-800 shadow hover:bg-gray-50"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Typography variant="body2">{tt("Đang tải...", "Loading...")}</Typography>
                </LocalizedLink>
              </li>
            ) : user ? (
              <>
                <li>
                  <LocalizedLink
                    href="/dashboard"
                    className="btn-sm bg-white text-gray-800 shadow hover:bg-gray-50"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Typography variant="body2" sx={{ marginRight: '8px' }}>
                      {tt("Xin chào,", "Hi,")}
                    </Typography>
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
                  </LocalizedLink>
                </li>
                <li>
                  <IconButton
                    onClick={handleLogout}
                    sx={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: 'white',
                      border: '1px solid rgba(156, 163, 175, 0.3)',
                      color: 'rgb(31, 41, 55)',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      '&:hover': {
                        borderColor: 'rgba(156, 163, 175, 0.5)',
                        backgroundColor: 'rgba(249, 250, 251, 1)',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                      },
                    }}
                    title={tt("Đăng xuất", "Sign Out")}
                  >
                    <SignOutIcon size={18} />
                  </IconButton>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Button
                    variant="outlined"
                    onClick={handleSSOLogin}
                    disabled={!isSSOEnabled}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 500,
                      height: '32px',
                      minWidth: 'auto',
                      px: 1.5,
                      backgroundColor: 'white',
                      borderColor: 'rgba(156, 163, 175, 0.3)',
                      color: 'rgb(31, 41, 55)',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      '&:hover': {
                        borderColor: 'rgba(156, 163, 175, 0.5)',
                        backgroundColor: 'rgba(249, 250, 251, 1)',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                      },
                    }}
                    startIcon={
                      <svg width="18" height="18" viewBox="0 0 20 20" style={{ display: 'block' }}>
                        <g>
                          <path
                            d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.48a4.68 4.68 0 0 1-2.03 3.07v2.55h3.28c1.92-1.77 3.03-4.38 3.03-7.41z"
                            fill="#4285F4"
                          />
                          <path
                            d="M10 20c2.7 0 4.97-.9 6.63-2.44l-3.28-2.55c-.91.61-2.07.97-3.35.97-2.57 0-4.75-1.74-5.53-4.07H1.06v2.6A9.99 9.99 0 0 0 10 20z"
                            fill="#34A853"
                          />
                          <path
                            d="M4.47 11.91A5.99 5.99 0 0 1 4.01 10c0-.66.11-1.31.26-1.91V5.49H1.06A9.99 9.99 0 0 0 0 10c0 1.64.39 3.19 1.06 4.51l3.41-2.6z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M10 4.01c1.47 0 2.78.51 3.81 1.5l2.85-2.85C14.97 1.13 12.7.01 10 .01A9.99 9.99 0 0 0 1.06 5.49l3.41 2.6C5.25 5.75 7.43 4.01 10 4.01z"
                            fill="#EA4335"
                          />
                        </g>
                      </svg>
                    }
                  >
                    <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>
                      {tt("Đăng nhập", "Login")}
                    </Typography>
                  </Button>
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
