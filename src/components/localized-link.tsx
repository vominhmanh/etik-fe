'use client';

import { useLocale } from '@/contexts/locale-context';
import Link, { LinkProps } from 'next/link';
import { AnchorHTMLAttributes, forwardRef } from 'react';

type LocalizedLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
  LinkProps & {
    children?: React.ReactNode;
  };

/**
 * A wrapper around Next.js Link that automatically handles locale prefixes.
 * 
 * When locale is 'vi' (Vietnamese), routes normally.
 * When locale is 'en' (English), automatically adds '/en' prefix to the href.
 * 
 * Usage:
 * ```tsx
 * <LocalizedLink href="/events">Events</LocalizedLink>
 * // In Vietnamese: links to /events
 * // In English: links to /en/events
 * ```
 */
export const LocalizedLink = forwardRef<HTMLAnchorElement, LocalizedLinkProps>(
  ({ href, ...props }, ref) => {
    const { locale } = useLocale();

    // Convert href to string if it's an object
    const hrefString = typeof href === 'string' ? href : href.pathname || '/';

    // Add /en prefix for English locale, unless it already has it
    const localizedHref = locale === 'en' && !hrefString.startsWith('/en')
      ? `/en${hrefString}`
      : hrefString;

    return <Link ref={ref} href={localizedHref} {...props} />;
  }
);

LocalizedLink.displayName = 'LocalizedLink';

