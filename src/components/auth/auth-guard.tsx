'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Alert from '@mui/material/Alert';
import { jwtDecode } from 'jwt-decode';

import { paths } from '@/paths';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';

export interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { error, isLoading, getUser } = useUser();
  const [isChecking, setIsChecking] = React.useState<boolean>(true);

  const checkPermissions = async (): Promise<void> => {
    const user = getUser()
    const accessToken = localStorage.getItem('accessToken');

    if (isLoading) {
      return;
    }

    if (error) {
      setIsChecking(false);
      return;
    }

    if (!user || !accessToken) {
      logger.debug('[AuthGuard]: User or  Access token is not logged in, redirecting to sign in');
      const qs = searchParams?.toString() ?? '';
      const returnUrl = `${pathname || '/'}${qs ? `?${qs}` : ''}`;
      router.replace(`${paths.auth.signIn}?returnUrl=${encodeURIComponent(returnUrl)}`);
      return; // stop further processing
    }

    try {
      const decodedToken = jwtDecode(accessToken);
      const currentTime = Date.now() / 1000;

      // TODO: Call refresh token endpoint if the token is about to expire
      // If the token is expired, logout the user
      if (!decodedToken.exp || decodedToken.exp < currentTime) {
        const qs = searchParams?.toString() ?? '';
        const returnUrl = `${pathname || '/'}${qs ? `?${qs}` : ''}`;
        router.replace(`${paths.auth.signIn}?returnUrl=${encodeURIComponent(returnUrl)}`);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        return; // stop further processing
      }
    } catch (err) {
      logger.error(err);
      const qs = searchParams?.toString() ?? '';
      const returnUrl = `${pathname || '/'}${qs ? `?${qs}` : ''}`;
      router.replace(`${paths.auth.signIn}?returnUrl=${encodeURIComponent(returnUrl)}`);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      return; // stop further processing
    }

    setIsChecking(false);
  };

  React.useEffect(() => {
    checkPermissions().catch(() => {
      // noop
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Expected
  }, [ error, isLoading]);

  if (isChecking || isLoading) {
    return null;
  }

  if (error) {
    return <Alert color="error">{error}</Alert>;
  }

  return <React.Fragment>{children}</React.Fragment>;
}
