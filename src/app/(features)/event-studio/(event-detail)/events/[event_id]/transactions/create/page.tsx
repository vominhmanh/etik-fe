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
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  const [extraFee, setExtraFee] = React.useState<number>(0);
  const router = useRouter(); // Use useRouter from next/navigation
  const [selectedCategories, setSelectedCategories] = React.useState<Record<number, Record<number, number>>>({});
  const defaultTitle = locale === 'en' ? 'Mx.' : 'Bạn';
  const [customer, setCustomer] = React.useState({
    title: defaultTitle,
    name: '',
    email: '',
    phoneNumber: '',
    phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2,
    dob: null as string | null,
    address: '',
    idcard_number: '',
    avatar: ''
  });
  const [paymentMethod, setPaymentMethod] = React.useState<string>('napas247');
  const [ticketHolders, setTicketHolders] = React.useState<TicketHolderInfo[]>([{ title: 'Bạn', name: '', email: '', phone: '', avatar: '' }]);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);
  const [activeScheduleId, setActiveScheduleId] = React.useState<number | null>(null);
  const [ticketHolderEditted, setTicketHolderEditted] = React.useState<boolean>(false);
  const [requestedCategoryModalId, setRequestedCategoryModalId] = React.useState<number | null>(null);
  const [ticketHoldersByCategory, setTicketHoldersByCategory] = React.useState<Record<string, TicketHolderInfo[]>>({});
  const requireGuestAvatar: boolean = true;
  const [pendingCustomerAvatarFile, setPendingCustomerAvatarFile] = React.useState<File | null>(null);
  const [pendingHolderAvatarFiles, setPendingHolderAvatarFiles] = React.useState<Record<string, File>>({});
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
    return PHONE_COUNTRIES.find((c) => c.iso2 === customer.phoneCountryIso2) || DEFAULT_PHONE_COUNTRY;
  }, [customer.phoneCountryIso2]);

  const customerNSN = React.useMemo(() => {
    if (!customer.phoneNumber) return '';
    const digits = customer.phoneNumber.replace(/\D/g, '');
    return digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
  }, [customer.phoneNumber]);

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
        // Silently fail - vouchers are optional
        console.error('Error fetching vouchers:', error);
      }
    };
    if (params.event_id) {
      fetchAvailableVouchers();
    }
  }, [params.event_id]);


  const builtinInternalNames = React.useMemo(
    () => new Set(['title', 'name', 'email', 'phone_number', 'address', 'dob', 'idcard_number']),
    []
  );

  const customCheckoutFields = React.useMemo(
    () => checkoutFormFields.filter((f) => !builtinInternalNames.has(f.internalName)),
    [checkoutFormFields, builtinInternalNames]
  );

  // Cleanup blob URLs on unmount to prevent memory leaks
  React.useEffect(() => {
    return () => {
      if (customer.avatar && customer.avatar.startsWith('blob:')) {
        URL.revokeObjectURL(customer.avatar);
      }
      Object.values(ticketHoldersByCategory).forEach(holders => {
        holders.forEach(holder => {
          if (holder.avatar && holder.avatar.startsWith('blob:')) {
            URL.revokeObjectURL(holder.avatar);
          }
        });
      });
    };
  }, []);

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

  const handleAddToCartQuantity = (showId: number, categoryId: number, quantity: number, holders?: { title: string; name: string; email: string; phone: string; phoneCountryIso2?: string; }[]) => {
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
      const existing = prev[key] || [];
      if (holders && holders.length > 0) {
        const merged = Array.from({ length: quantity }, (_, i) => {
          const prevHolder: TicketHolderInfo = existing[i] || { title: 'Bạn', name: '', email: '', phone: '', phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2, avatar: (requireGuestAvatar && customer.avatar) ? customer.avatar : '' };
          const incoming = holders[i];
          let combined: TicketHolderInfo = incoming ? { ...prevHolder, ...incoming } as TicketHolderInfo : prevHolder;
          if (!combined.avatar) {
            combined = { ...combined, avatar: (requireGuestAvatar && customer.avatar) ? customer.avatar : '' };
          }
          return combined;
        });
        return { ...prev, [key]: merged };
      }
      // ensure existing array is sized to quantity
      const sized = Array.from({ length: quantity }, (_, i) => existing[i] || { title: 'Bạn', name: '', email: '', phone: '', phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2, avatar: (requireGuestAvatar && customer.avatar) ? customer.avatar : '' });
      return { ...prev, [key]: sized };
    });
  };

  const handleSelectionChange = (selected: Show[]) => {
    setSelectedSchedules(selected);

    // If the active schedule gets unselected, clear active (no fallback to other schedules)
    if (activeScheduleId !== null && !selected.some((s) => s.id === activeScheduleId)) {
      setActiveScheduleId(null);
    }

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

  const activeSchedule = React.useMemo(() => {
    if (!activeScheduleId) return null;
    return selectedSchedules.find((s) => s.id === activeScheduleId) || null;
  }, [selectedSchedules, activeScheduleId]);

  const handleExtraFeeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, ''); // Remove non-digit characters
    setExtraFee(Number(value));
  };

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

      // Store the file for later upload
      setPendingCustomerAvatarFile(file);

      // update customer avatar with preview URL
      setCustomer(prev => ({ ...prev, avatar: previewUrl }));
      // also sync into the customer-holder (index 0)
      setTicketHolders(prev => {
        const next = [...prev];
        const current = next[0] || { title: 'Bạn', name: '', email: '', phone: '', avatar: '' };
        next[0] = { ...current, avatar: previewUrl };
        return next;
      });
      // merge avatar into all ticket holders that don't have one yet
      setTicketHoldersByCategory(prev => {
        const next: Record<string, TicketHolderInfo[]> = {};
        Object.entries(prev).forEach(([k, arr]) => {
          next[k] = (arr || []).map(h => {
            if (!h) return h as TicketHolderInfo;
            return h.avatar ? h : { ...h, avatar: previewUrl };
          });
        });
        return next;
      });
    } catch (error) {
      notificationCtx.error(error);
    }
  };

  const handleTicketHolderAvatarFile = async (showId: number, categoryId: number, index: number, file?: File) => {
    if (!file) return;
    try {
      // Create local preview URL instead of uploading to S3
      const previewUrl = createLocalPreviewUrl(file);

      // Store the file for later upload
      const fileKey = `${showId}-${categoryId}-${index}`;
      setPendingHolderAvatarFiles(prev => ({ ...prev, [fileKey]: file }));

      const key = `${showId}-${categoryId}`;
      setTicketHoldersByCategory(prev => {
        const existing = prev[key] || [];
        const next = existing.slice();
        const current = next[index] || { title: 'Bạn', name: '', email: '', phone: '', avatar: (requireGuestAvatar && customer.avatar) ? customer.avatar : '' };
        next[index] = { ...current, avatar: previewUrl };
        return { ...prev, [key]: next };
      });
    } catch (error) {
      notificationCtx.error(error);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  // Calculate total ticket quantity
  const totalTicketQuantity = React.useMemo(() => {
    return Object.entries(selectedCategories).reduce((total, [, categories]) => {
      return total + Object.values(categories || {}).reduce((sum, qty) => sum + (qty || 0), 0);
    }, 0);
  }, [selectedCategories]);

  // Calculate subtotal (before discount)
  const subtotal = React.useMemo(() => {
    return Object.entries(selectedCategories).reduce((total, [showId, categories]) => {
      const show = event?.shows.find((show) => show.id === parseInt(showId));
      const categoriesTotal = Object.entries(categories || {}).reduce((sub, [categoryIdStr, qty]) => {
        const categoryId = parseInt(categoryIdStr);
        const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
        return sub + (ticketCategory?.price || 0) * (qty || 0);
      }, 0);
      return total + categoriesTotal;
    }, 0);
  }, [selectedCategories, event]);

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
    if (ticketQuantity <= 0) {
      notificationCtx.warning(tt('Vui lòng điền đầy đủ các thông tin bắt buộc', 'Please fill in all required information'));
      return;
    }

    // Validate required fields based on checkout form configuration
    for (const field of checkoutFormFields) {
      if (!field.visible || !field.required) continue;

      // Built-in fields: map vào customer
      if (field.internalName === 'name' && !customer.name) {
        notificationCtx.warning(tt('Vui lòng nhập họ tên người mua', 'Please enter buyer name'));
        return;
      }
      if (field.internalName === 'email' && !customer.email) {
        notificationCtx.warning(tt('Vui lòng nhập email người mua', 'Please enter buyer email'));
        return;
      }
      if (field.internalName === 'phone_number' && !customer.phoneNumber) {
        notificationCtx.warning(tt('Vui lòng nhập số điện thoại người mua', 'Please enter buyer phone number'));
        return;
      }
      if (field.internalName === 'address' && !customer.address) {
        notificationCtx.warning(tt('Vui lòng nhập địa chỉ người mua', 'Please enter buyer address'));
        return;
      }
      if (field.internalName === 'dob' && !customer.dob) {
        notificationCtx.warning(tt('Vui lòng nhập ngày sinh người mua', 'Please enter buyer date of birth'));
        return;
      }
      if (field.internalName === 'idcard_number' && !customer.idcard_number) {
        notificationCtx.warning(
          tt(
            'Vui lòng nhập số Căn cước công dân của người mua',
            'Please enter buyer ID card number'
          )
        );
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
      notificationCtx.warning(tt('Vui lòng chọn ít nhất 1 loại vé', 'Please select at least 1 ticket category'));
      return;
    }


    // Validate per-ticket holder info when required
    if (requireTicketHolderInfo) {
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
            notificationCtx.warning(tt('Vui lòng điền đủ thông tin người tham dự cho từng vé.', 'Please fill in information for each ticket holder.'));
            setActiveStep(2);
            return;
          }
        }
      }
    }

    // Validate for separate QR option - must have email and phone for each holder
    if (qrOption === 'separate') {
      for (const [showId, categories] of Object.entries(selectedCategories)) {
        for (const [categoryIdStr, qty] of Object.entries(categories || {})) {
          const categoryId = parseInt(categoryIdStr);
          const quantity = qty || 0;
          if (quantity <= 0) continue;
          const key = `${showId}-${categoryId}`;
          const holders = ticketHoldersByCategory[key] || [];
          if (holders.length < quantity) {
            notificationCtx.warning(tt('Vui lòng điền đủ thông tin người tham dự cho từng vé.', 'Please fill in information for each ticket holder.'));
            setActiveStep(2);
            return;
          }
          for (let i = 0; i < quantity; i++) {
            const h = holders[i];
            if (!h || !h.title || !h.name) {
              notificationCtx.warning(tt('Vui lòng điền đủ tên cho từng vé.', 'Please fill in name for each ticket holder.'));
              setActiveStep(2);
              return;
            }
            if (!h.email) {
              notificationCtx.warning(tt('Vui lòng điền đủ email cho từng vé khi sử dụng mã QR riêng.', 'Please fill in email for each ticket holder when using separate QR codes.'));
              setActiveStep(2);
              return;
            }
            if (!h.phone) {
              notificationCtx.warning(tt('Vui lòng điền đủ số điện thoại cho từng vé khi sử dụng mã QR riêng.', 'Please fill in phone number for each ticket holder when using separate QR codes.'));
              setActiveStep(2);
              return;
            }
          }
        }
      }
    }

    setActiveStep(3);
  };

  const handleSubmit = async () => {
    try {
      if (requireTicketHolderInfo) {
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
              notificationCtx.warning(tt('Vui lòng điền đủ thông tin người tham dự cho từng vé.', 'Please fill in information for each ticket holder.'));
              setActiveStep(2);
              return;
            }
          }
        }
      }

      // Validate for separate QR option - must have email and phone for each holder
      if (qrOption === 'separate') {
        for (const [showId, categories] of Object.entries(selectedCategories)) {
          for (const [categoryIdStr, qty] of Object.entries(categories || {})) {
            const categoryId = parseInt(categoryIdStr);
            const quantity = qty || 0;
            if (quantity <= 0) continue;
            const key = `${showId}-${categoryId}`;
            const holders = ticketHoldersByCategory[key] || [];
            if (holders.length < quantity) {
              notificationCtx.warning(tt('Vui lòng điền đủ thông tin người tham dự cho từng vé.', 'Please fill in information for each ticket holder.'));
              setActiveStep(2);
              return;
            }
            for (let i = 0; i < quantity; i++) {
              const h = holders[i];
              if (!h || !h.title || !h.name) {
                notificationCtx.warning(tt('Vui lòng điền đủ tên cho từng vé.', 'Please fill in name for each ticket holder.'));
                setActiveStep(2);
                return;
              }
              if (!h.email) {
                notificationCtx.warning(tt('Vui lòng điền đủ email cho từng vé khi sử dụng mã QR riêng.', 'Please fill in email for each ticket holder when using separate QR codes.'));
                setActiveStep(2);
                return;
              }
              if (!h.phone) {
                notificationCtx.warning(tt('Vui lòng điền đủ số điện thoại cho từng vé khi sử dụng mã QR riêng.', 'Please fill in phone number for each ticket holder when using separate QR codes.'));
                setActiveStep(21);
                return;
              }
            }
          }
        }
      }

      setIsLoading(true);

      // Upload customer avatar to S3 if pending and requireGuestAvatar is true
      let customerAvatarUrl = undefined;
      if (requireGuestAvatar && pendingCustomerAvatarFile) {
        const uploadedUrl = await uploadImageToS3(pendingCustomerAvatarFile);
        if (uploadedUrl) {
          customerAvatarUrl = uploadedUrl;
        }
      }

      // Upload all pending holder avatars to S3 if requireGuestAvatar is true
      const holderAvatarUrls: Record<string, string> = {};
      if (requireGuestAvatar) {
        for (const [fileKey, file] of Object.entries(pendingHolderAvatarFiles)) {
          const uploadedUrl = await uploadImageToS3(file);
          if (uploadedUrl) {
            holderAvatarUrls[fileKey] = uploadedUrl;
          }
        }
      }

      // Prepare tickets with uploaded avatar URLs
      const tickets = Object.entries(selectedCategories).flatMap(([showId, catMap]) => (
        Object.entries(catMap || {}).map(([categoryIdStr, qty]) => {
          const key = `${showId}-${categoryIdStr}`;
          const holders = ticketHoldersByCategory[key] || [];

          // Replace preview URLs with S3 URLs if requireGuestAvatar is true
          // Also convert phoneCountryIso2 to phoneCountry and phoneNationalNumber
          const holdersWithS3Urls = holders.map((h, index) => {
            const fileKey = `${showId}-${categoryIdStr}-${index}`;
            const holderData: any = { ...h };

            // requireGuestAvatar is always true (see always-on options above)
            if (holderAvatarUrls[fileKey]) {
              holderData.avatar = holderAvatarUrls[fileKey];
            }

            // Convert phoneCountryIso2 to phoneCountry and phoneNationalNumber
            if (holderData.phone) {
              // Derive NSN from phone number (strip leading '0' if present)
              const digits = holderData.phone.replace(/\D/g, '');
              const phoneNSN = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
              holderData.phoneCountry = holderData.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2;
              holderData.phoneNationalNumber = phoneNSN;
              // Keep phoneCountryIso2 for internal use, but also send phoneCountry
              delete holderData.phoneCountryIso2; // Remove from final payload
            }

            return holderData;
          });

          // qrOption is always 'separate' (see always-on options above)
          const holdersToSend = holdersWithS3Urls;

          return {
            showId: parseInt(showId),
            ticketCategoryId: parseInt(categoryIdStr),
            quantity: qty || 0,
            holders: holdersToSend,
          };
        })
      ));

      // Prepare customer data, only include fields that are visible in checkout form
      const customerData: any = {
        title: customer.title || (locale === 'en' ? 'Mx.' : 'Bạn'),
        name: customer.name,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        phoneCountry: customer.phoneCountryIso2,
        phoneNationalNumber: customerNSN,
      };

      const isFieldVisible = (name: string) =>
        !!checkoutFormFields.find((f) => f.internalName === name && f.visible);

      // Title is always included as it's a built-in core field (shown in startAdornment of name field)
      // Other optional built-in fields
      if (isFieldVisible('dob')) {
        customerData.dob = customer.dob;
      }
      if (isFieldVisible('address')) {
        customerData.address = customer.address;
      }
      if (isFieldVisible('idcard_number')) {
        customerData.idcard_number = customer.idcard_number;
      }

      if (requireGuestAvatar && customerAvatarUrl) {
        customerData.avatarUrl = customerAvatarUrl;
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
        qrOption,
        requireTicketHolderInfo,
        requireGuestAvatar,
        paymentMethod,
        extraFee,
      };

      if (Object.keys(formAnswers).length > 0) {
        transactionData.formAnswers = formAnswers;
      }

      // Add voucher code if applied and valid
      if (appliedVoucher && voucherValidation.valid) {
        transactionData.voucherCode = appliedVoucher.code;
      }

      const response = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/transactions`,
        transactionData
      );
      const newTransaction = response.data;
      const path = `/event-studio/events/${params.event_id}/transactions/${newTransaction.id}`;
      router.push(locale === 'en' ? `/en${path}` : path); // Navigate to a different page on success
      notificationCtx.success(tt("Tạo đơn hàng thành công!", "Order created successfully!"));
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSelectedTickets = React.useMemo(() => {
    return Object.values(selectedCategories).reduce((sum, catMap) => {
      const subtotal = Object.values(catMap || {}).reduce((s, q) => s + (q || 0), 0);
      return sum + subtotal;
    }, 0);
  }, [selectedCategories]);

  const paymentMethodLabel = React.useMemo(() => getPaymentMethodLabel(paymentMethod, tt), [paymentMethod, tt]);

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
              qrOption={qrOption}
              requireTicketHolderInfo={requireTicketHolderInfo}
              requestedCategoryModalId={requestedCategoryModalId}
              onModalRequestHandled={() => setRequestedCategoryModalId(null)}
              onCategorySelect={handleCategorySelection}
              onAddToCart={handleAddToCartQuantity}
              cartQuantitiesForActiveSchedule={(activeSchedule && selectedCategories[activeSchedule.id]) || {}}
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
              customer={customer}
              setCustomer={setCustomer}
              ticketHolderEditted={ticketHolderEditted}
              ticketHolders={ticketHolders}
              setTicketHolders={setTicketHolders}
              checkoutFormFields={checkoutFormFields}
              customCheckoutFields={customCheckoutFields}
              builtinInternalNames={builtinInternalNames}
              checkoutCustomAnswers={checkoutCustomAnswers}
              setCheckoutCustomAnswers={setCheckoutCustomAnswers}
              requireGuestAvatar={requireGuestAvatar}
              requireTicketHolderInfo={requireTicketHolderInfo}
              selectedCategories={selectedCategories}
              shows={event?.shows || []}
              ticketHoldersByCategory={ticketHoldersByCategory}
              setTicketHoldersByCategory={setTicketHoldersByCategory}
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
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onBack={() => setActiveStep(1)}
              onNext={handleCreateClick}
            />
          </Box>

          <Box sx={{ display: activeStep === 3 ? 'block' : 'none' }}>
            <Step4Review
              tt={tt}
              checkoutFormFields={checkoutFormFields}
              builtinInternalNames={builtinInternalNames}
              checkoutCustomAnswers={checkoutCustomAnswers}
              customer={customer}
              formattedCustomerPhone={formattedCustomerPhone}
              selectedCategories={selectedCategories}
              shows={event?.shows || []}
              ticketHoldersByCategory={ticketHoldersByCategory}
              requireGuestAvatar={requireGuestAvatar}
              requireTicketHolderInfo={requireTicketHolderInfo}
              qrOption={qrOption}
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
                  {Object.entries(selectedCategories).flatMap(([showIdStr, categories]) => {
                    const showId = parseInt(showIdStr);
                    const show = event?.shows?.find((s) => s.id === showId);
                    return Object.entries(categories || {}).map(([categoryIdStr, qty]) => {
                      const categoryId = parseInt(categoryIdStr);
                      const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
                      const quantity = qty || 0;
                      if (quantity <= 0) return null;

                      const unitPrice = ticketCategory?.price || 0;
                      const lineTotal = unitPrice * quantity;

                      return (
                        <Card key={`${showId}-${categoryId}`} variant="outlined" sx={{ borderRadius: 1, boxShadow: 'none' }}>
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
                                    {formatPrice(unitPrice)}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                                    x {quantity}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    sx={{ p: 0.5 }}
                                    onClick={() => {
                                      setActiveScheduleId(showId);
                                      setRequestedCategoryModalId(categoryId);
                                    }}
                                    aria-label={tt('Chỉnh sửa', 'Edit')}
                                  >
                                    <Pencil />
                                  </IconButton>
                                  <Typography variant="caption" sx={{ minWidth: 96, textAlign: 'right', fontSize: 12 }}>
                                    = {formatPrice(lineTotal)}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    sx={{ p: 0.5 }}
                                    onClick={() => handleAddToCartQuantity(showId, categoryId, 0)}
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
                  })}

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
