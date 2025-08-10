import type { Metadata } from 'next';
import * as React from 'react';

import { GuestGuard } from '@/components/auth/guest-guard';
import { Layout } from '@/components/auth/layout';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { config } from '@/config';

export const metadata = { title: `Đăng ký | Tài khoản | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  
  return (
    <Layout>
      <GuestGuard>
        <SignUpForm />
      </GuestGuard>
    </Layout>
  );
}
