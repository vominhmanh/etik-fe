'use client';

import { useEffect } from 'react';
import AOS from 'aos';

import 'aos/dist/aos.css';

import { SSOProvider } from '@/contexts/sso-context';

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    AOS.init({
      once: true,
      disable: 'phone',
      duration: 700,
      easing: 'ease-out-cubic',
    });
  });

  // SSO Configuration - chỉ config nội bộ trong layout này
  const ssoConfig = {
    enabled: true, // Enable SSO login for this layout
    onLoginSuccess: () => {
      // Optional: Handle login success
      console.log('SSO login successful');
    },
    onLoginError: (error: string) => {
      // Optional: Handle login error
      console.error('SSO login error:', error);
    },
  };

  return (
    <SSOProvider config={ssoConfig}>
      <>{children}</>
    </SSOProvider>
  );
}
