import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';
import { ListBullets } from '@phosphor-icons/react/dist/ssr/ListBullets';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
import { SealCheck } from '@phosphor-icons/react/dist/ssr';

export function getNavItems(tt: (vi: string, en: string) => string): NavItemConfig[] {
  return [
    { key: 'account-event-agency', title: tt('Tài khoản Event Agency', 'Event Agency Account'), href: '/event-studio/account-event-agency', icon: SealCheck },
    { key: 'events', title: tt('Danh sách sự kiện', 'Event List'), href: '/event-studio/events', icon: ListBullets },
    { key: 'customers', title: tt('Tạo sự kiện', 'Create Event'), href: '/event-studio/events/create', icon: Plus }
  ] satisfies NavItemConfig[];
}
