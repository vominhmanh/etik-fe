"use client"
import { CompaniesFilters } from '@/components/dashboard/integrations/integrations-filters';
import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { CardMedia, Tooltip } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import { cyan, deepOrange, deepPurple, green, indigo, pink, yellow } from '@mui/material/colors';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { MapPin, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import { LocalizedLink } from '@/components/localized-link';

import * as React from 'react';

const getStatusMap = (tt: (vi: string, en: string) => string) => ({
  not_opened_for_sale: { label: tt('Chưa mở bán', 'Not Open for Sale'), color: 'secondary' },
  on_sale: { label: tt('Đang mở bán', 'On Sale'), color: 'success' },
  out_of_stock: { label: tt('Đã hết', 'Sold Out'), color: 'secondary' },
  temporarily_locked: { label: tt('Đang tạm khoá', 'Temporarily Locked'), color: 'warning' },
});

const getTypeMap = (tt: (vi: string, en: string) => string) => ({
  private: { label: tt('Nội bộ', 'Private'), color: 'warning' },
  public: { label: tt('Công khai', 'Public'), color: 'primary' },
});

type ColorMap = {
  [key: number]: string
}

const colorMap: ColorMap = {
  0: deepOrange[500],
  1: deepPurple[500],
  2: green[500],
  3: cyan[500],
  4: indigo[500],
  5: pink[500],
  6: yellow[500],
  7: deepPurple[300],
};

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


// Function to map payment statuses to corresponding labels and colors
const getPaymentStatusDetails = (
  paymentStatus: string,
  tt: (vi: string, en: string) => string
): { label: string; color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (paymentStatus) {
    case 'waiting_for_payment':
      return { label: tt('Chờ thanh toán', 'Waiting for payment'), color: 'warning' };
    case 'paid':
      return { label: tt('Đã thanh toán', 'Paid'), color: 'success' };
    case 'refund':
      return { label: tt('Đã hoàn tiền', 'Refunded'), color: 'secondary' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

// Function to map row statuses to corresponding labels and colors
const getRowStatusDetails = (
  status: string,
  tt: (vi: string, en: string) => string
): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
    case 'normal':
      return { label: tt('Trạng thái: Bình thường', 'Status: Normal'), color: 'success' };
    case 'wait_for_response':
      return { label: tt('Đang chờ', 'Waiting'), color: 'warning' };
    case 'wait_for_transfering':
      return { label: tt('Chờ chuyển nhượng', 'Waiting for Transfer'), color: 'warning' };
    case 'transfered':
      return { label: tt('Đã chuyển nhượng', 'Transferred'), color: 'error' };
    case 'customer_cancelled':
      return { label: tt('Trạng thái: Huỷ bởi KH', 'Status: Cancelled by Customer'), color: 'error' };
    case 'staff_locked':
      return { label: tt('Trạng thái: Khoá bởi NV', 'Status: Locked by Staff'), color: 'error' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt } = useTranslation();
  const statusMap = React.useMemo(() => getStatusMap(tt), [tt]);
  const typeMap = React.useMemo(() => getTypeMap(tt), [tt]);
  const [transactions, setTransactions] = React.useState<TransactionResponse[]>([]);
  const notificationCtx = React.useContext(NotificationContext);

  React.useEffect(() => {
    document.title = `${tt('Vé của tôi', 'My Tickets')} | ETIK - ${tt('Vé điện tử & Quản lý sự kiện', 'E-tickets & Event Management')}`;
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
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">{tt('Vé của tôi', 'My Tickets')}</Typography>
        </Stack>
        <div>

        </div>
      </Stack>
      <CompaniesFilters />
      <Grid container spacing={3}>
        {transactions.map((transaction) => (
          <Grid key={transaction.id} lg={4} md={6} xs={12}>
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardActionArea
                component={LocalizedLink}
                href={`/account/my-tickets/${transaction.id}`}
                sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', height: '100%' }}
              >
                <CardMedia
                  sx={{ height: 170 }}
                  image={transaction.event.bannerUrl || ''}
                  title={transaction.event.name}
                />
                <CardContent>
                  <Stack spacing={2}>
                    <Stack spacing={1} direction={'row'} sx={{ alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mr: 2, width: '80px', height: '80px' }}>
                        {transaction.event.avatarUrl ? (
                          <Box component="img" src={transaction.event.avatarUrl} sx={{ height: '80px', width: '80px', borderRadius: '50%' }} />
                        ) : (
                          <Avatar sx={{ height: '80px', width: '80px', fontSize: '2rem' }}>
                            {(transaction.event.name[0] ?? 'a').toUpperCase()}
                          </Avatar>
                        )}
                      </Box>
                      <Typography align="center" variant="h5">
                        {transaction.event.name}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {transaction.event.startDateTime && transaction.event.endDateTime
                          ? `${dayjs(transaction.event.startDateTime || 0).format('HH:mm DD/MM/YYYY')} - ${dayjs(transaction.event.endDateTime || 0).format('HH:mm DD/MM/YYYY')}`
                          : tt('Chưa xác định', 'To be determined')} {transaction.event.timeInstruction ? `(${transaction.event.timeInstruction})` : ''}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <MapPin fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {transaction.event.place ? transaction.event.place : tt('Chưa xác định', 'To be determined')} {transaction.event.locationInstruction ? `(${transaction.event.locationInstruction})` : ''}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Stack spacing={2} direction={'row'} sx={{ mt: 2 }}>
                    <Chip color='success' size='small' label={`${transaction.ticketQuantity} ${tt('vé', 'tickets')}`} />
                    <Chip
                      color={getPaymentStatusDetails(transaction.paymentStatus, tt).color}
                      label={getPaymentStatusDetails(transaction.paymentStatus, tt).label}
                      size='small'
                    />
                    <Stack spacing={0} direction={'row'}>
                      <Chip
                        color={getRowStatusDetails(transaction.status, tt).color}
                        label={getRowStatusDetails(transaction.status, tt).label}
                        size='small'
                      />
                      {transaction.cancelRequestStatus == 'pending' &&
                        <Tooltip title={
                          <Typography>{tt('Khách hàng yêu cầu hủy', 'Customer requested cancellation')}</Typography>
                        }>
                          <Chip size='small' color={'error'} label={<WarningCircle size={16} />} />
                        </Tooltip>
                      }
                    </Stack>

                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      {/* <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination count={3} size="small" />
      </Box> */}
    </Stack>
  );
}
