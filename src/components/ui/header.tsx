"use client"; // If using Next.js App Router

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./logo";
import { Avatar, Box, Typography } from "@mui/material";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);


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
                  <Typography variant="body2">Đang tải...</Typography>
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
                    Xin chào,
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
                    {user.fullName || "Người dùng"}
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
                    Đăng nhập
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/sign-up"
                    className="btn-sm bg-gray-800 text-gray-200 shadow hover:bg-gray-900"
                  >
                    Đăng ký
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </header>
  );
}
