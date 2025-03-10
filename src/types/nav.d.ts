import type { Icon } from '@phosphor-icons/react/dist/lib/types';

export interface NavItemConfig {
  key: string;
  title?: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  icon?: Icon;
  href?: string;
  items?: NavItemConfig[];
  onClick?: () => void;
  // Matcher cannot be a function in order
  // to be able to use it on the server.
  // If you need to match multiple paths,
  // can extend it to accept multiple matchers.
  matcher?: { type: 'startsWith' | 'equals'; href: string };
}
