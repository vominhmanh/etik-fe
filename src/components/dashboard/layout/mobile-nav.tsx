'use client';

import * as React from 'react';
import { LocalizedLink } from '@/components/homepage/localized-link';

import { usePathname } from 'next/navigation';
import { Collapse, IconButton, Link } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ArrowSquareUpRight as ArrowSquareUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowSquareUpRight';
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
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';

import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';
import { isNavItemActive } from '@/lib/is-nav-item-active';

import { getNavItems } from './config';
import { Armchair, CurrencyCircleDollar, DiceSix, FileText, ImageSquare, Invoice, Mailbox, Popcorn, SealPercent, Sliders, SpinnerBall, SquaresFour, StackPlus, StarHalf, Storefront, Tag, UserList } from '@phosphor-icons/react/dist/ssr';
import NotificationContext from '@/contexts/notification-context';
import { AxiosResponse } from 'axios';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import logoImage from "@/images/etik-logo-transparent-dark.png";
import logoImageEn from "@/images/etik-logo-transparent-dark-en.png";
import Image from "next/image";
import { useTranslation } from '@/contexts/locale-context';

export interface MobileNavProps {
  onClose?: () => void;
  open?: boolean;
  items?: NavItemConfig[];
}

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

export function MobileNav({ open, onClose }: MobileNavProps): React.JSX.Element {
  const { tt, locale } = useTranslation();
  const pathname = usePathname();
  const normalizedPathname = React.useMemo(() => {
    if (!pathname) return '/';
    if (locale && pathname.startsWith(`/${locale}`)) {
      const trimmed = pathname.slice(locale.length + 1);
      return trimmed ? trimmed : '/';
    }
    return pathname;
  }, [pathname, locale]);
  const logo = locale === 'en' ? logoImageEn : logoImage;
  const [dynamicId, setDynamicId] = React.useState<string | null>(null);
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const notificationCtx = React.useContext(NotificationContext);
  const navItems = React.useMemo(() => getNavItems(tt), [tt]);

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
          notificationCtx.error(tt('Lỗi:', 'Error:'), error);
        }
      };
      fetchEventDetails();
    }
  }, [dynamicId]);


  return (
    <Drawer
      PaperProps={{
        sx: {
          '--MobileNav-background': 'var(--mui-palette-neutral-950)',
          '--MobileNav-color': 'var(--mui-palette-common-white)',
          '--NavItem-color': 'var(--mui-palette-neutral-300)',
          '--NavItem-hover-background': 'rgba(255, 255, 255, 0.04)',
          '--NavItem-active-background': 'var(--mui-palette-primary-main)',
          '--NavItem-active-color': 'var(--mui-palette-primary-contrastText)',
          '--NavItem-disabled-color': 'var(--mui-palette-neutral-500)',
          '--NavItem-icon-color': 'var(--mui-palette-neutral-400)',
          '--NavItem-icon-active-color': 'var(--mui-palette-primary-contrastText)',
          '--NavItem-icon-disabled-color': 'var(--mui-palette-neutral-600)',
          bgcolor: 'var(--MobileNav-background)',
          color: 'var(--MobileNav-color)',
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '100%',
          scrollbarWidth: 'none',
          width: 'var(--MobileNav-width)',
          zIndex: 'var(--MobileNav-zIndex)',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      }}
      onClose={onClose}
      open={open}
    >
      <Stack spacing={2} sx={{ p: 3 }}>
        <Box sx={{ display: 'inline-flex' }}>
          <IconButton sx={{ color: "var(--mui-palette-neutral-400)" }} component={LocalizedLink} href="/event-studio/events/">
            <CaretLeftIcon />
          </IconButton>
          <LocalizedLink href={paths.dashboard.eventStudio} style={{ display: 'inline-flex' }}>
            <Image
              src={logo}
              alt="Left Logo"
              height={40}
              className="mr-2" // Khoảng cách giữa hai logo
            />
          </LocalizedLink>
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
          <Box sx={{ flex: '1 1 auto' }}>
            <Typography color="var(--mui-palette-neutral-400)" variant="body2">
              Event
            </Typography>
            <Typography color="inherit" variant="subtitle1" sx={{ fontSize: '0.875rem' }}>
              {event?.name || 'Untitled Event'}
            </Typography>
          </Box>
          <CaretUpDownIcon />
        </Box>
      </Stack>
      <Divider sx={{ borderColor: 'var(--mui-palette-neutral-700)' }} />
      <Box component="nav" sx={{ flex: '1 1 auto', p: '12px' }}>
        <Stack component="ul" key={navItems[0].key} spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
          <NavItem
            pathname={normalizedPathname}
            key="overview"
            title={tt("Tổng quan", "Overview")}
            href={`/event-studio/events/${dynamicId}`}
            icon={ChartPieIcon}
            onClose={onClose}
          />
          <NavItemCollapse pathname={normalizedPathname} key="configuration" title={tt("Thiết kế sự kiện", "Event Design")} icon={PlugsConnectedIcon} onClose={onClose}>
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="configuration-event-info"
              title={tt("Thông tin & Hiển thị", "Information & Display")}
              href={`/event-studio/events/${dynamicId}/event-detail`}
              icon={InfoIcon}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="configuration-shows-ticket-categories"
              title={tt("Thiết lập vé", "Ticket Categories setup")}
              href={`/event-studio/events/${dynamicId}/shows`}
              icon={TicketIcon}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="configuration-shows-concessions"
              title={tt("Thiết lập bỏng nước", "Concessions setup")}
              href={`/event-studio/events/${dynamicId}/concessions`}
              icon={Popcorn}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="advanced-settings"
              title={tt("Cài đặt nâng cao", "Advanced Settings")}
              href={`/event-studio/events/${dynamicId}/advanced-settings`}
              icon={Sliders}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="revenue-and-fee"
              title={tt("Doanh thu & Phí dịch vụ", "Revenue & Service Fee")}
              href={`/event-studio/events/${dynamicId}/revenue-and-fee`}
              icon={CurrencyCircleDollar}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="etik-forms"
              title={tt("ETIK Forms", "ETIK Forms")}
              href={`/event-studio/events/${dynamicId}/etik-forms`}
              icon={FileText}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="invitation-letter-design"
              title={tt("Thiết kế thư mời", "Invitation Letter Design")}
              href={`/event-studio/events/${dynamicId}/invitation-letter-design`}
              icon={ImageSquare}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="ticket-tag-design"
              title={tt("Thiết kế tem vé", "Ticket Tag Design")}
              href={`/event-studio/events/${dynamicId}/ticket-tag-designs`}
              icon={Tag}
              onClose={onClose}
            />

            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="vouchers"
              title={tt("Khuyến mãi", "Vouchers")}
              href={`/event-studio/events/${dynamicId}/vouchers`}
              icon={SealPercent}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="seat-maps"
              title={tt("Sơ đồ ghế", "Seat Maps")}
              href={`/event-studio/events/${dynamicId}/seat-maps`}
              icon={Invoice}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="tax-invoice"
              title={tt("Hóa đơn thuế", "Tax Invoice")}
              href={`/event-studio/events/${dynamicId}/tax-invoices`}
              icon={Invoice}
              onClose={onClose}
            />
          </NavItemCollapse>
          <NavItemCollapse pathname={normalizedPathname} key="transactions" title={tt("Bán vé & Khách hàng", "Ticket Sales & Customers")} icon={TicketIcon} onClose={onClose}>
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="transactions-create"
              title={tt("Tạo đơn hàng", "Create Order")}
              caption={tt("Dành cho quản trị viên sự kiện", "For Event Manager")}
              href={`/event-studio/events/${dynamicId}/transactions/create`}
              icon={PlusIcon}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="transactions-create-bulk"
              title={tt("Tạo đơn hàng theo lô", "Create Bulk Orders (Admin)")}
              href={`/event-studio/events/${dynamicId}/transactions/create-bulk`}
              icon={StackPlus}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="transactions-list"
              title={tt("Danh sách đơn hàng", "Order List")}
              href={`/event-studio/events/${dynamicId}/transactions`}
              icon={ListDashesIcon}
              onClose={onClose}
            />
            {/* <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="tickets-list"
              title={tt("Danh sách khách hàng & vé", "Customer & Ticket List")}
              href={`/event-studio/events/${dynamicId}/tickets`}
              icon={UserList}
              onClose={onClose}
            /> */}
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="transactions-create"
              title={tt("Trang marketplace", "Create Order")}
              caption={tt("Trang khách hàng tự mua vé", "Customer Self Buy Page")}
              href={`/event-studio/events/${dynamicId}/marketplace-settings`}
              icon={Storefront}
              onClose={onClose}
            />
          </NavItemCollapse>
          <NavItemCollapse pathname={normalizedPathname} key="check-in" title={tt("Soát vé", "Check-in")} icon={DoorIcon} onClose={onClose}>
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="check-in-qr"
              title={tt("Soát vé bằng mã QR", "Check-in with QR Code")}
              href={`/event-studio/events/${dynamicId}/check-in/qr`}
              icon={BarcodeIcon}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="check-in-face"
              title={tt("Soát vé bằng khuôn mặt", "Face Check-in")}
              href={`https://ekyc.etik.vn/check-in-face`}
              icon={ScanSmileyIcon}
              onClose={onClose}
            />
          </NavItemCollapse>
          <NavItem
            pathname={normalizedPathname}
            key="roles"
            title={tt("Phân quyền", "Roles & Permissions")}
            href={`/event-studio/events/${dynamicId}/roles`}
            icon={UsersIcon}
            onClose={onClose}
          />
          <NavItemCollapse pathname={normalizedPathname} key="email-template" title="Email" icon={Mailbox} onClose={onClose}>
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="email-template-1"
              title={tt("Email marketing", "Email Marketing")}
              href={`/event-studio/events/${dynamicId}/templates/email-marketing`}
              icon={ListDashesIcon}
              onClose={onClose}
            />
            {/* <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="email-template-2"
              title={tt("Template vé bị huỷ", "Cancelled Ticket Template")}
              href={`/event-studio/events/${dynamicId}/templates`}
              icon={PlusIcon}
              onClose={onClose}
            /> */}
          </NavItemCollapse>
          <NavItemCollapse pathname={normalizedPathname} key="mini-app" title="Mini App" icon={SquaresFour} onClose={onClose}>
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="welcome-banner"
              title={tt("Banner chào mừng", "Welcome Banner")}
              href={`/event-studio/events/${dynamicId}/config-mini-app-welcome-banner`}
              icon={ImageSquare}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="email-template-1"
              title={tt("Chấm điểm và khảo sát", "Rating Online")}
              href={`/event-studio/events/${dynamicId}/config-mini-app-rating-online`}
              icon={StarHalf}
              onClose={onClose}
            />
            {/* <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="email-template-2"
              title={tt("Xúc xắc", "Dice roll")}
              href={`/event-studio/events/${dynamicId}/templates`}
              icon={DiceSix}
              onClose={onClose}
            /> */}
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="email-template-3"
              title={tt("Con số may mắn", "Lucky Number")}
              href={`/event-studio/events/${dynamicId}/config-mini-app-lucky-draw`}
              icon={SpinnerBall}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="email-template-4"
              title={tt("Vòng quay may mắn", "Lucky Wheel")}
              href={`/event-studio/events/${dynamicId}/config-mini-app-lucky-wheel`}
              icon={SpinnerBall}
              onClose={onClose}
            />
            <NavItemCollapseChildItem
              pathname={normalizedPathname}
              key="config-mini-app-voting"
              title={tt("Bình chọn", "Voting")}
              href={`/event-studio/events/${dynamicId}/config-mini-app-voting`}
              icon={SpinnerBall}
              onClose={onClose}
            />

          </NavItemCollapse>
        </Stack>
      </Box>
    </Drawer>
  );
}

interface NavItemProps extends Omit<NavItemConfig, 'items'> {
  pathname: string;
  children?: React.ReactNode;
  onClose?: () => void;
  caption?: string;
}

function NavItem({ disabled, external, href, icon, matcher, pathname, title, onClose }: NavItemProps): React.JSX.Element {
  const active = isNavItemActive({ disabled, external, href, matcher, pathname });
  const Icon = icon;

  const handleClick = (event: React.MouseEvent) => {
    // Don't prevent default - let navigation happen immediately
    // Only delay the drawer closing
    if (href && onClose) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <li>
      <Box
        {...(href
          ? {
            component: external ? 'a' : LocalizedLink,
            href,
            target: external ? '_blank' : undefined,
            rel: external ? 'noreferrer' : undefined,
            onClick: handleClick,
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
              component: external ? 'a' : LocalizedLink,
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
  onClose,
  caption,
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
      // For custom onClick, still delay drawer closing
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
      return;
    }

    // Don't prevent default - let navigation happen immediately
    // Only delay the drawer closing
    if (href && onClose) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <li>
      <Box
        {...(href && !onClick
          ? {
            component: external ? 'a' : LocalizedLink,
            href,
            target: external ? '_blank' : undefined,
            rel: external ? 'noreferrer' : undefined,
            onClick: handleClick,
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
          {caption && (
            <Typography
              component="span"
              sx={{ color: active ? 'var(--mui-palette-neutral-200)' : 'var(--mui-palette-neutral-500)', fontSize: '0.75rem', lineHeight: '1', display: 'block', marginTop: '-4px' }}
            >
              {caption}
            </Typography>
          )}
        </Box>
      </Box>
    </li>
  );
}
