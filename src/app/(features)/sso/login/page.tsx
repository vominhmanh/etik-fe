import * as React from 'react';
import type { Metadata } from 'next';
import { Layout } from '@/components/auth/layout';
import { SignInForm } from './login-form';

export const metadata = { title: `Đăng nhập | ETIK - Vé điện tử & Quản lý sự kiện` } satisfies Metadata;

export default function Page(): React.JSX.Element {

  return (
    <Layout>
        <SignInForm />
    </Layout>
  );
}
