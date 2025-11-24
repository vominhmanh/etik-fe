'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Alert from '@mui/material/Alert';

import { paths } from '@/paths';
import { getDecodedReturnUrl } from '@/lib/auth/urls';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/hooks/use-user';
import { useTranslation } from '@/contexts/locale-context';

export interface GuestGuardProps {
  children: React.ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps): React.JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { error, isLoading, user, checkSession } = useUser();
  const { locale } = useTranslation();
  const [isChecking, setIsChecking] = React.useState<boolean>(true);
  const didTryHydrateRef = React.useRef<boolean>(false);

  // Helper to make path locale-aware
  const getLocalizedPath = React.useCallback((path: string): string => {
    // If path already has locale, preserve it
    if (path.startsWith('/en')) {
      return path;
    }
    // Apply current locale
    if (locale === 'en' && !path.startsWith('/en')) {
      return `/en${path}`;
    }
    return path;
  }, [locale]);

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
      const rawTarget = getDecodedReturnUrl(searchParams?.get('returnUrl'), paths.dashboard.overview);
      // Preserve locale from returnUrl if it has one, otherwise apply current locale
      let target = rawTarget;
      if (!rawTarget.startsWith('/en')) {
        // Apply current locale based on pathname
        const currentLocale = pathname?.startsWith('/en') ? 'en' : 'vi';
        if (currentLocale === 'en') {
          target = `/en${rawTarget}`;
        }
      }
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
  }, [error, isLoading, locale, pathname]);

  if (isChecking) {
    return null;
  }

  if (error) {
    return <Alert color="error">{error}</Alert>;
  }

  return <React.Fragment>{children}</React.Fragment>;
}

