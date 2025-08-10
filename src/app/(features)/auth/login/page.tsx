import type { Metadata } from 'next';
import * as React from 'react';

import { GuestGuard } from '@/components/auth/guest-guard';
import { Layout } from '@/components/auth/layout';
import { SignInForm } from '@/components/auth/login-form';

export const metadata = { title: `Đăng nhập | ETIK - Vé điện tử & Quản lý sự kiện` } satisfies Metadata;

export default function Page(): React.JSX.Element {

  return (
    <Layout>
      <GuestGuard>
        <SignInForm />
      </GuestGuard>
    </Layout>
  );
}
