import type { NavItemConfig } from '@/types/nav';

export function isNavItemActive({
  disabled,
  external,
  href,
  matcher,
  pathname,
}: Pick<NavItemConfig, 'disabled' | 'external' | 'href' | 'matcher'> & { pathname: string }): boolean {
  if (disabled || !href || external) {
    return false;
  }

  if (matcher) {
    if (matcher.type === 'startsWith') {
      return pathname.startsWith(matcher.href);
    }

    if (matcher.type === 'equals') {
      return pathname === matcher.href;
    }

    return false;
  }

  // Special case: if href is /transactions, also match /tickets in the same event context
  if (href.endsWith('/transactions') && pathname.endsWith('/tickets')) {
    // Extract event path prefix (e.g., /event-studio/events/123)
    const eventPathMatch = href.match(/^(.+\/events\/\d+)\/transactions$/);
    if (eventPathMatch) {
      const eventPath = eventPathMatch[1];
      return pathname.startsWith(eventPath + '/tickets');
    }
  }

  // Special case: if href is /tickets, also match /transactions in the same event context
  if (href.endsWith('/tickets') && pathname.endsWith('/transactions')) {
    // Extract event path prefix (e.g., /event-studio/events/123)
    const eventPathMatch = href.match(/^(.+\/events\/\d+)\/tickets$/);
    if (eventPathMatch) {
      const eventPath = eventPathMatch[1];
      return pathname.startsWith(eventPath + '/transactions');
    }
  }

  return pathname === href;
}
