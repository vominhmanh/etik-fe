'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Avatar,
  Box,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  Modal,
  TextField,
  Radio,
  RadioGroup,
  FormGroup,
} from '@mui/material';
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
import { useSearchParams } from 'next/navigation';
import ReCAPTCHA from 'react-google-recaptcha';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY, parseE164Phone } from '@/config/phone-countries';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { orange } from '@mui/material/colors';
import { Schedules } from './schedules';
import { TicketCategories } from './ticket-categories';
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

type CheckoutRuntimeFieldOption = {
  value: string;
  label: string;
  sort_order: number;
};

type CheckoutRuntimeField = {
  internal_name: string;
  label: string;
  field_type: string;
  visible: boolean;
  required: boolean;
  note?: string | null;
  options?: CheckoutRuntimeFieldOption[];
};

export default function Page(): React.JSX.Element {
  const params = { event_slug: 'techdata-partners-day' }
  const searchParams = useSearchParams();
  const { tt, locale: lang } = useTranslation();
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [selectedCategories, setSelectedCategories] = React.useState<Record<number, Record<number, number>>>({});
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  // Helper functions to get title options based on language
  const getTitleOptions = React.useCallback(() => {
    if (lang === 'en') {
      return [
        { value: 'Mr.', label: 'Mr.' },
        { value: 'Ms', label: 'Ms' },
        { value: 'Mx.', label: 'Mx.' },
      ];
    }
    return [
      { value: 'Anh', label: 'Anh' },
      { value: 'Chị', label: 'Chị' },
      { value: 'Bạn', label: 'Bạn' },
    ];
  }, [lang]);

  const getDefaultTitle = React.useCallback(() => {
    return lang === 'en' ? 'Mx.' : 'Bạn';
  }, [lang]);

  const [customer, setCustomer] = React.useState({
    title: getDefaultTitle(),
    name: '',
    email: '',
    phoneNumber: '',
    phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2,
    address: '',
    dob: '',
    idcard_number: '',
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
  const [responseTransaction, setResponseTransaction] = React.useState<Transaction | null>(null);
  const [checkoutFormFields, setCheckoutFormFields] = React.useState<CheckoutRuntimeField[]>([]);
  const [checkoutCustomAnswers, setCheckoutCustomAnswers] = React.useState<Record<string, any>>({});

  // Update customer title default when language changes
  React.useEffect(() => {
    setCustomer(prev => ({
      ...prev,
      title: getDefaultTitle(),
    }));
  }, [lang, getDefaultTitle]);

  const NOTIF_KEY = 'hideNotifMarketplaceEventNotApprovedUntil';

  React.useEffect(() => {
    document.title = `${tt('Sự kiện', 'Event')} ${event?.name} | ETIK - ${tt('Vé điện tử & Quản lý sự kiện', 'E-tickets & Event Management')}`;
  }, [event, tt]);


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

  const totalSelectedTickets = React.useMemo(() => {
    return Object.values(selectedCategories).reduce((sum, catMap) => {
      return sum + Object.values(catMap || {}).reduce((sub, qty) => sub + (qty || 0), 0);
    }, 0);
  }, [selectedCategories]);

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

  // Load checkout form runtime (builtin + custom fields)
  React.useEffect(() => {
    const fetchCheckoutForm = async () => {
      if (!params.event_slug) return;
      try {
        const resp: AxiosResponse<{ fields: CheckoutRuntimeField[] }> =
          await baseHttpServiceInstance.get(
            `/marketplace/events/${params.event_slug}/forms/checkout/runtime`
          );
        setCheckoutFormFields(resp.data.fields || []);
      } catch (error) {
        // Nếu chưa có form cấu hình, vẫn dùng các field mặc định hiện tại
        console.error('Failed to load marketplace checkout form runtime', error);
      }
    };
    fetchCheckoutForm();
  }, [params.event_slug]);

  const builtinInternalNames = React.useMemo(
    () => new Set(['name', 'email', 'phone_number', 'address', 'dob', 'idcard_number']),
    []
  );

  const customCheckoutFields = React.useMemo(
    () => checkoutFormFields.filter((f) => !builtinInternalNames.has(f.internal_name)),
    [checkoutFormFields, builtinInternalNames]
  );
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
      const sized = Array.from({ length: quantity }, (_, i) => existing[i] || { title: getDefaultTitle(), name: '', email: '', phone: '' });
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

  const formatDateTime = React.useCallback((date: string) => {
    return lang === 'vi'
      ? dayjs(date).format('HH:mm DD/MM/YYYY')
      : dayjs(date).format('MMM D, YYYY, h:mm A');
  }, [lang]);


  const handleCreateClick = () => {
    if (ticketQuantity <= 0) {
      notificationCtx.warning(tt('Vui lòng điền đầy đủ các thông tin bắt buộc', 'Please fill in all required fields'));
      return;
    }

    // Validate customer required fields based on checkout form configuration
    for (const field of checkoutFormFields) {
      if (!field.visible || !field.required) continue;

      // Built-in fields mapped vào customer
      if (field.internal_name === 'name' && !customer.name) {
        notificationCtx.warning(tt('Vui lòng nhập họ tên', 'Please enter your full name'));
        return;
      }
      if (field.internal_name === 'email' && !customer.email) {
        notificationCtx.warning(tt('Vui lòng nhập email', 'Please enter your email'));
        return;
      }
      if (field.internal_name === 'phone_number' && !customer.phoneNumber) {
        notificationCtx.warning(tt('Vui lòng nhập số điện thoại', 'Please enter your phone number'));
        return;
      }
      if (field.internal_name === 'address' && !customer.address) {
        notificationCtx.warning(tt('Vui lòng nhập địa chỉ', 'Please enter your address'));
        return;
      }
      if (field.internal_name === 'dob' && !customer.dob) {
        notificationCtx.warning(tt('Vui lòng nhập ngày sinh', 'Please enter your date of birth'));
        return;
      }
      if (field.internal_name === 'idcard_number' && !customer.idcard_number) {
        notificationCtx.warning(tt('Vui lòng nhập số căn cước công dân', 'Please enter your ID card number'));
        return;
      }

      // Custom fields
      if (!builtinInternalNames.has(field.internal_name)) {
        const value = checkoutCustomAnswers[field.internal_name];
        if (field.field_type === 'checkbox') {
          if (!Array.isArray(value) || value.length === 0) {
            notificationCtx.warning(
              tt(
                `Vui lòng chọn ít nhất một lựa chọn cho "${field.label}"`,
                `Please choose at least one option for "${field.label}"`
              )
            );
            return;
          }
        } else if (!value) {
          notificationCtx.warning(
            tt(
              `Vui lòng nhập thông tin cho "${field.label}"`,
              `Please fill in "${field.label}"`
            )
          );
          return;
        }
      }
    }

    const totalSelectedCategories = Object.values(selectedCategories).reduce((sum, catMap) => sum + Object.keys(catMap || {}).length, 0);
    if (totalSelectedCategories === 0) {
      notificationCtx.warning(tt('Vui lòng chọn ít nhất 1 loại huy hiệu', 'Please select at least one badge type'));
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
            notificationCtx.warning(tt('Vui lòng điền đủ thông tin người tham dự cho từng vé.', 'Please provide attendee info for each ticket.'));
            setRequestedCategoryModalId(categoryId);
            return;
          }
        }
      }
    }

    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    if (ticketQuantity <= 0) {
      notificationCtx.warning(tt('Vui lòng điền các trường thông tin bắt buộc', 'Please fill in the required fields'));
      return;
    }

    // Validate customer required fields based on checkout form configuration
    for (const field of checkoutFormFields) {
      if (!field.visible || !field.required) continue;

      // Built-in fields mapped vào customer
      if (field.internal_name === 'name' && !customer.name) {
        notificationCtx.warning(tt('Vui lòng nhập họ tên', 'Please enter your full name'));
        return;
      }
      if (field.internal_name === 'email' && !customer.email) {
        notificationCtx.warning(tt('Vui lòng nhập email', 'Please enter your email'));
        return;
      }
      if (field.internal_name === 'phone_number' && !customer.phoneNumber) {
        notificationCtx.warning(tt('Vui lòng nhập số điện thoại', 'Please enter your phone number'));
        return;
      }
      if (field.internal_name === 'address' && !customer.address) {
        notificationCtx.warning(tt('Vui lòng nhập địa chỉ', 'Please enter your address'));
        return;
      }
      if (field.internal_name === 'dob' && !customer.dob) {
        notificationCtx.warning(tt('Vui lòng nhập ngày sinh', 'Please enter your date of birth'));
        return;
      }
      if (field.internal_name === 'idcard_number' && !customer.idcard_number) {
        notificationCtx.warning(tt('Vui lòng nhập số căn cước công dân', 'Please enter your ID card number'));
        return;
      }

      // Custom fields
      if (!builtinInternalNames.has(field.internal_name)) {
        const value = checkoutCustomAnswers[field.internal_name];
        if (field.field_type === 'checkbox') {
          if (!Array.isArray(value) || value.length === 0) {
            notificationCtx.warning(
              tt(
                `Vui lòng chọn ít nhất một lựa chọn cho "${field.label}"`,
                `Please choose at least one option for "${field.label}"`
              )
            );
            return;
          }
        } else if (!value) {
          notificationCtx.warning(
            tt(
              `Vui lòng nhập thông tin cho "${field.label}"`,
              `Please fill in "${field.label}"`
            )
          );
          return;
        }
      }
    }

    const captchaValue = captchaRef.current?.getValue();
    if (!captchaValue) {
      notificationCtx.warning(tt('Vui lòng xác nhận reCAPTCHA!', 'Please complete the reCAPTCHA!'));
      return;
    }

    if (Object.keys(selectedCategories).length == 0) {
      notificationCtx.warning(tt('Vui lòng chọn ít nhất 1 chức năng', 'Please select at least one badge type'));
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
              notificationCtx.warning(tt('Vui lòng điền đủ thông tin người tham dự cho từng vé.', 'Please provide attendee info for each ticket.'));
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

          // Convert phoneCountryIso2 to phoneCountry and phoneNationalNumber for holders
          const processedHolders = holders.map((h: any) => {
            if (!h.phone) return h;
            // Derive NSN from phone number (strip leading '0' if present)
            const digits = h.phone.replace(/\D/g, '');
            const phoneNSN = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
            return {
              ...h,
              phoneCountry: h.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2,
              phoneNationalNumber: phoneNSN,
            };
          });

          return {
            showId: parseInt(showId),
            ticketCategoryId: parseInt(categoryIdStr),
            quantity: qty || 0,
            holders: qrOption === 'separate' ? processedHolders : undefined,
          };
        })
      ));

      // Convert phoneCountryIso2 to phoneCountry and phoneNationalNumber for customer
      const digits = customer.phoneNumber.replace(/\D/g, '');
      const phoneNSN = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
      const { phoneCountryIso2, ...customerWithoutPhoneCountryIso2 } = customer;

      const customerData: any = {
        ...customerWithoutPhoneCountryIso2,
        phoneCountry: phoneCountryIso2,
        phoneNationalNumber: phoneNSN,
      };

      const isFieldVisible = (name: string) =>
        !!checkoutFormFields.find((f) => f.internal_name === name && f.visible);

      if (!isFieldVisible('address')) {
        delete customerData.address;
      }
      if (!isFieldVisible('dob')) {
        delete customerData.dob;
      }
      if (!isFieldVisible('idcard_number')) {
        delete customerData.idcard_number;
      }

      // Only send answers for visible custom fields
      const formAnswers: Record<string, any> = {};
      checkoutFormFields.forEach((field) => {
        if (!field.visible) return;
        if (builtinInternalNames.has(field.internal_name)) return;
        formAnswers[field.internal_name] = checkoutCustomAnswers[field.internal_name];
      });

      const transactionData: any = {
        customer: customerData,
        tickets,
        paymentMethod,
        qrOption,
        captchaValue,
        latitude: position?.latitude,
        longitude: position?.longitude,
      };

      if (Object.keys(formAnswers).length > 0) {
        transactionData.formAnswers = formAnswers;
      }

      const response: AxiosResponse<Transaction> = await baseHttpServiceInstance.post(
        `/marketplace/events/${params.event_slug}/transactions`,
        transactionData
      );
      // notificationCtx.success('Transaction created successfully!');
      setResponseTransaction(response.data);
      setOpenSuccessModal(true);

      // Redirect to the payment checkout URL
      if (response.data.paymentCheckoutUrl) {
        window.location.href = response.data.paymentCheckoutUrl;
      }
    } catch (error) {
      notificationCtx.error(tt('Lỗi:', 'Error:'), error);
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
      <Container maxWidth="xl" sx={{ py: '50px' }}>
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
                  alt={tt('Sự kiện', 'Event')}
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
                        {tt('Đơn vị tổ chức', 'Organizer')}: {event?.organizer}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {event?.startDateTime && event?.endDateTime
                          ? `${formatDateTime(event.startDateTime)} - ${formatDateTime(event.endDateTime)}`
                          : tt('Chưa xác định', 'TBD')} {event?.timeInstruction ? `(${event.locationInstruction})` : ''}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} >
                      <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {event?.place ? `${event?.place}` : tt('Chưa xác định', 'TBD')} {event?.locationInstruction && event.locationInstruction} {event?.locationUrl && <a href={event.locationUrl} target='_blank'>{tt('Xem bản đồ', 'View map')}</a>}
                      </Typography>
                    </Stack>

                    {event && event.displayOption !== 'display_with_everyone' &&
                      <Stack direction="row" spacing={1} sx={{ color: orange[500] }}>
                        <Eye fontSize="var(--icon-fontSize-sm)" />
                        <Typography display="inline" variant="body2">
                          {tt('Sự kiện không hiển thị công khai', 'This event is not publicly visible')}
                        </Typography>
                      </Stack>
                    }
                  </Stack>
                  <div style={{ marginTop: '20px' }}>
                    <Button fullWidth variant="contained" href={`#registration`} size="small" startIcon={<UserPlus />}>
                      {tt('Đăng ký ngay', 'Register now')}
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
                        {tt('Chưa có mô tả', 'No description')}
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
              <Typography variant="h6">{tt('Đăng ký tham dự', 'Register to attend')}</Typography>
            </Stack>
          </Stack>
          <Grid container spacing={3}>
            <Grid item lg={4} md={6} xs={12}>
              <Stack spacing={3}>
                <Schedules shows={event?.shows} onSelectionChange={handleSelectionChange} lang={lang} />
                {selectedSchedules && selectedSchedules.map(show => (
                  <TicketCategories
                    key={show.id}
                    show={show}
                    qrOption={qrOption}
                    lang={lang}
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
                  <CardHeader subheader={tt('Vui lòng điền các trường thông tin phía dưới.', 'Please fill in the required fields below.')} title={tt('Thông tin người đăng ký', 'Registrant information')} />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item lg={4} xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel htmlFor="customer-name">{tt('Danh xưng*  Họ và tên', 'Title*  Full name')}</InputLabel>
                          <OutlinedInput
                            id="customer-name"
                            label={tt('Danh xưng*  Họ và tên', 'Title*  Full name')}
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
                                  value={customer.title}
                                  onChange={(e) =>
                                    setCustomer({ ...customer, title: e.target.value })
                                  }
                                  sx={{ minWidth: 65 }} // chiều rộng tối thiểu để gọn
                                >
                                  {getTitleOptions().map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                      {option.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </InputAdornment>
                            }
                          />
                        </FormControl>
                      </Grid>
                      <Grid item lg={4} xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel>{tt('Địa chỉ Email', 'Email address')}</InputLabel>
                          <OutlinedInput
                            label={tt('Địa chỉ Email', 'Email address')}
                            name="customer_email"
                            type="email"
                            value={customer.email}
                            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                          />
                        </FormControl>
                      </Grid>
                      <Grid item lg={4} xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel>{tt('Số điện thoại', 'Phone number')}</InputLabel>
                          <OutlinedInput
                            label={tt('Số điện thoại', 'Phone number')}
                            name="customer_phone_number"
                            type="tel"
                            value={customer.phoneNumber}
                            onChange={(e) => setCustomer({ ...customer, phoneNumber: e.target.value })}
                            startAdornment={
                              <InputAdornment position="start">
                                <Select
                                  variant="standard"
                                  disableUnderline
                                  value={customer.phoneCountryIso2}
                                  onChange={(e) =>
                                    setCustomer({ ...customer, phoneCountryIso2: e.target.value as string })
                                  }
                                  sx={{ minWidth: 50 }}
                                  renderValue={(value) => {
                                    const country =
                                      PHONE_COUNTRIES.find((c) => c.iso2 === value) || DEFAULT_PHONE_COUNTRY;
                                    return country.dialCode;
                                  }}
                                >
                                  {PHONE_COUNTRIES.map((country) => (
                                    <MenuItem key={country.iso2} value={country.iso2}>
                                      {lang === 'vi' ? country.nameVi : country.nameEn} ({country.dialCode})
                                    </MenuItem>
                                  ))}
                                </Select>
                              </InputAdornment>
                            }
                          />
                        </FormControl>
                      </Grid>

                      {(() => {
                        const dobCfg = checkoutFormFields.find((f) => f.internal_name === 'dob');
                        const visible = !!dobCfg && dobCfg.visible;
                        const required = !!dobCfg?.required;
                        return (
                          visible && (
                            <Grid item lg={6} xs={12}>
                              <FormControl fullWidth required={required}>
                                <TextField
                                  fullWidth
                                  label={tt('Ngày tháng năm sinh', 'Date of Birth')}
                                  name="customer_dob"
                                  type="date"
                                  required={required}
                                  value={customer.dob || ''}
                                  onChange={(e) =>
                                    setCustomer({ ...customer, dob: e.target.value })
                                  }
                                  InputLabelProps={{
                                    shrink: true,
                                  }}
                                  inputProps={{
                                    max: new Date().toISOString().slice(0, 10),
                                  }}
                                />
                              </FormControl>
                            </Grid>
                          )
                        );
                      })()}

                      
{(() => {
                        const idCfg = checkoutFormFields.find(
                          (f) => f.internal_name === 'idcard_number'
                        );
                        const visible = !!idCfg && idCfg.visible;
                        const required = !!idCfg?.required;
                        return (
                          visible && (
                            <Grid item lg={6} xs={12}>
                              <FormControl fullWidth required={required}>
                                <InputLabel>
                                  {tt('Số Căn cước công dân', 'ID Card Number')}
                                </InputLabel>
                                <OutlinedInput
                                  label={tt('Số Căn cước công dân', 'ID Card Number')}
                                  name="customer_idcard_number"
                                  value={customer.idcard_number}
                                  onChange={(e) =>
                                    setCustomer({ ...customer, idcard_number: e.target.value })
                                  }
                                />
                              </FormControl>
                            </Grid>
                          )
                        );
                      })()}

                      {(() => {
                        const addrCfg = checkoutFormFields.find(
                          (f) => f.internal_name === 'address'
                        );
                        const visible = !!addrCfg && addrCfg.visible;
                        const required = !!addrCfg?.required;
                        return (
                          visible && (
                            <Grid item lg={12} xs={12}>
                              <FormControl fullWidth required={required}>
                                <InputLabel>{tt('Địa chỉ', 'Address')}</InputLabel>
                                <OutlinedInput
                                  label={tt('Địa chỉ', 'Address')}
                                  name="customer_address"
                                  value={customer.address}
                                  onChange={(e) =>
                                    setCustomer({ ...customer, address: e.target.value })
                                  }
                                />
                              </FormControl>
                            </Grid>
                          )
                        );
                      })()}



                      {/* Custom checkout fields (ETIK Forms) */}
                      {customCheckoutFields.map((field) => (
                        <Grid key={field.internal_name} item xs={12}>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {field.label}
                              {field.required && ' *'}
                            </Typography>
                            {field.note && (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {field.note}
                              </Typography>
                            )}

                            {['text', 'number'].includes(field.field_type) && (
                              <TextField
                                fullWidth
                                size="small"
                                type={field.field_type === 'number' ? 'number' : 'text'}
                                value={checkoutCustomAnswers[field.internal_name] ?? ''}
                                onChange={(e) =>
                                  setCheckoutCustomAnswers((prev) => ({
                                    ...prev,
                                    [field.internal_name]: e.target.value,
                                  }))
                                }
                              />
                            )}

                            {['date', 'time', 'datetime'].includes(field.field_type) && (
                              <TextField
                                fullWidth
                                size="small"
                                type={
                                  field.field_type === 'date'
                                    ? 'date'
                                    : field.field_type === 'time'
                                      ? 'time'
                                      : 'datetime-local'
                                }
                                InputLabelProps={{ shrink: true }}
                                value={checkoutCustomAnswers[field.internal_name] ?? ''}
                                onChange={(e) =>
                                  setCheckoutCustomAnswers((prev) => ({
                                    ...prev,
                                    [field.internal_name]: e.target.value,
                                  }))
                                }
                              />
                            )}

                            {field.field_type === 'radio' && field.options && (
                              <FormControl component="fieldset" variant="standard">
                                <RadioGroup
                                  value={checkoutCustomAnswers[field.internal_name] ?? ''}
                                  onChange={(e) =>
                                    setCheckoutCustomAnswers((prev) => ({
                                      ...prev,
                                      [field.internal_name]: e.target.value,
                                    }))
                                  }
                                >
                                  {field.options.map((opt) => (
                                    <FormControlLabel
                                      key={opt.value}
                                      value={opt.value}
                                      control={<Radio size="small" />}
                                      label={opt.label}
                                    />
                                  ))}
                                </RadioGroup>
                              </FormControl>
                            )}

                            {field.field_type === 'checkbox' && field.options && (
                              <FormGroup>
                                {field.options.map((opt) => {
                                  const current: string[] =
                                    checkoutCustomAnswers[field.internal_name] ?? [];
                                  const checked = current.includes(opt.value);
                                  return (
                                    <FormControlLabel
                                      key={opt.value}
                                      control={
                                        <Checkbox
                                          size="small"
                                          checked={checked}
                                          onChange={(e) => {
                                            setCheckoutCustomAnswers((prev) => {
                                              const prevArr: string[] =
                                                prev[field.internal_name] ?? [];
                                              let nextArr: string[];
                                              if (e.target.checked) {
                                                nextArr = Array.from(
                                                  new Set([...prevArr, opt.value])
                                                );
                                              } else {
                                                nextArr = prevArr.filter((v) => v !== opt.value);
                                              }
                                              return {
                                                ...prev,
                                                [field.internal_name]: nextArr,
                                              };
                                            });
                                          }}
                                        />
                                      }
                                      label={opt.label}
                                    />
                                  );
                                })}
                              </FormGroup>
                            )}
                          </Stack>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>

                {/* Ticket Quantity and Ticket Holders */}
                {totalSelectedTickets > 0 && (
                  <Card>
                    <CardHeader
                      title={tt('Danh sách vé', 'Tickets')}
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
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{show?.name || tt('Chưa xác định', 'Unknown')} - {ticketCategory?.name || tt('Chưa rõ', 'Unknown badge type')}</Typography>
                                    <IconButton size="small" sx={{ ml: 1, alignSelf: 'flex-start' }} onClick={() => setRequestedCategoryModalId(categoryId)}><Pencil /></IconButton>
                                  </Stack>
                                  <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                                    <Typography variant="caption">{quantity}</Typography>
                                  </Stack>
                                </Stack>

                                {qrOption === 'separate' && quantity > 0 && (
                                  <Stack spacing={2}>
                                    {Array.from({ length: quantity }, (_, index) => {
                                      const holderInfo = ticketHoldersByCategory[`${showId}-${categoryId}`]?.[index];
                                      return (
                                        <Box key={index} sx={{ ml: 2, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                            {index + 1}. {holderInfo?.name ? `${holderInfo?.title} ${holderInfo?.name}` : tt('Chưa có thông tin', 'No info')}
                                          </Typography>
                                          <br />
                                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {holderInfo?.email || tt('Chưa có email', 'No email')} - {holderInfo?.phone || tt('Chưa có SĐT', 'No phone')}
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
                )}

                {totalSelectedTickets > 1 && (
                  <Card>
                    <CardHeader
                      title={tt('Tùy chọn bổ sung', 'Additional options')}
                    />
                    <Divider />
                    <CardContent>
                      <Grid container spacing={1} alignItems="center">
                        <Grid item xs>
                          <Typography variant="body2">{tt('Sử dụng mã QR riêng cho từng vé', 'Use a separate QR for each ticket')}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {tt('Bạn cần nhập email cho từng vé.', 'You need to enter an email for each ticket.')}
                          </Typography>
                        </Grid>
                        <Grid item>
                          <Checkbox
                            checked={qrOption === 'separate'}
                            onChange={(_e, checked) => {
                              setQrOption(checked ? 'separate' : 'shared');
                              if (checked) {
                                notificationCtx.info(tt('Vui lòng điền thông tin cho từng vé', 'Please fill info for each ticket'));
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                
                {/* Submit Button */}
                <Grid spacing={3} container sx={{ alignItems: 'center', mt: '3' }}>
                  <Grid item sm={9} xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', }}>
                    <ReCAPTCHA
                      sitekey="6LdRnq4aAAAAAFT6htBYNthM-ksGymg70CsoYqHR"
                      ref={captchaRef}
                      hl={lang}
                    />
                  </Grid>
                  <Grid item sm={3} xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', }}>
                    <div>
                      <Button variant="contained" onClick={handleCreateClick}>
                        {tt('Đăng ký', 'Register')}
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
        <DialogTitle sx={{ color: "primary.main" }}>{tt('Xác nhận tạo đơn hàng', 'Confirm order creation')}</DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{tt('Thông tin đăng ký', 'Registration information')}</Typography>
            {checkoutFormFields.filter(f => f.visible).map((field) => {
              if (builtinInternalNames.has(field.internal_name)) {
                // Built-in fields
                if (field.internal_name === 'name') {
                  return (
                    <Box key={field.internal_name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Họ và tên", "Full Name")}</Typography>
                      <Typography variant="body2">{customer.title ? `${customer.title} ` : ''}{customer.name}</Typography>
                    </Box>
                  );
                }
                if (field.internal_name === 'email') {
                  return (
                    <Box key={field.internal_name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Địa chỉ Email", "Email Address")}</Typography>
                      <Typography variant="body2">{customer.email}</Typography>
                    </Box>
                  );
                }
                if (field.internal_name === 'phone_number') {
                  return (
                    <Box key={field.internal_name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Số điện thoại", "Phone Number")}</Typography>
                      <Typography variant="body2">
                        {(() => {
                          const selectedCountry = PHONE_COUNTRIES.find(c => c.iso2 === customer.phoneCountryIso2) || DEFAULT_PHONE_COUNTRY;
                          const digits = customer.phoneNumber.replace(/\D/g, '');
                          const phoneNSN = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
                          return phoneNSN ? `${selectedCountry.dialCode} ${phoneNSN}` : customer.phoneNumber;
                        })()}
                      </Typography>
                    </Box>
                  );
                }
                if (field.internal_name === 'address') {
                  return (
                    <Box key={field.internal_name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Địa chỉ", "Address")}</Typography>
                      <Typography variant="body2">{customer.address || '-'}</Typography>
                    </Box>
                  );
                }
                if (field.internal_name === 'dob') {
                  return (
                    <Box key={field.internal_name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Ngày tháng năm sinh", "Date of Birth")}</Typography>
                      <Typography variant="body2">{customer.dob || '-'}</Typography>
                    </Box>
                  );
                }
                if (field.internal_name === 'idcard_number') {
                  return (
                    <Box key={field.internal_name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Số Căn cước công dân", "ID Card Number")}</Typography>
                      <Typography variant="body2">{customer.idcard_number || '-'}</Typography>
                    </Box>
                  );
                }
                return null;
              } else {
                // Custom fields
                const answer = checkoutCustomAnswers[field.internal_name];
                let displayValue = '-';
                if (answer !== undefined && answer !== null && answer !== '') {
                  if (field.field_type === 'checkbox' && Array.isArray(answer)) {
                    displayValue = answer.join(', ');
                  } else if (field.field_type === 'radio' && field.options) {
                    const option = field.options.find(opt => opt.value === answer);
                    displayValue = option ? option.label : answer;
                  } else {
                    displayValue = String(answer);
                  }
                }
                return (
                  <Box key={field.internal_name} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{field.label}</Typography>
                    <Typography variant="body2">{displayValue}</Typography>
                  </Box>
                );
              }
            })}
            <Divider />

            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{tt('Danh sách vé', 'Tickets')}</Typography>
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
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{show?.name || tt('Chưa xác định', 'Unknown')} - {ticketCategory?.name || tt('Chưa rõ', 'Unknown badge type')}</Typography>
                        </Stack>
                        <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                          <Typography variant="caption">{quantity}</Typography>
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
                                    {index + 1}. {holderInfo?.name ? `${holderInfo?.title} ${holderInfo?.name}` : tt('Chưa có thông tin', 'No info')}
                                  </Typography>
                                  <br />
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {holderInfo?.email || tt('Chưa có email', 'No email')} - {holderInfo?.phone || tt('Chưa có SĐT', 'No phone')}
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

          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{tt('Quay lại', 'Back')}</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>{tt('Xác nhận', 'Confirm')}</Button>
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
                  <Typography variant="h5">{tt('Đăng ký thành công !', 'Registration successful!')}</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'justify' }}>
                    {lang === 'vi'
                      ? `Cảm ơn ${customer.title} ${customer.name} đã sử dụng ETIK. Hãy kiểm tra Email để xem vé. Nếu ${customer.title} cần hỗ trợ thêm, vui lòng gửi yêu cầu hỗ trợ `
                      : `Thank you ${customer.title} ${customer.name} for using ETIK. Please check your email for your tickets. If you need support, submit a request `}
                    <a style={{ textDecoration: 'none' }} target='_blank' href="https://forms.gle/2mogBbdUxo9A2qRk8">{tt('tại đây.', 'here.')}</a>
                  </Typography>
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
                      {tt('Khám phá trang thông tin sự kiện.', 'Explore the event page.')}
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
                      {tt('Đăng ký check-in bằng khuôn mặt', 'Register face check-in')}
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
                    {tt('Tạo một đơn hàng khác', 'Create another order')}
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
            <CardHeader title={tt('Thông báo: Sự kiện này không hiển thị công khai', 'Notice: This event is not publicly visible')} />
            <Divider />
            <CardContent>
              <Stack spacing={3}>
                <Stack spacing={1}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {tt('Hiện tại, sự kiện này chỉ hiển thị với ', 'Currently, this event is only visible to ')}<b>{tt('người quản lý sự kiện', 'event managers')}</b>{tt(' do sự kiện chưa phải là Sự kiện Được xác thực.', ' because it is not yet a Verified Event.')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {tt('Để sự kiện được hiển thị công khai, quý khách vui lòng nâng cấp thành Sự kiện Được xác thực tại trang quản trị sự kiện. Xin cảm ơn!', 'To make the event public, please upgrade it to a Verified Event in the event management page. Thank you!')}
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
                    label={tt('Không hiển thị lại trong 24 giờ', 'Do not show again for 24 hours')}
                  />

                  <div style={{ textAlign: 'center' }}>
                    <Button fullWidth variant="contained" size="small" onClick={handleCloseNotifModal}>
                      {tt('Đã hiểu', 'Got it')}
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
