'use client';

import { useLocale } from '@/contexts/locale-context';
import Link, { LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { AnchorHTMLAttributes, forwardRef } from 'react';

type LocalizedLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
  LinkProps & {
    children?: React.ReactNode;
    style?: React.CSSProperties;
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
    const pathname = usePathname();

    // Convert href to string if it's an object
    let hrefString = typeof href === 'string' ? href : href.pathname || '/';

    // If href is a relative path, convert it to an absolute path
    if (!hrefString.startsWith('/')) {
      // Get the base pathname (remove /en prefix if present)
      const basePathname = pathname.startsWith('/en') ? pathname.substring(3) : pathname;

      // Get the directory of the current path (everything except the last segment)
      const currentDir = basePathname.substring(0, basePathname.lastIndexOf('/')) || '/';

      // Resolve the relative path
      if (currentDir === '/') {
        hrefString = `/${hrefString}`;
      } else {
        hrefString = `${currentDir}/${hrefString}`;
      }
    }

    // Add /en prefix for English locale, unless it already has it
    const localizedHref = locale === 'en' && !hrefString.startsWith('/en')
      ? `/en${hrefString}`
      : hrefString;

    return <Link ref={ref} href={localizedHref} {...props} style={props.style} />;
  }
);

LocalizedLink.displayName = 'LocalizedLink';

