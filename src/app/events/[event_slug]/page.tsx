'use client';

import * as React from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Avatar, Box, CardMedia, Container, InputAdornment } from '@mui/material';
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
import { UserPlus } from '@phosphor-icons/react/dist/ssr';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Coins as CoinsIcon } from '@phosphor-icons/react/dist/ssr/Coins';
import { Hash as HashIcon } from '@phosphor-icons/react/dist/ssr/Hash';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import axios, { AxiosResponse } from 'axios';
import dayjs from 'dayjs';

import NotificationContext from '@/contexts/notification-context';

import { Schedules } from './schedules';
import { TicketCategories } from './ticket-categories';

export type TicketCategory = {
  id: string;
  avatar: string;
  name: string;
  updatedAt: Date;
  price: number;
  type: string;
  status: string;
};
export type Show = {
  id: number;
  eventId: number;
  name: string;
  startDateTime: Date | null;
  endDateTime: Date | null;
  place: string | null;
};

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
  slug: string;
  locationInstruction: string | null;
};

export default function Page({ params }: { params: { event_slug: string } }): React.JSX.Element {
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [ticketCategories, setTicketCategories] = React.useState<TicketCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  const [customer, setCustomer] = React.useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
  });
  const [extraFee, setExtraFee] = React.useState<number>(0);
  const [paymentMethod, setPaymentMethod] = React.useState<string>('');
  const [ticketHolders, setTicketHolders] = React.useState<string[]>(['']);
  const [shows, setShows] = React.useState<Show[]>([]);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // Fetch event details on component mount
  React.useEffect(() => {
    if (params.event_slug) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
            `/marketplace/events/${params.event_slug}`
          );
          setEvent(response.data);
          // setFormValues(response.data); // Initialize form with the event data
        } catch (error) {
          notificationCtx.error('Error fetching event details:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    }
  }, [params.event_slug]);

  // Fetch shows
  React.useEffect(() => {
    async function fetchShows() {
      try {
        setIsLoading(true);
        const response: AxiosResponse<Show[]> = await baseHttpServiceInstance.get(
          `/marketplace/events/${params.event_slug}/shows`
        );
        setShows(response.data);
      } catch (error) {
        notificationCtx.error('Error fetching shows:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchShows();
  }, [params.event_slug]);

  // Fetch ticket categories
  React.useEffect(() => {
    async function fetchTicketCategories() {
      try {
        setIsLoading(true);
        const response: AxiosResponse<TicketCategory[]> = await baseHttpServiceInstance.get(
          `/marketplace/events/${params.event_slug}/ticket_categories`
        );
        const sortedCategories = response.data.sort((a, b) => {
          if (a.status === 'on_sale' && b.status !== 'on_sale') return -1;
          if (a.status !== 'on_sale' && b.status === 'on_sale') return 1;
          return 0;
        });
        setTicketCategories(sortedCategories);
      } catch (error) {
        notificationCtx.error('Error fetching ticket categories:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTicketCategories();
  }, [params.event_slug]);

  const handleCategorySelection = (ticketCategoryId: string) => {
    setSelectedCategoryId(ticketCategoryId);
  };

  const handleTicketQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = Number(event.target.value);
    setTicketQuantity(quantity);
    setTicketHolders(Array(quantity).fill('')); // Dynamically update ticket holders array
  };

  const handleTicketHolderChange = (index: number, value: string) => {
    const updatedHolders = [...ticketHolders];
    updatedHolders[index] = value;
    setTicketHolders(updatedHolders);
  };

  // const handleExtraFeeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = event.target.value.replace(/\D/g, ''); // Remove non-digit characters
  //   setExtraFee(Number(value));
  // };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const handleSubmit = async () => {
    if (!selectedCategoryId || !customer.name || !customer.email || ticketQuantity <= 0) {
      notificationCtx.warning('Please fill in the required fields.');
      return;
    }

    try {
      setIsLoading(true);
      const transactionData = {
        customer: {
          ...customer,
        },
        ticket: {
          ticketCategoryId: selectedCategoryId,
          quantity: ticketQuantity,
          ticketHolders: ticketHolders.filter(Boolean), // Ensure no empty names
        },
        paymentMethod,
        extraFee,
      };
      const response = await baseHttpServiceInstance.post(
        `/marketplace/events/${params.event_slug}/transactions`,
        transactionData
      );
      notificationCtx.success('Transaction created successfully!');
    } catch (error) {
      notificationCtx.error('Error creating transaction.', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        <Stack spacing={3}>
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
            <Grid item lg={4} md={6} xs={12}>
              <Card sx={{ height: '100%' }}>
                <CardContent
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <Stack direction="column" spacing={2}>
                    <Stack direction="row" spacing={2} style={{ alignItems: 'center' }}>
                      <div>
                        <Avatar sx={{ height: '80px', width: '80px', fontSize: '2rem' }}>
                          {event?.name[0].toUpperCase()}
                        </Avatar>
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
                    <Button fullWidth variant="contained" href={`#registration`} size="small" startIcon={<UserPlus />}>
                      Đăng ký ngay
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Stack direction="row" spacing={3}>
            <Grid container spacing={3}>
              <Grid item lg={8} md={6} xs={12}>
                <Card>
                  <CardContent>
                    {event?.description ? (
                      <Box
                        sx={{
                          margin: 0,
                          padding: 0,
                          '& img': {
                            maxWidth: '100%', // Set images to scale down if they exceed container width
                            height: 'auto', // Maintain aspect ratio
                          },
                        }}
                        dangerouslySetInnerHTML={{ __html: event?.description }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Chưa có mô tả
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item lg={4} md={6} xs={12}></Grid>
            </Grid>
          </Stack>
          <div
            id="registration"
            style={{ display: 'block', height: '100px', marginTop: '-100px', visibility: 'hidden' }}
          ></div>
          <Stack direction="row" spacing={3}>
            <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
              <Typography variant="h6">Đăng ký tham dự</Typography>
            </Stack>
          </Stack>
          <Grid container spacing={3}>
            <Grid item lg={4} md={6} xs={12}>
              <Stack spacing={3}>
                <TicketCategories ticketCategories={ticketCategories} onCategorySelect={handleCategorySelection} />
                <Schedules shows={shows} />
              </Stack>
            </Grid>
            <Grid item lg={8} md={6} xs={12}>
              <Stack spacing={3}>
                {/* Customer Information Card */}
                <Card>
                  <CardHeader subheader="Vui lòng điền các trường thông tin phía dưới." title="Thông tin người mua" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item lg={6} xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel>Họ và tên</InputLabel>
                          <OutlinedInput
                            label="Họ và tên"
                            name="customer_name"
                            value={customer.name}
                            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                          />
                        </FormControl>
                      </Grid>
                      <Grid item lg={6} xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel>Địa chỉ Email</InputLabel>
                          <OutlinedInput
                            label="Địa chỉ Email"
                            name="customer_email"
                            type="email"
                            value={customer.email}
                            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                          />
                        </FormControl>
                      </Grid>
                      <Grid item lg={6} xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Số điện thoại</InputLabel>
                          <OutlinedInput
                            label="Số điện thoại"
                            name="customer_phone_number"
                            type="tel"
                            value={customer.phoneNumber}
                            onChange={(e) => setCustomer({ ...customer, phoneNumber: e.target.value })}
                          />
                        </FormControl>
                      </Grid>
                      <Grid item lg={6} xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Địa chỉ</InputLabel>
                          <OutlinedInput
                            label="Địa chỉ"
                            name="customer_address"
                            value={customer.address}
                            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                          />
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Ticket Quantity and Ticket Holders */}
                <Card>
                  <CardHeader
                    title="Số lượng vé"
                    action={
                      <OutlinedInput
                        sx={{ maxWidth: 180 }}
                        type="number"
                        value={ticketQuantity}
                        onChange={handleTicketQuantityChange}
                      />
                    }
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      {ticketHolders.map((holder, index) => (
                        <Grid item lg={12} xs={12} key={index}>
                          <FormControl fullWidth required>
                            <InputLabel>Họ và tên người tham dự {index + 1}</InputLabel>
                            <OutlinedInput
                              label={`Họ và tên người tham dự ${index + 1}`}
                              value={holder}
                              onChange={(e) => handleTicketHolderChange(index, e.target.value)}
                            />
                          </FormControl>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>

                {/* Extra Fee */}
                {/* <Card>
              <CardHeader
                title="Phụ phí"
                subheader="(nếu có)"
                action={
                  <OutlinedInput
                    name="extraFee"
                    value={extraFee.toLocaleString()} // Format as currency
                    onChange={handleExtraFeeChange}
                    sx={{ maxWidth: 180 }}
                    endAdornment={<InputAdornment position="end">đ</InputAdornment>}
                  />
                }
              />
            </Card> */}

                {/* Payment Method */}
                <Card>
                  <CardHeader
                    title="Phương thức thanh toán"
                    action={
                      <FormControl sx={{ maxWidth: 180, minWidth: 180 }}>
                        <Select
                          name="payment_method"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <MenuItem value="napas247" selected>
                            Napas 247
                          </MenuItem>
                        </Select>
                      </FormControl>
                    }
                  />
                </Card>

                {/* Payment Summary */}
                {selectedCategoryId && ticketCategories.length > 0 && (
                  <Card>
                    <CardHeader title="Thanh toán" />
                    <Divider />
                    <CardContent>
                      <Stack spacing={2}>
                        <Grid item sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <TicketIcon fontSize="var(--icon-fontSize-md)" />
                            <Typography variant="body1">Loại vé:</Typography>
                          </Stack>

                          <Typography variant="body1">
                            {ticketCategories.find((cat) => cat.id === selectedCategoryId)?.name || 'Chưa xác định'}
                          </Typography>
                        </Grid>
                        <Grid item sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <TagIcon fontSize="var(--icon-fontSize-md)" />
                            <Typography variant="body1">Đơn giá:</Typography>
                          </Stack>
                          <Typography variant="body1"></Typography>
                          <Typography variant="body1">
                            {formatPrice(ticketCategories.find((cat) => cat.id === selectedCategoryId)?.price || 0)}
                          </Typography>
                        </Grid>
                        <Grid item sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <HashIcon fontSize="var(--icon-fontSize-md)" />
                            <Typography variant="body1">Số lượng:</Typography>
                          </Stack>
                          <Typography variant="body1"></Typography>
                          <Typography variant="body1">{ticketQuantity}</Typography>
                        </Grid>
                        <Grid item sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <CoinsIcon fontSize="var(--icon-fontSize-md)" />
                            <Typography variant="body1">Thành tiền:</Typography>
                          </Stack>
                          <Typography variant="body1">
                            {formatPrice(
                              (ticketCategories.find((cat) => cat.id === selectedCategoryId)?.price || 0) *
                                ticketQuantity +
                                extraFee
                            )}
                          </Typography>
                        </Grid>
                      </Stack>
                    </CardContent>
                  </Card>
                )}
                {/* Submit Button */}
                <Grid item sx={{ display: 'flex', justifyContent: 'flex-end', mt: '3' }}>
                  <Button variant="contained" onClick={handleSubmit}>
                    Mua vé
                  </Button>
                </Grid>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </div>
  );
}
