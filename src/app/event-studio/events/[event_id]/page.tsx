"use client"
import * as React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import dayjs from 'dayjs';

import { Budget } from '@/components/dashboard/overview/budget';
import { CheckIn } from '@/components/dashboard/overview/check-in';
import { LatestOrders } from '@/components/dashboard/overview/latest-orders';
import { LatestProducts } from '@/components/dashboard/overview/latest-products';
import { Refund } from '@/components/dashboard/overview/refund';
import { Sales } from '@/components/dashboard/overview/sales';
import { TasksProgress } from '@/components/dashboard/overview/tasks-progress';
import { TotalCustomers } from '@/components/dashboard/overview/total-customers';
import { TotalProfit } from '@/components/dashboard/overview/total-profit';
import { Traffic } from '@/components/dashboard/overview/traffic';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Avatar, Box, CardMedia, MenuItem, Select, Stack, TextField } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import { ArrowSquareIn } from '@phosphor-icons/react/dist/ssr';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { AxiosResponse } from 'axios';
import NotificationContext from '@/contexts/notification-context';
import ReactQuill from 'react-quill';

// Define the event response type
type EventResponse = {
  id: number;
  name: string;
  organizer: string;
  organizerEmail: string;
  organizerPhoneNumber: string;
  description: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  place: string | null;
  locationUrl: string | null;
  bannerUrl: string;
  avatarUrl: string;
  slug: string;
  secureApiKey: string;
  locationInstruction: string | null;
  displayOnMarketplace: boolean;
};

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
 
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const { event_id } = params;
  const [description, setDescription] = React.useState<string>('');
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    document.title = `${event?.name || ''} | ETIK - Vé điện tử & Quản lý sự kiện`;
  }, [event]);

  React.useEffect(() => {
    if (event_id) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
            `/event-studio/events/${event_id}`
          );
          setEvent(response.data);
          setDescription(response.data.description || '');
        } catch (error) {
          notificationCtx.error('Error fetching event details:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEventDetails();
    }
  }, [event_id]);

  return (
    <>
      <Backdrop
        open={isLoading}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          marginLeft: '0px !important',
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Grid container spacing={3} sx={{marginBottom: '20px'}}>
        <Grid lg={8} md={6} xs={12}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: 16 / 6, // 16:9 aspect ratio (modify as needed)
              overflow: 'hidden',
              border: 'grey 1px',
              borderRadius: '20px',
              backgroundColor: 'gray',
            }}
          >
            <img
              src={event?.bannerUrl}
              alt="Car"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 'auto',
                objectFit: 'cover', // or 'contain' depending on your preference
              }}
            />
          </Box>
        </Grid>
        <Grid lg={4} md={6} xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent
              sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <Stack direction="column" spacing={2}>
                <Stack direction="row" spacing={2} style={{ alignItems: 'center' }}>
                  <div>
                    {event?.avatarUrl ?
                      <img src={event?.avatarUrl} style={{ height: '80px', width: '80px', borderRadius: '50%' }} />
                      :
                      <Avatar sx={{ height: '80px', width: '80px', fontSize: '2rem' }}>
                        {event?.name[0].toUpperCase()}
                      </Avatar>}
                  </div>
                  <Typography variant="h5" sx={{ width: '100%', textAlign: 'center' }}>
                    {event?.name}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <HouseLineIcon fontSize="var(--icon-fontSize-sm)" />
                  <Typography color="text.secondary" display="inline" variant="body2">
                    Đơn vị tổ chức: {event?.organizer}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                  <Typography color="text.secondary" display="inline" variant="body2">
                    {event?.startDateTime && event?.endDateTime
                      ? `${dayjs(event.startDateTime || 0).format('HH:mm:ss DD/MM/YYYY')} - ${dayjs(event.endDateTime || 0).format('HH:mm:ss DD/MM/YYYY')}`
                      : 'Chưa xác định'}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                  <Typography color="text.secondary" display="inline" variant="body2">
                    {event?.place ? event?.place : 'Chưa xác định'}
                  </Typography>
                </Stack>
              </Stack>
              <div style={{ marginTop: '20px' }}>
                <Button
                  fullWidth
                  variant="contained"
                  target="_blank"
                  href={`/events/${event?.slug}`}
                  size="small"
                  endIcon={<ArrowSquareIn />}
                >
                  Đến trang Marketplace của sự kiện
                </Button>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid lg={3} sm={6} xs={12}>
          <Budget diff={12} trend="up" sx={{ height: '100%' }} value="$24k" />
        </Grid>
        <Grid lg={3} sm={6} xs={12}>
          <TotalCustomers diff={16} trend="down" sx={{ height: '100%' }} value="1.6k" />
        </Grid>
        <Grid lg={3} sm={6} xs={12}>
          <TasksProgress sx={{ height: '100%' }} value={75.5} />
        </Grid>
        <Grid lg={3} sm={6} xs={12}>
          <CheckIn diff={12} trend="up" sx={{ height: '100%' }} value="$24k" />
        </Grid>
        <Grid lg={3} sm={6} xs={12}>
          <TotalProfit sx={{ height: '100%' }} value="$15k" />
        </Grid>
        <Grid lg={3} sm={6} xs={12}>
          <Refund diff={12} trend="up" sx={{ height: '100%' }} value="$24k" />
        </Grid>

        <Grid lg={8} xs={12}>
          <Sales
            chartSeries={[
              { name: 'This year', data: [18, 16, 5, 8, 3, 14, 14, 16, 17, 19, 18, 20] },
              { name: 'Last year', data: [12, 11, 4, 6, 2, 9, 9, 10, 11, 12, 13, 13] },
            ]}
            sx={{ height: '100%' }}
          />
        </Grid>
        <Grid lg={4} md={6} xs={12}>
          <Traffic chartSeries={[63, 15, 22]} labels={['Desktop', 'Tablet', 'Phone']} sx={{ height: '100%' }} />
        </Grid>
        <Grid lg={4} md={6} xs={12}>
          <LatestProducts
            products={[
              {
                id: 'PRD-005',
                name: 'Soja & Co. Eucalyptus',
                image: '/assets/product-5.png',
                updatedAt: dayjs().subtract(18, 'minutes').subtract(5, 'hour').toDate(),
              },
              {
                id: 'PRD-004',
                name: 'Necessaire Body Lotion',
                image: '/assets/product-4.png',
                updatedAt: dayjs().subtract(41, 'minutes').subtract(3, 'hour').toDate(),
              },
              {
                id: 'PRD-003',
                name: 'Ritual of Sakura',
                image: '/assets/product-3.png',
                updatedAt: dayjs().subtract(5, 'minutes').subtract(3, 'hour').toDate(),
              },
              {
                id: 'PRD-002',
                name: 'Lancome Rouge',
                image: '/assets/product-2.png',
                updatedAt: dayjs().subtract(23, 'minutes').subtract(2, 'hour').toDate(),
              },
              {
                id: 'PRD-001',
                name: 'Erbology Aloe Vera',
                image: '/assets/product-1.png',
                updatedAt: dayjs().subtract(10, 'minutes').toDate(),
              },
            ]}
            sx={{ height: '100%' }}
          />
        </Grid>
        <Grid lg={8} md={12} xs={12}>
          <LatestOrders
            orders={[
              {
                id: 'ORD-007',
                customer: { name: 'Ekaterina Tankova' },
                amount: 30.5,
                status: 'pending',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-006',
                customer: { name: 'Cao Yu' },
                amount: 25.1,
                status: 'delivered',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-004',
                customer: { name: 'Alexa Richardson' },
                amount: 10.99,
                status: 'refunded',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-003',
                customer: { name: 'Anje Keizer' },
                amount: 96.43,
                status: 'pending',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-002',
                customer: { name: 'Clarke Gillebert' },
                amount: 32.54,
                status: 'delivered',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-001',
                customer: { name: 'Adam Denisov' },
                amount: 16.76,
                status: 'delivered',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
            ]}
            sx={{ height: '100%' }}
          />
        </Grid>
      </Grid>
    </>
  );
}
