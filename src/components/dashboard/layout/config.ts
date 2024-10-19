import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Tổng quan', href: paths.dashboard.overview, icon: 'chart-pie' },
  { key: 'integrations', title: 'Thiết kế sự kiện', href: paths.dashboard.integrations, icon: 'plugs-connected' },
  { key: 'customers', title: 'Khách mời & Vé', href: paths.dashboard.customers, icon: 'users' },
  { key: 'settings', title: 'Cài đặt', href: paths.dashboard.settings, icon: 'gear-six' },
  { key: 'account', title: 'Thành viên', href: paths.dashboard.account, icon: 'user' },
  { key: 'error', title: 'Error', href: paths.errors.notFound, icon: 'x-square' },
] satisfies NavItemConfig[];
