'use client';

import * as React from 'react';
import { LocalizedLink } from '@/components/localized-link';

import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
// import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import logoImage from "@/images/etik-logo-transparent-dark.png";
import logoImageEn from "@/images/etik-logo-transparent-dark-en.png";
import Image from "next/image";
import { useTranslation } from '@/contexts/locale-context';

import { getNavItems } from './config';
import Stack from "@mui/material/Stack";

export function SideNav(): React.JSX.Element {
  const { tt, locale } = useTranslation();
  const pathname = usePathname();
  const navItems = React.useMemo(() => getNavItems(tt), [tt]);
  const { key: firstKey, ...firstItem } = navItems[0];
  const { key: secondKey, ...secondItem } = navItems[1];
  const { key: thirdKey, ...thirdItem } = navItems[2];
  const logo = locale === 'en' ? logoImageEn : logoImage;

  return (
    <Box
      sx={{
        '--SideNav-background': 'var(--mui-palette-neutral-800)',
        '--SideNav-color': 'var(--mui-palette-common-white)',
        '--NavItem-color': 'var(--mui-palette-neutral-300)',
        '--NavItem-hover-background': 'rgba(255, 255, 255, 0.04)',
        '--NavItem-active-background': 'var(--mui-palette-primary-main)',
        '--NavItem-active-color': 'var(--mui-palette-primary-contrastText)',
        '--NavItem-disabled-color': 'var(--mui-palette-neutral-500)',
        '--NavItem-icon-color': 'var(--mui-palette-neutral-400)',
        '--NavItem-icon-active-color': 'var(--mui-palette-primary-contrastText)',
        '--NavItem-icon-disabled-color': 'var(--mui-palette-neutral-600)',
        bgcolor: 'var(--SideNav-background)',
        color: 'var(--SideNav-color)',
        display: { xs: 'none', lg: 'flex' },
        flexDirection: 'column',
        minHeight: '95vh',
        height: '100%',
        left: 0,
        maxWidth: '100%',
        position: 'absolute',
        scrollbarWidth: 'none',
        width: 'var(--SideNav-width)',
        zIndex: 'var(--SideNav-zIndex)',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      <Stack sx={{ position: 'sticky', top: 0 }}>
        <Stack spacing={2} sx={{ p: 2 }}>
          <Box component={LocalizedLink} href={paths.dashboard.overview} sx={{ display: 'inline-flex' }}>
            <Image
              src={logo}
              alt="Left Logo"
              height={40}
              className="mr-2" // Khoảng cách giữa hai logo
            />
          </Box>
        </Stack>
        <Divider sx={{ borderColor: 'var(--mui-palette-neutral-700)' }} />
        <Box component="nav" sx={{ flex: '1 1 auto', p: '12px' }}>
          <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
            <NavItem key={firstKey} pathname={pathname} {...firstItem} />
            <NavItem key={secondKey} pathname={pathname} {...secondItem} />
            <NavItem key={thirdKey} pathname={pathname} {...thirdItem} />
          </Stack>
          {/*{renderNavItems({ pathname, items: navItems })}*/}
        </Box>
      </Stack>
    </Box>
  );
}

interface NavItemProps extends Omit<NavItemConfig, 'items'> {
  pathname: string;
}

function NavItem({ disabled, external, href, icon, matcher, pathname, title }: NavItemProps): React.JSX.Element {
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });
  const Icon = icon;

  return (
    <li>
      <Box
        {...(href
          ? {
            component: external ? 'a' : LocalizedLink,
            href,
            target: external ? '_blank' : undefined,
            rel: external ? 'noreferrer' : undefined,
          }
          : { role: 'button' })}
        sx={{
          alignItems: 'center',
          borderRadius: 1,
          color: 'var(--NavItem-color)',
          cursor: 'pointer',
          display: 'flex',
          flex: '0 0 auto',
          gap: 1,
          p: '6px 16px',
          position: 'relative',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          ...(disabled && {
            bgcolor: 'var(--NavItem-disabled-background)',
            color: 'var(--NavItem-disabled-color)',
            cursor: 'not-allowed',
          }),
          ...(active && { bgcolor: 'var(--NavItem-active-background)', color: 'var(--NavItem-active-color)' }),
        }}
      >
        <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', flex: '0 0 auto' }}>
          {Icon ? (
            <Icon
              fill={active ? 'var(--NavItem-icon-active-color)' : 'var(--NavItem-icon-color)'}
              fontSize="var(--icon-fontSize-md)"
              weight={active ? 'fill' : undefined}
            />
          ) : null}
        </Box>
        <Box sx={{ flex: '1 1 auto' }}>
          <Typography
            component="span"
            sx={{ color: 'inherit', fontSize: '0.875rem', fontWeight: 500, lineHeight: '28px' }}
          >
            {title}
          </Typography>
        </Box>
      </Box>
    </li>
  );
}
