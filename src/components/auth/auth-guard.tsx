'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Alert from '@mui/material/Alert';

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
        return; // wait for state update, effect will re-run
      }
      logger.debug('[AuthGuard]: User is not logged in, redirecting to sign in');
      const qs = searchParams?.toString() ?? '';
      const returnUrl = `${pathname || '/'}${qs ? `?${qs}` : ''}`;
      router.replace(`${paths.auth.signIn}?returnUrl=${encodeURIComponent(returnUrl)}`);
      return; // stop further processing
    }

    // Token validation handled by server via httpOnly cookies

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
