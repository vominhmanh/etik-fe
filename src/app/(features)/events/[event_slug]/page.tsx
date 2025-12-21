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
import { calculateVoucherDiscount } from '@/utils/voucher-discount';
import { X } from '@phosphor-icons/react/dist/ssr';

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
  checkoutFormFields?: CheckoutRuntimeField[];
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
  paymentStatus: string | null;
  paymentMethod: string | null;
  sentPaymentInstructionAt: string | null;
  sentTicketViaZalo?: boolean;
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
  sortOrder: number;
};

type CheckoutRuntimeField = {
  internalName: string;
  label: string;
  fieldType: string;
  visible: boolean;
  required: boolean;
  note?: string | null;
  options?: CheckoutRuntimeFieldOption[];
};

const paymentMethodLabelMap: Record<string, string> = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  napas247: 'Napas 247',
};

export default function Page({ params }: { params: { event_slug: string } }): React.JSX.Element {
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

  // Voucher states
  const [availableVouchers, setAvailableVouchers] = React.useState<any[]>([]);
  const [appliedVoucher, setAppliedVoucher] = React.useState<any | null>(null);
  const [manualDiscountCode, setManualDiscountCode] = React.useState<string>('');
  const [voucherDetailModalOpen, setVoucherDetailModalOpen] = React.useState<boolean>(false);
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] = React.useState<any | null>(null);

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
  // Get all tickets in order with details
  const orderTickets = React.useMemo(() => {
    const tickets: Array<{ showId: number; ticketCategoryId: number; price: number; quantity: number }> = [];
    Object.entries(selectedCategories).forEach(([showId, categories]) => {
      const show = event?.shows.find((show) => show.id === parseInt(showId));
      Object.entries(categories || {}).forEach(([categoryIdStr, qty]) => {
        const categoryId = parseInt(categoryIdStr);
        const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
        if (ticketCategory && qty > 0) {
          tickets.push({
            showId: parseInt(showId),
            ticketCategoryId: categoryId,
            price: ticketCategory.price,
            quantity: qty || 0,
          });
        }
      });
    });
    return tickets;
  }, [selectedCategories, event]);

  // Check if ticket is in voucher scope
  const isTicketInScope = React.useCallback((showId: number, ticketCategoryId: number, voucher: any): boolean => {
    if (voucher.applyToAll) {
      return true;
    }
    if (!voucher.ticketCategories || voucher.ticketCategories.length === 0) {
      return false;
    }
    return voucher.ticketCategories.some((tc: any) => tc.id === ticketCategoryId);
  }, []);

  // Validate voucher can be applied
  const validateVoucher = React.useCallback((voucher: any): { valid: boolean; message?: string } => {
    if (!voucher) {
      return { valid: false, message: tt('Voucher không hợp lệ', 'Invalid voucher') };
    }

    const ticketsInScope = orderTickets.filter((ticket) =>
      isTicketInScope(ticket.showId, ticket.ticketCategoryId, voucher)
    );
    const totalTicketsInScope = ticketsInScope.reduce((sum, t) => sum + t.quantity, 0);

    if (totalTicketsInScope === 0) {
      return {
        valid: false,
        message: tt('Đơn hàng không có vé thuộc phạm vi áp dụng của voucher', 'Order does not have tickets in voucher scope'),
      };
    }

    if (voucher.minTicketsRequired && totalTicketsInScope < voucher.minTicketsRequired) {
      return {
        valid: false,
        message: tt(
          `Voucher yêu cầu tối thiểu ${voucher.minTicketsRequired} vé trong phạm vi áp dụng`,
          `Voucher requires minimum ${voucher.minTicketsRequired} tickets in scope`
        ),
      };
    }

    if (voucher.maxTicketsAllowed && totalTicketsInScope > voucher.maxTicketsAllowed) {
      return {
        valid: false,
        message: tt(
          `Voucher chỉ cho phép tối đa ${voucher.maxTicketsAllowed} vé trong phạm vi áp dụng`,
          `Voucher allows maximum ${voucher.maxTicketsAllowed} tickets in scope`
        ),
      };
    }

    return { valid: true };
  }, [orderTickets, isTicketInScope, tt]);

  // Calculate discount amount using helper function
  const discountAmount = React.useMemo(() => {
    if (!appliedVoucher) return 0;
    return calculateVoucherDiscount(appliedVoucher, orderTickets, isTicketInScope, validateVoucher);
  }, [appliedVoucher, orderTickets, isTicketInScope, validateVoucher]);

  // Check if applied voucher is still valid
  const voucherValidation = React.useMemo(() => {
    if (!appliedVoucher) {
      return { valid: true };
    }
    return validateVoucher(appliedVoucher);
  }, [appliedVoucher, validateVoucher]);

  const totalAmount = React.useMemo(() => {
    return orderTickets.reduce((sum, ticket) => sum + ticket.price * ticket.quantity, 0);
  }, [orderTickets]);

  // Calculate final total (with discount, no extraFee for marketplace)
  const finalTotal = React.useMemo(() => {
    return Math.max(0, totalAmount - discountAmount);
  }, [totalAmount, discountAmount]);

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
          setCheckoutFormFields(response.data.checkoutFormFields || []);
        } catch (error) {
          notificationCtx.error('Lỗi:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    }
  }, [params.event_slug]);

  // Fetch available public vouchers
  React.useEffect(() => {
    const fetchAvailableVouchers = async () => {
      try {
        const response: AxiosResponse<any[]> = await baseHttpServiceInstance.get(
          `/marketplace/events/${params.event_slug}/voucher-campaigns/public/available`
        );
        setAvailableVouchers(response.data || []);
      } catch (error) {
        // Silently fail - vouchers are optional
        console.error('Error fetching vouchers:', error);
      }
    };
    if (params.event_slug) {
      fetchAvailableVouchers();
    }
  }, [params.event_slug]);


  const builtinInternalNames = React.useMemo(
    () => new Set(['title', 'name', 'email', 'phone_number', 'address', 'dob', 'idcard_number']),
    []
  );

  const customCheckoutFields = React.useMemo(
    () => checkoutFormFields.filter((f) => !builtinInternalNames.has(f.internalName)),
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

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
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
      if (field.internalName === 'name' && !customer.name) {
        notificationCtx.warning(tt('Vui lòng nhập họ tên', 'Please enter your full name'));
        return;
      }
      if (field.internalName === 'email' && !customer.email) {
        notificationCtx.warning(tt('Vui lòng nhập email', 'Please enter your email'));
        return;
      }
      if (field.internalName === 'phone_number' && !customer.phoneNumber) {
        notificationCtx.warning(tt('Vui lòng nhập số điện thoại', 'Please enter your phone number'));
        return;
      }
      if (field.internalName === 'address' && !customer.address) {
        notificationCtx.warning(tt('Vui lòng nhập địa chỉ', 'Please enter your address'));
        return;
      }
      if (field.internalName === 'dob' && !customer.dob) {
        notificationCtx.warning(tt('Vui lòng nhập ngày sinh', 'Please enter your date of birth'));
        return;
      }
      if (field.internalName === 'idcard_number' && !customer.idcard_number) {
        notificationCtx.warning(tt('Vui lòng nhập số căn cước công dân', 'Please enter your ID card number'));
        return;
      }

      // Custom fields
      if (!builtinInternalNames.has(field.internalName)) {
        const value = checkoutCustomAnswers[field.internalName];
        if (field.fieldType === 'checkbox') {
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
      notificationCtx.warning(tt('Vui lòng chọn ít nhất 1 loại vé', 'Please select at least one ticket type'));
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

  // Handle apply voucher from list
  const handleApplyVoucher = React.useCallback((voucher: any) => {
    const validation = validateVoucher(voucher);
    setAppliedVoucher(voucher); // Always set to show the box, even if invalid
    setManualDiscountCode('');
    if (!validation.valid) {
      notificationCtx.error(validation.message || tt('Voucher không hợp lệ', 'Invalid voucher'));
      return;
    }
    notificationCtx.success(tt('Áp dụng mã khuyến mãi thành công', 'Voucher applied successfully'));
  }, [validateVoucher, notificationCtx, tt]);

  // Handle validate and display voucher from manual input
  const handleValidateAndDisplayVoucher = React.useCallback(async () => {
    if (!manualDiscountCode.trim()) {
      notificationCtx.warning(tt('Vui lòng nhập mã khuyến mãi', 'Please enter voucher code'));
      return;
    }

    try {
      const response: AxiosResponse<any> = await baseHttpServiceInstance.get(
        `/marketplace/events/${params.event_slug}/voucher-campaigns/validate-voucher`,
        { params: { code: manualDiscountCode.trim() } }
      );
      const voucher = response.data;
      setAppliedVoucher(voucher); // Always set to show the box
      setManualDiscountCode('');

      // Validate voucher after receiving from API
      const validation = validateVoucher(voucher);
      if (!validation.valid) {
        notificationCtx.error(validation.message || tt('Voucher không hợp lệ', 'Invalid voucher'));
        return;
      }

      notificationCtx.success(tt('Mã khuyến mãi hợp lệ', 'Voucher code is valid'));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || tt('Mã khuyến mãi không hợp lệ', 'Invalid voucher code');
      notificationCtx.error(errorMessage);
      setAppliedVoucher(null);
    }
  }, [manualDiscountCode, params.event_slug, notificationCtx, validateVoucher, tt]);

  const handleSubmit = async () => {
    if (ticketQuantity <= 0) {
      notificationCtx.warning(tt('Vui lòng điền các trường thông tin bắt buộc', 'Please fill in the required fields'));
      return;
    }

    // Validate customer required fields based on checkout form configuration
    for (const field of checkoutFormFields) {
      if (!field.visible || !field.required) continue;

      // Built-in fields mapped vào customer
      if (field.internalName === 'name' && !customer.name) {
        notificationCtx.warning(tt('Vui lòng nhập họ tên', 'Please enter your full name'));
        return;
      }
      if (field.internalName === 'email' && !customer.email) {
        notificationCtx.warning(tt('Vui lòng nhập email', 'Please enter your email'));
        return;
      }
      if (field.internalName === 'phone_number' && !customer.phoneNumber) {
        notificationCtx.warning(tt('Vui lòng nhập số điện thoại', 'Please enter your phone number'));
        return;
      }
      if (field.internalName === 'address' && !customer.address) {
        notificationCtx.warning(tt('Vui lòng nhập địa chỉ', 'Please enter your address'));
        return;
      }
      if (field.internalName === 'dob' && !customer.dob) {
        notificationCtx.warning(tt('Vui lòng nhập ngày sinh', 'Please enter your date of birth'));
        return;
      }
      if (field.internalName === 'idcard_number' && !customer.idcard_number) {
        notificationCtx.warning(tt('Vui lòng nhập số căn cước công dân', 'Please enter your ID card number'));
        return;
      }

      // Custom fields
      if (!builtinInternalNames.has(field.internalName)) {
        const value = checkoutCustomAnswers[field.internalName];
        if (field.fieldType === 'checkbox') {
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
      notificationCtx.warning(tt('Vui lòng chọn ít nhất 1 loại vé', 'Please select at least one ticket type'));
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
        !!checkoutFormFields.find((f) => f.internalName === name && f.visible);

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
        if (builtinInternalNames.has(field.internalName)) return;
        formAnswers[field.internalName] = checkoutCustomAnswers[field.internalName];
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

      // Add voucher code if applied and valid
      if (appliedVoucher && voucherValidation.valid) {
        transactionData.voucherCode = appliedVoucher.code;
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
                        const dobCfg = checkoutFormFields.find((f) => f.internalName === 'dob');
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
                          (f) => f.internalName === 'idcard_number'
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
                          (f) => f.internalName === 'address'
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
                        <Grid key={field.internalName} item xs={12}>
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

                            {['text', 'number'].includes(field.fieldType) && (
                              <TextField
                                fullWidth
                                size="small"
                                type={field.fieldType === 'number' ? 'number' : 'text'}
                                value={checkoutCustomAnswers[field.internalName] ?? ''}
                                onChange={(e) =>
                                  setCheckoutCustomAnswers((prev) => ({
                                    ...prev,
                                    [field.internalName]: e.target.value,
                                  }))
                                }
                              />
                            )}

                            {['date', 'time', 'datetime'].includes(field.fieldType) && (
                              <TextField
                                fullWidth
                                size="small"
                                type={
                                  field.fieldType === 'date'
                                    ? 'date'
                                    : field.fieldType === 'time'
                                      ? 'time'
                                      : 'datetime-local'
                                }
                                InputLabelProps={{ shrink: true }}
                                value={checkoutCustomAnswers[field.internalName] ?? ''}
                                onChange={(e) =>
                                  setCheckoutCustomAnswers((prev) => ({
                                    ...prev,
                                    [field.internalName]: e.target.value,
                                  }))
                                }
                              />
                            )}

                            {field.fieldType === 'radio' && field.options && (
                              <FormControl component="fieldset" variant="standard">
                                <RadioGroup
                                  value={checkoutCustomAnswers[field.internalName] ?? ''}
                                  onChange={(e) =>
                                    setCheckoutCustomAnswers((prev) => ({
                                      ...prev,
                                      [field.internalName]: e.target.value,
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

                            {field.fieldType === 'checkbox' && field.options && (
                              <FormGroup>
                                {field.options.map((opt) => {
                                  const current: string[] =
                                    checkoutCustomAnswers[field.internalName] ?? [];
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
                                                prev[field.internalName] ?? [];
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
                                                [field.internalName]: nextArr,
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
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{show?.name || tt('Chưa xác định', 'Unknown')} - {ticketCategory?.name || tt('Chưa rõ loại vé', 'Unknown ticket type')}</Typography>
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

                {/* Payment Method */}
                {totalAmount > 0 &&
                  <Card>
                    <CardHeader
                      title={tt('Phương thức thanh toán', 'Payment method')}
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
                            {tt('Chuyển khoản nhanh Napas 247', 'Napas 247 instant transfer')}
                          </MenuItem>
                        </Select>
                        <FormHelperText>{tt('Tự động xuất vé khi thanh toán thành công', 'Tickets will be issued automatically after successful payment')}</FormHelperText>
                      </FormControl>
                    </CardContent>
                  </Card>
                }
                {/* Voucher Card */}
                {(appliedVoucher || availableVouchers.length > 0) && (
                  <Card>
                    <CardHeader
                      title={tt("Khuyến mãi", "Discount")}
                      action={
                        !appliedVoucher && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <OutlinedInput
                              size="small"
                              name="discountCode"
                              placeholder={tt("Nhập mã khuyến mãi", "Enter discount code")}
                              value={manualDiscountCode}
                              onChange={(e) => setManualDiscountCode(e.target.value)}
                              sx={{ maxWidth: 180 }}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={handleValidateAndDisplayVoucher}
                            >
                              {tt("Áp dụng", "Apply")}
                            </Button>
                          </Box>
                        )
                      }
                    />
                    {(appliedVoucher || availableVouchers.length > 0) && (
                      <>
                        <Divider />
                        <CardContent sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {appliedVoucher ? (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 2,
                                border: '1px solid',
                                borderColor: voucherValidation.valid ? 'success.main' : 'error.main',
                                borderRadius: 1,
                                bgcolor: voucherValidation.valid ? 'success.50' : 'error.50',
                                gap: 2,
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Stack spacing={0.5}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 600, color: voucherValidation.valid ? 'success.main' : 'error.main' }}>
                                      {tt('Đã áp dụng:', 'Applied:')} {appliedVoucher.code}
                                    </Typography>
                                    {voucherValidation.valid && (
                                      <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                                        - {appliedVoucher.discountType === 'percentage'
                                          ? `${appliedVoucher.discountValue}%`
                                          : `${appliedVoucher.discountValue.toLocaleString('vi-VN')} đ`}
                                        {appliedVoucher.applicationType === 'per_ticket' && (
                                          <Typography component="span" variant="body2" sx={{ ml: 0.5, fontWeight: 400 }}>
                                            {tt('mỗi vé', 'per ticket')}
                                          </Typography>
                                        )}
                                      </Typography>
                                    )}
                                  </Box>
                                  {!voucherValidation.valid ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                      <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                                        {tt('Mã khuyến mãi không hợp lệ', 'Invalid discount code')}
                                        {voucherValidation.message && `: ${voucherValidation.message}`}
                                      </Typography>
                                      <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                          p: 0,
                                          minWidth: 'auto',
                                          fontSize: '0.75rem',
                                          textTransform: 'none',
                                          color: 'primary.main',
                                          '&:hover': { textDecoration: 'underline' }
                                        }}
                                        onClick={() => {
                                          setSelectedVoucherForDetail(appliedVoucher);
                                          setVoucherDetailModalOpen(true);
                                        }}
                                      >
                                        {tt('Xem thêm', 'View Details')}
                                      </Button>
                                    </Box>
                                  ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                      <Typography variant="caption" color="text.secondary">
                                        {appliedVoucher.name}
                                      </Typography>
                                      <Button
                                        variant="text"
                                        size="small"
                                        sx={{
                                          p: 0,
                                          minWidth: 'auto',
                                          fontSize: '0.75rem',
                                          textTransform: 'none',
                                          color: 'primary.main',
                                          '&:hover': { textDecoration: 'underline' }
                                        }}
                                        onClick={() => {
                                          setSelectedVoucherForDetail(appliedVoucher);
                                          setVoucherDetailModalOpen(true);
                                        }}
                                      >
                                        {tt('Xem thêm', 'View Details')}
                                      </Button>
                                    </Box>
                                  )}
                                </Stack>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setAppliedVoucher(null);
                                  notificationCtx.info(tt('Đã xóa mã khuyến mãi', 'Removed discount code'));
                                }}
                                sx={{ color: 'error.main' }}
                              >
                                <X size={20} />
                              </IconButton>
                            </Box>
                          ) : (
                            availableVouchers.length > 0 && (
                              <Stack spacing={2}>
                                {availableVouchers.map((voucher) => {
                                  const formatDiscount = (type: string, value: number) => {
                                    if (type === 'percentage') {
                                      return `${value}%`;
                                    }
                                    return `${value.toLocaleString('vi-VN')} đ`;
                                  };

                                  const formatDate = (dateStr: string) => {
                                    return dayjs(dateStr).format('DD/MM/YYYY HH:mm');
                                  };

                                  const conditions: string[] = [];
                                  if (voucher.minTicketsRequired) {
                                    conditions.push(tt(`Tối thiểu ${voucher.minTicketsRequired} vé`, `Min ${voucher.minTicketsRequired} tickets`));
                                  }
                                  if (voucher.maxTicketsAllowed) {
                                    conditions.push(tt(`Tối đa ${voucher.maxTicketsAllowed} vé`, `Max ${voucher.maxTicketsAllowed} tickets`));
                                  }
                                  if (voucher.maxUsesPerUser) {
                                    conditions.push(tt(`Tối đa ${voucher.maxUsesPerUser} lần/người`, `Max ${voucher.maxUsesPerUser} uses/person`));
                                  }
                                  if (voucher.requireLogin) {
                                    conditions.push(tt('Yêu cầu đăng nhập', 'Requires login'));
                                  }

                                  return (
                                    <Box
                                      key={voucher.id}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        gap: 2,
                                      }}
                                    >
                                      <Box sx={{ flex: 1 }}>
                                        <Stack spacing={0.5}>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                              {voucher.code}
                                            </Typography>
                                            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                                              - {formatDiscount(voucher.discountType, voucher.discountValue)}
                                              {voucher.applicationType === 'per_ticket' && (
                                                <Typography component="span" variant="body2" sx={{ ml: 0.5, fontWeight: 400 }}>
                                                  {tt('mỗi vé', 'per ticket')}
                                                </Typography>
                                              )}
                                            </Typography>
                                          </Box>
                                          <Typography variant="caption" color="text.secondary">
                                            {tt('Thời gian:', 'Valid:')} {formatDate(voucher.validFrom)} - {formatDate(voucher.validUntil)}
                                          </Typography>
                                          {conditions.length > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                              <Typography variant="caption" color="text.secondary">
                                                {tt('Điều kiện:', 'Conditions:')} {conditions.join(', ')}
                                              </Typography>
                                              <Button
                                                variant="text"
                                                size="small"
                                                sx={{
                                                  p: 0,
                                                  minWidth: 'auto',
                                                  fontSize: '0.75rem',
                                                  textTransform: 'none',
                                                  color: 'primary.main',
                                                  '&:hover': { textDecoration: 'underline' }
                                                }}
                                                onClick={() => {
                                                  setSelectedVoucherForDetail(voucher);
                                                  setVoucherDetailModalOpen(true);
                                                }}
                                              >
                                                {tt('Xem thêm', 'View Details')}
                                              </Button>
                                            </Box>
                                          )}
                                          {conditions.length === 0 && (
                                            <Button
                                              variant="text"
                                              size="small"
                                              sx={{
                                                alignSelf: 'flex-start',
                                                p: 0,
                                                minWidth: 'auto',
                                                fontSize: '0.75rem',
                                                textTransform: 'none',
                                                color: 'primary.main',
                                                '&:hover': { textDecoration: 'underline' }
                                              }}
                                              onClick={() => {
                                                setSelectedVoucherForDetail(voucher);
                                                setVoucherDetailModalOpen(true);
                                              }}
                                            >
                                              {tt('Xem thêm', 'View Details')}
                                            </Button>
                                          )}
                                        </Stack>
                                      </Box>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleApplyVoucher(voucher)}
                                      >
                                        {tt('Áp dụng', 'Apply')}
                                      </Button>
                                    </Box>
                                  );
                                })}
                              </Stack>
                            )
                          )}
                        </CardContent>
                      </>
                    )}
                  </Card>
                )}
                {/* Payment Summary */}
                {Object.values(selectedCategories).some((catMap) => Object.keys(catMap || {}).length > 0) && (
                  <Card>
                    <CardContent>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            {tt("Tổng tiền vé:", "Ticket Total:")}
                          </Typography>
                          <Typography variant="body2">
                            {formatPrice(totalAmount)}
                          </Typography>
                        </Box>
                        {appliedVoucher && discountAmount > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              {tt("Giảm giá:", "Discount:")}
                            </Typography>
                            <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                              - {formatPrice(discountAmount)}
                            </Typography>
                          </Box>
                        )}
                        <Divider />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{tt('Tổng cộng:', 'Total:')}</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {formatPrice(finalTotal)}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                )}
                {/* Submit Button */}
                <Grid spacing={3} container sx={{ alignItems: 'center', mt: '3' }}>
                  <Grid item sm={9} xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', }}>
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
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{tt('Thông tin người mua', 'Buyer information')}</Typography>
            {checkoutFormFields.filter(f => f.visible).map((field) => {
              if (builtinInternalNames.has(field.internalName)) {
                // Built-in fields
                if (field.internalName === 'name') {
                  return (
                    <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Họ và tên", "Full Name")}</Typography>
                      <Typography variant="body2">{customer.title ? `${customer.title} ` : ''}{customer.name}</Typography>
                    </Box>
                  );
                }
                if (field.internalName === 'email') {
                  return (
                    <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Địa chỉ Email", "Email Address")}</Typography>
                      <Typography variant="body2">{customer.email}</Typography>
                    </Box>
                  );
                }
                if (field.internalName === 'phone_number') {
                  return (
                    <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
                if (field.internalName === 'address') {
                  return (
                    <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Địa chỉ", "Address")}</Typography>
                      <Typography variant="body2">{customer.address || '-'}</Typography>
                    </Box>
                  );
                }
                if (field.internalName === 'dob') {
                  return (
                    <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Ngày tháng năm sinh", "Date of Birth")}</Typography>
                      <Typography variant="body2">{customer.dob || '-'}</Typography>
                    </Box>
                  );
                }
                if (field.internalName === 'idcard_number') {
                  return (
                    <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Số Căn cước công dân", "ID Card Number")}</Typography>
                      <Typography variant="body2">{customer.idcard_number || '-'}</Typography>
                    </Box>
                  );
                }
                return null;
              } else {
                // Custom fields
                const answer = checkoutCustomAnswers[field.internalName];
                let displayValue = '-';
                if (answer !== undefined && answer !== null && answer !== '') {
                  if (field.fieldType === 'checkbox' && Array.isArray(answer)) {
                    displayValue = answer.join(', ');
                  } else if (field.fieldType === 'radio' && field.options) {
                    const option = field.options.find(opt => opt.value === answer);
                    displayValue = option ? option.label : answer;
                  } else {
                    displayValue = String(answer);
                  }
                }
                return (
                  <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{show?.name || tt('Chưa xác định', 'Unknown')} - {ticketCategory?.name || tt('Chưa rõ loại vé', 'Unknown ticket type')}</Typography>
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
            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">{tt('Phương thức thanh toán', 'Payment method')}</Typography>
              <Typography variant="body2">{tt(paymentMethodLabelMap[paymentMethod] || paymentMethod, paymentMethod === 'napas247' ? 'Napas 247 instant transfer' : paymentMethod)}</Typography>
            </Box>
            <Divider />
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {tt("Tổng tiền vé:", "Ticket Total:")}
                </Typography>
                <Typography variant="body2">
                  {formatPrice(totalAmount)}
                </Typography>
              </Box>
              {appliedVoucher && discountAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {tt("Giảm giá:", "Discount:")} ({appliedVoucher.code})
                  </Typography>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                    - {formatPrice(discountAmount)}
                  </Typography>
                </Box>
              )}
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{tt('Tổng cộng', 'Total')}</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {formatPrice(finalTotal)}
                </Typography>
              </Box>
            </Stack>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <ReCAPTCHA
                sitekey="6LdRnq4aAAAAAFT6htBYNthM-ksGymg70CsoYqHR"
                ref={captchaRef}
                hl={lang}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>{tt('Quay lại', 'Back')}</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>{tt('Xác nhận', 'Confirm')}</Button>
        </DialogActions>
      </Dialog>

      {/* Voucher Detail Modal */}
      <Dialog
        open={voucherDetailModalOpen}
        onClose={() => {
          setVoucherDetailModalOpen(false);
          setSelectedVoucherForDetail(null);
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ color: "primary.main" }}>
          {tt("Chi tiết khuyến mãi", "Voucher Details")}
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedVoucherForDetail && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {tt("Mã khuyến mãi", "Voucher Code")}
                </Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                  {selectedVoucherForDetail.code}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {tt("Giảm giá:", "Discount:")}
                  </Typography>
                  <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>
                    {selectedVoucherForDetail.discountType === 'percentage'
                      ? `${selectedVoucherForDetail.discountValue}%`
                      : `${selectedVoucherForDetail.discountValue.toLocaleString('vi-VN')} đ`}
                    {selectedVoucherForDetail.applicationType === 'per_ticket' && (
                      <Typography component="span" variant="body2" sx={{ ml: 0.5, fontWeight: 400 }}>
                        {tt('mỗi vé', 'per ticket')}
                      </Typography>
                    )}
                  </Typography>
                </Box>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {tt("Tên chiến dịch", "Campaign Name")}
                </Typography>
                <Typography variant="body1">
                  {selectedVoucherForDetail.name}
                </Typography>
                {selectedVoucherForDetail.content && (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                    {selectedVoucherForDetail.content}
                  </Typography>
                )}
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {tt("Thời gian hiệu lực", "Validity Period")}
                </Typography>
                <Typography variant="body2">
                  {tt("Từ:", "From:")} {dayjs(selectedVoucherForDetail.validFrom).format('DD/MM/YYYY HH:mm')}
                </Typography>
                <Typography variant="body2">
                  {tt("Đến:", "To:")} {dayjs(selectedVoucherForDetail.validUntil).format('DD/MM/YYYY HH:mm')}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {tt("Loại áp dụng", "Application Type")}
                </Typography>
                <Typography variant="body1">
                  {selectedVoucherForDetail.applicationType === 'total_order'
                    ? tt('Giảm chung trên tổng đơn hàng', 'Discount on Total Order')
                    : tt('Giảm theo vé', 'Discount per Ticket')}
                </Typography>
                {selectedVoucherForDetail.applicationType === 'per_ticket' && selectedVoucherForDetail.maxTicketsToDiscount && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {tt(`Tối đa ${selectedVoucherForDetail.maxTicketsToDiscount} vé được giảm giá`, `Maximum ${selectedVoucherForDetail.maxTicketsToDiscount} tickets can receive discount`)}
                  </Typography>
                )}
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {tt("Phạm vi áp dụng", "Application Scope")}
                </Typography>
                {selectedVoucherForDetail.applyToAll ? (
                  <Typography variant="body1">
                    {tt("Toàn bộ suất diễn và toàn bộ hạng vé", "All Shows and All Ticket Categories")}
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      {tt("Chỉ áp dụng cho các hạng vé sau:", "Only applies to the following ticket categories:")}
                    </Typography>
                    {selectedVoucherForDetail.ticketCategories && selectedVoucherForDetail.ticketCategories.length > 0 ? (
                      <Stack spacing={0.5}>
                        {selectedVoucherForDetail.ticketCategories.map((tc: any, index: number) => (
                          <Typography key={`tc-${index}`} variant="body2">
                            • {tc.show ? `${tc.show.name} - ` : ''}{tc.name}
                          </Typography>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {tt("Chưa có hạng vé nào được chọn", "No ticket categories selected")}
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {tt("Điều kiện áp dụng", "Application Conditions")}
                </Typography>
                <Stack spacing={1}>
                  {selectedVoucherForDetail.minTicketsRequired ? (
                    <Typography variant="body2">
                      {tt("Số lượng vé tối thiểu:", "Minimum tickets required:")} <strong>{selectedVoucherForDetail.minTicketsRequired}</strong>
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {tt("Số lượng vé tối thiểu: Không giới hạn", "Minimum tickets required: Unlimited")}
                    </Typography>
                  )}
                  {selectedVoucherForDetail.maxTicketsAllowed ? (
                    <Typography variant="body2">
                      {tt("Số lượng vé tối đa:", "Maximum tickets allowed:")} <strong>{selectedVoucherForDetail.maxTicketsAllowed}</strong>
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {tt("Số lượng vé tối đa: Không giới hạn", "Maximum tickets allowed: Unlimited")}
                    </Typography>
                  )}
                  {selectedVoucherForDetail.maxUsesPerUser ? (
                    <Typography variant="body2">
                      {tt("Số lần sử dụng tối đa mỗi người:", "Maximum uses per user:")} <strong>{selectedVoucherForDetail.maxUsesPerUser}</strong>
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {tt("Số lần sử dụng tối đa mỗi người: Không giới hạn", "Maximum uses per user: Unlimited")}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    {tt("Yêu cầu đăng nhập:", "Requires login:")} <strong>{selectedVoucherForDetail.requireLogin ? tt('Có', 'Yes') : tt('Không', 'No')}</strong>
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setVoucherDetailModalOpen(false);
            setSelectedVoucherForDetail(null);
          }}>
            {tt("Đóng", "Close")}
          </Button>
          {selectedVoucherForDetail && !appliedVoucher && (
            <Button
              variant="contained"
              onClick={() => {
                handleApplyVoucher(selectedVoucherForDetail);
                setVoucherDetailModalOpen(false);
                setSelectedVoucherForDetail(null);
              }}
            >
              {tt("Áp dụng mã này", "Apply This Code")}
            </Button>
          )}
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
                    {(() => {
                      if (!responseTransaction) return null;

                      // Case 1: Waiting for approval
                      if (responseTransaction.status === 'wait_for_response') {
                        return lang === 'vi'
                          ? `Cảm ơn ${customer.title} ${customer.name} đã đăng ký. Đơn hàng của ${customer.title} đang chờ Ban Tổ Chức xét duyệt. Kết quả sẽ được gửi qua Email trong thời gian sớm nhất.`
                          : `Thank you ${customer.title} ${customer.name}. Your order is pending approval by the Organizer. The result will be sent via Email shortly.`;
                      }

                      // Case 2: Waiting for payment
                      if (responseTransaction.paymentStatus === 'waiting_for_payment') {
                        return lang === 'vi'
                          ? `Cảm ơn ${customer.title} ${customer.name} đã đăng ký. Vui lòng kiểm tra Email để nhận hướng dẫn thanh toán. Vé sẽ được gửi sau khi thanh toán thành công.`
                          : `Thank you ${customer.title} ${customer.name}. Please check your email for payment instructions. Tickets will be sent after successful payment.`;
                      }

                      // Case 3: Paid but ticket not yet exported (Manual issuing or processing)
                      if (responseTransaction.paymentStatus === 'paid' && !responseTransaction.exportedTicketAt) {
                        return lang === 'vi'
                          ? `Cảm ơn ${customer.title} ${customer.name}. Thanh toán thành công! Vé đang được xử lý và sẽ gửi tới ${customer.title} trong giây lát.`
                          : `Thank you ${customer.title} ${customer.name}. Payment successful! Tickets are being processed and will be sent to you momentarily.`;
                      }

                      // Case 4: Ticket exported (Success) / Default fallback
                      const checkChannels = responseTransaction.sentTicketViaZalo ? (lang === 'vi' ? 'Email và Zalo' : 'Email and Zalo') : 'Email';
                      return (
                        <>
                          {lang === 'vi'
                            ? `Cảm ơn ${customer.title} ${customer.name} đã sử dụng ETIK. Hãy kiểm tra ${checkChannels} để xem vé. Nếu ${customer.title} cần hỗ trợ thêm, vui lòng gửi yêu cầu hỗ trợ `
                            : `Thank you ${customer.title} ${customer.name} for using ETIK. Please check your ${checkChannels} for your tickets. If you need support, submit a request `}
                          <a style={{ textDecoration: 'none' }} target='_blank' href="https://forms.gle/2mogBbdUxo9A2qRk8">{tt('tại đây.', 'here.')}</a>
                        </>
                      );
                    })()}
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
