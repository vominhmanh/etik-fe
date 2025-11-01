import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export function getNavItems(tt: (vi: string, en: string) => string): NavItemConfig[] {
  return [
    { key: 'overview', title: tt('Tổng quan', 'Overview'), href: paths.dashboard.overview },
    { key: 'integrations', title: tt('Thiết kế sự kiện', 'Event Design'), href: paths.dashboard.integrations },
    { key: 'customers', title: tt('Khách mời & Vé', 'Guests & Tickets'), href: paths.dashboard.customers },
    { key: 'settings', title: tt('Cài đặt', 'Settings'), href: paths.dashboard.settings },
    { key: 'account', title: tt('Thành viên', 'Members'), href: paths.dashboard.account },
    { key: 'error', title: 'Error', href: paths.errors.notFound },
  ] satisfies NavItemConfig[];
}
