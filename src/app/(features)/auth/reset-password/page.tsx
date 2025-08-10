import type { Metadata } from 'next';
import * as React from 'react';

import { GuestGuard } from '@/components/auth/guest-guard';
import { Layout } from '@/components/auth/layout';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata = { title: `Lấy lại mật khẩu | ETIK - Vé điện tử & Quản lý sự kiện` } satisfies Metadata;

export default function Page(): React.JSX.Element {
 
  return (
    <Layout>
      <GuestGuard>
        <ResetPasswordForm />
      </GuestGuard>
    </Layout>
  );
}
