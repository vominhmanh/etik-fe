'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Step,
  StepButton,
  Stepper,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { alpha } from '@mui/material/styles';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import { ShoppingCart as ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr/ShoppingCart';
import { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { LocalizedLink } from '@/components/localized-link';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';

import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { Schedules } from './schedules';
import { TicketCategories } from './ticket-categories';
import { CaretDown, DotsThreeOutlineVertical, Pencil } from '@phosphor-icons/react/dist/ssr';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { X } from '@phosphor-icons/react/dist/ssr';
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, parseE164Phone } from '@/config/phone-countries';
import dayjs from 'dayjs';
import { calculateVoucherDiscount } from '@/utils/voucher-discount';
import { Step1SelectTickets } from './step-1-select-tickets';
import { Step2Info } from './step-2-info';
import { Step3Payment } from './step-3-payment';
import { Step4Review } from './step-4-review';

export type TicketCategory = {
  id: number;
  avatar: string | null;
  name: string;
  price: number;
  type: string;
  description: string;
  status: string;
  quantity: number;
  sold: number;
  disabled: boolean;
  limitPerTransaction: number | null;
  limitPerCustomer: number | null;
};

export type Show = {
  id: number;
  name: string;
  avatar: string;
  status: string;
  type: string;
  disabled: boolean;
  seatmapMode?: 'no_seatmap' | 'seatings_selection' | 'ticket_categories_selection' | string;
  layoutJson?: any;
  startDateTime: string; // backend response provides date as string
  endDateTime: string; // backend response provides date as string
  ticketCategories: TicketCategory[];
};

export type EventResponse = {
  id: number;
  name: string;
  organizer: string;
  description: string;
  startDateTime: string | null;
  endDateTime: string | null;
  place: string | null;
  locationUrl: string | null;
  bannerUrl: string;
  slug: string;
  locationInstruction: string | null;
  shows: Show[];
  checkoutFormFields: CheckoutRuntimeField[];
};
export type TicketHolderInfo = { title: string; name: string; email: string; phone: string; phoneCountryIso2?: string; avatar?: string };

export type CheckoutRuntimeFieldOption = {
  value: string;
  label: string;
  sortOrder: number;
};

export type CheckoutRuntimeField = {
  internalName: string;
  label: string;
  fieldType: string;
  visible: boolean;
  required: boolean;
  note?: string | null;
  options?: CheckoutRuntimeFieldOption[];
};

const getPaymentMethodLabel = (paymentMethod: string, tt: (vi: string, en: string) => string): string => {
  switch (paymentMethod) {
    case 'cash':
      return tt('Tiền mặt', 'Cash');
    case 'transfer':
      return tt('Chuyển khoản', 'Transfer');
    case 'napas247':
      return 'Napas 247';
    default:
      return paymentMethod;
  }
};

export interface CustomerInfo {
  title: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  phoneCountryIso2?: string;
  dob?: string | null;
  idcard_number?: string;
  avatar?: string;
}

export interface HolderInfo {
  title: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  gender?: string;
  nationality?: string;
  idcard_number?: string;
  phoneCountryIso2?: string;
}

export interface TicketInfo {
  showId: number;
  ticketCategoryId: number; // Optional if seatId present? User said optional but practically needed for pricing. Sticking to user req but usually category is known.
  seatId?: string;
  holder?: HolderInfo;
  price?: number; // Helper for frontend calculation
}

export interface Order {
  customer: CustomerInfo;
  tickets: TicketInfo[];
  qrOption: 'shared' | 'separate';
  paymentMethod: string;
  extraFee: number;
  formAnswers?: Record<string, any>;
  voucherCode?: string;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt, locale } = useTranslation();
  React.useEffect(() => {
    document.title = tt("Tạo đơn hàng | ETIK - Vé điện tử & Quản lý sự kiện", "Create Order | ETIK - E-tickets & Event Management");
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
  const requireTicketHolderInfo: boolean = true;
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const router = useRouter(); // Use useRouter from next/navigation

  const defaultTitle = locale === 'en' ? 'Mx.' : 'Bạn';

  // Refactored Order State
  const [order, setOrder] = React.useState<Order>({
    customer: {
      title: defaultTitle,
      name: '',
      email: '',
      phoneNumber: '',
      address: '',
      phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2,
      dob: null,
      idcard_number: '',
      avatar: ''
    },
    tickets: [],
    qrOption: 'separate',
    paymentMethod: 'napas247',
    extraFee: 0
  });

  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);
  const [activeScheduleId, setActiveScheduleId] = React.useState<number | null>(null);
  const [requestedCategoryModalId, setRequestedCategoryModalId] = React.useState<number | null>(null);

  const requireGuestAvatar: boolean = true;
  const [cartOpen, setCartOpen] = React.useState<boolean>(false);

  const [checkoutFormFields, setCheckoutFormFields] = React.useState<CheckoutRuntimeField[]>([]);
  const [checkoutCustomAnswers, setCheckoutCustomAnswers] = React.useState<Record<string, any>>({});
  const [availableVouchers, setAvailableVouchers] = React.useState<any[]>([]);
  const [appliedVoucher, setAppliedVoucher] = React.useState<any | null>(null);
  const [manualDiscountCode, setManualDiscountCode] = React.useState<string>('');
  const [voucherDetailModalOpen, setVoucherDetailModalOpen] = React.useState<boolean>(false);
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] = React.useState<any | null>(null);

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
    if (!order.customer.phoneNumber) return '';
    const digits = order.customer.phoneNumber.replace(/\D/g, '');
    return digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
  }, [order.customer.phoneNumber]);

  const formattedCustomerPhone = React.useMemo(() => {
    if (!customerNSN) return '';
    return `${selectedPhoneCountry.dialCode} ${customerNSN}`;
  }, [customerNSN, selectedPhoneCountry]);

  // Fetch event details on component mount
  React.useEffect(() => {
    if (params.event_id) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
            `/event-studio/events/${params.event_id}/transactions/get-info-to-create-transaction`
          );
          setEvent(response.data);
          setCheckoutFormFields(response.data.checkoutFormFields || []);
          // setFormValues(response.data); // Initialize form with the event data
        } catch (error) {
          notificationCtx.error(error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    }
  }, [params.event_id]);

  // Fetch available public vouchers
  React.useEffect(() => {
    const fetchAvailableVouchers = async () => {
      try {
        const response: AxiosResponse<any[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/voucher-campaigns/public/available`
        );
        setAvailableVouchers(response.data || []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchAvailableVouchers();
  }, [params.event_id]);

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
          for (let i = 0; i < countToAdd; i++) {
            newTicketsForCategory.push({
              showId,
              ticketCategoryId,
              // seatId? If seated, we might need seat selection logic, but this is quantity update.
              // For now, assume this is for non-seatmap or general admission helper.
              // If seated, quantity usually managed by picking seats.
              // But if we use this for "X" button on cart, quantity=0 works fine for seated too.
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


  const handleNext = () => {
    if (activeStep < stepLabels.length - 1) {
      // Validate current step before moving?
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
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
      // TODO: Propagate to holders if needed?
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
      // Pending: manage file upload mapping if needed
    } catch (error) {
      notificationCtx.error(error);
    }
  };

  const extraFee = order.extraFee;

  const handleExtraFeeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, '');
    const num = parseInt(value || '0', 10);
    setOrder(prev => ({ ...prev, extraFee: num }));
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  // Calculate total ticket quantity
  const totalTicketQuantity = order.tickets.length;

  // Calculate subtotal (before discount)
  const subtotal = React.useMemo(() => {
    return order.tickets.reduce((sum, t) => sum + (t.price || 0), 0);
  }, [order.tickets]);

  // Get all tickets in order with details (Projected for voucher logic compatibility)
  const orderTickets = React.useMemo(() => {
    return order.tickets.map(t => ({
      showId: t.showId,
      ticketCategoryId: t.ticketCategoryId,
      price: t.price || 0,
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

  const handleValidateAndDisplayVoucher = React.useCallback((voucher: any) => {
    // Set applied voucher immediately to display UI
    setAppliedVoucher(voucher);
    // Check validation (will be displayed in UI)
    const validation = validateVoucher(voucher);
    if (validation.valid) {
      notificationCtx.success(tt(`Đã áp dụng mã ${voucher.code}`, `Applied code ${voucher.code}`));
    } else {
      // Still show the voucher but with invalid state
      notificationCtx.info(tt(`Đã tìm thấy mã ${voucher.code}, nhưng không đủ điều kiện áp dụng`, `Found code ${voucher.code}, but does not meet application conditions`));
    }
  }, [validateVoucher, notificationCtx, tt]);

  const validateVoucherByApi = React.useCallback(async (code: string) => {
    try {
      const response = await baseHttpServiceInstance.get(
        `/event-studio/events/${params.event_id}/voucher-campaigns/validate-voucher`,
        { params: { code: code.trim() } }
      );
      return response.data || null;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || tt('Mã khuyến mãi không hợp lệ', 'Invalid discount code');
      notificationCtx.error(errorMessage);
      return null;
    }
  }, [params.event_id, notificationCtx, tt]);

  const openVoucherDetail = React.useCallback((voucher: any) => {
    setSelectedVoucherForDetail(voucher);
    setVoucherDetailModalOpen(true);
  }, []);

  const removeAppliedVoucher = React.useCallback(() => {
    setAppliedVoucher(null);
    notificationCtx.info(tt('Đã xóa mã khuyến mãi', 'Removed discount code'));
  }, [notificationCtx, tt]);

  const handleCreateClick = () => {
    if (order.tickets.length === 0) {
      notificationCtx.warning(tt('Vui lòng chọn ít nhất 1 loại vé', 'Please select at least 1 ticket category'));
      return;
    }

    // Validate required fields based on checkout form configuration
    for (const field of checkoutFormFields) {
      if (!field.visible || !field.required) continue;

      // Built-in fields: map to order.customer
      if (field.internalName === 'title' && !order.customer.title) {
        notificationCtx.warning(tt('Vui lòng chọn danh xưng', 'Please select title'));
        return;
      }
      if (field.internalName === 'name' && !order.customer.name) {
        notificationCtx.warning(tt('Vui lòng nhập họ tên người mua', 'Please enter buyer name'));
        return;
      }
      if (field.internalName === 'email' && !order.customer.email) {
        notificationCtx.warning(tt('Vui lòng nhập email người mua', 'Please enter buyer email'));
        return;
      }
      if (field.internalName === 'phone_number' && !order.customer.phoneNumber) {
        notificationCtx.warning(tt('Vui lòng nhập số điện thoại người mua', 'Please enter buyer phone number'));
        return;
      }
      if (field.internalName === 'address' && !order.customer.address) {
        notificationCtx.warning(tt('Vui lòng nhập địa chỉ người mua', 'Please enter buyer address'));
        return;
      }
      if (field.internalName === 'dob' && !order.customer.dob) {
        notificationCtx.warning(tt('Vui lòng nhập ngày sinh người mua', 'Please enter buyer date of birth'));
        return;
      }
      if (field.internalName === 'idcard_number' && !order.customer.idcard_number) {
        notificationCtx.warning(tt('Vui lòng nhập số Căn cước công dân của người mua', 'Please enter buyer ID card number'));
        return;
      }

      // Custom fields
      if (!builtinInternalNames.has(field.internalName)) {
        // Assuming formAnswers are stored in order.formAnswers
        const value = order.formAnswers?.[field.internalName];
        if (field.fieldType === 'checkbox') {
          if (!Array.isArray(value) || value.length === 0) {
            notificationCtx.warning(tt(`Vui lòng chọn ít nhất một lựa chọn cho "${field.label}"`, `Please choose at least one option for "${field.label}"`));
            return;
          }
        } else if (!value) {
          notificationCtx.warning(tt(`Vui lòng nhập thông tin cho "${field.label}"`, `Please fill in "${field.label}"`));
          return;
        }
      }
    }

    // Validate ticket holders
    if (requireTicketHolderInfo || order.qrOption === 'separate') {
      for (let i = 0; i < order.tickets.length; i++) {
        const t = order.tickets[i];
        const holder = t.holder;
        if (!holder || !holder.name) {
          notificationCtx.warning(tt(`Vui lòng nhập tên cho vé thứ ${i + 1}`, `Please enter name for ticket #${i + 1}`));
          setActiveStep(1); // Go to Info step
          return;
        }
        if (order.qrOption === 'separate') {
          if (!holder.email) {
            notificationCtx.warning(tt(`Vui lòng nhập email cho vé thứ ${i + 1}`, `Please enter email for ticket #${i + 1}`));
            setActiveStep(1);
            return;
          }
          if (!holder.phone) {
            notificationCtx.warning(tt(`Vui lòng nhập số điện thoại cho vé thứ ${i + 1}`, `Please enter phone number for ticket #${i + 1}`));
            setActiveStep(1);
            return;
          }
        }
      }
    }

    setActiveStep(3); // Go to Review step
  };

  const handleSubmit = async () => {
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

      // Upload customer avatar
      let customerAvatarUrl = order.customer.avatar;
      if (requireGuestAvatar && order.customer.avatar?.startsWith('blob:')) {
        customerAvatarUrl = await uploadBlob(order.customer.avatar);
      }

      // Upload holder avatars & prepare tickets
      const tickets = await Promise.all(order.tickets.map(async (t) => {
        let holderAvatar = t.holder?.avatar;
        if (requireGuestAvatar && holderAvatar?.startsWith('blob:')) {
          holderAvatar = await uploadBlob(holderAvatar);
        }

        // Prepare holder data
        const holderData = t.holder ? { ...t.holder, avatar: holderAvatar } : undefined;

        // Remove internal helper fields from holder if any
        // Make sure phone is formatted or passed as is (Backend will format)

        return {
          showId: t.showId,
          ticketCategoryId: t.ticketCategoryId,
          seatId: t.seatId,
          holder: holderData
        };
      }));

      // Prepare customer data
      const customerData = {
        ...order.customer,
        avatarUrl: customerAvatarUrl
      };

      // Format phone number (E.164 preparation if needed, but backend handles it too?)
      // Legacy code did some logic with phoneNationalNumber/customerNSN. 
      // We'll pass what we have (phoneNumber) and let backend handle parsing if phoneCountryIso2 is provided.
      // But strict backend expects check: `phone_country`, `phone_national_number` or just `phone_number`?
      // Checking backend: it uses `format_phone_to_e164` with `phone_country` and `phone_national_number`.
      // So we should parse phoneNumber into these if possible or pass them if we stored them separated.
      // Our CustomerInfo has `phoneCountryIso2` and `phoneNumber`.
      // Ideally we pass `phoneCountry` and `phoneNationalNumber`.
      // Let's optimize:
      const digits = customerData.phoneNumber.replace(/\D/g, '');
      const phoneNSN = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
      const apiCustomer = {
        ...customerData,
        phoneCountry: customerData.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2,
        phoneNationalNumber: phoneNSN
      };

      const transactionData = {
        customer: apiCustomer,
        tickets: tickets,
        qrOption: order.qrOption,
        requireTicketHolderInfo: requireTicketHolderInfo, // Legacy constant
        requireGuestAvatar: requireGuestAvatar, // Legacy constant
        paymentMethod: order.paymentMethod,
        extraFee: order.extraFee,
        formAnswers: checkoutCustomAnswers,
        voucherCode: order.voucherCode // If we store it in order
      };

      // Add voucher code from state if not in order
      if (appliedVoucher && voucherValidation.valid) {
        transactionData.voucherCode = appliedVoucher.code;
      }

      const response = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/transactions`,
        transactionData
      );
      const newTransaction = response.data;
      const path = `/event-studio/events/${params.event_id}/transactions/${newTransaction.id}`;
      router.push(locale === 'en' ? `/en${path}` : path);
      notificationCtx.success(tt("Tạo đơn hàng thành công!", "Order created successfully!"));
    } catch (error: any) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  };



  const paymentMethodLabel = React.useMemo(() => getPaymentMethodLabel(order.paymentMethod, tt), [order.paymentMethod, tt]);

  // Wizard UI (4 steps). Keep the legacy JSX below for now, but don't render it anymore.
  const useWizardStepper = true as const;
  if (useWizardStepper) {
    return (
      <>
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

        <Stack spacing={3}>
          <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
            <Typography variant="h4">{tt("Tạo đơn hàng mới", "Create New Order")}</Typography>
          </Stack>

          <Stepper nonLinear activeStep={activeStep} sx={{ mb: 1 }}>
            {stepLabels.map((label, index) => (
              <Step key={label}>
                <StepButton onClick={() => setActiveStep(index)}>{label}</StepButton>
              </Step>
            ))}
          </Stepper>

          {/* Keep all steps mounted; show/hide via CSS so users can still open modals from previous steps */}
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
              requireTicketHolderInfo={requireTicketHolderInfo}
              requestedCategoryModalId={requestedCategoryModalId}
              onModalRequestHandled={() => setRequestedCategoryModalId(null)}
              order={order}
              setOrder={setOrder}
              cartQuantitiesForActiveSchedule={cartQuantitiesForActiveSchedule}
              tt={tt}
              onNext={() => setActiveStep(1)}
            />
          </Box>

          <Box sx={{ display: activeStep === 1 ? 'block' : 'none' }}>
            <Step2Info
              tt={tt}
              locale={locale}
              defaultTitle={defaultTitle}
              paramsEventId={params.event_id}
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
              requireGuestAvatar={requireGuestAvatar}
              requireTicketHolderInfo={requireTicketHolderInfo}
              shows={event?.shows || []}
              handleCustomerAvatarFile={handleCustomerAvatarFile}
              handleTicketHolderAvatarFile={handleTicketHolderAvatarFile}
              formatPrice={formatPrice}
              setActiveScheduleId={(showId) => setActiveScheduleId(showId)}
              setRequestedCategoryModalId={(categoryId) => setRequestedCategoryModalId(categoryId)}
              onBack={() => setActiveStep(0)}
              onNext={() => setActiveStep(2)}
            />
          </Box>

          <Box sx={{ display: activeStep === 2 ? 'block' : 'none' }}>
            <Step3Payment
              tt={tt}
              paramsEventId={params.event_id}
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
              onNext={handleCreateClick}
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
              requireGuestAvatar={requireGuestAvatar}
              requireTicketHolderInfo={requireTicketHolderInfo}
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
            />
          </Box>

          {/* Cart Modal */}
          <Dialog open={cartOpen} onClose={() => setCartOpen(false)} fullWidth maxWidth="md">
            <DialogTitle sx={{ color: "primary.main", display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ShoppingCartIcon size={16} />
                <Typography variant="subtitle1" sx={{ m: 0, fontWeight: 700 }}>
                  {tt('Giỏ hàng', 'Cart')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  ({totalSelectedTickets} {tt('vé', 'tickets')})
                </Typography>
              </Stack>
              <IconButton onClick={() => setCartOpen(false)} aria-label={tt('Đóng', 'Close')}>
                <X />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto', px: 2, py: 1.5 }}>
              {totalSelectedTickets <= 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {tt('Giỏ hàng trống', 'Cart is empty')}
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {order.tickets.length === 0 ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {tt('Giỏ hàng trống', 'Cart is empty')}
                    </Typography>
                  ) : (
                    <Stack spacing={1.25}>
                      {(() => {
                        // Group for display
                        const groups: any[] = [];
                        order.tickets.forEach(t => {
                          const key = `${t.showId}-${t.ticketCategoryId}`;
                          let g = groups.find(x => x.key === key);
                          if (!g) {
                            g = { key, showId: t.showId, ticketCategoryId: t.ticketCategoryId, quantity: 0, price: t.price || 0 };
                            groups.push(g);
                          }
                          g.quantity++;
                        });

                        return groups.map((g) => {
                          const show = event?.shows?.find(s => s.id === g.showId);
                          const ticketCategory = show?.ticketCategories?.find(c => c.id === g.ticketCategoryId);

                          return (
                            <Card key={g.key} variant="outlined" sx={{ borderRadius: 1, boxShadow: 'none' }}>
                              {/* Card Content ... reuse existing UI markup structure if possible, but simplified */}
                              <CardContent sx={{ px: 1.5, py: 1, '&:last-child': { pb: 1 } }}>
                                <Stack spacing={0.75}>
                                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ justifyContent: 'space-between' }}>
                                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                      <TicketIcon fontSize="var(--icon-fontSize-md)" />
                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
                                          {show?.name || tt('Chưa xác định', 'Not specified')}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }} noWrap>
                                          {ticketCategory?.name || tt('Chưa rõ loại vé', 'Unknown ticket category')}
                                        </Typography>
                                      </Box>
                                    </Stack>

                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                                        {formatPrice(g.price)}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                                        x {g.quantity}
                                      </Typography>
                                      <IconButton
                                        size="small"
                                        sx={{ p: 0.5 }}
                                        onClick={() => {
                                          setActiveScheduleId(g.showId);
                                          setRequestedCategoryModalId(g.ticketCategoryId);
                                        }}
                                        aria-label={tt('Chỉnh sửa', 'Edit')}
                                      >
                                        <Pencil />
                                      </IconButton>
                                      <Typography variant="caption" sx={{ minWidth: 96, textAlign: 'right', fontSize: 12 }}>
                                        = {formatPrice(g.price * g.quantity)}
                                      </Typography>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        sx={{ p: 0.5 }}
                                        onClick={() => handleAddToCartQuantity(g.showId, g.ticketCategoryId, 0)}
                                        aria-label={tt('Xóa', 'Remove')}
                                      >
                                        <X />
                                      </IconButton>
                                    </Stack>
                                  </Stack>
                                </Stack>
                              </CardContent>
                            </Card>
                          );
                        });
                      })()}
                    </Stack>
                  )}

                  <Box sx={{ display: activeStep === 2 ? 'block' : 'none' }}>
                    <Step3Payment
                      tt={tt}
                      paramsEventId={params.event_id}
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
                      onBack={handleBack}
                      onNext={handleCreateClick}
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
                      requireGuestAvatar={requireGuestAvatar}
                      requireTicketHolderInfo={requireTicketHolderInfo}
                      paymentMethodLabel={paymentMethodLabel}
                      extraFee={extraFee}
                      subtotal={subtotal}
                      discountAmount={discountAmount}
                      appliedVoucherCode={appliedVoucher && voucherValidation.valid ? appliedVoucher.code : null}
                      finalTotal={finalTotal}
                      formatPrice={formatPrice}
                      onBack={() => {
                        handleBack();
                        setCartOpen(false); // Close cart on back from modal step? Or just back
                      }}
                      onConfirm={handleSubmit}
                      confirmDisabled={isLoading}
                    />
                  </Box>

                  <Divider />
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2">{tt('Tổng tiền vé', 'Tickets total')}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {formatPrice(subtotal)}
                    </Typography>
                  </Stack>
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCartOpen(false)}>{tt('Đóng', 'Close')}</Button>
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
                    <Typography variant="body1">{selectedVoucherForDetail.name}</Typography>
                    {selectedVoucherForDetail.content && (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
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
                        {tt(
                          `Tối đa ${selectedVoucherForDetail.maxTicketsToDiscount} vé được giảm giá`,
                          `Maximum ${selectedVoucherForDetail.maxTicketsToDiscount} tickets can receive discount`
                        )}
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
              <Button
                onClick={() => {
                  setVoucherDetailModalOpen(false);
                  setSelectedVoucherForDetail(null);
                }}
              >
                {tt("Đóng", "Close")}
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </>
    );
  }

  // Fallback (should never happen)
  return <></>;

}
