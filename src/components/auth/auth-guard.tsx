'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
  const { user, error, isLoading } = useUser();
  const [isChecking, setIsChecking] = React.useState<boolean>(true);

  const checkPermissions = async (): Promise<void> => {
    if (isLoading) {
      return;
    }

    if (error) {
      setIsChecking(false);
      return;
    }

    if (!user) {
      logger.debug('[AuthGuard]: User is not logged in, redirecting to sign in');
      router.replace(paths.auth.signIn);
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      logger.debug('[AuthGuard]: Access token is missing, redirecting to sign in');
      return;
    }

    try {
      const decodedToken = jwtDecode(accessToken);
      const currentTime = Date.now() / 1000;

      // TODO: Call refresh token endpoint if the token is about to expire
      // If the token is expired, logout the user
      if (!decodedToken.exp || decodedToken.exp < currentTime) {
        router.replace(paths.auth.signIn);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    } catch (err) {
      logger.error(err);
      router.replace(paths.auth.signIn);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }

    setIsChecking(false);
  };

  React.useEffect(() => {
    checkPermissions().catch(() => {
      // noop
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Expected
  }, [user, error, isLoading]);

  if (isChecking) {
    return null;
  }

  if (error) {
    return <Alert color="error">{error}</Alert>;
  }

  return <React.Fragment>{children}</React.Fragment>;
}
