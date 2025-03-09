'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { usePathname } from 'next/navigation';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { DiceSix, Mailbox, Plus, SquaresFour, StackPlus, StarHalf, UserList } from '@phosphor-icons/react/dist/ssr';
import { Barcode as BarcodeIcon } from '@phosphor-icons/react/dist/ssr/Barcode';
import { CalendarDots as CalendarDotsIcon } from '@phosphor-icons/react/dist/ssr/CalendarDots';
import { CaretDown as CaretDownIcon } from '@phosphor-icons/react/dist/ssr/CaretDown';
import { CaretLeft as CaretLeftIcon } from '@phosphor-icons/react/dist/ssr/CaretLeft';
import { CaretUpDown as CaretUpDownIcon } from '@phosphor-icons/react/dist/ssr/CaretUpDown';
import { ChartPie as ChartPieIcon } from '@phosphor-icons/react/dist/ssr/ChartPie';
import { Door as DoorIcon } from '@phosphor-icons/react/dist/ssr/Door';
import { Info as InfoIcon } from '@phosphor-icons/react/dist/ssr/Info';
import { ListDashes as ListDashesIcon } from '@phosphor-icons/react/dist/ssr/ListDashes';
import { PlugsConnected as PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { ScanSmiley as ScanSmileyIcon } from '@phosphor-icons/react/dist/ssr/ScanSmiley';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { AxiosResponse } from 'axios';

import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import NotificationContext from '@/contexts/notification-context';
import { Logo } from '@/components/core/logo';

import { navItems } from './config';
import { SpinnerBall } from '@phosphor-icons/react';
export type EventResponse = {
  id: number;
  name: string;
  organizer: string;
  description: string;
  startDateTime: string | null;
  endDateTime: string | null;
  place: string | null;
  locationUrl: string | null;
  bannerUrl: string | null;
  avatarUrl: string | null;
  slug: string;
  locationInstruction: string | null;
};

export function SideNav(): React.JSX.Element {
  const pathname = usePathname();
  const [dynamicId, setDynamicId] = React.useState<string | null>(null);
  const notificationCtx = React.useContext(NotificationContext);
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  React.useEffect(() => {
    const storedEventId = localStorage.getItem('event_id');
    setDynamicId(storedEventId);
  }, []);

  React.useEffect(() => {
    if (dynamicId) {
      const fetchEventDetails = async () => {
        try {
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
            `/event-studio/events/${dynamicId}`
          );
          setEvent(response.data);
        } catch (error) {
          notificationCtx.error('Lỗi:', error);
        }
      };
      fetchEventDetails();
    }
  }, [dynamicId]);

  const handleRedirectToCheckInFace = (eventId: number) => {
    const accessToken = localStorage.getItem('accessToken'); // Retrieve accessToken from localStorage
    if (!accessToken) {
      console.error('Access token not found in localStorage.');
      return;
    }

    const url = `https://ekyc.etik.io.vn/check-in-face?event_id=${eventId}&accessToken=${accessToken}`;
    window.location.href = url; // Redirect to the URL
  };

  return (
    <Box
      sx={{
        '--SideNav-background': 'var(--mui-palette-neutral-950)',
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
        height: '100%',
        left: 0,
        maxWidth: '100%',
        position: 'absolute',
        top: 0,
        scrollbarWidth: 'none',
        width: 'var(--SideNav-width)',
        zIndex: 'var(--SideNav-zIndex)',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      <Stack sx={{ position: 'sticky', top: 0 }}>
        <Stack spacing={2} sx={{ p: 3 }}>
          <Box component={RouterLink} href={paths.home} sx={{ display: 'inline-flex' }}>
            <Logo color="light" height={32} width={122} />
          </Box>
          <Box
            sx={{
              alignItems: 'center',
              backgroundColor: 'var(--mui-palette-neutral-950)',
              border: '1px solid var(--mui-palette-neutral-700)',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              p: '4px 12px',
            }}
          >
            <Box sx={{ flex: '1 1 auto', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Typography color="var(--mui-palette-neutral-400)" variant="body2">
                Events
              </Typography>
              <Typography
                color="inherit"
                variant="subtitle1"
                sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
              >
                {event?.name || 'Untitled Event'}
              </Typography>
            </Box>
            <CaretUpDownIcon />
          </Box>
        </Stack>
        <Divider sx={{ borderColor: 'var(--mui-palette-neutral-700)' }} />
        <Box
          component="nav"
          sx={{
            flex: '1 1 auto',
            p: '12px',
            height: '78vh',
            overflowY: 'scroll',
            '&::-webkit-scrollbar': {
              width: '5px', // Width of the scrollbar
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#888', // Color of the scrollbar thumb
              borderRadius: '8px', // Rounded corners
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: '#555', // Hover state for the scrollbar thumb
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'var(--mui-palette-neutral-950)', // Background color of the scrollbar track
            },
          }}
        >
          <Stack component="ul" key={navItems[0].key} spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
            <NavItem
              pathname={pathname}
              key="overview"
              title="Tổng quan"
              href={`/event-studio/events/${dynamicId}`}
              icon={ChartPieIcon}
            />
            <NavItemCollapse pathname={pathname} key="configuration" title="Thiết kế sự kiện" icon={PlugsConnectedIcon}>
              <NavItemCollapseChildItem
                pathname={pathname}
                key="configuration-event-info"
                title="Chỉnh sửa sự kiện"
                href={`/event-studio/events/${dynamicId}/event-detail`}
                icon={InfoIcon}
              />
              <NavItemCollapseChildItem
                pathname={pathname}
                key="configuration-date-time"
                title="Suất diễn"
                href={`/event-studio/events/${dynamicId}/schedules`}
                icon={CalendarDotsIcon}
              />
              <NavItemCollapseChildItem
                pathname={pathname}
                key="configuration-shows-ticket-categories"
                title="Loại vé theo suất diễn"
                href={`/event-studio/events/${dynamicId}/shows`}
                icon={TicketIcon}
              />
            </NavItemCollapse>
            <NavItemCollapse pathname={pathname} key="transactions" title="Bán vé & Khách hàng" icon={TicketIcon}>
              <NavItemCollapseChildItem
                pathname={pathname}
                key="transactions-create"
                title="Tạo đơn hàng"
                href={`/event-studio/events/${dynamicId}/transactions/create`}
                icon={PlusIcon}
              />
              <NavItemCollapseChildItem
                pathname={pathname}
                key="transactions-create-bulk"
                title="Tạo đơn hàng theo lô"
                href={`/event-studio/events/${dynamicId}/transactions/create-bulk`}
                icon={StackPlus}
              />
              <NavItemCollapseChildItem
                pathname={pathname}
                key="transactions-list"
                title="Danh sách đơn hàng"
                href={`/event-studio/events/${dynamicId}/transactions`}
                icon={ListDashesIcon}
              />
              <NavItemCollapseChildItem
                pathname={pathname}
                key="tickets-list"
                title="Danh sách khách hàng & vé"
                href={`/event-studio/events/${dynamicId}/tickets`}
                icon={UserList}
              />
            </NavItemCollapse>
            <NavItemCollapse pathname={pathname} key="check-in" title="Soát vé" icon={DoorIcon}>
              <NavItemCollapseChildItem
                pathname={pathname}
                key="check-in-qr"
                title="Soát vé bằng mã QR"
                href={`/event-studio/events/${dynamicId}/check-in/qr`}
                icon={BarcodeIcon}
              />
              <NavItemCollapseChildItem
                pathname={pathname}
                key="check-in-face"
                title="Soát vé bằng khuôn mặt"
                onClick={() => handleRedirectToCheckInFace(event?.id || 0)}
                icon={ScanSmileyIcon}
              />
            </NavItemCollapse>
            <NavItem
              pathname={pathname}
              key="roles"
              title="Phân quyền"
              href={`/event-studio/events/${dynamicId}/roles`}
              icon={UsersIcon}
            />
            <NavItemCollapse pathname={pathname} key="role" title="Email" icon={Mailbox}>
              <NavItemCollapseChildItem
                pathname={pathname}
                key="email-template-1"
                title="Email marketing"
                href={`/event-studio/events/${dynamicId}/templates/email-marketing`}
                icon={ListDashesIcon}
              />
              <NavItemCollapseChildItem
                pathname={pathname}
                key="email-template-2"
                title="Template vé bị huỷ"
                href={`/event-studio/events/${dynamicId}/templates`}
                icon={PlusIcon}
              />
            </NavItemCollapse>
            <NavItemCollapse pathname={pathname} key="role" title="Mini App" icon={SquaresFour}>
              <NavItemCollapseChildItem
                pathname={pathname}
                key="email-template-1"
                title="Rating Online"
                href={`/event-studio/events/${dynamicId}/config-mini-app-rating-online`}
                icon={StarHalf}
              />
              <NavItemCollapseChildItem
                pathname={pathname}
                key="email-template-2"
                title="Dice roll"
                href={`/event-studio/events/${dynamicId}/templates`}
                icon={DiceSix}
              />
              <NavItemCollapseChildItem
                pathname={pathname}
                key="email-template-2"
                title="Lucky number"
                href={`/event-studio/events/${dynamicId}/templates`}
                icon={SpinnerBall}
              />
            </NavItemCollapse>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

interface NavItemProps extends Omit<NavItemConfig, 'items'> {
  pathname: string;
  children?: React.ReactNode;
}

function NavItem({ disabled, external, href, icon, matcher, pathname, title }: NavItemProps): React.JSX.Element {
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });
  const Icon = icon;

  return (
    <li>
      <Box
        {...(href
          ? {
            component: external ? 'a' : RouterLink,
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

function NavItemCollapse({
  disabled,
  external,
  href,
  icon,
  matcher,
  pathname,
  title,
  children,
}: NavItemProps): React.JSX.Element {
  const [open, setOpen] = React.useState(true); // State to manage collapse/expand
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });
  const Icon = icon;

  const handleToggle = () => {
    setOpen((prev) => !prev); // Toggle the state
  };

  // Function to check if any child is active
  const isChildActive = React.Children.toArray(children).some((child: any) => {
    return child.props.active; // Assuming that child items pass the `active` prop
  });

  // Effect to automatically keep open if a child is active
  React.useEffect(() => {
    if (isChildActive) {
      setOpen(true); // Force expand if any child is active
    }
  }, [isChildActive]);

  return (
    <Stack spacing={1}>
      <li>
        <Box
          {...(href
            ? {
              component: external ? 'a' : RouterLink,
              href,
              target: external ? '_blank' : undefined,
              rel: external ? 'noreferrer' : undefined,
            }
            : { role: 'button', onClick: handleToggle, cursor: 'pointer' })}
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
          <Box>
            {open ? <CaretDownIcon /> : <CaretLeftIcon />} {/* Toggle between icons */}
          </Box>
        </Box>
      </li>
      <li>
        <Collapse in={open} timeout="auto">
          {' '}
          {/* Manage collapse state */}
          <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {children}
          </Stack>
        </Collapse>
      </li>
    </Stack>
  );
}

function NavItemCollapseChildItem({
  disabled,
  external,
  href,
  icon,
  matcher,
  pathname,
  title,
  onClick,
}: NavItemProps): React.JSX.Element {
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });
  const Icon = icon;

  const handleClick = (event: React.MouseEvent) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    if (onClick) {
      event.preventDefault(); // Prevent default navigation behavior for onClick
      onClick();
    }
  };

  return (
    <li>
      <Box
        {...(href && !onClick
          ? {
              component: external ? 'a' : RouterLink,
              href,
              target: external ? '_blank' : undefined,
              rel: external ? 'noreferrer' : undefined,
            }
          : { role: 'button', onClick: handleClick })}
        sx={{
          alignItems: 'center',
          borderRadius: 1,
          color: 'var(--NavItem-color)',
          cursor: disabled ? 'not-allowed' : 'pointer',
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
          }),
          ...(active && {
            bgcolor: 'var(--NavItem-active-background)',
            color: 'var(--NavItem-active-color)',
          }),
        }}
      >
        <Box
          sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', flex: '0 0 auto', marginLeft: '24px' }}
        >
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
