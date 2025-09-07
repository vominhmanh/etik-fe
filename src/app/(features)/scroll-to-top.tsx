"use client";
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Forces window scroll to top after route (pathname or query) change.
 * Helps when a sticky header prevents Next's default auto-scroll.
 */
export function ScrollToTop(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Defer to ensure layout rendered before scrolling
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  return null;
}


