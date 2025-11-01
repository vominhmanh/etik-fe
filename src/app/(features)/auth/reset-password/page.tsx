'use client';

import * as React from 'react';

import { GuestGuard } from '@/components/auth/guest-guard';
import { Layout } from '@/components/auth/layout';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { useTranslation } from '@/contexts/locale-context';

export default function Page(): React.JSX.Element {
  const { tt } = useTranslation();

  React.useEffect(() => {
    document.title = tt('Lấy lại mật khẩu | ETIK - Vé điện tử & Quản lý sự kiện', 'Reset Password | ETIK - E-tickets & Event Management');
  }, [tt]);
 
  return (
    <Layout>
      <GuestGuard>
        <ResetPasswordForm />
      </GuestGuard>
    </Layout>
  );
}
