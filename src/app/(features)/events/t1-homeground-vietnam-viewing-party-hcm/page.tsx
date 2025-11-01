'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Avatar, Box, Checkbox, Container, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormHelperText, IconButton, InputAdornment, Modal } from '@mui/material';
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
import { ArrowRight, Eye, Pencil, UserPlus } from '@phosphor-icons/react/dist/ssr';
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
import { sha256 } from 'js-sha256';
import { ScanSmiley as ScanSmileyIcon } from '@phosphor-icons/react/dist/ssr/ScanSmiley';

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
  useCheckInFace: boolean;
};


// TransactionResponse.ts
export interface Transaction {
  id: number;
  email: string;
  name: string;
  paymentCheckoutUrl: string | null;
  status: string;
  createdAt: Date;
  exportedTicketAt: string | null;
  customerResponseToken: string | null;
}

const options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};
type TicketHolderInfo = { title: string; name: string; email: string; phone: string };

const paymentMethodLabelMap: Record<string, string> = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  napas247: 'Napas 247',
};

export default function Page(): React.JSX.Element {
  const params = { event_slug: 't1-homeground-vietnam-viewing-party-hcm' }

  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [selectedCategories, setSelectedCategories] = React.useState<Record<number, Record<number, number>>>({});
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  const [customer, setCustomer] = React.useState({
    title: 'Bạn',
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    dob: '',
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
  const [qrOption, setQrOption] = React.useState<string>("shared");
  const [requestedCategoryModalId, setRequestedCategoryModalId] = React.useState<number | null>(null);
  const [ticketHoldersByCategory, setTicketHoldersByCategory] = React.useState<Record<string, TicketHolderInfo[]>>({});
  const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);
  const [openAccessPasswordModal, setOpenAccessPasswordModal] = React.useState(true);
  const [accessingPassword, setAccessingPassword] = React.useState<string>('');
  const [responseTransaction, setResponseTransaction] = React.useState<Transaction | null>(null);
  const VALID_HASH = '668f444694341f0c7979bdd20314f11c91eeec0515d755f3058ebb70723c9722'; // SHA-256 of "password"

  const hashSHA256 = async (str: string) => {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }
    } catch (err) {
      // Ignore and fallback to js-sha256
    }
    // Fallback for environments without SubtleCrypto (e.g., non-secure context)
    return sha256(str);
  };


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
    return Object.entries(selectedCategories).reduce((total, [showId, categories]) => {
      const show = event?.shows.find((show) => show.id === parseInt(showId));
      const categoriesTotal = Object.entries(categories || {}).reduce((sub, [categoryIdStr, qty]) => {
        const categoryId = parseInt(categoryIdStr);
        const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
        return sub + (ticketCategory?.price || 0) * (qty || 0);
      }, 0);
      return total + categoriesTotal;
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
  const handleAddToCartQuantity = (showId: number, categoryId: number, quantity: number, holders?: TicketHolderInfo[]) => {
    setSelectedCategories(prev => {
      const forShow = prev[showId] || {};
      const updatedForShow = { ...forShow } as Record<number, number>;
      if (quantity <= 0) {
        delete updatedForShow[categoryId];
      } else {
        updatedForShow[categoryId] = quantity;
      }
      return {
        ...prev,
        [showId]: updatedForShow,
      };
    });

    const key = `${showId}-${categoryId}`;
    setTicketHoldersByCategory(prev => {
      if (quantity <= 0) {
        const next = { ...prev } as Record<string, TicketHolderInfo[]>;
        delete next[key];
        return next;
      }
      if (holders && holders.length > 0) {
        return { ...prev, [key]: holders.slice(0, quantity) };
      }
      // ensure existing array is sized to quantity
      const existing = prev[key] || [];
      const sized = Array.from({ length: quantity }, (_, i) => existing[i] || { title: 'Bạn', name: '', email: '', phone: '' });
      return { ...prev, [key]: sized };
    });
  };


  const handleCategorySelection = (showId: number, categoryId: number) => {
    setSelectedCategories(prevCategories => {
      const existingForShow = prevCategories[showId] || {};
      const exists = Object.prototype.hasOwnProperty.call(existingForShow, categoryId);
      const nextForShow = { ...existingForShow } as Record<number, number>;
      if (exists) {
        delete nextForShow[categoryId];
      } else {
        nextForShow[categoryId] = 1; // default quantity when toggled via list
      }
      return {
        ...prevCategories,
        [showId]: nextForShow,
      };
    });
  };

  const handleSelectionChange = (selected: Show[]) => {
    setSelectedSchedules(selected);
    const tmpObj: Record<number, Record<number, number>> = {}
    selected.forEach((s) => { tmpObj[s.id] = selectedCategories[s.id] || {} })
    setSelectedCategories(tmpObj);

    // filter holders to only keep keys for selected shows
    const allowedShowIds = new Set(selected.map(s => s.id));
    setTicketHoldersByCategory(prev => {
      const next: Record<string, TicketHolderInfo[]> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const showIdStr = k.split('-')[0];
        const sid = parseInt(showIdStr);
        if (allowedShowIds.has(sid)) next[k] = v;
      });
      return next;
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };


  const handleCreateClick = () => {
    if (!customer.name || !customer.email || !customer.phoneNumber || !customer.dob || ticketQuantity <= 0) {
      notificationCtx.warning('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    const totalSelectedCategories = Object.values(selectedCategories).reduce((sum, catMap) => sum + Object.keys(catMap || {}).length, 0);
    if (totalSelectedCategories === 0) {
      notificationCtx.warning('Vui lòng chọn ít nhất 1 loại vé');
      return;
    }


    // Validate per-ticket holder info when separate QR is selected
    if (qrOption === 'separate') {
      for (const [showId, categories] of Object.entries(selectedCategories)) {
        for (const [categoryIdStr, qty] of Object.entries(categories || {})) {
          const categoryId = parseInt(categoryIdStr);
          const quantity = qty || 0;
          if (quantity <= 0) continue;
          const key = `${showId}-${categoryId}`;
          const holders = ticketHoldersByCategory[key] || [];
          let invalid = holders.length < quantity;
          if (!invalid) {
            for (let i = 0; i < quantity; i++) {
              const h = holders[i];
              if (!h || !h.title || !h.name) { invalid = true; break; }
            }
          }
          if (invalid) {
            notificationCtx.warning('Vui lòng điền đủ thông tin người tham dự cho từng vé.');
            setRequestedCategoryModalId(categoryId);
            return;
          }
        }
      }
    }

    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    if (!customer.name || !customer.email || !customer.address || !customer.dob || ticketQuantity <= 0) {
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

    try {
      if (qrOption === 'separate') {
        for (const [showId, categories] of Object.entries(selectedCategories)) {
          for (const [categoryIdStr, qty] of Object.entries(categories || {})) {
            const categoryId = parseInt(categoryIdStr);
            const quantity = qty || 0;
            if (quantity <= 0) continue;
            const key = `${showId}-${categoryId}`;
            const holders = ticketHoldersByCategory[key] || [];
            let invalid = holders.length < quantity;
            if (!invalid) {
              for (let i = 0; i < quantity; i++) {
                const h = holders[i];
                if (!h || !h.title || !h.name) { invalid = true; break; }
              }
            }
            if (invalid) {
              setConfirmOpen(false);
              notificationCtx.warning('Vui lòng điền đủ thông tin người tham dự cho từng vé.');
              setRequestedCategoryModalId(categoryId);
              return;
            }
          }
        }
      }

      setConfirmOpen(false);
      setIsLoading(true);

      const tickets = Object.entries(selectedCategories).flatMap(([showId, catMap]) => (
        Object.entries(catMap || {}).map(([categoryIdStr, qty]) => {
          const key = `${showId}-${categoryIdStr}`;
          const holders = ticketHoldersByCategory[key] || [];
          return {
            showId: parseInt(showId),
            ticketCategoryId: parseInt(categoryIdStr),
            quantity: qty || 0,
            holders: qrOption === 'separate' ? holders : undefined,
          };
        })
      ));

      const transactionData = {
        customer,
        tickets,
        paymentMethod,
        qrOption,
        captchaValue,
        "latitude": position?.latitude,
        "longitude": position?.longitude
      };

      const response: AxiosResponse<Transaction> = await baseHttpServiceInstance.post(
        `/marketplace/events/${params.event_slug}/transactions`,
        transactionData
      );
      // notificationCtx.success('Transaction created successfully!');
      setResponseTransaction(response.data);
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
        open={openAccessPasswordModal}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 2,
          marginLeft: '0px !important',
        }}
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
                      src="/assets/animations/warning.lottie"
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
                  <Typography variant="h5">Yêu cầu mã số</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'justify' }}>Để truy cập sự kiện này, vui lòng nhập mã truy cập. Vui lòng liên hệ BTC để biết thêm chi tiết</Typography>
                  {/* 👉 Password input here */}
                  <FormControl fullWidth required>
                    <OutlinedInput
                      type="password"
                      // label="Mã truy cập sự kiện"
                      name='accessing_password'
                      size="small"
                      value={accessingPassword}
                      onChange={(e) => {
                        const input = e.target.value;
                        setAccessingPassword(input);

                        hashSHA256(input).then((hashed) => {
                          if (hashed === VALID_HASH) {
                            setOpenAccessPasswordModal(false);
                          }
                        });
                      }}
                      sx={{ mt: 3 }}
                    />
                  </FormControl>

                </Stack>
              </Stack>
              <div style={{ marginTop: '20px', justifyContent: 'center' }}>
                <Button fullWidth variant='contained' size="small" endIcon={<ArrowRight />} >
                  Truy cập
                </Button>
              </div>
            </CardContent>
          </Card>
        </Container>
      </Backdrop>
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
                  <TicketCategories
                    key={show.id}
                    show={show}
                    qrOption={qrOption}
                    requestedCategoryModalId={requestedCategoryModalId || undefined}
                    onModalRequestHandled={() => setRequestedCategoryModalId(null)}
                    onCategorySelect={(categoryId: number) => handleCategorySelection(show.id, categoryId)}
                    onAddToCart={(categoryId: number, quantity: number, holders?: { title: string; name: string; email: string; phone: string; }[]) => handleAddToCartQuantity(show.id, categoryId, quantity, holders)}
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
                          <InputLabel shrink>Ngày tháng năm sinh</InputLabel>
                          <OutlinedInput
                            label="Ngày tháng năm sinh"
                            name="customer_dob"
                            type='date'
                            value={customer.dob}
                            onChange={(e) => setCustomer({ ...customer, dob: e.target.value })}
                            inputProps={{ max: new Date().toISOString().slice(0, 10) }}
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

                      <Grid item lg={12} xs={12}>
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
                    title="Danh sách vé"
                    action={
                      <FormControl size="small" sx={{ width: 210 }}>
                        <InputLabel id="qr-option-label">Thông tin trên vé</InputLabel>
                        <Select
                          labelId="qr-option-label"
                          value={qrOption}
                          label="Thông tin trên vé"
                          onChange={(e) => {
                            setQrOption(e.target.value);
                            if (e.target.value === 'separate') {
                              notificationCtx.info("Vui lòng điền thông tin người sở hữu cho từng vé");
                            }
                          }}
                        >
                          <MenuItem value="shared">
                            <Stack>
                              <Typography variant="body2">Giống thông tin người đ.ký</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                dùng một QR check-in tất cả vé
                              </Typography>
                            </Stack>
                          </MenuItem>
                        </Select>
                      </FormControl>
                    }
                  />
                  <Divider />
                  <CardContent>
                    <Stack spacing={3}>
                      {Object.entries(selectedCategories).flatMap(([showId, categories]) => {
                        const show = event?.shows.find((show) => show.id === parseInt(showId));
                        return Object.entries(categories || {}).map(([categoryIdStr, qty]) => {
                          const categoryId = parseInt(categoryIdStr);
                          const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
                          const quantity = qty || 0;
                          return (
                            <Stack spacing={3} key={`${showId}-${categoryId}`}>
                              <Stack direction={{ xs: 'column', md: 'row' }} key={`${showId}-${categoryId}`} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                                  <TicketIcon fontSize="var(--icon-fontSize-md)" />
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{show?.name || 'Chưa xác định'} - {ticketCategory?.name || 'Chưa rõ loại vé'}</Typography>
                                  <IconButton size="small" sx={{ ml: 1, alignSelf: 'flex-start' }} onClick={() => setRequestedCategoryModalId(categoryId)}><Pencil /></IconButton>
                                </Stack>
                                <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                                  <Typography variant="caption">{formatPrice(ticketCategory?.price || 0)}</Typography>
                                  <Typography variant="caption">x {quantity}</Typography>
                                  <Typography variant="caption">
                                    = {formatPrice((ticketCategory?.price || 0) * quantity)}
                                  </Typography>
                                </Stack>
                              </Stack>

                              {qrOption === 'separate' && quantity > 0 && (
                                <Stack spacing={2}>
                                  {Array.from({ length: quantity }, (_, index) => {
                                    const holderInfo = ticketHoldersByCategory[`${showId}-${categoryId}`]?.[index];
                                    return (
                                      <Box key={index} sx={{ ml: 2, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                          {index + 1}. {holderInfo?.name ? `${holderInfo?.title} ${holderInfo?.name}` : 'Chưa có thông tin'}
                                        </Typography>
                                        <br />
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                          {holderInfo?.email || 'Chưa có email'} - {holderInfo?.phone || 'Chưa có SĐT'}
                                        </Typography>
                                      </Box>
                                    );
                                  })}
                                </Stack>
                              )}
                            </Stack >
                          );
                        });
                      })}
                    </Stack>
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
                {Object.values(selectedCategories).some((catMap) => Object.keys(catMap || {}).length > 0) && (
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Tổng cộng:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {formatPrice(
                            totalAmount
                          )}
                        </Typography>
                      </Box>
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
                      <Button variant="contained" onClick={handleCreateClick}>
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

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ color: "primary.main" }}>Xác nhận tạo đơn hàng</DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Thông tin người mua</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Họ và tên</Typography>
              <Typography variant="body2">{customer.title ? `${customer.title} ` : ''}{customer.name}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Email</Typography>
              <Typography variant="body2">{customer.email}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Ngày tháng năm sinh</Typography>
              <Typography variant="body2">{dayjs(customer.dob).format('DD/MM/YYYY')}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Số điện thoại</Typography>
              <Typography variant="body2">{customer.phoneNumber}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Địa chỉ</Typography>
              <Typography variant="body2">{customer.address}</Typography>
            </Box>
            <Divider />

            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Danh sách vé</Typography>
            <Stack spacing={1}>
              {Object.entries(selectedCategories).flatMap(([showId, categories]) => {
                const show = event?.shows.find((show) => show.id === parseInt(showId));
                return Object.entries(categories || {}).map(([categoryIdStr, qty]) => {
                  const categoryId = parseInt(categoryIdStr);
                  const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
                  const quantity = qty || 0;
                  return (
                    <Stack spacing={0} key={`confirm-${showId}-${categoryId}`}>
                      <Stack direction={{ xs: 'column', md: 'row' }} key={`${showId}-${categoryId}`} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <TicketIcon fontSize="var(--icon-fontSize-md)" />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{show?.name || 'Chưa xác định'} - {ticketCategory?.name || 'Chưa rõ loại vé'}</Typography>
                        </Stack>
                        <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                          <Typography variant="caption">{formatPrice(ticketCategory?.price || 0)}</Typography>
                          <Typography variant="caption">x {quantity}</Typography>
                          <Typography variant="caption">
                            = {formatPrice((ticketCategory?.price || 0) * quantity)}
                          </Typography>
                        </Stack>
                      </Stack>

                      {qrOption === 'separate' && quantity > 0 && (
                        <Box sx={{ ml: 2 }}>
                          <Stack spacing={1}>
                            {Array.from({ length: quantity }, (_, index) => {
                              const holderInfo = ticketHoldersByCategory[`${showId}-${categoryId}`]?.[index];
                              return (
                                <Box key={index} sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                    {index + 1}. {holderInfo?.name ? `${holderInfo?.title} ${holderInfo?.name}` : 'Chưa có thông tin'}
                                  </Typography>
                                  <br />
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {holderInfo?.email || 'Chưa có email'} - {holderInfo?.phone || 'Chưa có SĐT'}
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  );
                });
              })}
            </Stack>
            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Phương thức thanh toán</Typography>
              <Typography variant="body2">{paymentMethodLabelMap[paymentMethod] || paymentMethod}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Tổng cộng</Typography>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {formatPrice(totalAmount)}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Quay lại</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>Xác nhận</Button>
        </DialogActions>
      </Dialog>
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
                  <Typography variant="body2" sx={{ textAlign: 'justify' }}>Cảm ơn {customer.title} {customer.name} đã sử dụng ETIK. Hãy kiểm tra Email để xem vé. Nếu {customer.title} cần hỗ trợ thêm, vui lòng gửi yêu cầu hỗ trợ <a style={{ textDecoration: 'none' }} target='_blank' href="https://forms.gle/2mogBbdUxo9A2qRk8">tại đây.</a></Typography>
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
                  {event?.useCheckInFace && (
                  <Button
                    fullWidth
                    variant='contained'
                    size="small"
                    component="a"
                    href={`https://ekyc.etik.vn/ekyc-register?event_slug=${params.event_slug}&transaction_id=${responseTransaction?.id}&response_token=${responseTransaction?.customerResponseToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<ScanSmileyIcon />}
                  >
                    Đăng ký check-in bằng khuôn mặt
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
                    Hiện tại, sự kiện này chỉ hiển thị với <b>người quản lý sự kiện</b> do sự kiện chưa được nâng cấp thành Sự kiện Được xác thực.
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Để sự kiện được hiển thị công khai, quý khách vui lòng nâng cấp thành Sự kiện Được xác thực tại trang quản trị sự kiện. Xin cảm ơn!
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
