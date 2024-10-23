import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';
import { ListBullets } from '@phosphor-icons/react/dist/ssr/ListBullets';
import { Plus } from '@phosphor-icons/react/dist/ssr/Plus';
export const navItems = [
  { key: 'events', title: 'Danh sách sự kiện', href: '/event-studio/events', icon: ListBullets },
  { key: 'customers', title: 'Tạo sự kiện', href: '/event-studio/events/create', icon: Plus }
] satisfies NavItemConfig[];
