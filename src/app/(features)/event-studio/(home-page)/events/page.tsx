'use client';

import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { CardMedia, Tooltip, Avatar, Box } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
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
  avatarUrl: string;
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
  }, [notificationCtx, tt]);

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
      <Stack direction="row" spacing={3} alignItems="center">
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">{tt('Sự kiện của tôi', 'My Events')}</Typography>
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

      <Grid container spacing={2}>
        {events.map((event) => (
          <Grid key={event.id} xs={12} sm={6} md={4} lg={3}>
            <Card sx={{
              height: '100%',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 }
            }}>
              <CardActionArea
                component={LocalizedLink}
                href={`/event-studio/events/${event.id}`}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
              >
                {/* Banner Image - Height 120px like My Tickets */}
                <Box sx={{ position: 'relative', height: 120 }}>
                  <CardMedia
                    component="img"
                    src={event.bannerUrl || ''}
                    alt={event.name}
                    sx={{
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'brightness(0.9)',
                    }}
                  />
                  {/* Overlaid Avatar */}
                  <Box sx={{
                    position: 'absolute',
                    bottom: -16,
                    left: 12,
                    p: 0.5,
                    bgcolor: 'background.paper',
                    borderRadius: '50%',
                    zIndex: 1,
                  }}>
                    {event.avatarUrl ? (
                      <Avatar src={event.avatarUrl} sx={{ width: 36, height: 36 }} />
                    ) : (
                      <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                        {(event.name[0] ?? 'A').toUpperCase()}
                      </Avatar>
                    )}
                  </Box>
                </Box>

                <CardContent sx={{ pt: 3, px: 1.5, pb: 1, flexGrow: 1 }}>
                  <Stack spacing={0.5}>
                    {/* Event Name */}
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
                        height: '2.6em',
                        mb: 0.5
                      }}
                    >
                      {event.name}
                    </Typography>

                    <Stack spacing={0.5}>
                      {/* Organizer */}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <HouseLineIcon size={14} color="var(--mui-palette-text-secondary)" />
                        <Tooltip title={event.organizer}>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {event.organizer}
                          </Typography>
                        </Tooltip>
                      </Stack>

                      {/* Time */}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ClockIcon size={14} color="var(--mui-palette-text-secondary)" />
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {event.startDateTime && event.endDateTime
                            ? `${dayjs(event.startDateTime || 0).format('HH:mm DD/MM/YYYY')} - ${dayjs(event.endDateTime || 0).format('HH:mm DD/MM/YYYY')}`
                            : tt('Chưa xác định', 'To be determined')}
                        </Typography>
                      </Stack>

                      {/* Place */}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <MapPinIcon size={14} color="var(--mui-palette-text-secondary)" />
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: '90%' }}>
                          {event.place || tt('Chưa xác định', 'TBD')}
                        </Typography>
                      </Stack>
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
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                  }}
                >
                  <Tooltip title={event.displayOnMarketplace ? tt("Đang hiển thị trên Marketplace", "On Marketplace") : tt('Không hiển thị trên Marketplace', 'Hidden from Marketplace')}>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{
                      color: event.displayOnMarketplace ? 'success.main' : 'text.disabled',
                      bgcolor: 'background.paper', px: 1, py: 0.3, borderRadius: 1
                    }}>
                      <Storefront size={16} weight={event.displayOnMarketplace ? "duotone" : "regular"} />
                      <Typography variant="caption" fontWeight="medium">
                        {event.displayOnMarketplace ? tt('Marketplace', 'Marketplace') : tt('Hidden', 'Hidden')}
                      </Typography>
                    </Stack>
                  </Tooltip>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
