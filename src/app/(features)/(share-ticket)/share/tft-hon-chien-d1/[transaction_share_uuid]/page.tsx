'use client';

import * as React from 'react';
import { Helmet } from 'react-helmet';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Avatar, Box, CardMedia, Checkbox, Container, FormControlLabel, FormHelperText, InputAdornment, Modal } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ArrowRight, Eye, Storefront, UserPlus } from '@phosphor-icons/react/dist/ssr';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Coins as CoinsIcon } from '@phosphor-icons/react/dist/ssr/Coins';
import { Hash as HashIcon } from '@phosphor-icons/react/dist/ssr/Hash';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import axios, { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import ReCAPTCHA from 'react-google-recaptcha';

import NotificationContext from '@/contexts/notification-context';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { orange, red, yellow } from '@mui/material/colors';


export type EventResponse = {
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
};

// 1) Define the missing TransactionResponse type
export type TransactionResponse = {
  name: string;
  ticketQuantity: number;
};

export default function Page({
  params,
}: {
  params: { transaction_share_uuid: string };
}): React.JSX.Element {
  const event_slug = 'tft-hon-chien-d1'
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [transaction, setTransaction] =
    React.useState<TransactionResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const notificationCtx = React.useContext(NotificationContext);

  // Update document title when event loads
  React.useEffect(() => {
    if (event) {
      document.title = `${transaction?.name} đã tham gia sự kiện ${event.name} | ETIK`;
    }
  }, [event]);

  // 2) Fetch both event & transaction in one go
  React.useEffect(() => {
    const { transaction_share_uuid } = params;
    if (!event_slug || !transaction_share_uuid) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // typed as an object with event + transaction
        const resp: AxiosResponse<{
          event: EventResponse;
          transaction: TransactionResponse;
        }> = await baseHttpServiceInstance.get(
          `/customers/share-transactions/${event_slug}/${transaction_share_uuid}`
        );
        setEvent(resp.data.event);
        setTransaction(resp.data.transaction);
      } catch (err: any) {
        notificationCtx.error(err.message || err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [event_slug, params.transaction_share_uuid]);

  if (!transaction) {
    return;
  }

  return (
    <div
      style={{
        scrollBehavior: 'smooth',
        backgroundColor: '#d1f9db',
        backgroundImage: `linear-gradient(356deg, #d1f9db 0%, #fffed9 100%)`,
      }}
    >
      <Helmet>
        {/* Tiêu đề share */}
        <title>
          {transaction
            ? `${transaction.name} đã sở hữu vé của sự kiện ${event?.name}`
            : event?.name || 'ETIK'}
        </title>

        {/* Open Graph tags cho Facebook */}
        <meta
          property="og:title"
          content={
            transaction
              ? `${transaction.name} đã sở hữu vé của sự kiện ${event?.name}`
              : event?.name || 'ETIK'
          }
        />
        <meta
          property="og:image"
          content={event?.bannerUrl || event?.avatarUrl || ''}
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={typeof window !== 'undefined' ? window.location.href : ''}
        />

        {/* Tùy chọn thêm */}
        <meta
          property="og:description"
          content={event?.description?.replace(/<[^>]+>/g, '') || ''}
        />
        <meta property="og:site_name" content="ETIK - Vé điện tử & Quản lý sự kiện" />
      </Helmet>
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
                <img
                  src={event?.bannerUrl || ''}
                  alt="Sự kiện"
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
            <Grid item lg={4} md={6} xs={12}>
              <Card>
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
                        Đơn vị tổ chức: {event?.organizer}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {event?.startDateTime && event?.endDateTime
                          ? `${dayjs(event.startDateTime || 0).format('HH:mm DD/MM/YYYY')} - ${dayjs(event.endDateTime || 0).format('HH:mm DD/MM/YYYY')}`
                          : 'Chưa xác định'}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} >
                      <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {event?.place ? `${event?.place}` : 'Chưa xác định'} {event?.locationInstruction && event.locationInstruction} {event?.locationUrl && <a href={event.locationUrl} target='_blank'>Xem bản đồ</a>}
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
                        <Typography variant="h5">Xác nhận đăng ký thành công!</Typography>
                        <Stack spacing={1} sx={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Typography variant="body1">Tên người đăng ký:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{transaction?.name}</Typography>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Typography variant="body1">Số lượng:</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{transaction?.ticketQuantity}</Typography>
                          </div>
                        </Stack>


                        <Typography variant="body2" sx={{ textAlign: 'justify' }}>Cảm ơn Quý khách đã sử dụng ETIK !</Typography>
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
