'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Alert from '@mui/material/Alert';

import { paths } from '@/paths';
import { getDecodedReturnUrl } from '@/lib/auth/urls';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';

export interface GuestGuardProps {
  children: React.ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps): React.JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error, isLoading, user, checkSession } = useUser();
  const [isChecking, setIsChecking] = React.useState<boolean>(true);
  const didTryHydrateRef = React.useRef<boolean>(false);

  const checkPermissions = async (): Promise<void> => {

    if (isLoading) {
      return;
    }

    if (error) {
      setIsChecking(false);
      return;
    }

    if (!user) {
      if (!didTryHydrateRef.current) {
        didTryHydrateRef.current = true;
        await checkSession?.();
        return; // wait for state update; effect will re-run
      }
    }

    if (user) {
      const target: string = getDecodedReturnUrl(searchParams?.get('returnUrl'), paths.dashboard.overview);
      logger.debug('[GuestGuard]: User is logged in, redirecting', { target });
      router.replace(target);
      return;
    }

    setIsChecking(false);
  };

  React.useEffect(() => {
    checkPermissions().catch(() => {
      // noop
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Expected
  }, [error, isLoading]);

  if (isChecking) {
    return null;
  }

  if (error) {
    return <Alert color="error">{error}</Alert>;
  }

  return <React.Fragment>{children}</React.Fragment>;
}

