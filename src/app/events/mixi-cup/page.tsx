'use client';

import * as React from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Avatar, Box, CardMedia, Container, FormHelperText, InputAdornment, Modal } from '@mui/material';
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
import { ArrowRight, UserPlus } from '@phosphor-icons/react/dist/ssr';
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

import { Schedules } from './schedules';
import { TicketCategories } from './ticket-categories';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Head from 'next/head';

export type TicketCategory = {
  id: number;
  avatar: string | null;
  name: string;
  price: number;
  description: string;
  status: string;
};

export type ShowTicketCategory = {
  quantity: number;
  sold: number;
  disabled: boolean;
  ticketCategory: TicketCategory;
};

export type Show = {
  id: number;
  name: string;
  avatar: string | null;
  startDateTime: string; // backend response provides date as string
  endDateTime: string; // backend response provides date as string
  showTicketCategories: ShowTicketCategory[];
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
  shows: Show[];
};

const options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

export default function Page(): React.JSX.Element {
  const params = {event_slug: 'mixi-cup'}
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [selectedCategories, setSelectedCategories] = React.useState<Record<number, number | null>>({});
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  const [customer, setCustomer] = React.useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
  });
  const [additionalAnswers, setAdditionalAnswers] = React.useState({
    province: '',
    linkFacebook: '',
    arrivalTime: '',
    doMixiFullName: '',
    teamPlayers: '',
    licensePlate: '',
    reason: '',
    messageToOrganizer: ''
  });

  const [paymentMethod, setPaymentMethod] = React.useState<string>('napas247');
  const [ticketHolders, setTicketHolders] = React.useState<string[]>(['']);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);
  const captchaRef = React.useRef<ReCAPTCHA | null>(null);
  const [position, setPosition] = React.useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [openErrorPositionModal, setOpenErrorPositionModal] = React.useState(false);
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  React.useEffect(() => {
    document.title = `Sự kiện ${event?.name} | ETIK - Vé điện tử & Quản lý sự kiện`;
  }, [event]);

  React.useEffect(() => {
    const currentTime = new Date();
    currentTime.setMinutes(currentTime.getMinutes() + 5); // Add 5 minutes
    const formattedTime = currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    notificationCtx.warning(`Vui lòng hoàn thành phiên đăng ký trước ${formattedTime}. `);
  }, []);

  const provinces = [
    { value: 'An Giang', label: 'An Giang' },
    { value: 'Bà Rịa Vũng Tàu', label: 'Bà Rịa Vũng Tàu' },
    { value: 'Bạc Liêu', label: 'Bạc Liêu' },
    { value: 'Bắc Giang', label: 'Bắc Giang' },
    { value: 'Bắc Kạn', label: 'Bắc Kạn' },
    { value: 'Bắc Ninh', label: 'Bắc Ninh' },
    { value: 'Bến Tre', label: 'Bến Tre' },
    { value: 'Bình Dương', label: 'Bình Dương' },
    { value: 'Bình Định', label: 'Bình Định' },
    { value: 'Bình Phước', label: 'Bình Phước' },
    { value: 'Bình Thuận', label: 'Bình Thuận' },
    { value: 'Cà Mau', label: 'Cà Mau' },
    { value: 'Cao Bằng', label: 'Cao Bằng' },
    { value: 'Cần Thơ', label: 'Cần Thơ' },
    { value: 'Đà Nẵng', label: 'Đà Nẵng' },
    { value: 'Đắk Lắk', label: 'Đắk Lắk' },
    { value: 'Đắk Nông', label: 'Đắk Nông' },
    { value: 'Điện Biên', label: 'Điện Biên' },
    { value: 'Đồng Nai', label: 'Đồng Nai' },
    { value: 'Đồng Tháp', label: 'Đồng Tháp' },
    { value: 'Gia Lai', label: 'Gia Lai' },
    { value: 'Hà Giang', label: 'Hà Giang' },
    { value: 'Hà Nam', label: 'Hà Nam' },
    { value: 'Hà Nội', label: 'Hà Nội' },
    { value: 'Hà Tĩnh', label: 'Hà Tĩnh' },
    { value: 'Hải Dương', label: 'Hải Dương' },
    { value: 'Hải Phòng', label: 'Hải Phòng' },
    { value: 'Hậu Giang', label: 'Hậu Giang' },
    { value: 'Hòa Bình', label: 'Hòa Bình' },
    { value: 'Hưng Yên', label: 'Hưng Yên' },
    { value: 'Khánh Hòa', label: 'Khánh Hòa' },
    { value: 'Kiên Giang', label: 'Kiên Giang' },
    { value: 'Kon Tum', label: 'Kon Tum' },
    { value: 'Lai Châu', label: 'Lai Châu' },
    { value: 'Lạng Sơn', label: 'Lạng Sơn' },
    { value: 'Lào Cai', label: 'Lào Cai' },
    { value: 'Lâm Đồng', label: 'Lâm Đồng' },
    { value: 'Long An', label: 'Long An' },
    { value: 'Nam Định', label: 'Nam Định' },
    { value: 'Nghệ An', label: 'Nghệ An' },
    { value: 'Ninh Bình', label: 'Ninh Bình' },
    { value: 'Ninh Thuận', label: 'Ninh Thuận' },
    { value: 'Phú Thọ', label: 'Phú Thọ' },
    { value: 'Phú Yên', label: 'Phú Yên' },
    { value: 'Quảng Bình', label: 'Quảng Bình' },
    { value: 'Quảng Nam', label: 'Quảng Nam' },
    { value: 'Quảng Ngãi', label: 'Quảng Ngãi' },
    { value: 'Quảng Ninh', label: 'Quảng Ninh' },
    { value: 'Quảng Trị', label: 'Quảng Trị' },
    { value: 'Sóc Trăng', label: 'Sóc Trăng' },
    { value: 'Sơn La', label: 'Sơn La' },
    { value: 'Tây Ninh', label: 'Tây Ninh' },
    { value: 'Thái Bình', label: 'Thái Bình' },
    { value: 'Thái Nguyên', label: 'Thái Nguyên' },
    { value: 'Thanh Hóa', label: 'Thanh Hóa' },
    { value: 'Thừa Thiên Huế', label: 'Thừa Thiên Huế' },
    { value: 'Tiền Giang', label: 'Tiền Giang' },
    { value: 'TP Hồ Chí Minh', label: 'TP Hồ Chí Minh' },
    { value: 'Trà Vinh', label: 'Trà Vinh' },
    { value: 'Tuyên Quang', label: 'Tuyên Quang' },
    { value: 'Vĩnh Long', label: 'Vĩnh Long' },
    { value: 'Vĩnh Phúc', label: 'Vĩnh Phúc' },
    { value: 'Yên Bái', label: 'Yên Bái' },
  ] as const;

  const totalAmount = React.useMemo(() => {
    return Object.entries(selectedCategories).reduce((total, [showId, category]) => {
      const show = event?.shows.find((show) => show.id === parseInt(showId));
      const showTicketCategory = show?.showTicketCategories.find((cat) => cat.ticketCategory.id === category);
      return total + (showTicketCategory?.ticketCategory?.price || 0) * (ticketQuantity || 0);
    }, 0)
  }, [selectedCategories])

  const handleCloseErrorPositionModal = (event, reason) => {
    if (reason && reason == "backdropClick" && "escapeKeyDown")
      return;
    setOpenErrorPositionModal(false);
  }
  const handleCloseSuccessModal = (event, reason) => {
    if (reason && reason == "backdropClick" && "escapeKeyDown")
      return;
  }

  const success = (pos: GeolocationPosition) => {
    const crd = pos.coords;

    setPosition({
      latitude: crd.latitude,
      longitude: crd.longitude,
      accuracy: crd.accuracy,
    });
    setOpenErrorPositionModal(false)
  };

  const handleErrorGeolocation = (err: GeolocationPositionError) => {
    setOpenErrorPositionModal(true)
  };

  React.useEffect(() => {
    navigator.geolocation.getCurrentPosition(success, handleErrorGeolocation, options);
  }, []);

  const handleAllowGeolocation = () => {
    navigator.geolocation.getCurrentPosition(success, handleErrorGeolocation, options);
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

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setAdditionalAnswers(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectionChange = (selected: Show[]) => {
    setSelectedSchedules(selected);
    const tmpObj = {}
    selected.forEach((s) => { tmpObj[s.id] = selectedCategories[s.id] || null })
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

    if (position?.latitude == null || position?.longitude == null) {
      setOpenErrorPositionModal(true)
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
        // ticketHolders: ticketHolders.filter(Boolean), // Ensure no empty names
        ticketHolders: [customer.name],
        quantity: ticketQuantity,
        captchaValue,
        "latitude": position?.latitude,
        "longitude": position?.longitude,
        additionalAnswers
      };

      const response = await baseHttpServiceInstance.post(
        `/marketplace/special_events/${params.event_slug}/transactions`,
        transactionData
      );
      // notificationCtx.success('Transaction created successfully!');
      setOpenSuccessModal(true)
      setTimeout(() => {window.location.href = "https://www.facebook.com/MixiGaming"}, 5000) 

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
    <>
     <Head>
        <title>Đăng ký tham gia MIXI CUP - Giải đấu giao hữu bóng đá đỉnh cao của cộng đồng streamer Việt Nam!</title>
        <meta name="description" content="Mixi Cup là sự kiện bóng đá giao hữu đặc biệt do MixiGaming tổ chức, quy tụ các đội tuyển hàng đầu với các đội trưởng nổi tiếng: Refund Gaming - Đội trưởng: Độ Mixi, Allstar - Đội trưởng: Cris Phan, SBTC - Đội trưởng: Thầy Giáo Ba, 500Bros Media - Đội trưởng: Bomman. Giải đấu sẽ diễn ra trong hai ngày 23 và 24 tháng 11 tại Sân vận động Bà Rịa, hứa hẹn mang đến những màn tranh tài kịch tính và đầy sôi động. Khán giả có thể đăng ký nhận vé miễn phí để có cơ hội trực tiếp ủng hộ thần tượng và theo dõi các trận cầu hấp dẫn!" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Đăng ký tham gia MIXI CUP - Giải đấu giao hữu bóng đá đỉnh cao của cộng đồng streamer Việt Nam!" />
        <meta property="og:description" content="Mixi Cup là sự kiện bóng đá giao hữu đặc biệt do MixiGaming tổ chức, quy tụ các đội tuyển hàng đầu với các đội trưởng nổi tiếng: Refund Gaming - Đội trưởng: Độ Mixi, Allstar - Đội trưởng: Cris Phan, SBTC - Đội trưởng: Thầy Giáo Ba, 500Bros Media - Đội trưởng: Bomman. Giải đấu sẽ diễn ra trong hai ngày 23 và 24 tháng 11 tại Sân vận động Bà Rịa, hứa hẹn mang đến những màn tranh tài kịch tính và đầy sôi động. Khán giả có thể đăng ký nhận vé miễn phí để có cơ hội trực tiếp ủng hộ thần tượng và theo dõi các trận cầu hấp dẫn!" />
        <meta property="og:image" content="https://etik-media.s3.amazonaws.com/1/event_banners/64b41c29-c751-400a-a54c-f8ae6f092dec.jpg" />
        <meta property="og:image:alt" content="MIXI CUP - Giải đấu giao hữu bóng đá đỉnh cao của cộng đồng streamer Việt Nam" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="628" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Đăng ký tham gia MIXI CUP - Giải đấu giao hữu bóng đá đỉnh cao của cộng đồng streamer Việt Nam!" />
        <meta name="twitter:description" content="Mixi Cup là sự kiện bóng đá giao hữu đặc biệt do MixiGaming tổ chức, quy tụ các đội tuyển hàng đầu với các đội trưởng nổi tiếng: Refund Gaming - Đội trưởng: Độ Mixi, Allstar - Đội trưởng: Cris Phan, SBTC - Đội trưởng: Thầy Giáo Ba, 500Bros Media - Đội trưởng: Bomman. Giải đấu sẽ diễn ra trong hai ngày 23 và 24 tháng 11 tại Sân vận động Bà Rịa, hứa hẹn mang đến những màn tranh tài kịch tính và đầy sôi động. Khán giả có thể đăng ký nhận vé miễn phí để có cơ hội trực tiếp ủng hộ thần tượng và theo dõi các trận cầu hấp dẫn!" />
        <meta name="twitter:image" content="https://etik-media.s3.amazonaws.com/1/event_banners/64b41c29-c751-400a-a54c-f8ae6f092dec.jpg" />
        <meta name="twitter:image:alt" content="MIXI CUP - Giải đấu giao hữu bóng đá đỉnh cao của cộng đồng streamer Việt Nam" />
        
        {/* Favicon */}
        <link rel="icon" href="https://etik-media.s3.amazonaws.com/1/event_avatars/9e17892e-40a4-4326-a965-944195f8f705.png" />
      </Head>
  
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
                      {event?.place ? `${event?.place}` : 'Chưa xác định'} { event?.locationUrl && <a target='_blank' href={event?.locationUrl}>Xem bản đồ</a>}
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
                      <Grid item lg={12} xs={12}>
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
                          <InputLabel>Địa chỉ thường trú</InputLabel>
                          <OutlinedInput
                            label="Địa chỉ thường trú"
                            name="customer_address"
                            value={customer.address}
                            placeholder='Vui lòng nhập chính xác theo CCCD'
                            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                          />
                        </FormControl>
                      </Grid>
                      <Grid item lg={6} xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel>Tỉnh thành thường trú</InputLabel>
                          <Select defaultValue="" label="Tỉnh thành thường trú" name="province" variant="outlined" onChange={(e) => setAdditionalAnswers({ ...additionalAnswers, province: e.target.value })}>
                            {provinces.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item lg={12} xs={12}>
                      <FormControl fullWidth required>
                          <InputLabel>Link facebook cá nhân</InputLabel>
                          <OutlinedInput
                            label="Link facebook cá nhân"
                            name="link_facebook"
                            value={additionalAnswers.linkFacebook}
                            onChange={(e) => setAdditionalAnswers({ ...additionalAnswers, linkFacebook: e.target.value })}
                          />
                        </FormControl>
                      </Grid>

                    </Grid>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Câu hỏi bổ sung" subheader="Vui lòng dành thời gian trả lời một số câu hỏi sau đây." />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      {/* Question 1 */}

                      <Grid item xs={12}>
                        <Typography variant="body2">Thời gian dự kiến bạn có mặt tại Sân vận động Bà Rịa?</Typography>
                        <FormControl fullWidth required>
                          <InputLabel>Chọn một phương án</InputLabel>
                          <Select
                            label="Chọn một phương án"
                            name="arrivalTime"
                            value={additionalAnswers.arrivalTime}
                            onChange={handleInputChange}
                          >
                            <MenuItem value={'15:30'}>15:30</MenuItem>
                            <MenuItem value={'16:30'}>16:30</MenuItem>
                            <MenuItem value={'17:30'}>17:30</MenuItem>
                            <MenuItem value={'18:30'}>18:30</MenuItem>
                            <MenuItem value={'19:30'}>19:30</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Question 2 */}
                      <Grid item xs={12}>
                        <Typography variant="body2">Hãy viết họ và tên đầy đủ của Tộc trưởng Độ Mixi?</Typography>
                        <FormControl fullWidth required>
                          <InputLabel>Câu trả lời của bạn</InputLabel>
                          <OutlinedInput
                            label="Câu trả lời của bạn"
                            name="doMixiFullName"
                            value={additionalAnswers.doMixiFullName}
                            onChange={handleInputChange}
                          />
                        </FormControl>
                      </Grid>

                      {/* Question 3 */}
                      <Grid item xs={12}>
                        <Typography variant="body2">Mixi Cup thi đấu theo thể thức mỗi đội có bao nhiêu người trên sân?</Typography>
                        <FormControl fullWidth required>
                          <InputLabel>Chọn một phương án</InputLabel>
                          <Select
                            label="Số lượng người"
                            name="teamPlayers"
                            value={additionalAnswers.teamPlayers}
                            onChange={handleInputChange}
                          >
                            <MenuItem value={5}>5</MenuItem>
                            <MenuItem value={7}>7</MenuItem>
                            <MenuItem value={8}>8</MenuItem>
                            <MenuItem value={11}>11</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Question 4 */}
                      <Grid item xs={12}>
                        <Typography variant="body2">Biển số xe ở Bà Rịa - Vũng Tàu là?</Typography>
                        <FormControl fullWidth required>
                          <InputLabel>Câu trả lời của bạn</InputLabel>
                          <OutlinedInput
                            label="Câu trả lời của bạn"
                            name="licensePlate"
                            type="number"
                            value={additionalAnswers.licensePlate}
                            onChange={handleInputChange}
                            fullWidth
                            required
                          />
                        </FormControl>


                      </Grid>

                      {/* Question 5 */}
                      <Grid item xs={12}>
                        <Typography variant="body2">Lí do khiến bạn muốn tham gia sự kiện này?</Typography>
                        <FormControl fullWidth required>
                          <InputLabel>Câu trả lời của bạn</InputLabel>
                          <OutlinedInput
                            label="Câu trả lời của bạn"
                            name="reason"
                            value={additionalAnswers.reason}
                            onChange={handleInputChange}
                            fullWidth
                            required
                          />
                        </FormControl>

                      </Grid>

                      {/* Question 6 */}
                      <Grid item xs={12}>
                        <Typography variant="body2">Bạn có điều gì muốn gửi đến BTC hoặc 4 đội không?</Typography>
                        <FormControl fullWidth required>
                          <InputLabel>Câu trả lời của bạn</InputLabel>
                          <OutlinedInput
                            label="Câu trả lời của bạn"
                            name="messageToOrganizer"
                            value={additionalAnswers.messageToOrganizer}
                            onChange={handleInputChange}
                            multiline
                            rows={4}
                            fullWidth
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
                    subheader='Tối đa 1 người'
                    action={
                      <OutlinedInput
                        sx={{ maxWidth: 130 }}
                        type="number"
                        value={ticketQuantity}
                        onChange={handleTicketQuantityChange}
                        inputProps={{ min: 1, max: 1 }}
                      />
                    }
                  />
                  {/* <Divider /> */}
                  {/* <CardContent>
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
                  </CardContent> */}
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
                          const showTicketCategory = show?.showTicketCategories.find((cat) => cat.ticketCategory.id === category);

                          return (
                            <Stack direction={{ xs: 'column', sm: 'row' }} key={showId} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                                <TicketIcon fontSize="var(--icon-fontSize-md)" />
                                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{show?.name || 'Chưa xác định'} - {showTicketCategory?.ticketCategory.name || 'Chưa rõ loại vé'}</Typography>
                              </Stack>
                              <Stack spacing={2} direction={'row'}>
                                <Typography variant="body1">Giá: {formatPrice(showTicketCategory?.ticketCategory.price || 0)}</Typography>
                                <Typography variant="body1">SL: {ticketQuantity || 0}</Typography>
                                <Typography variant="body1">
                                  Thành tiền: {formatPrice((showTicketCategory?.ticketCategory.price || 0) * (ticketQuantity || 0))}
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
                      onChange={() => {
                        console.log('Are kris ok');
                      }}
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
        open={openErrorPositionModal}
        onClose={handleCloseErrorPositionModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Container maxWidth="xl">
          <Card sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { sm: '500px', xs: '90%' },
            bgcolor: 'background.paper',
            boxShadow: 24,
          }}>
            <CardContent>
              <Stack spacing={3} direction={{ sm: 'row', xs: 'column' }} sx={{ display: 'flex', alignItems: 'center' }} >
                <div style={{ width: '150px', height: '150px', borderRadius: '20px' }}>
                  <DotLottieReact
                    src="/assets/animations/failure.lottie"
                    loop
                    width={'100%'}
                    height={'100%'}
                    style={{
                      borderRadius: '20px'
                    }}
                    autoplay
                  />
                </div>

                <Stack spacing={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Stack spacing={1}>
                    <Typography variant='h6'>
                      Bạn cần bật vị trí để tiếp tục đăng ký.
                    </Typography>
                    <Typography variant='body2'>
                      Vui lòng cho phép sử dụng vị trí để tiếp tục
                    </Typography>
                    <Typography variant='body2' color={'danger'}>

                    </Typography>
                  </Stack>
                  {/* <div style={{ marginTop: '20px' }}>
                    <Button fullWidth variant='contained' onClick={() => { handleAllowGeolocation }} size="small" endIcon={<ArrowRight />}>
                      Cho phép
                    </Button>
                  </div> */}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>
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
                  <Typography variant="body1" sx={{ textAlign: 'justify' }}>Để đảm bảo chất lượng trải nghiệm và tổ chức được tốt nhất, chúng tôi sẽ thực hiện việc chọn lọc từ danh sách đăng ký để gửi vé mời.</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'justify' }}>Ban Tổ Chức sẽ xác nhận thông tin với những bạn may mắn nhận được vé qua email. Mong các bạn thông cảm và tiếp tục theo dõi để không bỏ lỡ các cập nhật thú vị tiếp theo của giải đấu!</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'justify' }}>Cảm ơn quý khách đã sử dụng ETIK. Nếu quý khách cần hỗ trợ thêm, vui lòng gửi yêu cầu hỗ trợ <a style={{ textDecoration: 'none' }} target='_blank' href="https://forms.gle/2mogBbdUxo9A2qRk8">tại đây.</a></Typography>
                </Stack>
              </Stack>
              <div style={{ marginTop: '20px', justifyContent: 'center' }}>
                <Button fullWidth variant='contained' size="small" endIcon={<ArrowRight />} onClick={() => window.location.href = "https://www.facebook.com/MixiGaming"}>
                  Khám phá trang MixiGaming (Tự động điều hướng sau 5s).
                </Button>
              </div>

            </CardContent>
          </Card>

        </Container>
      </Modal>
    </div>
    </>
  );
}
