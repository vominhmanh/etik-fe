"use client"
import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { Upload as UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';
import { CompaniesFilters } from '@/components/dashboard/integrations/integrations-filters';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import axios, { AxiosResponse } from 'axios';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import Chip from '@mui/material/Chip';
import { deepPurple, deepOrange, indigo, cyan, green, pink, yellow } from '@mui/material/colors';

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

const colorMap = {
  0: deepOrange[500], 
  1: deepPurple[500],
  2: green[500],
  3: cyan[500],
  4: indigo[500],
  5: pink[500],
  6: yellow[500],
  7: deepPurple[300],
};

export interface Ticket {
  id: number;
  holder: string;
  createdAt: string;
  checkInAt: string | null;
}

export interface Creator {
  id: number;
  fullName: string;
  email: string;
}


// Define the event response type
interface Event {
  id: number;
  name: string;
  organizer: string;
  description: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  place: string | null;
  locationUrl: string | null;
  bannerUrl: string;
  slug: string;
  locationInstruction: string | null;
};

export interface TicketCategory {
  id: number;
  name: string;
  type: string;
  price: number;
  avatar: string | null;
  quantity: number;
  sold: number;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  eventId: number;
  event: Event;
  customerId: number;
  email: string;
  name: string;
  gender: string;
  phoneNumber: string;
  address: string;
  dob: string | null;
  ticketCategory: TicketCategory;
  ticketQuantity: number;
  netPricePerOne: number;
  extraFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentOrderCode: string | null;
  paymentDueDatetime: string | null;
  paymentCheckoutUrl: string | null;
  paymentTransactionDatetime: string | null;
  note: string | null;
  status: string;
  createdBy: number | null;
  createdAt: string;
  tickets: Ticket[];
  createdSource: string;
  creator: Creator | null;
}


export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);

  React.useEffect(() => {
    const fetchTicketCategories = async () => {
      try {
        const response: AxiosResponse<Transaction[]> = await baseHttpServiceInstance.get(
          `/account/transactions/`
        );
        setTransactions(response.data);
      } catch (error) {
        console.error('Error fetching ticket categories:', error);
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
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardContent sx={{ flex: '1 1 auto' }}>
                <Stack spacing={2}>
                  <Stack spacing={1} direction={'row'}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mr: 2, width: '50px', height: '50px' }}>
                      <Avatar
                        href={null}
                        sx={{ height: '45px', width: '45px', fontSize: '2rem', borderRadius: '5px', bgcolor: colorMap[transaction.id % 8] }}
                        variant="square"
                      >
                        A
                        {/* {transaction.avatar ? '' : ticketCategory.name[0]} */}
                      </Avatar>
                    </Box>
                    <Stack spacing={0}>
                      <Typography align="left" variant="h6">
                        {transaction.event.name}
                      </Typography>
                      <Typography align="left" variant="body1">
                        {transaction.totalAmount.toLocaleString('vi-VN', {style : 'currency', currency : 'VND'})}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Typography align="left" variant="body1">
                    Số lượng: {transaction.ticketQuantity}
                  </Typography>
                  {/* <Typography align="left" variant="body1">
                    {ticketCategory.description ? ticketCategory.description : "Chưa có mô tả"}
                  </Typography> */}
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
                  <Button href={`/account/my-tickets/${transaction.id}`} size="small" startIcon={<EyeIcon />}>
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
