"use client"
import { CompaniesFilters } from '@/components/dashboard/integrations/integrations-filters';
import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { CardMedia, Tooltip } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import { cyan, deepOrange, deepPurple, green, indigo, pink, yellow } from '@mui/material/colors';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { MapPin, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import RouterLink from 'next/link';
import * as React from 'react';

const statusMap = {
  not_opened_for_sale: { label: 'Chưa mở bán', color: 'secondary' },
  on_sale: { label: 'Đang mở bán', color: 'success' },
  out_of_stock: { label: 'Đã hết', color: 'secondary' },
  temporarily_locked: { label: 'Đang tạm khoá', color: 'warning' },
};

const typeMap = {
  private: { label: 'Nội bộ', color: 'warning' },
  public: { label: 'Công khai', color: 'primary' },
};

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
  paymentStatus: string
): { label: string; color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (paymentStatus) {
    case 'waiting_for_payment':
      return { label: 'Chờ thanh toán', color: 'warning' };
    case 'paid':
      return { label: 'Đã thanh toán', color: 'success' };
    case 'refund':
      return { label: 'Đã hoàn tiền', color: 'secondary' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

// Function to map row statuses to corresponding labels and colors
const getRowStatusDetails = (status: string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
    case 'normal':
      return { label: 'Trạng thái: Bình thường', color: 'success' };
    case 'wait_for_response':
      return { label: 'Đang chờ', color: 'warning' };
    case 'customer_cancelled':
      return { label: 'Trạng thái: Huỷ bởi KH', color: 'error' }; // error for danger
    case 'staff_locked':
      return { label: 'Trạng thái: Khoá bởi NV', color: 'error' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const [transactions, setTransactions] = React.useState<TransactionResponse[]>([]);
  const notificationCtx = React.useContext(NotificationContext);

  React.useEffect(() => {
    document.title = "Vé của tôi | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);

  React.useEffect(() => {
    const fetchTicketCategories = async () => {
      try {
        const response: AxiosResponse<TransactionResponse[]> = await baseHttpServiceInstance.get(
          `/account/transactions`
        );
        setTransactions(response.data);
      } catch (error) {
        notificationCtx.error('Lỗi', error);
      }
    };

    fetchTicketCategories();
  }, [params.event_id]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Vé của tôi</Typography>
        </Stack>
        <div>

        </div>
      </Stack>
      <CompaniesFilters />
      <Grid container spacing={3}>
        {transactions.map((transaction) => (
          <Grid key={transaction.id} lg={4} md={6} xs={12}>
            <Card sx={{ display: 'flex', flexDirection: 'column'}}>
              <CardMedia
                sx={{ height: 170 }}
                image={transaction.event.bannerUrl || ''}
                title={transaction.event.name}>
              </CardMedia>
              <CardContent>
                <Stack spacing={2}>
                  <Stack spacing={1} direction={'row'} sx={{ alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mr: 2, width: '80px', height: '80px' }}>
                      {transaction.event.avatarUrl ?
                        <Box component="img" src={transaction.event.avatarUrl} sx={{ height: '80px', width: '80px', borderRadius: '50%' }} />
                        :
                        <Avatar sx={{ height: '80px', width: '80px', fontSize: '2rem' }}>
                          {(transaction.event.name[0] ?? 'a').toUpperCase()}
                        </Avatar>}
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
                        : 'Chưa xác định'} {transaction.event.timeInstruction ? `(${transaction.event.timeInstruction})` : ''}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <MapPin fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {transaction.event.place ? transaction.event.place : 'Chưa xác định'} {transaction.event.locationInstruction ? `(${transaction.event.locationInstruction})` : ''}
                    </Typography>
                  </Stack>
                </Stack>
                <Stack spacing={2} direction={'row'} sx={{ mt: 2 }}>
                  <Chip color='success' size='small' label={`${transaction.ticketQuantity} vé`} />
                  <Chip
                    color={getPaymentStatusDetails(transaction.paymentStatus).color}
                    label={getPaymentStatusDetails(transaction.paymentStatus).label}
                    size='small'
                  />
                  <Stack spacing={0} direction={'row'}>
                    <Chip
                      color={getRowStatusDetails(transaction.status).color}
                      label={getRowStatusDetails(transaction.status).label}
                      size='small'
                    />
                    {transaction.cancelRequestStatus == 'pending' &&
                      <Tooltip title={
                        <Typography>Khách hàng yêu cầu hủy</Typography>
                      }>
                        <Chip size='small' color={'error'} label={<WarningCircle size={16} />} />
                      </Tooltip>
                    }
                  </Stack>

                </Stack>
              </CardContent>
              <Divider />
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                <Stack sx={{ alignItems: 'center' }} direction="row" spacing={1}>
                  {/* <Chip
                    label={statusMap[ticketCategory.status]?.label}
                    color={statusMap[ticketCategory.status]?.color}
                    size="small"
                  />
                  <Chip
                    label={typeMap[ticketCategory.type]?.label}
                    color={typeMap[ticketCategory.type]?.color}
                    size="small"
                  /> */}
                </Stack>
                <Stack sx={{ alignItems: 'center' }} direction="row" spacing={1}>
                  <Button component={RouterLink} href={`/account/my-tickets/${transaction.id}`} size="small" startIcon={<EyeIcon />}>
                    Xem chi tiết
                  </Button>
                </Stack>
              </Stack>
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
