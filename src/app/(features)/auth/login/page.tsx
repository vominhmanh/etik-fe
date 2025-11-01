'use client';

import * as React from 'react';

import { GuestGuard } from '@/components/auth/guest-guard';
import { Layout } from '@/components/auth/layout';
import { SignInForm } from '@/components/auth/login-form';
import { useTranslation } from '@/contexts/locale-context';

export default function Page(): React.JSX.Element {
  const { tt } = useTranslation();

  React.useEffect(() => {
    document.title = tt('Đăng nhập | ETIK - Vé điện tử & Quản lý sự kiện', 'Sign In | ETIK - E-tickets & Event Management');
  }, [tt]);

  return (
    <Layout>
      <GuestGuard>
        <SignInForm />
      </GuestGuard>
    </Layout>
  );
}
