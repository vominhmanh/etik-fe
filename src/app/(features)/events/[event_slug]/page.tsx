'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Avatar,
  Box,
  Container,
  Step,
  StepButton,
  Stepper
} from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Modal from '@mui/material/Modal';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  ArrowRight,
  Clock as ClockIcon,
  Eye,
  HouseLine as HouseLineIcon,
  MapPin as MapPinIcon,
  Smiley as ScanSmileyIcon,
  UserPlus
} from '@phosphor-icons/react/dist/ssr';
import { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import * as React from 'react';


import { useTranslation } from '@/contexts/locale-context';
import NotificationContext from '@/contexts/notification-context';
import { getPaymentMethodLabel } from '@/utils/payment';

import { Step1SelectTickets } from '@/components/transactions/create-steps/step-1-select-tickets';
import { Step2Info } from '@/components/transactions/create-steps/step-2-info';
import { Step3Payment } from '@/components/transactions/create-steps/step-3-payment';
import { Step4Review } from '@/components/transactions/create-steps/step-4-review';
import {
  CheckoutRuntimeField,
  EventResponse,
  HolderInfo,
  Order,
  Show,
  TicketInfo,
  Transaction
} from '@/components/transactions/create-steps/types';
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, formatToE164 } from '@/config/phone-countries';
import { calculateVoucherDiscount } from '@/utils/voucher-discount';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { orange } from '@mui/material/colors';
import dayjs from 'dayjs';

const formatDateTime = (date: string | Date | null) => {
  if (!date) return '';
  return dayjs(date).format('HH:mm DD/MM/YYYY');
};


export default function Page({ params }: { params: { event_slug: string } }): React.JSX.Element {
  const { tt, locale } = useTranslation();
  React.useEffect(() => {
    document.title = tt("Đăng ký tham gia | ETIK", "Register for event | ETIK");
  }, [tt]);
  const [activeStep, setActiveStep] = React.useState<number>(0);
  const stepLabels = React.useMemo(
    () => [
      tt('Chọn vé', 'Select tickets'),
      tt('Thông tin', 'Information'),
      tt('Thanh toán', 'Payment'),
      tt('Xem lại đơn', 'Review'),
    ],
    [tt]
  );
  // Always-on options (was previously toggleable via "Additional options" card)
  const qrOption: 'shared' | 'separate' = 'separate';

  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const router = useRouter(); // Use useRouter from next/navigation
  const lang = locale;

  const defaultTitle = locale === 'en' ? 'Mx.' : 'Bạn';

  // Refactored Order State
  const [order, setOrder] = React.useState<Order>({
    customer: {
      title: defaultTitle,
      name: '',
      email: '',
      phoneNumber: '',
      nationalPhone: '',
      address: '',
      phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2,
      dob: null,
      idcard_number: '',
      avatar: ''
    },
    tickets: [],
    concessions: [],
    qrOption: 'separate',
    paymentMethod: 'napas247',
    extraFee: 0
  });

  console.log('[DEBUG] Page Render - Order State:', JSON.stringify(order.concessions));

  const notificationCtx = React.useContext(NotificationContext);
  const captchaRef = React.useRef<any>(null); // ReCAPTCHA ref
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);
  const [activeScheduleId, setActiveScheduleId] = React.useState<number | null>(null);
  const [requestedCategoryModalId, setRequestedCategoryModalId] = React.useState<number | null>(null);

  const [cartOpen, setCartOpen] = React.useState<boolean>(false);

  const [checkoutFormFields, setCheckoutFormFields] = React.useState<CheckoutRuntimeField[]>([]);
  const [checkoutCustomAnswers, setCheckoutCustomAnswers] = React.useState<Record<string, any>>({});
  const [availableVouchers, setAvailableVouchers] = React.useState<any[]>([]);
  const [appliedVoucher, setAppliedVoucher] = React.useState<any | null>(null);
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [openNotifModal, setOpenNotifModal] = React.useState(false);
  const [prevent24h, setPrevent24h] = React.useState(false);
  const [responseTransaction, setResponseTransaction] = React.useState<any | null>(null);

  const handleCloseSuccessModal = () => {
    // Optionally handle close
  }

  const handleCloseNotifModal = () => {
    setOpenNotifModal(false);
    if (prevent24h) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`notif_modal_${params.event_slug}`, new Date().toISOString());
      }
    }
  }

  React.useEffect(() => {
    if (event) {
      if (typeof window !== 'undefined') {
        const lastClosed = localStorage.getItem(`notif_modal_${params.event_slug}`);
        if (lastClosed) {
          const lastDate = new Date(lastClosed);
          const now = new Date();
          // 24 hours in MS
          if (now.getTime() - lastDate.getTime() < 24 * 60 * 60 * 1000) {
            return;
          }
        }
      }

      if (event.displayOption && event.displayOption !== 'display_with_everyone') {
        setOpenNotifModal(true);
      }
    }
  }, [event, params.event_slug]);

  React.useEffect(() => {
    console.log('[DEBUG] Order Changed:', order.concessions);
  }, [order]);
  const [manualDiscountCode, setManualDiscountCode] = React.useState<string>('');
  const [voucherDetailModalOpen, setVoucherDetailModalOpen] = React.useState<boolean>(false);
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] = React.useState<any | null>(null);

  // Fetch seats for active show if applicable
  const [showSeats, setShowSeats] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!activeScheduleId || !event) return;
    const show = event.shows.find((s) => s.id === activeScheduleId);

    // Check if show uses seatmap
    const seatmapModes = ['seatings_selection', 'ticket_categories_selection'];
    if (!show || !show.seatmapMode || !seatmapModes.includes(show.seatmapMode)) {
      setShowSeats([]);
      return;
    }

    const fetchSeats = async () => {
      try {
        const response = await baseHttpServiceInstance.get(
          `/marketplace/events/${event.slug}/transactions/shows/${show.id}/seats`
        );
        setShowSeats(response.data);
      } catch (err) {
        console.error("Failed to load seats", err);
      }
    };

    fetchSeats();
  }, [activeScheduleId, event]);

  const [formMenuAnchorEl, setFormMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const handleOpenFormMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFormMenuAnchorEl(event.currentTarget);
  };
  const handleCloseFormMenu = () => {
    setFormMenuAnchorEl(null);
  };

  const selectedPhoneCountry = React.useMemo(() => {
    return PHONE_COUNTRIES.find((c) => c.iso2 === order.customer.phoneCountryIso2) || DEFAULT_PHONE_COUNTRY;
  }, [order.customer.phoneCountryIso2]);

  const customerNSN = React.useMemo(() => {
    if (!order.customer.nationalPhone) return '';
    const digits = order.customer.nationalPhone.replace(/\D/g, '');
    return digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
  }, [order.customer.nationalPhone]);

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
          // @ts-ignore
          setCheckoutFormFields(response.data.checkoutFormFields || []);
          // @ts-ignore
          setAvailableVouchers(response.data.voucherCampaigns || []);
        } catch (error) {
          notificationCtx.error(error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    }
  }, [params.event_slug]);

  // Calculate cart quantities for active schedule for Step 1
  const cartQuantitiesForActiveSchedule = React.useMemo(() => {
    if (!activeScheduleId) return {};
    const quantities: Record<number, number> = {};
    order.tickets.forEach(t => {
      if (t.showId === activeScheduleId) {
        quantities[t.ticketCategoryId] = (quantities[t.ticketCategoryId] || 0) + 1;
      }
    });
    return quantities;
  }, [activeScheduleId, order.tickets]);

  const builtinInternalNames = React.useMemo(
    () => new Set(['title', 'name', 'email', 'phone', 'phone_number', 'address', 'dob', 'gender', 'nationality', 'idcard_number']),
    []
  );

  const customCheckoutFields = React.useMemo(
    () => checkoutFormFields.filter((f) => !builtinInternalNames.has(f.internalName)),
    [checkoutFormFields, builtinInternalNames]
  );

  // Calculate total tickets
  const totalSelectedTickets = order.tickets.length;

  const handleSelectionChange = (selected: Show[]) => {
    setSelectedSchedules(selected);

    // If the active schedule gets unselected, clear active (no fallback to other schedules)
    if (activeScheduleId !== null && !selected.some((s) => s.id === activeScheduleId)) {
      setActiveScheduleId(null);
    }

    // Remove tickets for deselected shows
    setOrder(prev => {
      const allowedShowIds = new Set(selected.map(s => s.id));
      return {
        ...prev,
        tickets: prev.tickets.filter(t => allowedShowIds.has(t.showId))
      };
    });
  };

  const handleAddToCartQuantity = (showId: number, ticketCategoryId: number, quantity: number) => {
    setOrder(prev => {
      // 1. Keep tickets not related to this show/category
      const otherTickets = prev.tickets.filter(t => t.showId !== showId || t.ticketCategoryId !== ticketCategoryId);

      // 2. Get existing tickets of this type to preserve holder info if reducing quantity
      const existingTickets = prev.tickets.filter(t => t.showId === showId && t.ticketCategoryId === ticketCategoryId);

      // 3. Prepare new tickets
      let newTicketsForCategory: TicketInfo[] = [];
      if (quantity > 0) {
        if (quantity <= existingTickets.length) {
          // Reducing or keeping same: take first N existing
          newTicketsForCategory = existingTickets.slice(0, quantity);
        } else {
          // Increasing: take all existing + add new ones
          newTicketsForCategory = [...existingTickets];
          const countToAdd = quantity - existingTickets.length;

          // Helper to find price
          const show = event?.shows.find(s => s.id === showId);
          const cat = show?.ticketCategories.find(c => c.id === ticketCategoryId);

          for (let i = 0; i < countToAdd; i++) {
            newTicketsForCategory.push({
              showId,
              ticketCategoryId,
              price: cat?.price || 0,
              holder: undefined
            });
          }
        }
      }

      return {
        ...prev,
        tickets: [...otherTickets, ...newTicketsForCategory]
      };
    });
  };


  const activeSchedule = React.useMemo(() => {
    if (!activeScheduleId) return null;
    return selectedSchedules.find((s) => s.id === activeScheduleId) || null;
  }, [selectedSchedules, activeScheduleId]);



  const uploadImageToS3 = async (file: File): Promise<string | null> => {
    try {
      // Step 1: Request presigned URL from backend
      const presignedResponse = await baseHttpServiceInstance.post('/common/s3/generate_presigned_url', {
        filename: file.name,
        content_type: file.type,
      });

      const { presignedUrl, fileUrl } = presignedResponse.data;

      // Step 2: Upload file directly to S3 using presigned URL
      await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // Step 3: Return the public file URL
      return fileUrl as string;
    } catch (error) {
      notificationCtx.error(error);
      return null;
    }
  };

  const createLocalPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const handleCustomerAvatarFile = async (file?: File) => {
    if (!file) return;
    try {
      // Create local preview URL instead of uploading to S3
      const previewUrl = createLocalPreviewUrl(file);

      // update customer avatar with preview URL
      setOrder(prev => ({
        ...prev,
        customer: { ...prev.customer, avatar: previewUrl }
      }));
    } catch (error) {
      notificationCtx.error(error);
    }
  };

  const handleTicketHolderAvatarFile = async (index: number, file?: File) => {
    if (!file) return;
    try {
      const previewUrl = createLocalPreviewUrl(file);
      setOrder(prev => {
        const newTickets = [...prev.tickets];
        if (newTickets[index]) {
          newTickets[index] = {
            ...newTickets[index],
            holder: {
              ...newTickets[index].holder || { title: 'Bạn', name: '' },
              avatar: previewUrl
            } as HolderInfo
          };
        }
        return { ...prev, tickets: newTickets };
      });
    } catch (error) {
      notificationCtx.error(error);
    }
  };

  const extraFee = order.extraFee;

  const handleUpdateConcessionQuantity = (showId: number, concessionId: number, quantity: number) => {
    setOrder(prev => {
      const existingConcessions = prev.concessions || [];
      const otherConcessions = existingConcessions.filter(
        c => !(c.showId === showId && c.concessionId === concessionId)
      );

      if (quantity > 0) {
        // Find price from event data to be safe, or use what was passed?
        // Ideally we find the price from the show data
        const show = event?.shows.find(s => s.id === showId);
        const showConcession = show?.showConcessions?.find(sc => sc.concessionId === concessionId);
        // Default to 0 if not found, but it should be found
        const price = showConcession ? (showConcession.priceOverride ?? showConcession.concession.basePrice) : 0;

        return {
          ...prev,
          concessions: [
            ...otherConcessions,
            {
              showId,
              concessionId,
              quantity,
              price
            }
          ]
        };
      } else {
        return {
          ...prev,
          concessions: otherConcessions
        };
      }
    });
  };

  const handleExtraFeeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, '');
    const num = parseInt(value || '0', 10);
    setOrder(prev => ({ ...prev, extraFee: num }));
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  // Calculate subtotal (before discount)
  // Calculate subtotal (before discount)
  // Calculate subtotal (before discount)
  // Calculate subtotal (before discount)
  const subtotal = React.useMemo(() => {
    const ticketsTotal = order.tickets.reduce((sum, t) => sum + (t.price ?? 0), 0);
    const concessionsTotal = (order.concessions || []).reduce((sum, c) => {
      let p: any = c.price;
      let q: any = c.quantity;
      console.log(`[DEBUG] Page Calc: ID=${c.concessionId}, Price=${p} (${typeof p}), Qty=${q} (${typeof q})`);

      // Robust handling for potential string '65.000' or similar
      if (typeof p === 'string') p = parseFloat((p as string).replace(/\./g, '').replace(/,/g, '.'));
      if (typeof q === 'string') q = parseFloat(q);

      const itemVal = (Number(p || 0) * Number(q || 0));
      console.log(`[DEBUG] Item Val: ${itemVal}`);
      return sum + itemVal;
    }, 0);
    console.log(`[DEBUG] Subtotal Result: T=${ticketsTotal} + C=${concessionsTotal} = ${ticketsTotal + concessionsTotal}`);
    return ticketsTotal + concessionsTotal;
  }, [order.tickets, order.concessions]);

  // Get all tickets in order with details (Projected for voucher logic compatibility)
  const orderTickets = React.useMemo(() => {
    return order.tickets.map(t => ({
      showId: t.showId,
      ticketCategoryId: t.ticketCategoryId,
      price: t.price ?? 0,
      quantity: 1
    }));
  }, [order.tickets]);

  // Check if ticket is in voucher scope
  const isTicketInScope = React.useCallback((showId: number, ticketCategoryId: number, voucher: any): boolean => {
    if (voucher.applyToAll) {
      return true;
    }
    if (!voucher.ticketCategories || voucher.ticketCategories.length === 0) {
      return false;
    }
    // Check if ticket category is in the list
    return voucher.ticketCategories.some(
      (tc: any) => tc.id === ticketCategoryId
    );
  }, []);

  // Validate voucher can be applied
  const validateVoucher = React.useCallback((voucher: any): { valid: boolean; message?: string } => {
    if (!voucher) {
      return { valid: false, message: tt('Voucher không hợp lệ', 'Invalid voucher') };
    }

    // Check if order has tickets in scope
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

    // Check minimum tickets required (only count tickets in scope)
    if (voucher.minTicketsRequired && totalTicketsInScope < voucher.minTicketsRequired) {
      return {
        valid: false,
        message: tt(
          `Voucher yêu cầu tối thiểu ${voucher.minTicketsRequired} vé trong phạm vi áp dụng`,
          `Voucher requires minimum ${voucher.minTicketsRequired} tickets in scope`
        ),
      };
    }

    // Check maximum tickets allowed (only count tickets in scope)
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

  // Calculate final total
  const finalTotal = React.useMemo(() => {
    return Math.max(0, subtotal + extraFee - discountAmount);
  }, [subtotal, extraFee, discountAmount]);

  // Check if applied voucher is still valid
  const voucherValidation = React.useMemo(() => {
    if (!appliedVoucher) {
      return { valid: true };
    }
    return validateVoucher(appliedVoucher);
  }, [appliedVoucher, validateVoucher]);

  // Handle apply voucher with validation
  const handleApplyVoucher = React.useCallback((voucher: any) => {
    const validation = validateVoucher(voucher);
    setAppliedVoucher(voucher); // Always set to show the box, even if invalid
    if (!validation.valid) {
      notificationCtx.error(validation.message || tt('Không thể áp dụng voucher', 'Cannot apply voucher'));
      return false;
    }
    notificationCtx.success(tt(`Đã áp dụng mã ${voucher.code}`, `Applied code ${voucher.code}`));
    return true;
  }, [validateVoucher, notificationCtx, tt]);

  // Scroll to top when activeStep changes
  React.useEffect(() => {
    // window.scrollTo(0, 0);
  }, [activeStep]);

  const handleValidateAndDisplayVoucher = React.useCallback(async () => {
    if (!manualDiscountCode.trim()) {
      notificationCtx.warning(tt('Vui lòng nhập mã khuyến mãi', 'Please enter voucher code'));
      return;
    }
    try {
      const response = await baseHttpServiceInstance.get(
        `/marketplace/events/${params.event_slug}/voucher-campaigns/validate-voucher`,
        { params: { code: manualDiscountCode.trim() } }
      );
      const voucher = response.data;
      setAppliedVoucher(voucher);
      setManualDiscountCode('');

      const validation = validateVoucher(voucher);
      if (validation.valid) {
        notificationCtx.success(tt(`Đã áp dụng mã ${voucher.code}`, `Applied code ${voucher.code}`));
      } else {
        notificationCtx.info(tt(`Đã tìm thấy mã ${voucher.code}, nhưng không đủ điều kiện áp dụng`, `Found code ${voucher.code}, but does not meet application conditions`));
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || tt('Mã khuyến mãi không hợp lệ', 'Invalid discount code');
      notificationCtx.error(errorMessage);
      setAppliedVoucher(null);
    }
  }, [validateVoucher, notificationCtx, tt, params.event_slug, manualDiscountCode]);

  const validateVoucherByApi = React.useCallback(async (code: string) => {
    try {
      const response = await baseHttpServiceInstance.get(
        `/marketplace/events/${params.event_slug}/voucher-campaigns/validate-voucher`,
        { params: { code: code.trim() } }
      );
      return response.data || null;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || tt('Mã khuyến mãi không hợp lệ', 'Invalid discount code');
      notificationCtx.error(errorMessage);
      return null;
    }
  }, [params.event_slug, notificationCtx, tt]);

  const openVoucherDetail = React.useCallback((voucher: any) => {
    setSelectedVoucherForDetail(voucher);
    setVoucherDetailModalOpen(true);
  }, []);

  const removeAppliedVoucher = React.useCallback(() => {
    setAppliedVoucher(null);
    notificationCtx.info(tt('Đã xóa mã khuyến mãi', 'Removed discount code'));
  }, [notificationCtx, tt]);

  const validateStep1 = () => {
    if (order.tickets.length === 0) {
      notificationCtx.warning(tt('Vui lòng chọn ít nhất 1 loại vé', 'Please select at least 1 ticket category'));
      return false;
    }

    // Validate that seated tickets have seatId
    for (const ticket of order.tickets) {
      const show = event?.shows.find(s => s.id === ticket.showId);
      const isSeated = show?.seatmapMode === 'seatings_selection' || show?.seatmapMode === 'ticket_categories_selection';

      if (isSeated && !ticket.seatId) {
        notificationCtx.warning(tt('Vui lòng chọn ghế cho vé', 'Please select a seat for the ticket'));
        return false;
      }
    }

    return true;
  };

  const validateStep2 = () => {
    // Validate required fields based on checkout form configuration
    for (const field of checkoutFormFields) {
      if (!field.visible || !field.required) continue;

      // Built-in fields: map to order.customer
      if (field.internalName === 'title' && !order.customer.title) {
        notificationCtx.warning(tt('Vui lòng chọn danh xưng', 'Please select title'));
        return false;
      }
      if (field.internalName === 'name' && !order.customer.name) {
        notificationCtx.warning(tt('Vui lòng nhập họ tên người mua', 'Please enter buyer name'));
        return false;
      }
      if (field.internalName === 'email' && !order.customer.email) {
        notificationCtx.warning(tt('Vui lòng nhập email người mua', 'Please enter buyer email'));
        return false;
      }
      if (field.internalName === 'phone_number' && !order.customer.nationalPhone) {
        notificationCtx.warning(tt('Vui lòng nhập số điện thoại người mua', 'Please enter buyer phone number'));
        return false;
      }
      if (field.internalName === 'address' && !order.customer.address) {
        notificationCtx.warning(tt('Vui lòng nhập địa chỉ người mua', 'Please enter buyer address'));
        return false;
      }
      if (field.internalName === 'dob' && !order.customer.dob) {
        notificationCtx.warning(tt('Vui lòng nhập ngày sinh người mua', 'Please enter buyer date of birth'));
        return false;
      }
      if (field.internalName === 'idcard_number' && !order.customer.idcard_number) {
        notificationCtx.warning(tt('Vui lòng nhập số Căn cước công dân của người mua', 'Please enter buyer ID card number'));
        return false;
      }

      // Custom fields
      if (!builtinInternalNames.has(field.internalName)) {
        // Assuming formAnswers are stored in order.formAnswers
        const value = checkoutCustomAnswers[field.internalName];
        if (field.fieldType === 'checkbox') {
          if (!Array.isArray(value) || value.length === 0) {
            notificationCtx.warning(tt(`Vui lòng chọn ít nhất một lựa chọn cho "${field.label}"`, `Please choose at least one option for "${field.label}"`));
            return false;
          }
        } else if (!value) {
          notificationCtx.warning(tt(`Vui lòng nhập thông tin cho "${field.label}"`, `Please fill in "${field.label}"`));
          return false;
        }
      }
    }

    // Validate ticket holders
    if (true) {
      for (let i = 0; i < order.tickets.length; i++) {
        const t = order.tickets[i];
        const holder = t.holder;
        if (!holder || !holder.name) {
          notificationCtx.warning(tt(`Vui lòng nhập tên cho vé thứ ${i + 1}`, `Please enter name for ticket #${i + 1}`));
          return false;
        }
        if (order.qrOption === 'separate') {
          if (!holder.email) {
            notificationCtx.warning(tt(`Vui lòng nhập email cho vé thứ ${i + 1}`, `Please enter email for ticket #${i + 1}`));
            return false;
          }
          if (!holder.nationalPhone) {
            notificationCtx.warning(tt(`Vui lòng nhập số điện thoại cho vé thứ ${i + 1}`, `Please enter phone number for ticket #${i + 1}`));
            return false;
          }
        }
      }
    }
    return true;
  };

  const validateStep3 = () => {
    if (!order.paymentMethod) {
      notificationCtx.warning(tt('Vui lòng chọn phương thức thanh toán', 'Please select payment method'));
      return false;
    }
    return true;
  };

  const handleNext = () => {
    // Validate current step before moving?
    if (activeStep === 0 && !validateStep1()) return;
    if (activeStep === 1 && !validateStep2()) return;
    if (activeStep === 2 && !validateStep3()) return;

    if (activeStep < stepLabels.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate captcha
    const captchaValue = captchaRef.current?.getValue();
    if (!captchaValue) {
      notificationCtx.warning(tt('Vui lòng xác nhận reCAPTCHA!', 'Please complete the reCAPTCHA!'));
      return;
    }

    try {
      setIsLoading(true);

      // Helper to upload blob URL
      const uploadBlob = async (blobUrl?: string): Promise<string | undefined> => {
        if (!blobUrl || !blobUrl.startsWith('blob:')) return blobUrl; // Return as is if not blob or empty
        try {
          const response = await fetch(blobUrl);
          const blob = await response.blob();
          const file = new File([blob], "avatar.jpg", { type: blob.type });
          return await uploadImageToS3(file) || undefined;
        } catch (e) {
          console.error("Upload failed", e);
          return undefined;
        }
      };

      // Upload holder avatars & prepare tickets
      const tickets = await Promise.all(order.tickets.map(async (t) => {
        let holderAvatar = t.holder?.avatar;
        if (holderAvatar?.startsWith('blob:')) {
          holderAvatar = await uploadBlob(holderAvatar);
        }

        // Prepare holder data with E.164 formatted phone
        let holderData = undefined;
        if (t.holder) {
          // Format phone to E.164
          let holderPhoneE164: string | undefined = undefined;
          let phoneCountry = t.holder.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2;
          let phoneNationalNumber = '';

          if (t.holder.nationalPhone) {
            const phoneDigits = t.holder.nationalPhone.replace(/\D/g, '').replace(/^0+/, '');
            holderPhoneE164 = formatToE164(phoneCountry, phoneDigits) || undefined;
            phoneNationalNumber = phoneDigits;
          }

          holderData = {
            title: t.holder.title,
            name: t.holder.name,
            email: t.holder.email,
            phone: holderPhoneE164,
            avatar: holderAvatar || undefined,
            phoneCountry: phoneCountry,
            phoneNationalNumber: phoneNationalNumber,
          };
        }

        return {
          showId: t.showId,
          ticketCategoryId: t.ticketCategoryId,
          seatId: t.seatId,
          holder: holderData,
          amount: t.price, // Optional strictly, but helpful for debugging
          audienceId: t.audienceId,
          quantity: 1, // API expects quantity, we are unwinding to 1 per ticket for separate holders
        };
      }));

      // Prepare customer data
      const customerData = {
        ...order.customer
      };

      // Format nationalPhone to E.164 for backend
      const phoneCountryIso2 = customerData.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2;
      const phoneDigits = customerData.nationalPhone.replace(/\D/g, '').replace(/^0+/, '');
      const customerPhoneE164 = formatToE164(phoneCountryIso2, phoneDigits) || undefined;
      const apiCustomer = {
        title: customerData.title,
        name: customerData.name,
        email: customerData.email,
        phoneNumber: customerPhoneE164 || '',
        phoneCountry: phoneCountryIso2,
        phoneNationalNumber: phoneDigits,
        address: customerData.address,
        dob: customerData.dob,
        idcard_number: customerData.idcard_number,
        avatar: customerData.avatar
      };

      const transactionData: any = {
        captchaValue: captchaValue,
        customer: apiCustomer,
        tickets: tickets,
        qrOption: order.qrOption,

        paymentMethod: order.paymentMethod,
        extraFee: order.extraFee,
        formAnswers: checkoutCustomAnswers,
        concessions: order.concessions,
        // voucherCode: order.voucherCode // If we store it in order
      };

      // Add voucher code from state if not in order
      if (appliedVoucher && voucherValidation.valid) {
        transactionData.voucherCode = appliedVoucher.code;
      }

      // Marketplace API
      const response: AxiosResponse<Transaction> = await baseHttpServiceInstance.post(
        `/marketplace/events/${params.event_slug}/transactions`,
        transactionData
      );

      setResponseTransaction(response.data);
      setOpenSuccessModal(true);

      // Redirect to the payment checkout URL
      if (response.data.paymentCheckoutUrl) {
        window.location.href = response.data.paymentCheckoutUrl;
      }

    } catch (error: any) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const paymentMethodLabel = React.useMemo(() => getPaymentMethodLabel(order.paymentMethod, tt), [order.paymentMethod, tt]);


  return (
    <div
      style={{
        scrollBehavior: 'smooth',
        backgroundColor: '#d1f9db',
        backgroundImage: `linear-gradient(356deg, #d1f9db 0%, #fffed9 100%)`,
        minHeight: '100vh',
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
                            {(event?.name?.[0] ?? 'a').toUpperCase()}
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
                          : tt('Chưa xác định', 'TBD')} {event?.timeInstruction ? `(${event.timeInstruction})` : ''}
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
              <Typography variant="caption" color="error">DEBUG Subtotal: {subtotal} (Tickets: {order.tickets.reduce((sum, t) => sum + (t.price ?? 0), 0)}, Concessions: {(order.concessions || []).reduce((sum, c) => sum + (c.price * c.quantity), 0)})</Typography>
            </Stack>
          </Stack>

          <Stepper nonLinear activeStep={activeStep} sx={{ mb: 1 }}>
            {stepLabels.map((label, index) => (
              <Step key={label}>
                <StepButton
                  onClick={() => {
                    // Check validation if moving forward to step 1, 2 etc.
                    // But for nonlinear, we might allow jumping back, but force validation for forward?
                    // Reference implementation allows jumping back only if index > activeStep is disabled (wait, reference has disabled property).
                    // Reference: disabled={index > activeStep}
                    if (index < activeStep) {
                      setActiveStep(index);
                    }
                  }}
                  disabled={index > activeStep}
                >
                  {label}
                </StepButton>
              </Step>
            ))}
          </Stepper>

          {/* Steps */}
          <Box sx={{ display: activeStep === 0 ? 'block' : 'none' }}>
            <Step1SelectTickets
              shows={event?.shows}
              selectedSchedules={selectedSchedules}
              activeScheduleId={activeScheduleId}
              onSelectionChange={handleSelectionChange}
              onOpenSchedule={(show) => setActiveScheduleId(show ? show.id : null)}
              totalSelectedTickets={totalSelectedTickets}
              onOpenCart={() => setCartOpen(true)}
              activeSchedule={activeSchedule}
              qrOption={order.qrOption}
              existingSeats={showSeats}
              requestedCategoryModalId={requestedCategoryModalId}
              onModalRequestHandled={() => setRequestedCategoryModalId(null)}
              order={order}
              setOrder={setOrder}
              cartQuantitiesForActiveSchedule={cartQuantitiesForActiveSchedule}
              tt={tt}
              onNext={() => {
                if (validateStep1()) setActiveStep(1);
              }}

              // Cart props
              isCartOpen={cartOpen}
              onCloseCart={() => setCartOpen(false)}
              formatPrice={formatPrice}
              subtotal={subtotal}
              onEditCartItem={(showId, categoryId) => {
                setActiveScheduleId(showId);
                setRequestedCategoryModalId(categoryId);
                setCartOpen(false);
                setActiveStep(0);
              }}
              onRemoveCartItem={(showId, categoryId) => handleAddToCartQuantity(showId, categoryId, 0)}
              onUpdateConcessionQuantity={handleUpdateConcessionQuantity}
              eventLimitPerTransaction={event?.limitPerTransaction}
              eventLimitPerCustomer={event?.limitPerCustomer}
            />
          </Box>

          <Box sx={{ display: activeStep === 1 ? 'block' : 'none' }}>
            <Step2Info
              tt={tt}
              locale={locale}
              defaultTitle={defaultTitle}
              paramsEventId={event?.id || 0}
              formMenuAnchorEl={formMenuAnchorEl}
              onOpenFormMenu={handleOpenFormMenu}
              onCloseFormMenu={handleCloseFormMenu}
              order={order}
              setOrder={setOrder}
              checkoutFormFields={checkoutFormFields}
              customCheckoutFields={customCheckoutFields}
              builtinInternalNames={builtinInternalNames}
              checkoutCustomAnswers={checkoutCustomAnswers}
              setCheckoutCustomAnswers={setCheckoutCustomAnswers}

              shows={event?.shows || []}
              handleCustomerAvatarFile={handleCustomerAvatarFile}
              handleTicketHolderAvatarFile={handleTicketHolderAvatarFile}
              formatPrice={formatPrice}
              setActiveScheduleId={(showId) => setActiveScheduleId(showId)}
              setRequestedCategoryModalId={(categoryId) => setRequestedCategoryModalId(categoryId)}
              onBack={() => setActiveStep(0)}
              onNext={() => {
                if (validateStep2()) setActiveStep(2);
              }}
            />
          </Box>

          <Box sx={{ display: activeStep === 2 ? 'block' : 'none' }}>
            <Step3Payment
              tt={tt}
              paramsEventId={event?.id || 0}
              order={order}
              shows={event?.shows || []}
              extraFee={extraFee}
              handleExtraFeeChange={handleExtraFeeChange}
              manualDiscountCode={manualDiscountCode}
              setManualDiscountCode={setManualDiscountCode}
              availableVouchers={availableVouchers}
              appliedVoucher={appliedVoucher}
              voucherValidation={voucherValidation}
              handleValidateAndDisplayVoucher={handleValidateAndDisplayVoucher}
              validateVoucherByApi={validateVoucherByApi}
              onOpenVoucherDetail={openVoucherDetail}
              onRemoveAppliedVoucher={removeAppliedVoucher}
              handleApplyVoucher={handleApplyVoucher}
              subtotal={subtotal}
              discountAmount={discountAmount}
              finalTotal={finalTotal}
              formatPrice={formatPrice}
              paymentMethod={order.paymentMethod}
              onPaymentMethodChange={(v) => setOrder(prev => ({ ...prev, paymentMethod: v }))}
              onBack={() => setActiveStep(1)}
              onNext={() => {
                if (validateStep3()) setActiveStep(3);
              }}

              // Voucher Modal props
              isVoucherModalOpen={voucherDetailModalOpen}
              onCloseVoucherModal={() => {
                setVoucherDetailModalOpen(false);
                setSelectedVoucherForDetail(null);
              }}
              selectedVoucherForDetail={selectedVoucherForDetail}
              showExtraFeeInput={false}
              allowedPaymentMethods={['napas247']}
            />
          </Box>

          <Box sx={{ display: activeStep === 3 ? 'block' : 'none' }}>
            <Step4Review
              tt={tt}
              order={order}
              shows={event?.shows || []}
              checkoutFormFields={checkoutFormFields}
              builtinInternalNames={builtinInternalNames}
              checkoutCustomAnswers={checkoutCustomAnswers}

              paymentMethodLabel={paymentMethodLabel}
              extraFee={extraFee}
              subtotal={subtotal}
              discountAmount={discountAmount}
              appliedVoucherCode={appliedVoucher && voucherValidation.valid ? appliedVoucher.code : null}
              finalTotal={finalTotal}
              formatPrice={formatPrice}
              onBack={() => setActiveStep(2)}
              onConfirm={handleSubmit}
              confirmDisabled={isLoading}
              enableCaptcha={true}
              captchaRef={captchaRef}
              captchaLang={locale}
            />
          </Box>
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
                  <Typography variant="h5">{tt('Đăng ký thành công !', 'Registration successful!')}</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'justify' }}>
                    {(() => {
                      if (!responseTransaction) return null;
                      const customer = order.customer;

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
                  {event?.locationUrl && ( // Changed externalLink to locationUrl or keep externalLink if mapped? EventResponse type has locationUrl, legacy has externalLink? Use event?.locationUrl or bannerUrl? Legacy used externalLink.
                    <Button
                      fullWidth
                      variant='contained'
                      size="small"
                      endIcon={<ArrowRight />}
                      onClick={() => {
                        // event?.externalLink ??
                        window.location.href = '#'; // Placeholder if unknown
                      }}
                    >
                      {tt('Khám phá trang thông tin sự kiện.', 'Explore the event page.')}
                    </Button>
                  )}
                  {/* Check-in Face Logic - removed or placeholder if event type differs */}

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
        open={openNotifModal && (event?.displayOption !== 'display_with_everyone') || false}
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
