"use client"

import { useEffect, useState } from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Upload as UploadIcon } from "@phosphor-icons/react/dist/ssr/Upload";
import { Download as DownloadIcon } from "@phosphor-icons/react/dist/ssr/Download";
import { Eye as EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { Clock as ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { HouseLine as HouseLineIcon } from "@phosphor-icons/react/dist/ssr/HouseLine";
import { MapPin as MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { Plus as PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import Card from "@mui/material/Card";
import { CardMedia } from "@mui/material";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { AxiosResponse } from 'axios';

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
};

export default function Page(): React.JSX.Element {
  const [events, setEvents] = useState<EventResponse[]>([]);

  // Fetch all events on component mount
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response: AxiosResponse<EventResponse[]> = await baseHttpServiceInstance.get('/marketplace/events/');
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <Stack spacing={5}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Sự kiện</Typography>
        </Stack>
        <div>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained" href='/event-studio/events/create'>
            Tạo sự kiện mới
          </Button>
        </div>
      </Stack>

      <Grid container spacing={3}>
        {events.map(event => (
          <Grid key={event.id} lg={4} sm={6} xs={12}>
            <Card>
              <CardMedia
                sx={{ height: 140 }}
                image={event.bannerUrl ? event.bannerUrl : 'https://mui.com/static/images/cards/contemplative-reptile.jpg'}
                title={event.name}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {event.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {event.description ? event.description : "Chưa có mô tả"}
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
                        ? `${event.startDateTime} - ${event.endDateTime}`
                        : "Chưa xác định"}
                    </Typography>
                  </Stack>
                  <Stack sx={{ alignItems: 'left' }} direction="row" spacing={1}>
                    <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {event.place ? event.place : "Chưa xác định"}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
              <Divider />
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
                <Button href={`/events/${event.slug}`} size="small" startIcon={<EyeIcon />}>
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
