'use client';

import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { CardMedia } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Storefront } from '@phosphor-icons/react/dist/ssr';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import { LocalizedLink } from '@/components/localized-link';

import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/contexts/locale-context';

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
  locationInstruction: string | null;
  timeInstruction: string | null;
  slug: string;
  secureApiKey: string;
  displayOnMarketplace: boolean;
};

export default function Page(): React.JSX.Element {
  const { tt } = useTranslation();

  React.useEffect(() => {
    document.title = tt(`Quản lý sự kiện | ETIK - Vé điện tử & Quản lý sự kiện`, `Event Management | ETIK - E-tickets & Event Management`);
  }, [tt]);
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
        notificationCtx.error(tt('Lỗi:', 'Error:'), error);
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
          <Typography variant="h4">{tt('Sự kiện của tôi', 'My Events')}</Typography>
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
            component={LocalizedLink}
            href="/event-studio/events/create"
          >
            {tt('Thêm', 'Add')}
          </Button>
        </div>
      </Stack>

      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid key={event.id} lg={4} sm={6} xs={12}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea
                component={LocalizedLink}
                href={`/event-studio/events/${event.id}`}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
              >
                <CardMedia sx={{ height: 140 }} image={event.bannerUrl ? event.bannerUrl : ''} title={event.name} />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="div">
                    {event.name}
                  </Typography>
                  <Stack direction="column" spacing={2} sx={{ alignItems: 'left', mt: 2 }}>
                    <Stack sx={{ alignItems: 'left' }} direction="row" spacing={1}>
                      <HouseLineIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {tt('Đơn vị tổ chức:', 'Organizer:')} {event.organizer}
                      </Typography>
                    </Stack>
                    <Stack sx={{ alignItems: 'left' }} direction="row" spacing={1}>
                      <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {event.startDateTime && event.endDateTime
                          ? `${dayjs(event.startDateTime || 0).format('HH:mm DD/MM/YYYY')} - ${dayjs(event.endDateTime || 0).format('HH:mm DD/MM/YYYY')}`
                          : tt('Chưa xác định', 'To be determined')} {event.timeInstruction ? `(${event.timeInstruction})` : ''}
                      </Typography>
                    </Stack>
                    <Stack sx={{ alignItems: 'left' }} direction="row" spacing={1}>
                      <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {event.place ? event.place : tt('Chưa xác định', 'To be determined')} {event.locationInstruction ? `(${event.locationInstruction})` : ''}
                      </Typography>
                    </Stack>
                    <Stack sx={{ alignItems: 'left' }} direction="row" spacing={1}>
                      <Storefront fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {event.displayOnMarketplace ? tt("Đang hiển thị trên Marketplace", "Currently displayed on Marketplace") : tt('Không hiển thị trên Marketplace', 'Not displayed on Marketplace')}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
