'use client';

import * as React from 'react';

import { GuestGuard } from '@/components/auth/guest-guard';
import { Layout } from '@/components/auth/layout';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { config } from '@/config';
import { useTranslation } from '@/contexts/locale-context';

export default function Page(): React.JSX.Element {
  const { tt } = useTranslation();

  React.useEffect(() => {
    document.title = tt(`Đăng ký | Tài khoản | ${config.site.name}`, `Sign Up | Account | ${config.site.name}`);
  }, [tt]);
  
  return (
    <Layout>
      <GuestGuard>
        <SignUpForm />
      </GuestGuard>
    </Layout>
  );
}
