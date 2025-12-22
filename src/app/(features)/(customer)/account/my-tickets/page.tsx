"use client";
import { CompaniesFilters } from '@/components/dashboard/integrations/integrations-filters';
import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { CardMedia, Tooltip } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import {
  MapPin,
  WarningCircle,
  Clock as ClockIcon,
  CheckCircle,
  XCircle,
  Hourglass,
  Ticket,
  LockKey,
  ArrowsLeftRight,
  ArrowUUpLeft,
} from '@phosphor-icons/react/dist/ssr';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import { LocalizedLink } from '@/components/localized-link';
import * as React from 'react';

export interface ListTransactionEventResponse {
  slug: string;
  name: string;
  organizer: string;
  startDateTime?: Date;
  endDateTime?: Date;
  place?: string;
  bannerUrl?: string;
  avatarUrl?: string;
  locationInstruction?: string;
  timeInstruction?: string;
}

export interface TransactionResponse {
  id: number;
  ticketQuantity: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: Date;
  cancelRequestStatus: string | null;
  event: ListTransactionEventResponse;
}

// Helper to get status icon/color/label
const getPaymentStatusDetails = (
  paymentStatus: string,
  tt: (vi: string, en: string) => string
) => {
  switch (paymentStatus) {
    case 'waiting_for_payment':
      return {
        label: tt('Chờ thanh toán', 'Waiting for payment'),
        color: 'warning.main',
        icon: <Hourglass size={18} weight="fill" />,
      };
    case 'paid':
      return {
        label: tt('Đã thanh toán', 'Paid'),
        color: 'success.main',
        icon: <CheckCircle size={18} weight="fill" />,
      };
    case 'refund':
      return {
        label: tt('Đã hoàn tiền', 'Refunded'),
        color: 'text.secondary',
        icon: <ArrowUUpLeft size={18} weight="fill" />,
      };
    default:
      return {
        label: 'Unknown',
        color: 'default',
        icon: <WarningCircle size={18} />,
      };
  }
};

const getRowStatusDetails = (
  status: string,
  tt: (vi: string, en: string) => string
) => {
  switch (status) {
    case 'normal':
      return {
        label: tt('Bình thường', 'Normal'),
        color: 'success.main',
        icon: <CheckCircle size={18} color="var(--mui-palette-success-main)" weight="duotone" />,
      };
    case 'wait_for_response':
      return {
        label: tt('Đang chờ', 'Waiting'),
        color: 'warning.main',
        icon: <Hourglass size={18} weight="duotone" />,
      };
    case 'wait_for_transfering':
      return {
        label: tt('Chờ chuyển nhượng', 'Waiting for Transfer'),
        color: 'warning.main',
        icon: <Hourglass size={18} weight="duotone" />,
      };
    case 'transfered':
      return {
        label: tt('Đã chuyển nhượng', 'Transferred'),
        color: 'error.main',
        icon: <ArrowsLeftRight size={18} weight="duotone" />,
      };
    case 'customer_cancelled':
      return {
        label: tt('Huỷ bởi KH', 'Cancelled by Customer'),
        color: 'error.main',
        icon: <XCircle size={18} weight="duotone" />,
      };
    case 'staff_locked':
      return {
        label: tt('Khoá bởi NV', 'Locked by Staff'),
        color: 'error.main',
        icon: <LockKey size={18} weight="duotone" />,
      };
    default:
      return {
        label: 'Unknown',
        color: 'default',
        icon: <WarningCircle size={18} weight="duotone" />,
      };
  }
};

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt } = useTranslation();
  const [transactions, setTransactions] = React.useState<TransactionResponse[]>([]);
  const notificationCtx = React.useContext(NotificationContext);

  React.useEffect(() => {
    document.title = `${tt('Vé của tôi', 'My Tickets')} | ETIK`;
  }, [tt]);

  React.useEffect(() => {
    const fetchTicketCategories = async () => {
      try {
        const response: AxiosResponse<TransactionResponse[]> = await baseHttpServiceInstance.get(
          `/account/transactions`
        );
        setTransactions(response.data);
      } catch (error) {
        notificationCtx.error(tt('Lỗi', 'Error'), error);
      }
    };
    fetchTicketCategories();
  }, [params.event_id, tt, notificationCtx]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3} alignItems="center">
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">{tt('Vé của tôi', 'My Tickets')}</Typography>
        </Stack>
      </Stack>

      <CompaniesFilters />

      <Grid container spacing={2}>
        {transactions.map((transaction) => {
          const paymentInfo = getPaymentStatusDetails(transaction.paymentStatus, tt);
          const statusInfo = getRowStatusDetails(transaction.status, tt);

          return (
            <Grid key={transaction.id} xs={12} sm={6} md={4} lg={3}>
              <Card sx={{
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
              }}>
                <CardActionArea
                  component={LocalizedLink}
                  href={`/account/my-tickets/${transaction.id}`}
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  {/* Banner Image - Height increased to 120px */}
                  <Box sx={{ position: 'relative', height: 120 }}>
                    <CardMedia
                      component="img"
                      src={transaction.event.bannerUrl || ''}
                      alt={transaction.event.name}
                      sx={{
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.9)',
                      }}
                    />
                    {/* Overlaid Avatar - Positioned to overhang */}
                    <Box sx={{
                      position: 'absolute',
                      bottom: -16,
                      left: 12,
                      p: 0.5,
                      bgcolor: 'background.paper',
                      borderRadius: '50%',
                      zIndex: 1, // Ensure it's above content background if they touch
                    }}>
                      {transaction.event.avatarUrl ? (
                        <Avatar src={transaction.event.avatarUrl} sx={{ width: 36, height: 36 }} />
                      ) : (
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                          {(transaction.event.name[0] ?? 'A').toUpperCase()}
                        </Avatar>
                      )}
                    </Box>
                  </Box>

                  <CardContent sx={{ pt: 3, px: 1.5, pb: 1, flexGrow: 1 }}>
                    <Stack spacing={0.5}>
                      {/* Event Name - Removed extra mb */}
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        sx={{
                          lineHeight: 1.3,
                          fontSize: '0.95rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          height: '2.6em', // Approximate fixed height for 2 lines to align cards
                        }}
                      >
                        {transaction.event.name}
                      </Typography>

                      {/* Info Rows - Icon + Text */}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ClockIcon size={14} color="var(--mui-palette-text-secondary)" />
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {transaction.event.startDateTime
                            ? dayjs(transaction.event.startDateTime).format('HH:mm DD/MM/YYYY')
                            : tt('Chưa xác định', 'TBD')}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <MapPin size={14} color="var(--mui-palette-text-secondary)" />
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '90%' }}>
                          {transaction.event.place || tt('Chưa xác định', 'TBD')}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>

                  {/* Footer - Status Icons */}
                  <Box
                    sx={{
                      p: 1,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'action.hover',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    {/* Quantity */}
                    <Tooltip title={tt('Số lượng vé', 'Ticket Quantity')}>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.primary', bgcolor: 'background.paper', px: 0.8, py: 0.3, borderRadius: 1 }}>
                        <Ticket size={16} weight="duotone" />
                        <Typography variant="caption" fontWeight="bold">{transaction.ticketQuantity}</Typography>
                      </Stack>
                    </Tooltip>

                    {/* Status Icons Row */}
                    <Stack direction="row" spacing={1} alignItems="center">

                      {/* Payment Status */}
                      <Tooltip title={`${tt('Thanh toán', 'Payment')}: ${paymentInfo.label}`}>
                        <Box sx={{ color: paymentInfo.color, display: 'flex' }}>
                          {paymentInfo.icon}
                        </Box>
                      </Tooltip>

                      {/* Divider */}
                      <Box sx={{ width: 1, height: 12, bgcolor: 'divider' }} />

                      {/* Row/Ticket Status */}
                      <Tooltip title={`${tt('Trạng thái', 'Status')}: ${statusInfo.label}`}>
                        <Box sx={{ color: statusInfo.color, display: 'flex' }}>
                          {statusInfo.icon}
                        </Box>
                      </Tooltip>

                      {/* Cancellation Warning */}
                      {transaction.cancelRequestStatus === 'pending' && (
                        <Tooltip title={tt('Khách hàng yêu cầu hủy', 'Cancellation requested')}>
                          <Box sx={{ color: 'error.main', display: 'flex' }}>
                            <WarningCircle size={18} weight="fill" />
                          </Box>
                        </Tooltip>
                      )}
                    </Stack>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}
