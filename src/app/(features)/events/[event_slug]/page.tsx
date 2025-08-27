'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Avatar, Box, Checkbox, Container, FormControlLabel, FormHelperText, InputAdornment, Modal } from '@mui/material';
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
import { ArrowRight, Eye, UserPlus } from '@phosphor-icons/react/dist/ssr';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import * as React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

import NotificationContext from '@/contexts/notification-context';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { orange } from '@mui/material/colors';
import { Schedules } from './schedules';
import { TicketCategories } from './ticket-categories';

export type TicketCategory = {
  id: number;
  avatar: string | null;
  name: string;
  price: number;
  description: string;
  status: string;
  quantity: number;
  sold: number;
  disabled: boolean;
};

export type Show = {
  id: number;
  name: string;
  status: string;
  disabled: boolean;
  avatar: string | null;
  startDateTime: string; // backend response provides date as string
  endDateTime: string; // backend response provides date as string
  ticketCategories: TicketCategory[];
};

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
  timeInstruction: string | null;
  shows: Show[];
  adminReviewStatus: 'no_request_from_user' | 'waiting_for_acceptance' | 'accepted' | 'rejected';
  displayOnMarketplace: boolean;
  displayOption: string;
  externalLink: string | null;
};

const options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

export default function Page({ params }: { params: { event_slug: string } }): React.JSX.Element {
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [selectedCategories, setSelectedCategories] = React.useState<Record<number, number | null>>({});
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  const [customer, setCustomer] = React.useState({
    title: 'Bạn',
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
  });
  const [paymentMethod, setPaymentMethod] = React.useState<string>('napas247');
  const [ticketHolders, setTicketHolders] = React.useState<string[]>(['']);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);
  const captchaRef = React.useRef<ReCAPTCHA | null>(null);
  const [position, setPosition] = React.useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [ticketHolderEditted, setTicketHolderEditted] = React.useState<boolean>(false);
  const [openNotifModal, setOpenNotifModal] = React.useState<boolean>(false);
  const [prevent24h, setPrevent24h] = React.useState(false);
  const NOTIF_KEY = 'hideNotifMarketplaceEventNotApprovedUntil';

  React.useEffect(() => {
    document.title = `Sự kiện ${event?.name} | ETIK - Vé điện tử & Quản lý sự kiện`;
  }, [event]);


  // Khi component mount, kiểm tra localStorage
  React.useEffect(() => {
    const hideUntil = localStorage.getItem(NOTIF_KEY);
    if (hideUntil) {
      const until = parseInt(hideUntil, 10);
      if (Date.now() < until) {
        // Nếu chưa hết 24h thì đóng luôn modal
        setOpenNotifModal(false);
        return;
      } else {
        setOpenNotifModal(true);
        // Hết hạn, xoá key đi
        localStorage.removeItem(NOTIF_KEY);
      }
    } else {
      setOpenNotifModal(true);
    }
    // Nếu không có key hoặc đã hết hạn, giữ openNotifModal theo prop
  }, [setOpenNotifModal]);

  const handleCloseNotifModal = () => {
    if (prevent24h) {
      // Lưu thời điểm 24h sau vào localStorage
      const hideUntil = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem(NOTIF_KEY, hideUntil.toString());
    }
    setOpenNotifModal(false);
  };
  const totalAmount = React.useMemo(() => {
    return Object.entries(selectedCategories).reduce((total, [showId, category]) => {
      const show = event?.shows.find((show) => show.id === parseInt(showId));
      const ticketCategory = show?.ticketCategories.find((cat) => cat.id === category);
      return total + (ticketCategory?.price || 0) * (ticketQuantity || 0);
    }, 0)
  }, [selectedCategories])

  const handleCloseSuccessModal = (event: {}, reason: "backdropClick" | "escapeKeyDown") => {
    if (reason && reason == "backdropClick" && "escapeKeyDown")
      return;
    setOpenSuccessModal(false)
  }

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
        } catch (error) {
          notificationCtx.error('Lỗi:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    }
  }, [params.event_slug]);


  const handleCategorySelection = (showId: number, categoryId: number) => {
    setSelectedCategories(prevCategories => ({
      ...prevCategories,
      [showId]: categoryId,
    }));
  };

  const handleSelectionChange = (selected: Show[]) => {
    setSelectedSchedules(selected);
    const tmpObj: Record<number, number | null> = {};
    selected.forEach((s) => { tmpObj[s.id] = selectedCategories[s.id] ?? null })
    setSelectedCategories(tmpObj);
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

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const handleSubmit = async () => {
    if (!customer.name || !customer.email || !customer.address || ticketQuantity <= 0) {
      notificationCtx.warning('Vui lòng điền các trường thông tin bắt buộc');
      return;
    }

    const captchaValue = captchaRef.current?.getValue();
    if (!captchaValue) {
      notificationCtx.warning('Vui lòng xác nhận reCAPTCHA!');
      return;
    }

    if (Object.keys(selectedCategories).length == 0) {
      notificationCtx.warning('Vui lòng chọn ít nhất 1 loại vé');
      return;
    }

    const emptyTicketShowIds = Object.entries(selectedCategories).filter(([showId, ticketCategoryId]) => (ticketCategoryId == null)).map(([showId, ticketCategoryId]) => (Number.parseInt(showId)));
    if (emptyTicketShowIds.length > 0) {
      const emptyTicketNames = event?.shows.filter(show => emptyTicketShowIds.includes(show.id)).map(show => show.name)
      notificationCtx.warning(`Vui lòng chọn loại vé cho ${emptyTicketNames?.join(', ')}`);
      return;
    }
    try {
      setIsLoading(true);

      const tickets = Object.entries(selectedCategories).map(([showId, ticketCategoryId]) => ({
        showId: parseInt(showId),
        ticketCategoryId,
      }));

      const transactionData = {
        customer,
        tickets,
        paymentMethod,
        ticketHolders: ticketHolders.filter(Boolean), // Ensure no empty names
        quantity: ticketQuantity,
        captchaValue,
        "latitude": position?.latitude,
        "longitude": position?.longitude
      };

      const response = await baseHttpServiceInstance.post(
        `/marketplace/events/${params.event_slug}/transactions`,
        transactionData
      );
      // notificationCtx.success('Transaction created successfully!');
      setOpenSuccessModal(true)

      // Redirect to the payment checkout URL
      if (response.data.paymentCheckoutUrl) {
        window.location.href = response.data.paymentCheckoutUrl;
      }
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      setIsLoading(false);
      captchaRef.current?.reset()
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
                <Box component="img"
                  src={event?.bannerUrl || ''}
                  alt="Sự kiện"
                  sx={{
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
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <div>
                        {event?.avatarUrl ?
                          <Box component="img" src={event?.avatarUrl} sx={{ height: '80px', width: '80px', borderRadius: '50%' }} />
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
                          : 'Chưa xác định'} {event?.timeInstruction ? `(${event.locationInstruction})` : ''}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} >
                      <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {event?.place ? `${event?.place}` : 'Chưa xác định'} {event?.locationInstruction && event.locationInstruction} {event?.locationUrl && <a href={event.locationUrl} target='_blank'>Xem bản đồ</a>}
                      </Typography>
                    </Stack>

                    {event && event.displayOption !== 'display_with_everyone' &&
                      <Stack direction="row" spacing={1} sx={{ color: orange[500] }}>
                        <Eye fontSize="var(--icon-fontSize-sm)" />
                        <Typography display="inline" variant="body2">
                          Sự kiện không hiển thị công khai
                        </Typography>
                      </Stack>
                    }
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
                <Schedules shows={event?.shows} onSelectionChange={handleSelectionChange} />
                {selectedSchedules && selectedSchedules.map(show => (
                  <TicketCategories key={show.id} show={show} onCategorySelect={(categoryId: number) => handleCategorySelection(show.id, categoryId)}
                  />
                ))}
              </Stack>
            </Grid>
            <Grid item lg={8} md={6} xs={12}>
              <Stack spacing={3}>
                {/* Customer Information Card */}
                <Card>
                  <CardHeader subheader="Vui lòng điền các trường thông tin phía dưới." title="Thông tin người đăng ký" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item lg={6} xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel htmlFor="customer-name">Danh xưng* &emsp; Họ và tên</InputLabel>
                          <OutlinedInput
                            id="customer-name"
                            label="Danh xưng* &emsp; Họ và tên"
                            name="customer_name"
                            value={customer.name}
                            onChange={(e) => {
                              !ticketHolderEditted && ticketHolders.length > 0 &&
                                setTicketHolders((prev) => {
                                  const updatedHolders = [...prev];
                                  updatedHolders[0] = e.target.value; // update first ticket holder
                                  return updatedHolders;
                                });
                              setCustomer({ ...customer, name: e.target.value });
                            }}
                            startAdornment={
                              <InputAdornment position="start">
                                <Select
                                  variant="standard"
                                  disableUnderline
                                  value={customer.title || "Bạn"}
                                  onChange={(e) =>
                                    setCustomer({ ...customer, title: e.target.value })
                                  }
                                  sx={{ minWidth: 65 }} // chiều rộng tối thiểu để gọn
                                >
                                  <MenuItem value="Anh">Anh</MenuItem>
                                  <MenuItem value="Chị">Chị</MenuItem>
                                  <MenuItem value="Bạn">Bạn</MenuItem>
                                </Select>
                              </InputAdornment>
                            }
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
                        <FormControl fullWidth required>
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
                        <FormControl fullWidth required>
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
                    title="Số lượng người tham dự"
                    action={
                      <OutlinedInput
                        sx={{ maxWidth: 130 }}
                        type="number"
                        value={ticketQuantity}
                        onChange={handleTicketQuantityChange}
                        inputProps={{ min: 1 }}
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
                              onChange={(e) => { setTicketHolderEditted(true); handleTicketHolderChange(index, e.target.value) }}
                            />
                          </FormControl>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                {totalAmount > 0 &&
                  <Card>
                    <CardHeader
                      title="Phương thức thanh toán"
                    />
                    <Divider />
                    <CardContent>
                      <FormControl fullWidth>
                        <Select
                          name="payment_method"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <MenuItem value="napas247" selected={true}>
                            Chuyển khoản nhanh Napas 247
                          </MenuItem>
                        </Select>
                        <FormHelperText>Tự động xuất vé khi thanh toán thành công</FormHelperText>
                      </FormControl>
                    </CardContent>
                  </Card>
                }
                {/* Payment Summary */}
                {Object.keys(selectedCategories).length > 0 && (
                  <Card>
                    <CardHeader title="Thanh toán" />
                    <Divider />
                    <CardContent>
                      <Stack spacing={2}>
                        {Object.entries(selectedCategories).map(([showId, category]) => {
                          const show = event?.shows.find((show) => show.id === parseInt(showId));
                          const ticketCategory = show?.ticketCategories.find((cat) => cat.id === category);

                          return (
                            <Stack direction={{ xs: 'column', sm: 'row' }} key={showId} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                                <TicketIcon fontSize="var(--icon-fontSize-md)" />
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{show?.name || 'Chưa xác định'} - {ticketCategory?.name || 'Chưa rõ loại vé'}</Typography>
                              </Stack>
                              <Stack spacing={2} direction={'row'}>
                                <Typography variant="body1">Giá: {formatPrice(ticketCategory?.price || 0)}</Typography>
                                <Typography variant="body1">SL: {ticketQuantity || 0}</Typography>
                                <Typography variant="body1">
                                  Thành tiền: {formatPrice((ticketCategory?.price || 0) * (ticketQuantity || 0))}
                                </Typography>
                              </Stack>
                            </Stack>
                          );
                        })}

                        {/* Total Amount */}
                        <Grid item sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Tổng cộng:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {formatPrice(totalAmount)}
                          </Typography>
                        </Grid>
                      </Stack>
                    </CardContent>
                  </Card>
                )}
                {/* Submit Button */}
                <Grid spacing={3} container sx={{ alignItems: 'center', mt: '3' }}>
                  <Grid item sm={9} xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', }}>
                    <ReCAPTCHA
                      sitekey="6LdRnq4aAAAAAFT6htBYNthM-ksGymg70CsoYqHR"
                      ref={captchaRef}
                    />
                  </Grid>
                  <Grid item sm={3} xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', }}>
                    <div>
                      <Button variant="contained" onClick={handleSubmit}>
                        Đăng ký
                      </Button>
                    </div>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Container>

      <Modal
        open={openSuccessModal}
        onClose={handleCloseSuccessModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Container maxWidth="xl">
          <Card sx={{
            scrollBehavior: 'smooth',
            backgroundColor: '#d1f9db',
            backgroundImage: `linear-gradient(356deg, #d1f9db 0%, #fffed9 100%)`,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { sm: '500px', xs: '90%' },
            bgcolor: 'background.paper',
            boxShadow: 24,
          }}>
            <CardContent>
              <Stack spacing={3} direction={{ sm: 'row', xs: 'column' }} sx={{ display: 'flex', justifyContent: 'center' }}>
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
                <Stack spacing={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '450px', maxWidth: '100%' }}>
                  <Typography variant="h5">Đăng ký thành công !</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'justify' }}>Cảm ơn {customer.title} {customer.name} đã sử dụng ETIK. Nếu {customer.title} cần hỗ trợ thêm, vui lòng gửi yêu cầu hỗ trợ <a style={{ textDecoration: 'none' }} target='_blank' href="https://forms.gle/2mogBbdUxo9A2qRk8">tại đây.</a></Typography>
                </Stack>
              </Stack>
              <div style={{ marginTop: '20px', justifyContent: 'center' }}>
                <Stack spacing={2}>
                  {event?.externalLink && (
                    <Button 
                      fullWidth 
                      variant='contained' 
                      size="small" 
                      endIcon={<ArrowRight />} 
                      onClick={() => {
                        window.location.href = event?.externalLink || '';
                      }}
                    >
                      Khám phá trang thông tin sự kiện.
                    </Button>
                  )}
                  <Button 
                    fullWidth 
                    variant='outlined' 
                    size="small" 
                    onClick={() => {
                      setOpenSuccessModal(false);
                      window.location.reload();
                    }}
                  >
                    Tạo một đơn hàng khác
                  </Button>
                </Stack>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Modal>
      <Modal
        open={openNotifModal && event && event?.adminReviewStatus !== 'accepted' && event?.displayOption !== 'display_with_everyone' || false}
        onClose={handleCloseNotifModal}
        aria-labelledby="ticket-category-description-modal-title"
        aria-describedby="ticket-category-description-modal-description"
      >
        <Container maxWidth="xl">
          <Card
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { sm: "500px", xs: "90%" },
              bgcolor: "background.paper",
              boxShadow: 24,
            }}
          >
            <CardHeader title="Thông báo: Sự kiện này không hiển thị công khai" />
            <Divider />
            <CardContent>
              <Stack spacing={3}>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Hiện tại, sự kiện này chỉ hiển thị với <b>người quản lý sự kiện</b> do sự kiện chưa được phê duyệt.
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Để sự kiện được hiển thị công khai, quý khách vui lòng hoàn tất quá trình gửi yêu cầu phê duyệt tại trang quản trị sự kiện. Xin cảm ơn!
                  </Typography>
                </Stack>

                <Stack spacing={1}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={prevent24h}
                        onChange={(e: any) => setPrevent24h(e.target.checked)}
                      />
                    }
                    label="Không hiển thị lại trong 24 giờ"
                  />

                  <div style={{ textAlign: 'center' }}>
                    <Button fullWidth variant="contained" size="small" onClick={handleCloseNotifModal}>
                      Đã hiểu
                    </Button>
                  </div>
                </Stack>

              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>
    </div>
  );
}
