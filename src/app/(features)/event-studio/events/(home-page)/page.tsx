'use client';

import React, { useEffect, useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { CardMedia } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import RouterLink from 'next/link';
import NotificationContext from '@/contexts/notification-context';
import { Storefront } from '@phosphor-icons/react/dist/ssr';

// Define response type for the events
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
  bannerUrl: string | null;
  slug: string;
  secureApiKey: string;
  displayOnMarketplace: boolean;
};

export default function Page(): React.JSX.Element {
  React.useEffect(() => {
    document.title = `Quản lý sự kiện | ETIK - Vé điện tử & Quản lý sự kiện`;
  }, []);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const notificationCtx = React.useContext(NotificationContext);

  // Fetch all events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<EventResponse[]> = await baseHttpServiceInstance.get('/event-studio/events');
        setEvents(response.data);
      } catch (error) {
        notificationCtx.error('Lỗi:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <Stack spacing={3}>
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
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Sự kiện của tôi</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {/* <Button color="inherit" startIcon={<UploadIcon fontSize="var(--icon-fontSize-md)" />}>
              Import
            </Button>
            <Button color="inherit" startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)" />}>
              Export
            </Button> */}
          </Stack>
        </Stack>
        <div>
          <Button
            startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
            variant="contained"
            component={RouterLink}
            href="/event-studio/events/create"
          >
            Thêm
          </Button>
        </div>
      </Stack>

      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid key={event.id} lg={4} sm={6} xs={12}>
            <Card>
              <CardMedia sx={{ height: 140 }} image={event.bannerUrl ? event.bannerUrl : ''} title={event.name} />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {event.name}
                </Typography>
                <Stack direction="column" spacing={2} sx={{ alignItems: 'left', mt: 2 }}>
                  <Stack sx={{ alignItems: 'left' }} direction="row" spacing={1}>
                    <HouseLineIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      Đơn vị tổ chức: {event.organizer}
                    </Typography>
                  </Stack>
                  <Stack sx={{ alignItems: 'left' }} direction="row" spacing={1}>
                    <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {event.startDateTime && event.endDateTime
                        ? `${dayjs(event.startDateTime || 0).format('HH:mm DD/MM/YYYY')} - ${dayjs(event.endDateTime || 0).format('HH:mm DD/MM/YYYY')}`
                        : 'Chưa xác định'}
                    </Typography>
                  </Stack>
                  <Stack sx={{ alignItems: 'left' }} direction="row" spacing={1}>
                    <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {event.place ? event.place : 'Chưa xác định'}
                    </Typography>
                  </Stack>
                  <Stack sx={{ alignItems: 'left' }} direction="row" spacing={1}>
                    <Storefront fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {event.displayOnMarketplace ? "Đang hiển thị trên Marketplace" : 'Không hiển thị trên Marketplace'}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
              <Divider />
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                <Button component={RouterLink}
                  href={`/event-studio/events/${event.id}`} size="small" startIcon={<EyeIcon />}>
                  Xem chi tiết
                </Button>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
