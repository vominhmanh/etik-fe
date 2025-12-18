'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Avatar,
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
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
import { DotsThreeOutlineVertical, Pencil } from '@phosphor-icons/react/dist/ssr';
import { Plus } from '@phosphor-icons/react/dist/ssr';
import { X } from '@phosphor-icons/react/dist/ssr';
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, parseE164Phone } from '@/config/phone-countries';
import dayjs from 'dayjs';
import { calculateVoucherDiscount } from '@/utils/voucher-discount';

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
type TicketHolderInfo = { title: string; name: string; email: string; phone: string; phoneCountryIso2?: string; avatar?: string };

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
  const [qrOption, setQrOption] = React.useState<string>("shared");
  const [requireTicketHolderInfo, setRequireTicketHolderInfo] = React.useState<boolean>(false);
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
  const [ticketHolderEditted, setTicketHolderEditted] = React.useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);
  const [requestedCategoryModalId, setRequestedCategoryModalId] = React.useState<number | null>(null);
  const [ticketHoldersByCategory, setTicketHoldersByCategory] = React.useState<Record<string, TicketHolderInfo[]>>({});
  const [requireGuestAvatar, setRequireGuestAvatar] = React.useState<boolean>(false);
  const [pendingCustomerAvatarFile, setPendingCustomerAvatarFile] = React.useState<File | null>(null);
  const [pendingHolderAvatarFiles, setPendingHolderAvatarFiles] = React.useState<Record<string, File>>({});

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
            setRequestedCategoryModalId(categoryId);
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
            setRequestedCategoryModalId(categoryId);
            return;
          }
          for (let i = 0; i < quantity; i++) {
            const h = holders[i];
            if (!h || !h.title || !h.name) {
              notificationCtx.warning(tt('Vui lòng điền đủ tên cho từng vé.', 'Please fill in name for each ticket holder.'));
              setRequestedCategoryModalId(categoryId);
              return;
            }
            if (!h.email) {
              notificationCtx.warning(tt('Vui lòng điền đủ email cho từng vé khi sử dụng mã QR riêng.', 'Please fill in email for each ticket holder when using separate QR codes.'));
              setRequestedCategoryModalId(categoryId);
              return;
            }
            if (!h.phone) {
              notificationCtx.warning(tt('Vui lòng điền đủ số điện thoại cho từng vé khi sử dụng mã QR riêng.', 'Please fill in phone number for each ticket holder when using separate QR codes.'));
              setRequestedCategoryModalId(categoryId);
              return;
            }
          }
        }
      }
    }

    setConfirmOpen(true);
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
              setConfirmOpen(false);
              notificationCtx.warning(tt('Vui lòng điền đủ thông tin người tham dự cho từng vé.', 'Please fill in information for each ticket holder.'));
              setRequestedCategoryModalId(categoryId);
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
              setConfirmOpen(false);
              notificationCtx.warning(tt('Vui lòng điền đủ thông tin người tham dự cho từng vé.', 'Please fill in information for each ticket holder.'));
              setRequestedCategoryModalId(categoryId);
              return;
            }
            for (let i = 0; i < quantity; i++) {
              const h = holders[i];
              if (!h || !h.title || !h.name) {
                setConfirmOpen(false);
                notificationCtx.warning(tt('Vui lòng điền đủ tên cho từng vé.', 'Please fill in name for each ticket holder.'));
                setRequestedCategoryModalId(categoryId);
                return;
              }
              if (!h.email) {
                setConfirmOpen(false);
                notificationCtx.warning(tt('Vui lòng điền đủ email cho từng vé khi sử dụng mã QR riêng.', 'Please fill in email for each ticket holder when using separate QR codes.'));
                setRequestedCategoryModalId(categoryId);
                return;
              }
              if (!h.phone) {
                setConfirmOpen(false);
                notificationCtx.warning(tt('Vui lòng điền đủ số điện thoại cho từng vé khi sử dụng mã QR riêng.', 'Please fill in phone number for each ticket holder when using separate QR codes.'));
                setRequestedCategoryModalId(categoryId);
                return;
              }
            }
          }
        }
      }

      setConfirmOpen(false);
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

            // Only include avatar if requireGuestAvatar is true
            if (requireGuestAvatar && holderAvatarUrls[fileKey]) {
              holderData.avatar = holderAvatarUrls[fileKey];
            } else if (!requireGuestAvatar) {
              // Remove avatar field if not required
              delete holderData.avatar;
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

          // Send holders based on requireTicketHolderInfo or qrOption
          let holdersToSend = undefined;
          if (qrOption === 'separate') {
            // For separate QR, always send holders with email and phone
            holdersToSend = holdersWithS3Urls;
          } else if (requireTicketHolderInfo) {
            // For requireTicketHolderInfo, send holders but without email/phone (will use customer's)
            holdersToSend = holdersWithS3Urls.map(h => ({
              title: h.title,
              name: h.name,
              avatar: h.avatar,
              // Don't include email and phone - will use customer's
            }));
          }

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

  return (
    <Stack spacing={3}>
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
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">{tt("Tạo đơn hàng mới", "Create New Order")}</Typography>
        </Stack>
      </Stack>
      <Grid container spacing={3}>
        <Grid lg={4} md={6} xs={12}>
          <Stack spacing={3}>
            <Schedules shows={event?.shows} onSelectionChange={handleSelectionChange} />
            {selectedSchedules && selectedSchedules.map(show => (
              <TicketCategories
                key={show.id}
                show={show}
                qrOption={qrOption}
                requireTicketHolderInfo={requireTicketHolderInfo}
                requestedCategoryModalId={requestedCategoryModalId || undefined}
                onModalRequestHandled={() => setRequestedCategoryModalId(null)}
                onCategorySelect={(categoryId: number) => handleCategorySelection(show.id, categoryId)}
                onAddToCart={(categoryId: number, quantity: number, holders?: { title: string; name: string; email: string; phone: string; }[]) => handleAddToCartQuantity(show.id, categoryId, quantity, holders)}
              />
            ))}
          </Stack>
        </Grid>
        <Grid lg={8} md={6} xs={12}>
          <Stack spacing={3}>
            {/* Customer Information Card */}
            <Card>
              <CardHeader
                subheader={tt("Vui lòng điền các trường thông tin phía dưới.", "Please fill in the information fields below.")}
                title={tt("Thông tin người mua", "Buyer Information")}
                action={
                  <>
                    <IconButton onClick={handleOpenFormMenu}>
                      <DotsThreeOutlineVertical />
                    </IconButton>
                    <Menu
                      anchorEl={formMenuAnchorEl}
                      open={Boolean(formMenuAnchorEl)}
                      onClose={handleCloseFormMenu}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    >
                      <MenuItem onClick={handleCloseFormMenu}>
                        <LocalizedLink
                          style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}
                          href={`/event-studio/events/${params.event_id}/etik-forms/checkout-form?back_to=/event-studio/events/${params.event_id}/transactions/create`}
                        >
                          {tt("Thêm câu hỏi vào biểu mẫu này", "Add questions to this form")}
                        </LocalizedLink>
                      </MenuItem>
                    </Menu>
                  </>
                }
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid lg={4} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel htmlFor="customer-name">{tt("Danh xưng* &emsp; Họ và tên", "Title* &emsp; Full Name")}</InputLabel>
                      <OutlinedInput
                        id="customer-name"
                        label={tt("Danh xưng* &emsp; Họ và tên", "Title* &emsp; Full Name")}
                        name="customer_name"
                        value={customer.name}
                        onChange={(e) => {
                          !ticketHolderEditted && ticketHolders.length > 0 &&
                            setTicketHolders((prev) => {
                              const updatedHolders = [...prev];
                              const current = updatedHolders[0] || { title: 'Bạn', name: '', email: '', phone: '', avatar: '' };
                              updatedHolders[0] = { ...current, name: e.target.value };
                              return updatedHolders;
                            });
                          setCustomer({ ...customer, name: e.target.value });
                        }}
                        startAdornment={
                          <InputAdornment position="start">
                            <Select
                              variant="standard"
                              disableUnderline
                              value={customer.title || defaultTitle}
                              onChange={(e) =>
                                setCustomer({ ...customer, title: e.target.value })
                              }
                              sx={{ minWidth: 65 }} // chiều rộng tối thiểu để gọn
                            >
                              <MenuItem value="Anh">Anh</MenuItem>
                              <MenuItem value="Chị">Chị</MenuItem>
                              <MenuItem value="Bạn">Bạn</MenuItem>
                              <MenuItem value="Em">Em</MenuItem>
                              <MenuItem value="Ông">Ông</MenuItem>
                              <MenuItem value="Bà">Bà</MenuItem>
                              <MenuItem value="Cô">Cô</MenuItem>
                              <MenuItem value="Thầy">Thầy</MenuItem>
                              <MenuItem value="Mr.">Mr.</MenuItem>
                              <MenuItem value="Ms.">Ms.</MenuItem>
                              <MenuItem value="Mx.">Mx.</MenuItem>
                              <MenuItem value="Miss">Miss</MenuItem>
                            </Select>
                          </InputAdornment>
                        }
                      />
                    </FormControl>
                  </Grid>

                  <Grid md={4} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>{tt("Địa chỉ Email", "Email Address")}</InputLabel>
                      <OutlinedInput
                        label={tt("Địa chỉ Email", "Email Address")}
                        name="customer_email"
                        type="email"
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={4} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>{tt("Số điện thoại", "Phone Number")}</InputLabel>
                      <OutlinedInput
                        label={tt("Số điện thoại", "Phone Number")}
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
                              sx={{ minWidth: 80 }}
                              renderValue={(value) => {
                                const country =
                                  PHONE_COUNTRIES.find((c) => c.iso2 === value) || DEFAULT_PHONE_COUNTRY;
                                return country.dialCode;
                              }}
                            >
                              {PHONE_COUNTRIES.map((country) => (
                                <MenuItem key={country.iso2} value={country.iso2}>
                                  {tt(country.nameVi, country.nameEn)} ({country.dialCode})
                                </MenuItem>
                              ))}
                            </Select>
                          </InputAdornment>
                        }
                      />
                    </FormControl>
                  </Grid>
                  {/* Builtin optional fields controlled by checkout form config */}
                  {(() => {
                    const dobCfg = checkoutFormFields.find((f) => f.internalName === 'dob');
                    const visible = !!dobCfg && dobCfg.visible;
                    const required = !!dobCfg?.required;
                    return (
                      visible && (
                        <Grid lg={6} xs={12}>
                          <TextField
                            fullWidth
                            label={tt("Ngày tháng năm sinh", "Date of Birth")}
                            name="customer_dob"
                            type="date"
                            required={required}
                            value={customer.dob || ""}
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
                        </Grid>
                      )
                    );
                  })()}
                  {(() => {
                    const idCfg = checkoutFormFields.find((f) => f.internalName === 'idcard_number');
                    const visible = !!idCfg && idCfg.visible;
                    const required = !!idCfg?.required;
                    return (
                      visible && (
                        <Grid lg={6} xs={12}>
                          <FormControl fullWidth required={required}>
                            <InputLabel>{tt("Số Căn cước công dân", "ID Card Number")}</InputLabel>
                            <OutlinedInput
                              label={tt("Số Căn cước công dân", "ID Card Number")}
                              name="customer_idcard_number"
                              value={customer.idcard_number}
                              onChange={(e) => setCustomer({ ...customer, idcard_number: e.target.value })}
                            />
                          </FormControl>
                        </Grid>
                      )
                    );
                  })()}

                  {(() => {
                    const addrCfg = checkoutFormFields.find((f) => f.internalName === 'address');
                    const visible = !!addrCfg && addrCfg.visible;
                    const required = !!addrCfg?.required;
                    return (
                      visible && (
                        <Grid lg={12} xs={12}>
                          <FormControl fullWidth required={required}>
                            <InputLabel>{tt("Địa chỉ", "Address")}</InputLabel>
                            <OutlinedInput
                              label={tt("Địa chỉ", "Address")}
                              name="customer_address"
                              value={customer.address}
                              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                            />
                          </FormControl>
                        </Grid>
                      )
                    );
                  })()}



                  {/* Custom checkout fields (ETIK Forms) */}
                  {customCheckoutFields.map((field) => (
                    <Grid key={field.internalName} xs={12}>
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
                                          const prevArr: string[] = prev[field.internalName] ?? [];
                                          let nextArr: string[];
                                          if (e.target.checked) {
                                            nextArr = Array.from(new Set([...prevArr, opt.value]));
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
                  title={tt(`Danh sách vé: ${totalSelectedTickets} vé`, `Ticket List: ${totalSelectedTickets} tickets`)}
                  action={
                    qrOption === 'shared' && requireGuestAvatar && (
                      <Box sx={{ position: 'relative', width: 36, height: 36, '&:hover .avatarUploadBtn': { opacity: 1, visibility: 'visible' } }}>
                        <Avatar src={customer.avatar || ''} sx={{ width: 36, height: 36 }} />
                        <IconButton
                          className="avatarUploadBtn"
                          sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%', opacity: 0, visibility: 'hidden', backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.35)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
                          onClick={() => {
                            const input = document.getElementById('upload-customer-avatar') as HTMLInputElement | null;
                            input?.click();
                          }}
                        >
                          <Plus size={14} />
                        </IconButton>
                        <input
                          id="upload-customer-avatar"
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            handleCustomerAvatarFile(f);
                            e.currentTarget.value = '';
                          }}
                        />
                      </Box>
                    )
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
                          <Stack spacing={2} key={`${showId}-${categoryId}`}>
                            <Stack direction={{ xs: 'column', md: 'row' }} key={`${showId}-${categoryId}`} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                                <TicketIcon fontSize="var(--icon-fontSize-md)" />
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{show?.name || tt('Chưa xác định', 'Not specified')} - {ticketCategory?.name || tt('Chưa rõ loại vé', 'Unknown ticket category')}</Typography>
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

                            {requireTicketHolderInfo && quantity > 0 && (
                              <Stack spacing={2}>
                                {Array.from({ length: quantity }, (_, index) => {
                                  const holderInfo = ticketHoldersByCategory[`${showId}-${categoryId}`]?.[index];
                                  return (
                                    <Stack spacing={0} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                                      {requireGuestAvatar && (
                                        <Box sx={{ position: 'relative', width: 36, height: 36, '&:hover .avatarUploadBtn': { opacity: 1, visibility: 'visible' } }}>
                                          <Avatar src={holderInfo?.avatar || ''} sx={{ width: 36, height: 36 }} />
                                          <IconButton
                                            className="avatarUploadBtn"
                                            sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%', opacity: 0, visibility: 'hidden', backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.35)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
                                            onClick={() => {
                                              const input = document.getElementById(`upload-holder-${showId}-${categoryId}-${index}`) as HTMLInputElement | null;
                                              input?.click();
                                            }}
                                          >
                                            <Plus size={14} />
                                          </IconButton>
                                          <input
                                            id={`upload-holder-${showId}-${categoryId}-${index}`}
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={(e) => {
                                              const f = e.target.files?.[0];
                                              handleTicketHolderAvatarFile(parseInt(showId), categoryId, index, f);
                                              e.currentTarget.value = '';
                                            }}
                                          />
                                        </Box>
                                      )}
                                      <Box key={index} sx={{ ml: 2, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                          {index + 1}. {holderInfo?.name ? `${holderInfo?.title} ${holderInfo?.name}` : tt('Chưa có thông tin', 'No information')}
                                        </Typography>
                                        <br />
                                        {qrOption === 'separate' && (
                                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {(() => {
                                              const email = holderInfo?.email || tt('Chưa có email', 'No email');
                                              if (!holderInfo?.phone) {
                                                return `${email} - ${tt('Chưa có SĐT', 'No phone')}`;
                                              }
                                              // Use phoneCountryIso2 from user input, or parse E.164 if not available
                                              const countryIso2 = holderInfo?.phoneCountryIso2;

                                              if (countryIso2) {
                                                // Use country from user input
                                                const country = PHONE_COUNTRIES.find(c => c.iso2 === countryIso2) || DEFAULT_PHONE_COUNTRY;
                                                // Format phone number (remove leading 0 if present)
                                                const digits = holderInfo.phone.replace(/\D/g, '');
                                                const phoneNSN = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
                                                return `${email} - ${country.dialCode} ${phoneNSN}`;
                                              } else {
                                                // Try to parse E.164 format (fallback)
                                                const parsedPhone = parseE164Phone(holderInfo.phone);
                                                if (parsedPhone) {
                                                  const country = PHONE_COUNTRIES.find(c => c.iso2 === parsedPhone.countryCode) || DEFAULT_PHONE_COUNTRY;
                                                  return `${email} - ${country.dialCode} ${parsedPhone.nationalNumber}`;
                                                }
                                                return `${email} - ${holderInfo.phone}`;
                                              }
                                            })()}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Stack>
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

            {/* Additional options */}

            <Card>
              <CardHeader title={tt("Tùy chọn bổ sung", "Additional Options")} />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid xs>
                      <Typography variant="body2">{tt("Ảnh đại diện cho khách mời", "Guest Avatar")}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {tt("Bạn cần tải lên ảnh đại diện cho khách mời.", "You need to upload an avatar for guests.")}
                      </Typography>
                    </Grid>
                    <Grid>
                      <Checkbox
                        checked={requireGuestAvatar}
                        onChange={(_e, checked) => {
                          setRequireGuestAvatar(checked);
                        }}
                      />
                    </Grid>
                  </Grid>
                  {totalSelectedTickets > 1 && (
                    <>
                      <Grid container spacing={1} alignItems="center">
                        <Grid xs>
                          <Typography variant="body2">{tt("Nhập thông tin người sở hữu cho từng vé", "Enter ticket holder information for each ticket")}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {tt("Chọn nếu bạn biết thông tin của từng khách mời.", "Select if you know the information of each guest.")}
                          </Typography>
                        </Grid>
                        <Grid>
                          <Checkbox
                            checked={requireTicketHolderInfo}
                            onChange={(_e, checked) => {
                              setRequireTicketHolderInfo(checked);
                              if (checked) {
                                notificationCtx.info(tt('Vui lòng điền thông tin người sở hữu cho từng vé', 'Please fill in information for each ticket holder'));
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                      {requireTicketHolderInfo && (
                        <Grid container spacing={1} alignItems="center">
                          <Grid xs>
                            <Typography variant="body2">{tt("Sử dụng mã QR riêng cho từng vé", "Use separate QR code for each ticket")}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {tt("Chọn nếu bạn muốn tạo và gửi mã QR riêng qua email từng khách mời.", "Select if you want to send separate QR codes for each guest.")}
                            </Typography>
                          </Grid>
                          <Grid>
                            <Checkbox
                              checked={qrOption === 'separate'}
                              onChange={(_e, checked) => {
                                setQrOption(checked ? 'separate' : 'shared');
                              }}
                            />
                          </Grid>
                        </Grid>
                      )}
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Extra Fee */}
            <Card>
              <CardHeader
                title={tt("Phụ phí", "Extra Fee")}
                subheader={tt("(nếu có)", "(if any)")}
                action={
                  <OutlinedInput
                    size="small"
                    name="extraFee"
                    value={extraFee.toLocaleString()} // Format as currency
                    onChange={handleExtraFeeChange}
                    sx={{ maxWidth: 180 }}
                    endAdornment={<InputAdornment position="end">đ</InputAdornment>}
                  />
                }
              />
            </Card>
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
                        onClick={async () => {
                          if (!manualDiscountCode.trim()) {
                            notificationCtx.warning(tt('Vui lòng nhập mã khuyến mãi', 'Please enter discount code'));
                            return;
                          }

                          try {
                            // First try to find in available vouchers (public vouchers)
                            const voucher = availableVouchers.find((v) => v.code.toLowerCase() === manualDiscountCode.toLowerCase());
                            if (voucher) {
                              handleValidateAndDisplayVoucher(voucher);
                              setManualDiscountCode('');
                              return;
                            }

                            // If not found in public list, call API to validate
                            const response = await baseHttpServiceInstance.get(
                              `/event-studio/events/${params.event_id}/voucher-campaigns/validate-voucher`,
                              { params: { code: manualDiscountCode.trim() } }
                            );

                            if (response.data) {
                              handleValidateAndDisplayVoucher(response.data);
                              setManualDiscountCode('');
                            }
                          } catch (error: any) {
                            const errorMessage = error?.response?.data?.detail || error?.message || tt('Mã khuyến mãi không hợp lệ', 'Invalid discount code');
                            notificationCtx.error(errorMessage);
                          }
                        }}
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
                                  onClick={() => {
                                    handleApplyVoucher(voucher);
                                  }}
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
            {Object.values(selectedCategories).some((catMap) => Object.keys(catMap || {}).length > 0) && (
              <Card>
                <CardContent>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {tt("Tổng tiền vé:", "Ticket Total:")}
                      </Typography>
                      <Typography variant="body2">
                        {formatPrice(subtotal)}
                      </Typography>
                    </Box>
                    {extraFee > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {tt("Phụ phí:", "Extra Fee:")}
                        </Typography>
                        <Typography variant="body2">
                          {formatPrice(extraFee)}
                        </Typography>
                      </Box>
                    )}
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
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {tt("Tổng cộng:", "Total:")}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {formatPrice(finalTotal)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}
            {/* Payment Method */}
            <Card>
              <CardHeader
                title={tt("Phương thức thanh toán", "Payment Method")}
                action={
                  <FormControl size="small" sx={{ maxWidth: 180, minWidth: 180 }}>
                    <Select
                      name="payment_method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <MenuItem value=""></MenuItem>
                      <MenuItem value="cash">{tt("Tiền mặt", "Cash")}</MenuItem>
                      <MenuItem value="transfer">{tt("Chuyển khoản", "Transfer")}</MenuItem>
                      <MenuItem value="napas247">Napas 247</MenuItem>
                    </Select>
                  </FormControl>
                }
              />
            </Card>


            {/* Submit Button */}
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: '3' }}>
              <Button variant="contained" onClick={handleCreateClick}>
                {tt("Tạo", "Create")}
              </Button>
            </Grid>
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="md">
              <DialogTitle sx={{ color: "primary.main" }}>{tt("Xác nhận tạo đơn hàng", "Confirm Order Creation")}</DialogTitle>
              <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{tt("Thông tin người mua", "Buyer Information")}</Typography>
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
                              {formattedCustomerPhone || customer.phoneNumber}
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

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{tt("Danh sách vé", "Ticket List")}</Typography>
                    {qrOption === 'shared' && requireGuestAvatar && (
                      <Avatar src={customer.avatar || ''} sx={{ width: 36, height: 36 }} />
                    )}
                  </Box>
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
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{show?.name || tt('Chưa xác định', 'Not specified')} - {ticketCategory?.name || tt('Chưa rõ loại vé', 'Unknown ticket category')}</Typography>
                              </Stack>
                              <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                                <Typography variant="caption">{formatPrice(ticketCategory?.price || 0)}</Typography>
                                <Typography variant="caption">x {quantity}</Typography>
                                <Typography variant="caption">
                                  = {formatPrice((ticketCategory?.price || 0) * quantity)}
                                </Typography>
                              </Stack>
                            </Stack>

                            {requireTicketHolderInfo && quantity > 0 && (
                              <Box sx={{ ml: 2 }}>
                                <Stack spacing={1}>
                                  {Array.from({ length: quantity }, (_, index) => {
                                    const holderInfo = ticketHoldersByCategory[`${showId}-${categoryId}`]?.[index];
                                    return (
                                      <Stack spacing={0} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                                        {requireGuestAvatar && (
                                          <Avatar src={holderInfo?.avatar || ''} sx={{ width: 36, height: 36 }} />
                                        )}
                                        <Box key={index} sx={{ ml: 2, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                            {index + 1}. {holderInfo?.name ? `${holderInfo?.title} ${holderInfo?.name}` : tt('Chưa có thông tin', 'No information')}
                                          </Typography>
                                          <br />
                                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {holderInfo?.email || tt('Chưa có email', 'No email')} - {holderInfo?.phone || tt('Chưa có SĐT', 'No phone')}
                                          </Typography>
                                        </Box>
                                      </Stack>
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
                    <Typography variant="body2">{tt("Phương thức thanh toán", "Payment Method")}</Typography>
                    <Typography variant="body2">{getPaymentMethodLabel(paymentMethod, tt)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{tt("Phụ phí", "Extra Fee")}</Typography>
                    <Typography variant="body2">{formatPrice(extraFee)}</Typography>
                  </Box>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {tt("Tổng tiền vé:", "Ticket Total:")}
                      </Typography>
                      <Typography variant="body2">
                        {formatPrice(subtotal)}
                      </Typography>
                    </Box>
                    {extraFee > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {tt("Phụ phí:", "Extra Fee:")}
                        </Typography>
                        <Typography variant="body2">
                          {formatPrice(extraFee)}
                        </Typography>
                      </Box>
                    )}
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
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {tt("Tổng cộng", "Total")}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {formatPrice(finalTotal)}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmOpen(false)}>{tt("Quay lại", "Back")}</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>{tt("Xác nhận", "Confirm")}</Button>
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
                    {/* Voucher Code and Discount */}
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

                    {/* Campaign Name */}
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {tt("Tên chiến dịch", "Campaign Name")}
                      </Typography>
                      <Typography variant="body1">
                        {selectedVoucherForDetail.name}
                      </Typography>


                      {selectedVoucherForDetail.content && (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {selectedVoucherForDetail.content}
                        </Typography>
                      )}
                    </Box>
                    <Divider />

                    {/* Validity Period */}
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

                    {/* Application Type */}
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

                    {/* Application Scope */}
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

                    {/* Conditions */}
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
                {selectedVoucherForDetail && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (handleApplyVoucher(selectedVoucherForDetail)) {
                        setVoucherDetailModalOpen(false);
                        setSelectedVoucherForDetail(null);
                      }
                    }}
                  >
                    {tt("Áp dụng mã này", "Apply This Code")}
                  </Button>
                )}
              </DialogActions>
            </Dialog>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
