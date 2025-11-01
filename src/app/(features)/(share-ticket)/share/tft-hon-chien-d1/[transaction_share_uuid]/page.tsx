'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Avatar, Box, Container } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import * as React from 'react';
// import type { AxiosResponse } from 'axios';
import dayjs from 'dayjs';

import NotificationContext from '@/contexts/notification-context';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useTranslation } from '@/contexts/locale-context';


export interface EventResponse {
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
  timeInstruction: string | null;
}

// 1) Define the missing TransactionResponse type
export interface TransactionResponse {
  name: string;
  ticketQuantity: number;
}

export default function Page({
  params,
}: {
  params: { transaction_share_uuid: string };
}): React.JSX.Element | null {
  const { tt } = useTranslation();
  const eventSlug = 'tft-hon-chien-d1'
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [transaction, setTransaction] =
    React.useState<TransactionResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const notificationCtx = React.useContext(NotificationContext);

  // Update document title when event loads
  React.useEffect(() => {
    if (event && transaction) {
      document.title = `${transaction.name} ${tt('đã tham gia sự kiện', 'has registered for')} ${event.name} | ETIK`;
    }
  }, [event, transaction, tt]);

  // 2) Fetch both event & transaction in one go
  React.useEffect(() => {
    const { transaction_share_uuid: transactionShareUuid } = params as { transaction_share_uuid: string };
    if (!eventSlug || !transactionShareUuid) return;

    const fetchData = async (): Promise<void> => {
      setIsLoading(true);
      try {
        // typed as an object with event + transaction
        const resp = (await baseHttpServiceInstance.get(
          `/customers/share-transactions/${eventSlug}/${transactionShareUuid}`
        )) as unknown as { data: { event: EventResponse; transaction: TransactionResponse } };
        setEvent(resp.data.event);
        setTransaction(resp.data.transaction);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        notificationCtx.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [eventSlug, params, notificationCtx, tt]);

  if (!transaction) {
    return null;
  }

  return (
    <div
      style={{
        scrollBehavior: 'smooth',
        backgroundColor: '#d1f9db',
        backgroundImage: `linear-gradient(356deg, #d1f9db 0%, #fffed9 100%)`,
      }}
    >
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
      <Container maxWidth="xl" sx={{ py: '64px' }}>
        <Stack spacing={4}>

          <Grid container spacing={3}>
            <Grid item lg={8} md={6} xs={12}>
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
                <Box component="img"
                  src={event?.bannerUrl || ''}
                  alt={tt('Sự kiện', 'Event')}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover',
                  }}
                />
              </Box>
            </Grid>
            <Grid item lg={4} md={6} xs={12}>
              <Card>
                <CardContent
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <Stack direction="column" spacing={2}>
                    <Stack direction="row" spacing={2} style={{ alignItems: 'center' }}>
                      <div>
                        {event?.avatarUrl ?
                          <Box component="img" src={event?.avatarUrl || ''} alt={tt('Avatar sự kiện', 'Event Avatar')} style={{ height: '80px', width: '80px', borderRadius: '50%' }} />
                          :
                          <Avatar sx={{ height: '80px', width: '80px', fontSize: '2rem' }}>
                            {(event?.name[0] ?? 'a').toUpperCase()}
                          </Avatar>}
                      </div>
                      <Typography variant="h5" sx={{ width: '100%', textAlign: 'center' }}>
                        {event?.name}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <HouseLineIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {tt('Đơn vị tổ chức:', 'Organizer:')} {event?.organizer}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {event?.startDateTime && event?.endDateTime
                          ? `${dayjs(event.startDateTime || 0).format('HH:mm DD/MM/YYYY')} - ${dayjs(event.endDateTime || 0).format('HH:mm DD/MM/YYYY')}`
                          : tt('Chưa xác định', 'To be determined')} {event?.timeInstruction ? `(${event?.timeInstruction})` : ''}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} >
                      <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {event?.place ? event?.place : tt('Chưa xác định', 'To be determined')} {event?.locationInstruction && event.locationInstruction} {event?.locationUrl && <a href={event.locationUrl} target='_blank' rel="noreferrer">{tt('Xem bản đồ', 'View map')}</a>}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Stack direction="row" spacing={3}>
            <Grid container spacing={3}>
              <Grid item lg={8} md={6} xs={12}>
                <Card>
                  <CardContent>
                    <Stack spacing={2} direction={{ sm: 'row', xs: 'column' }} sx={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '150px', height: '150px', borderRadius: '20px', }}>
                          <DotLottieReact
                            src="/assets/animations/ticket-gold.lottie"
                            loop
                            width={'100%'}
                            height={'100%'}
                            style={{
                              borderRadius: '20px'
                            }}
                            autoplay
                          />
                        </div>
                      </div>

                      <Stack spacing={5} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '340px', maxWidth: '100%' }}>
                        <Typography variant="h5">{tt('Xác nhận đăng ký thành công!', 'Registration confirmed!')}</Typography>
                        <Stack spacing={1} sx={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Typography variant="body1">{tt('Tên người đăng ký:', 'Registrant name:')}</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{transaction?.name}</Typography>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Typography variant="body1">{tt('Số lượng:', 'Quantity:')}</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{transaction?.ticketQuantity}</Typography>
                          </div>
                        </Stack>


                        <Typography variant="body2" sx={{ textAlign: 'justify' }}>{tt('Cảm ơn Quý khách đã sử dụng ETIK !', 'Thank you for using ETIK!')}</Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        </Stack>
      </Container>
    </div>
  );
}
