'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Box,
  IconButton,
  Step,
  StepButton,
  Stepper
} from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { CaretLeft } from '@phosphor-icons/react/dist/ssr';
import { LocalizedLink } from '@/components/homepage/localized-link';


import { useTranslation } from '@/contexts/locale-context';
import NotificationContext from '@/contexts/notification-context';

import { Step1SelectTickets } from '@/components/transactions/create-steps/step-1-select-tickets';
import { Step2Info } from '@/components/transactions/create-steps/step-2-info';
import { Step3Payment } from '@/components/transactions/create-steps/step-3-payment';
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, formatToE164 } from '@/config/phone-countries';
import { getPaymentMethodLabel } from '@/utils/payment';
import { calculateVoucherDiscount } from '@/utils/voucher-discount';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

import { Step4Review } from '@/components/transactions/create-steps/step-4-review';
import {
  CheckoutRuntimeField,
  EventResponse,
  HolderInfo,
  Order,
  Show,
  TicketInfo
} from '@/components/transactions/create-steps/types';

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
      nationalPhone: '',
      address: '',
      phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2,
      dob: null,
      idcard_number: '',
      avatar: ''
    },
    tickets: [],
    qrOption: 'separate',
    paymentMethod: 'napas247',
    extraFee: 0,
    concessions: []
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
    if (!order.customer.nationalPhone) return '';
    const digits = order.customer.nationalPhone.replace(/\D/g, '');
    return digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
  }, [order.customer.nationalPhone]);

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
          `/event-studio/events/${params.event_id}/transactions/shows/${show.id}/seats`
        );
        setShowSeats(response.data);
      } catch (err) {
        console.error("Failed to load seats", err);
      }
    };

    fetchSeats();
  }, [activeScheduleId, event, params.event_id]);

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
    const ticketsTotal = order.tickets.reduce((sum, t) => sum + (t.price ?? 0), 0);
    const concessionsTotal = (order.concessions || []).reduce((sum, c) => {
      return sum + (Number(c.price || 0) * Number(c.quantity || 0));
    }, 0);
    return ticketsTotal + concessionsTotal;
  }, [order.tickets, order.concessions]);

  const handleUpdateConcessionQuantity = (showId: number, concessionId: number, quantity: number) => {
    setOrder(prev => {
      const existingConcessions = prev.concessions || [];
      const targetConcession = existingConcessions.find(c => c.showId === showId && c.concessionId === concessionId);
      const otherConcessions = existingConcessions.filter(c => !(c.showId === showId && c.concessionId === concessionId));

      if (quantity > 0) {
        // If we don't have price info here (e.g. from cart modal), we might need to rely on existing price
        // or re-fetch. But CartModal generally calls this.
        // For simplicity, we assume price persists or we update quantity only if exists.
        if (targetConcession) {
          return {
            ...prev,
            concessions: [...otherConcessions, { ...targetConcession, quantity }]
          };
        }
        // If adding new from cart modal (unlikely), we'd need price.
        return prev;
      } else {
        return {
          ...prev,
          concessions: otherConcessions
        };
      }
    });
  };

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
    window.scrollTo(0, 0);
  }, [activeStep]);

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

  const validateStep1 = () => {
    if (order.tickets.length === 0) {
      notificationCtx.warning(tt('Vui lòng chọn ít nhất 1 loại vé', 'Please select at least 1 ticket category'));
      return false;
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
          let phoneCountryIso2 = t.holder.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2;
          let phoneDigits = '';

          if (t.holder.nationalPhone) {
            phoneDigits = t.holder.nationalPhone.replace(/\D/g, '').replace(/^0+/, '');
            holderPhoneE164 = formatToE164(phoneCountryIso2, phoneDigits) || undefined;
          }

          holderData = {
            title: t.holder.title,
            name: t.holder.name,
            email: t.holder.email,
            phone: holderPhoneE164,
            avatar: holderAvatar || undefined,
            phoneCountry: phoneCountryIso2,
            phoneNationalNumber: phoneDigits,
          };
        }

        return {
          showId: t.showId,
          ticketCategoryId: t.ticketCategoryId,
          seatId: t.seatId,
          amount: t.price,
          audienceId: t.audienceId,
          holder: holderData
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

      const transactionData = {
        customer: apiCustomer,
        tickets: tickets,
        qrOption: order.qrOption,

        paymentMethod: order.paymentMethod,
        extraFee: order.extraFee,
        formAnswers: checkoutCustomAnswers,
        voucherCode: order.voucherCode, // If we store it in order
        concessions: order.concessions // Add concessions to payload
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
      <Stack spacing={4}>
        <Stack direction="row" spacing={3} alignItems="center" sx={{ flex: '1 1 auto' }}>
          <IconButton component={LocalizedLink} href={`/event-studio/events/${params.event_id}/transactions`}>
            <CaretLeft />
          </IconButton>
          <Typography variant="h4">{tt("Tạo đơn hàng mới", "Create New Order")}</Typography>
        </Stack>

        <Stepper nonLinear activeStep={activeStep} sx={{ mb: 1 }}>
          {stepLabels.map((label, index) => (
            <Step key={label}>
              <StepButton
                onClick={() => setActiveStep(index)}
                disabled={index > activeStep}
              >
                {label}
              </StepButton>
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
            onUpdateConcessionQuantity={handleUpdateConcessionQuantity}
            onEditCartItem={(showId, categoryId) => {
              setActiveScheduleId(showId);
              setRequestedCategoryModalId(categoryId);
              setCartOpen(false);
              // In linear mode, we might want to check step. For now, assuming step 0 is selection.
              setActiveStep(0);
            }}
            onRemoveCartItem={(showId, categoryId) => handleAddToCartQuantity(showId, categoryId, 0)}
            eventLimitPerTransaction={event?.limitPerTransaction}
            eventLimitPerCustomer={event?.limitPerCustomer}
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
            paramsEventId={params.event_id}
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
            showExtraFeeInput={true}
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
          />
        </Box>


      </Stack>
    </>
  );


}
