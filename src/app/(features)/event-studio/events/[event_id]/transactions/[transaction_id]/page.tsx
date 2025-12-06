'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Avatar, Box, CardActions, Chip, IconButton, InputAdornment, Menu, MenuItem, Modal, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Container, Checkbox, FormGroup, FormControlLabel, RadioGroup, Radio, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Bank as BankIcon, CaretDoubleRight, Check, Clock, DeviceMobile, DotsThreeOutline, DotsThreeOutlineVertical, EnvelopeSimple, HouseLine, ImageSquare, Info, Lightning, Lightning as LightningIcon, MapPin, Money as MoneyIcon, Plus, Printer, SignIn, SignOut, WarningCircle, X } from '@phosphor-icons/react/dist/ssr'; // Example icons
import { LocalizedLink } from '@/components/localized-link';

import * as React from 'react';
import { useEffect, useState } from 'react';

import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { Coins as CoinsIcon } from '@phosphor-icons/react/dist/ssr/Coins';
import { EnvelopeSimple as EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { Hash as HashIcon } from '@phosphor-icons/react/dist/ssr/Hash';
import { SealPercent as SealPercentIcon } from '@phosphor-icons/react/dist/ssr/SealPercent';
import { StackPlus as StackPlusIcon } from '@phosphor-icons/react/dist/ssr/StackPlus';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import { Pencil } from '@phosphor-icons/react/dist/ssr';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';

import NotificationContext from '@/contexts/notification-context';
import { useRouter, useSearchParams } from 'next/navigation';
import PrintTagModal from './print-tag-modal';
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, parseE164Phone, formatToE164 } from '@/config/phone-countries';
import { useTranslation } from '@/contexts/locale-context';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Function to map payment methods to corresponding labels and icons
const getPaymentMethodDetails = (paymentMethod: string, tt: (vi: string, en: string) => string): { label: string, icon: any } => {
  switch (paymentMethod) {
    case 'cash':
      return { label: tt('Tiền mặt', 'Cash'), icon: <MoneyIcon /> };
    case 'transfer':
      return { label: tt('Chuyển khoản', 'Bank Transfer'), icon: <BankIcon /> };
    case 'napas247':
      return { label: tt('Napas 247', 'Napas 247'), icon: <LightningIcon /> };
    default:
      return { label: tt('Không xác định', 'Unknown'), icon: null };
  }
};

// Function to map created source to label
const getCreatedSource = (paymentMethod: string, tt: (vi: string, en: string) => string): { label: string } => {
  switch (paymentMethod) {
    case 'event_studio':
      return { label: tt('Event Studio', 'Event Studio') };
    case 'marketplace':
      return { label: tt('Marketplace', 'Marketplace') };
    case 'api':
      return { label: tt('API', 'API') };
    default:
      return { label: tt('Không xác định', 'Unknown') };
  }
};

// Function to map payment statuses to corresponding labels and colors
const getPaymentStatusDetails = (status: string, tt: (vi: string, en: string) => string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
    case 'waiting_for_payment':
      return { label: tt('Chờ thanh toán', 'Waiting for Payment'), color: 'warning' };
    case 'paid':
      return { label: tt('Đã thanh toán', 'Paid'), color: 'success' };
    case 'refund':
      return { label: tt('Đã hoàn tiền', 'Refunded'), color: 'secondary' };
    default:
      return { label: tt('Không xác định', 'Unknown'), color: 'default' };
  }
};

// Function to map row statuses to corresponding labels and colors
const getRowStatusDetails = (status: string, tt: (vi: string, en: string) => string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
    case 'normal':
      return { label: tt('Bình thường', 'Normal'), color: 'success' };
    case 'wait_for_response':
      return { label: tt('Đang chờ', 'Pending'), color: 'warning' };
    case 'customer_cancelled':
      return { label: tt('Huỷ bởi KH', 'Cancelled by Customer'), color: 'error' };
    case 'staff_locked':
      return { label: tt('Khoá bởi NV', 'Locked by Staff'), color: 'error' };
    default:
      return { label: tt('Không xác định', 'Unknown'), color: 'default' };
  }
};

const getSentEmailTicketStatusDetails = (status: string, tt: (vi: string, en: string) => string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
    case 'sent':
      return { label: tt('Đã xuất', 'Issued'), color: 'success' };
    case 'not_sent':
      return { label: tt('Chưa xuất', 'Not Issued'), color: 'default' };
    default:
      return { label: tt('Không xác định', 'Unknown'), color: 'default' };
  }
};


const getHistorySendingTypeDetails = (type: SendingType, tt: (vi: string, en: string) => string) => {
  switch (type) {
    case SendingType.TICKET:
      return tt('Gửi vé điện tử', 'Send E-ticket');
    case SendingType.PAYMENT_INSTRUCTION:
      return tt('Gửi hướng dẫn thanh toán', 'Send Payment Instruction');
    case SendingType.CANCEL_TICKET:
      return tt('Gửi thư huỷ vé', 'Send Cancellation Notice');
    case SendingType.EMAIL_MARKETING:
      return tt('Gửi email marketing', 'Send Marketing Email');
  }
};

const getHistorySendingChannelDetails = (channel: SendingChannel, tt: (vi: string, en: string) => string) => {
  switch (channel) {
    case SendingChannel.EMAIL:
      return tt('Email', 'Email');
    case SendingChannel.ZALO:
      return tt('Zalo', 'Zalo');
  }
};


interface Event {
  id: number;
  name: string;
  organizer: string;
  startDateTime: string | null;
  endDateTime: string | null;
  place: string | null;
  locationUrl: string | null;
  avatarUrl: string;
  slug: string;
  locationInstruction: string | null;
  timeInstruction: string | null;
};


export interface Ticket {
  id: number;             // Unique identifier for the ticket
  holderName: string;        // Name of the ticket holder
  holderPhone: string;        // Phone number of the ticket holder in E.164 format (e.g., +84333247242)
  holderEmail: string;        // Email of the ticket holder
  holderTitle: string;        // Title of the ticket holder
  holderAvatar: string | null;  // Avatar URL of the ticket holder
  eCode?: string;
  createdAt: string;   // The date the ticket was created
  checkInAt: string | null; // The date/time the ticket was checked in, nullable
  historyCheckIns: CheckInHistory[]; // List of check-in history
}

export interface Show {
  id: number;            // Unique identifier for the show
  name: string;          // Name of the show
}

export interface TicketCategory {
  id: number;            // Unique identifier for the ticket category
  name: string;          // Name of the ticket category
  show: Show;                       // Show information

  // type: string;        // Type of the ticket
  // price: number;       // Price of the ticket category
  // avatar: string | null; // Optional avatar URL for the category
  // quantity: number;    // Total available quantity of tickets
  // sold: number;        // Number of tickets sold
  // description: string | null; // Optional description of the ticket category
  // status: string;      // Current status of the ticket category
  // createdAt: string;   // The date the ticket category was created
  // updatedAt: string;   // The date the ticket category was last updated
}

export interface TransactionTicketCategory {
  netPricePerOne: number;           // Net price per ticket
  tickets: Ticket[];                 // Array of related tickets
  ticketCategory: TicketCategory; // Related show and ticket category information
  quantity: number;               // Quantity of tickets in the transaction
}

export interface Creator {
  id: number;                        // Unique identifier for the creator
  fullName: string;                 // Full name of the creator
  email: string;                    // Email of the creator
}

// Enum for SendingChannel
export enum SendingChannel {
  EMAIL = "email",
  ZALO = "zalo",
}

// Enum for SendingType
export enum SendingType {
  TICKET = 'ticket',
  PAYMENT_INSTRUCTION = 'payment_instruction',
  EMAIL_MARKETING = 'email_marketing',
  CANCEL_TICKET = 'cancel_ticket'
}

// Interface for HistorySendingCreatorResponse
export interface HistorySendingCreatorResponse {
  id: number;
  fullName: string; // Converted to camelCase based on alias_generator
  email: string;
}

// Interface for HistorySendingResponse
export interface HistorySending {
  id: number;
  channel: SendingChannel;
  type: SendingType;
  createdAt: string; // ISO 8601 string for datetime
  createdBy: number | null;
  creator: HistorySendingCreatorResponse | null;
}

export interface HistoryAction {
  id: number;
  content: string;
  createdAt: string; // ISO 8601 string for datetime
  createdBy: number | null;
  creator: HistorySendingCreatorResponse | null;
}

export interface CheckInHistory {
  id: number;
  type: 'check-in' | 'check-out';
  imageUrl: string | null;
  createdAt: string; // ISO 8601 string for datetime
  createdBy: number | null;
  creator: HistorySendingCreatorResponse;
}

export interface Transaction {
  id: number;                       // Unique identifier for the transaction
  eventId: number;                  // ID of the related event
  customerId: number;               // ID of the customer who made the transaction
  email: string;                    // Email of the customer
  name: string;                     // Name of the customer
  avatar: string | null;            // Avatar URL of the customer
  requireGuestAvatar: boolean;       // Whether to require guest avatar
  gender: string;                   // Gender of the customer
  title: string;                   // Gender of the customer
  phoneNumber: string;              // Customer's phone number in E.164 format (e.g., +84333247242)
  address: string | null;           // Customer's address, nullable
  dob: string | null;               // Date of birth, nullable
  transactionTicketCategories: TransactionTicketCategory[]; // List of ticket categories in the transaction
  ticketQuantity: number;           // Number of tickets purchased
  extraFee: number;                 // Extra fees for the transaction
  discount: number;                 // Discount applied to the transaction
  discountCode: string | null;      // Voucher code applied to the transaction, nullable
  totalAmount: number;              // Total amount for the transaction
  paymentMethod: string;            // Payment method used
  paymentStatus: string;            // Current status of the payment
  paymentOrderCode: number | null;  // Order code for the payment, nullable
  paymentDueDatetime: string | null; // Due date for the payment, nullable
  paymentCheckoutUrl: string | null; // URL for payment checkout, nullable
  paymentTransactionDatetime: string | null; // Date of the payment transaction, nullable
  note: string | null;              // Optional note for the transaction, nullable
  status: string;                   // Current status of the transaction
  createdBy: number | null;         // ID of the user who created the transaction, nullable
  createdAt: string;                // The date the transaction was created
  exportedTicketAt: string | null; // The date the transaction was created
  sentPaymentInstructionAt: string | null; // The date the transaction was created
  createdSource: string;            // Source of the transaction creation
  creator: Creator | null;          // Related creator of the transaction, nullable
  historySendings: HistorySending[];
  historyActions: HistoryAction[];
  cancelRequestStatus: string | null;
  event: Event;
  qrOption: string;
  eCode?: string;
  // Dynamic checkout form answers (ETIK Forms)
  formAnswers?: Record<string, any>;
}

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


export default function Page({ params }: { params: { event_id: number; transaction_id: number } }): React.JSX.Element {
  const { tt, locale } = useTranslation();
  React.useEffect(() => {
    document.title = tt("Chi tiết đơn hàng | ETIK - Vé điện tử & Quản lý sự kiện", "Order Details | ETIK - E-tickets & Event Management");
  }, [tt]);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const notificationCtx = React.useContext(NotificationContext);
  const { event_id, transaction_id } = params;
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: transaction?.name || '',
    title: transaction?.title || '',
    phoneNumber: transaction?.phoneNumber || '',
    phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2,
    address: transaction?.address || '',
    dob: transaction?.dob || null,
    status: ''
  });
  // grab ?checkInCode=… from the browser URL
  const searchParams = useSearchParams()
  const checkInCode = searchParams.get('checkInCode') || undefined
  const [selectedStatus, setSelectedStatus] = useState<string>(formData.status || '');
  const [editCategoryModalOpen, setEditCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<TransactionTicketCategory | null>(null);
  const [editingHolderInfos, setEditingHolderInfos] = useState<{ title: string; name: string; email: string; phone: string; phoneCountryIso2?: string; avatar?: string; }[]>([]);
  const [ticketMenuAnchorEl, setTicketMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeMenuTicket, setActiveMenuTicket] = useState<{ categoryIndex: number; ticketIndex: number } | null>(null);
  const [pendingHolderAvatarFiles, setPendingHolderAvatarFiles] = useState<Record<number, File>>({});
  const [requireGuestAvatar, setRequireGuestAvatar] = useState<boolean>(false);
  const [printTagModalOpen, setPrintTagModalOpen] = useState<boolean>(false);
  const [checkoutFormFields, setCheckoutFormFields] = useState<CheckoutRuntimeField[]>([]);
  const [checkoutCustomAnswers, setCheckoutCustomAnswers] = useState<Record<string, any>>({});

  const builtinInternalNames = React.useMemo(
    () => new Set(['name', 'email', 'phone_number', 'address', 'dob', 'idcard_number']),
    []
  );

  const customCheckoutFields = React.useMemo(
    () => checkoutFormFields.filter((f) => !builtinInternalNames.has(f.internal_name)),
    [checkoutFormFields, builtinInternalNames]
  );

  const router = useRouter(); // Use useRouter from next/navigation

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

  const handleHolderAvatarFile = (ticketId: number, file?: File) => {
    if (!file) return;
    try {
      // Create local preview URL
      const previewUrl = createLocalPreviewUrl(file);

      // Store the file for later upload
      setPendingHolderAvatarFiles(prev => ({ ...prev, [ticketId]: file }));

      // Update the holder info with preview URL
      setEditingHolderInfos(prev => {
        return prev.map((h, i) => {
          if (editingCategory?.tickets[i]?.id === ticketId) {
            return { ...h, avatar: previewUrl };
          }
          return h;
        });
      });
    } catch (error) {
      notificationCtx.error(error);
    }
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const updateTransaction = async () => {
    try {
      // Chuẩn bị formAnswers cho custom fields visible
      const formAnswers: Record<string, any> = {};
      checkoutFormFields.forEach((field) => {
        if (!field.visible) return;
        if (builtinInternalNames.has(field.internal_name)) return;
        formAnswers[field.internal_name] = checkoutCustomAnswers[field.internal_name];
      });

      const payload: any = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        phoneCountry: formData.phoneCountryIso2,
        phoneNationalNumber: formData.phoneNumber.replace(/\D/g, '').replace(/^0(?!$)/, ''),
        dob: formData.dob,
        title: formData.title,
        address: formData.address,
      };

      if (Object.keys(formAnswers).length > 0) {
        payload.formAnswers = formAnswers;
      }

      const response: AxiosResponse = await baseHttpServiceInstance.patch(
        `/event-studio/events/${params.event_id}/transactions/${params.transaction_id}`,
        payload
      );

      if (response.status === 200) {
        notificationCtx.success(tt('Thông tin đơn hàng đã được cập nhật thành công!', 'Order information has been updated successfully!'));
        setTransaction((prev) => {
          if (!prev) return prev;
          
          // Update formAnswers array with new values
          const prevFormAnswers = (prev as any).formAnswers;
          let updatedFormAnswers: any;
          
          if (Array.isArray(prevFormAnswers)) {
            // New format: array of objects
            updatedFormAnswers = prevFormAnswers.map((item: any) => {
              if (formAnswers.hasOwnProperty(item.internalName)) {
                return { ...item, value: formAnswers[item.internalName] };
              }
              return item;
            });
          } else {
            // Old format: dictionary
            updatedFormAnswers = {
              ...(prevFormAnswers || {}),
              ...formAnswers,
            };
          }
          
          return {
            ...prev,
            name: formData.name,
            phoneNumber: formData.phoneNumber,
            address: formData.address,
            dob: formData.dob,
            title: formData.title,
            formAnswers: updatedFormAnswers,
          };
        });
        
        // Also update local state
        setCheckoutCustomAnswers(prev => ({ ...prev, ...formAnswers }));
      }
    } catch (error) {
      notificationCtx.error(tt('Lỗi:', 'Error:'), error);
    }
  };

  // Fetch transaction details
  useEffect(() => {
    const fetchTransactionDetails = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<Transaction> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/transactions/${transaction_id}`,
          {
            params: checkInCode ? { checkInCode } : undefined,
          }
        );
        setTransaction(response.data);
        
        // Parse E.164 phone number to extract country and national number
        const parsedPhone = parseE164Phone(response.data?.phoneNumber);
        const defaultTitle = locale === 'en' ? 'Mx.' : 'Bạn';
        setFormData({
          title: (response.data?.title || '').trim() || defaultTitle,
          name: response.data?.name || '',
          phoneNumber: parsedPhone?.nationalNumber || '',
          phoneCountryIso2: parsedPhone?.countryCode || DEFAULT_PHONE_COUNTRY.iso2,
          dob: response.data?.dob || null,
          address: response.data?.address || '',
          status: '',
        });

        // Khởi tạo câu trả lời custom fields nếu có
        // Convert from structured array to dictionary for local state
        const formAnswersData = (response.data as any).formAnswers;
        const answersDict: Record<string, any> = {};
        if (Array.isArray(formAnswersData)) {
          // New format: array of objects
          formAnswersData.forEach((item: any) => {
            answersDict[item.internalName] = item.value;
          });
        } else if (formAnswersData && typeof formAnswersData === 'object') {
          // Old format: dictionary (backward compatibility)
          Object.assign(answersDict, formAnswersData);
        }
        setCheckoutCustomAnswers(answersDict);

        // Load requireGuestAvatar from transaction data
        setRequireGuestAvatar(response.data?.requireGuestAvatar || false);
      } catch (error) {
        notificationCtx.error(tt('Lỗi:', 'Error:'), error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [event_id, transaction_id]);

  // Fetch checkout form runtime configuration (Event Studio)
  useEffect(() => {
    const fetchCheckoutForm = async () => {
      if (!event_id) return;
      try {
        const resp: AxiosResponse<{ fields: CheckoutRuntimeField[] }> =
          await baseHttpServiceInstance.get(
            `/event-studio/events/${event_id}/forms/checkout/runtime`
          );
        setCheckoutFormFields(resp.data.fields || []);
      } catch (error) {
        console.error('Failed to load checkout form runtime', error);
      }
    };
    fetchCheckoutForm();
  }, [event_id]);


  const handleSetTransactionStatus = async (status: string) => {

    try {
      setIsLoading(true); // Optional: Show loading state
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/transactions/${transaction_id}/set-transaction-status`, { status },
        {}
      )

      // Optionally handle response
      if (response.status === 200) {
        notificationCtx.success(response.data.message);
        setTransaction((prev) => prev ? { ...prev, status } : prev);
      }
    } catch (error: any) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false); // Optional: Hide loading state
    }
  };


  const exportTicket = async () => {
    try {
      setIsLoading(true); // Optional: Show loading state
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/transactions/${transaction_id}/export-ticket`
      );

      // Optionally handle response
      if (response.status === 200) {
        notificationCtx.success(response.data.message);
        setTransaction((prev) => prev ? { ...prev, exportedTicketAt: '.' } : prev);
      }
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false); // Optional: Hide loading state
    }
  };


  const sendTransaction = async (channel: string | null) => {
    try {
      setIsLoading(true); // Optional: Show loading state
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/transactions/${transaction_id}/send-transaction`, channel ? { channel: channel } : {}
      );

      // Optionally handle response
      if (response.status === 200) {
        notificationCtx.success(response.data.message);
        setTransaction((prev) => prev ? { ...prev, exportedTicketAt: '.' } : prev);
      }
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false); // Optional: Hide loading state
    }
  };

  const sendTicket = async (channel: string | null) => {
    try {
      setIsLoading(true); // Optional: Show loading state
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/transactions/${transaction_id}/send-ticket`, channel ? { channel: channel } : {}
      );

      // Optionally handle response
      if (response.status === 200) {
        notificationCtx.success(response.data.message);
        setTransaction((prev) => prev ? { ...prev, exportedTicketAt: '.' } : prev);
      }
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false); // Optional: Hide loading state
    }
  };

  const resendInstructionNapas247Email = async () => {
    try {
      setIsLoading(true); // Optional: Show loading state
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/transactions/${transaction_id}/resend-payment-instruction-napas247-email`
      );

      // Optionally handle response
      if (response.status === 200) {
        notificationCtx.success(tt('Hướng dẫn thanh toán đã được gửi thành công!', 'Payment instruction has been sent successfully!'));
      }
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false); // Optional: Hide loading state
    }
  };

  const checkInAllTickets = async () => {
    try {
      setIsLoading(true);
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/transactions/${transaction_id}/check-in-all`
      );

      if (response.status === 200) {
        notificationCtx.success(response.data?.message || tt('Check-in tất cả vé thành công!', 'Check-in all tickets successfully!'));
        // Refetch transaction to get updated historyCheckIns
        const refreshResponse: AxiosResponse<Transaction> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/transactions/${transaction_id}`,
          {
            params: checkInCode ? { checkInCode } : undefined,
          }
        );
        setTransaction(refreshResponse.data);
      }
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkOutAllTickets = async () => {
    try {
      setIsLoading(true);
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/transactions/${transaction_id}/check-out-all`
      );

      if (response.status === 200) {
        notificationCtx.success(response.data?.message || tt('Check-out tất cả vé thành công!', 'Check-out all tickets successfully!'));
        // Refetch transaction to get updated historyCheckIns
        const refreshResponse: AxiosResponse<Transaction> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/transactions/${transaction_id}`,
          {
            params: checkInCode ? { checkInCode } : undefined,
          }
        );
        setTransaction(refreshResponse.data);
      }
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditCategoryModal = (category: TransactionTicketCategory) => {
    setEditingCategory(category);
    const infos = category.tickets.map((t) => {
      // Parse E.164 phone number to extract country and national number
      const parsedPhone = parseE164Phone(t.holderPhone);
      const defaultTitle = locale === 'en' ? 'Mx.' : 'Bạn';
      return {
        title: t.holderTitle || defaultTitle,
        name: t.holderName || '',
        email: t.holderEmail || '',
        phone: parsedPhone?.nationalNumber || '',
        phoneCountryIso2: parsedPhone?.countryCode || DEFAULT_PHONE_COUNTRY.iso2,
        avatar: t.holderAvatar || '',
      };
    });
    setEditingHolderInfos(infos);
    setPendingHolderAvatarFiles({});
    setEditCategoryModalOpen(true);
  };

  const handleOpenTicketMenu = (
    anchorEl: HTMLElement,
    categoryIndex: number,
    ticketIndex: number
  ) => {
    setTicketMenuAnchorEl(anchorEl);
    setActiveMenuTicket({ categoryIndex, ticketIndex });
  };

  const handleCloseTicketMenu = () => {
    setTicketMenuAnchorEl(null);
    setActiveMenuTicket(null);
  };

  const handleCheckInSpecificTicket = async () => {
    if (!activeMenuTicket || !transaction) return;
    const { categoryIndex, ticketIndex } = activeMenuTicket;
    const category = transaction.transactionTicketCategories[categoryIndex];
    const ticket = category?.tickets[ticketIndex];
    if (!ticket) return;
    try {
      setIsLoading(true);
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/transactions/${transaction_id}/check-in/${ticket.id}`
      );

      if (response.status === 200) {
        notificationCtx.success(response.data?.message || tt('Check-in thành công!', 'Check-in successful!'));
        // Refetch transaction to get updated historyCheckIns
        const refreshResponse: AxiosResponse<Transaction> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/transactions/${transaction_id}`,
          {
            params: checkInCode ? { checkInCode } : undefined,
          }
        );
        setTransaction(refreshResponse.data);
        handleCloseTicketMenu();
      }
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOutSpecificTicket = async () => {
    if (!activeMenuTicket || !transaction) return;
    const { categoryIndex, ticketIndex } = activeMenuTicket;
    const category = transaction.transactionTicketCategories[categoryIndex];
    const ticket = category?.tickets[ticketIndex];
    if (!ticket) return;
    try {
      setIsLoading(true);
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/transactions/${transaction_id}/check-out/${ticket.id}`
      );

      if (response.status === 200) {
        notificationCtx.success(response.data?.message || tt('Check-out thành công!', 'Check-out successful!'));
        // Refetch transaction to get updated historyCheckIns
        const refreshResponse: AxiosResponse<Transaction> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/transactions/${transaction_id}`,
          {
            params: checkInCode ? { checkInCode } : undefined,
          }
        );
        setTransaction(refreshResponse.data);
        handleCloseTicketMenu();
      }
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTicketHolders = async () => {
    if (!editingCategory) return;
    const hasInvalid = editingHolderInfos.some((h) => !h.title || !h.name);
    if (hasInvalid) {
      notificationCtx.warning(tt('Vui lòng điền đủ Danh xưng, Họ tên và SĐT cho mỗi vé.', 'Please fill in Title, Full Name, and Phone Number for each ticket.'));
      return;
    }
    try {
      setIsLoading(true);

      // Upload avatars to S3 if any pending
      const avatarUrls: Record<number, string> = {};
      for (const [ticketIdStr, file] of Object.entries(pendingHolderAvatarFiles)) {
        const ticketId = parseInt(ticketIdStr);
        const uploadedUrl = await uploadImageToS3(file);
        if (uploadedUrl) {
          avatarUrls[ticketId] = uploadedUrl;
        }
      }

      const payload = {
        tickets: editingCategory.tickets.map((ticket, index) => {
          const holder = editingHolderInfos[index];
          if (!holder) return null;
          
          // Derive NSN from phone number (strip leading '0' if present)
          const digits = holder.phone.replace(/\D/g, '');
          const phoneNSN = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
          
          return {
            id: ticket.id,
            holderTitle: holder.title,
            holderName: holder.name,
            holderPhone: holder.phone,
            holderPhoneCountry: holder.phoneCountryIso2,
            holderPhoneNationalNumber: phoneNSN,
            holderAvatar: avatarUrls[ticket.id] || holder.avatar || null,
          };
        }).filter(Boolean),
      };
      await baseHttpServiceInstance.patch(
        `/event-studio/events/${event_id}/transactions/${transaction_id}/update-ticket-holders`,
        payload
      );
      
      // Update transaction state with E.164 formatted phone numbers
      setTransaction((prev) => {
        if (!prev) return prev;
        const updatedCategories = prev.transactionTicketCategories.map((cat) => {
          if (cat.ticketCategory.id !== (editingCategory?.ticketCategory.id || 0)) return cat;
          return {
            ...cat,
            tickets: cat.tickets.map((t, i) => {
              const holder = editingHolderInfos[i];
              if (!holder) return t;
              
              // Format phone to E.164
              const e164Phone = formatToE164(holder.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2, holder.phone.replace(/\D/g, '').replace(/^0+/, ''));
              
              return {
                ...t,
                holderTitle: holder.title || t.holderTitle,
                holderName: holder.name || t.holderName,
                holderPhone: e164Phone || t.holderPhone,
                holderAvatar: avatarUrls[t.id] || holder.avatar || t.holderAvatar,
              };
            }),
          };
        });
        return { ...prev, transactionTicketCategories: updatedCategories };
      });
      
      notificationCtx.success(tt('Cập nhật thông tin vé thành công!', 'Ticket information updated successfully!'));
      setEditCategoryModalOpen(false);
      setPendingHolderAvatarFiles({});
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTransactionPaidStatus = async (eventId: number, transactionId: number) => {
    try {
      const response: AxiosResponse = await baseHttpServiceInstance.put(
        `/event-studio/events/${eventId}/transactions/${transactionId}/set-paid-for-transaction`
      );

      if (response.status === 200) {
        notificationCtx.success(tt('Trạng thái đơn hàng đã được chuyển sang "Đã thanh toán" thành công!', 'Transaction status has been changed to "Paid" successfully!'));
        setTransaction((prev) => prev ? { ...prev, paymentStatus: 'paid' } : prev);
      }
    } catch (error) {
      notificationCtx.error(error);
    }
  };


  const setTransactionRefundStatus = async (eventId: number, transactionId: number) => {
    try {
      const response: AxiosResponse = await baseHttpServiceInstance.put(
        `/event-studio/events/${eventId}/transactions/${transactionId}/set-refund-for-transaction`
      );

      if (response.status === 200) {
        notificationCtx.success(tt('Trạng thái đơn hàng đã được chuyển sang "Đã hoàn tiền" thành công!', 'Transaction status has been changed to "Refunded" successfully!'));
        setTransaction((prev) => prev ? { ...prev, paymentStatus: 'refund' } : prev);
      }
    } catch (error) {
      notificationCtx.error(tt('Có lỗi xảy ra khi cập nhật trạng thái hoàn tiền:', 'An error occurred while updating refund status:'), error);
    }
  };

  const handleProcessCancelRequestStatus = async (transactionId: number, eventId: number, decision: 'accept' | 'reject') => {

    try {
      setIsLoading(true);

      // Call API
      await baseHttpServiceInstance.post(`/event-studio/events/${eventId}/transactions/${transactionId}/process-cancel-request`, {}, {
        params: { decision },
      });

      // Notify success
      if (decision === 'accept') {
        notificationCtx.success(tt('Đã chấp nhận yêu cầu hủy đơn hàng.', 'Cancel request has been accepted.'));
        setTransaction(transaction ? { ...transaction, cancelRequestStatus: 'accepted', status: 'customer_cancelled' } : transaction)

      } else {
        notificationCtx.success(tt('Đã từ chối yêu cầu hủy đơn hàng.', 'Cancel request has been rejected.'));
        setTransaction(transaction ? { ...transaction, cancelRequestStatus: 'rejected' } : transaction)

      }
    } catch (error) {
      // Handle error
      notificationCtx.error(error || tt('Đã xảy ra lỗi, vui lòng thử lại.', 'An error occurred, please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPhoneCountry = React.useMemo(() => {
    return PHONE_COUNTRIES.find(c => c.iso2 === formData.phoneCountryIso2) || DEFAULT_PHONE_COUNTRY;
  }, [formData.phoneCountryIso2]);

  if (!transaction) {
    return <Typography>{tt('Đang tải...', 'Loading...')}</Typography>;
  }

  const paymentMethodDetails = getPaymentMethodDetails(transaction.paymentMethod, tt);
  const paymentStatusDetails = getPaymentStatusDetails(transaction.paymentStatus, tt);
  const statusDetails = getRowStatusDetails(transaction.status, tt);
  const createdSource = getCreatedSource(transaction.createdSource, tt);

  return (
    <>
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
      <div>
        <Typography variant="h4">{tt('Chi tiết đơn hàng của', 'Order Details for')} {transaction.name}</Typography>
      </div>
      <Grid container spacing={3}>
        <Grid lg={5} md={5} xs={12} spacing={3}>
          <Stack spacing={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <Stack direction="column" spacing={2}>
                  <Stack direction="row" spacing={2} style={{ alignItems: 'center' }}>
                    <div>
                      {transaction.event.avatarUrl ?
                        <Box component="img" src={transaction.event.avatarUrl} style={{ height: '80px', width: '80px', borderRadius: '50%' }} />
                        :
                        <Avatar sx={{ height: '80px', width: '80px', fontSize: '2rem' }}>
                          {(transaction.event.name[0] ?? 'a').toUpperCase()}
                        </Avatar>}
                    </div>
                    <Typography variant="h5" sx={{ width: '100%', textAlign: 'center' }}>
                      {transaction.event.name}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <HouseLine fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {tt('Đơn vị tổ chức:', 'Organizer:')} {transaction.event.organizer}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Clock fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {transaction.event.startDateTime && transaction.event.endDateTime
                        ? `${dayjs(transaction.event.startDateTime || 0).format('HH:mm DD/MM/YYYY')} - ${dayjs(transaction.event.endDateTime || 0).format('HH:mm DD/MM/YYYY')}`
                        : tt('Chưa xác định', 'Not specified')} {transaction.event.timeInstruction ? `(${transaction.event.timeInstruction})` : ''}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <MapPin fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {transaction.event.place ? transaction.event.place : tt('Chưa xác định', 'Not specified')} {transaction.event.locationInstruction ? `(${transaction.event.locationInstruction})` : ''}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            <Card>
              <CardHeader title={tt('Thanh toán', 'Payment')} />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">{tt('Trạng thái đơn:', 'Order Status:')}</Typography>
                    <Stack spacing={0} direction={'row'}>
                      <Chip color={statusDetails.color} label={statusDetails.label} />
                      {transaction.cancelRequestStatus == 'pending' &&
                        <Tooltip title={
                          <Typography>{tt('Khách hàng yêu cầu hủy', 'Customer requested cancellation')}</Typography>
                        }>
                          <Chip color={'error'} label={<WarningCircle size={16} />} />
                        </Tooltip>
                      }
                    </Stack>

                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">{tt('Phương thức thanh toán:', 'Payment Method:')}</Typography>
                    <Chip icon={paymentMethodDetails.icon} label={paymentMethodDetails.label} />
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">{tt('Trạng thái thanh toán:', 'Payment Status:')}</Typography>
                    <Chip label={paymentStatusDetails.label} color={paymentStatusDetails.color} />
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">{tt('Trạng thái xuất vé:', 'Ticket Issued Status:')}</Typography>
                    <Chip
                      color={getSentEmailTicketStatusDetails(transaction?.exportedTicketAt ? 'sent' : 'not_sent', tt).color}
                      label={getSentEmailTicketStatusDetails(transaction?.exportedTicketAt ? 'sent' : 'not_sent', tt).label}
                    />
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">{tt('Tổng số tiền:', 'Total Amount:')}</Typography>
                    <Chip
                      icon={<MoneyIcon />}
                      label={`${transaction.totalAmount.toLocaleString()} VND`}
                      color="success"
                    />
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
            <Card>
              <CardHeader title={tt('Hành động', 'Actions')} />
              <Divider />
              <CardContent>
                <Stack spacing={3}>
                  {transaction.cancelRequestStatus === 'pending' &&
                    <>
                      <Typography variant='body2' color={'error'} sx={{ fontWeight: 'bold' }}>
                        {tt('Khách hàng yêu cầu hủy đơn hàng:', 'Customer requested order cancellation:')}
                      </Typography>
                      <Stack spacing={2} direction={'row'}>
                        <Button
                          onClick={() => handleProcessCancelRequestStatus(transaction.id, event_id, 'reject')}
                          size="small"
                        >
                          {tt('Từ chối hủy', 'Reject Cancellation')}
                        </Button>
                        <Button
                          onClick={() => handleProcessCancelRequestStatus(transaction.id, event_id, 'accept')}
                          size="small"
                          color='error'
                          startIcon={<Check />}
                        >
                          {tt('Chấp nhận hủy', 'Accept Cancellation')}
                        </Button>
                      </Stack>
                      <Divider />
                    </>

                  }
                  {transaction.status === 'wait_for_response' &&
                    <Stack spacing={2} direction={'row'}>
                      <Button onClick={() => handleSetTransactionStatus('normal')} size="small" startIcon={<Check />}>
                        {tt('Phê duyệt đơn hàng', 'Approve Order')}
                      </Button>
                      <Button onClick={() => handleSetTransactionStatus('staff_locked')} size="small" startIcon={<X />}>
                        {tt('Từ chối đơn hàng', 'Reject Order')}
                      </Button>
                    </Stack>
                  }
                  {transaction.status === 'normal' && transaction.paymentStatus === 'paid' && transaction.exportedTicketAt == null && (
                    <>
                      <Stack spacing={1} direction={'row'} flexWrap={'wrap'}>
                        <Button onClick={() => exportTicket()} size="small" startIcon={<TicketIcon />}>
                          {tt('Xuất vé', 'Export Tickets')}
                        </Button>
                      </Stack>
                    </>
                  )}
                  {transaction.status === 'normal' && transaction.paymentStatus === 'paid' && transaction.exportedTicketAt != null && (
                    <>
                      <Stack spacing={0} direction={'row'} flexWrap={'wrap'}>
                        {transaction.qrOption === 'shared' && (
                          <>
                            <Button onClick={() => sendTransaction('email')} size="small" startIcon={<EnvelopeSimpleIcon />}>
                              {tt('Gửi Email đơn hàng', 'Send Order Email')}
                            </Button>
                            <Button onClick={() => sendTransaction('zalo')} size="small" startIcon={<EnvelopeSimpleIcon />}>
                              {tt('Gửi Zalo đơn hàng', 'Send Order via Zalo')}
                            </Button>
                          </>
                        )}
                        {transaction.qrOption === 'separate' && (
                          <>
                            <Button onClick={() => sendTransaction('email')} size="small" startIcon={<EnvelopeSimpleIcon />}>
                              {tt('Gửi Email cho người đại diện (ng.mua)', 'Send Email to Representative (Buyer)')}
                            </Button>
                            <Button onClick={() => sendTicket('email')} size="small" startIcon={<EnvelopeSimpleIcon />}>
                              {tt('Gửi Email cho từng người sở hữu', 'Send Email to Each Ticket Holder')}
                            </Button>
                            <Button onClick={() => sendTicket('zalo')} size="small" startIcon={<EnvelopeSimpleIcon />}>
                              {tt('Gửi Zalo cho từng người sở hữu', 'Send Zalo to Each Ticket Holder')}
                            </Button>
                          </>
                        )}

                        <Button
                          onClick={() => window.open(`/event-studio/events/${event_id}/transactions/${transaction_id}/invitation-letter`, '_blank')}
                          size="small"
                          startIcon={<ImageSquare />} // Icon for document-like invitation letter
                        >
                          {tt('Xem ảnh thư mời', 'View Invitation Letter')}
                        </Button>
                        <Button
                          onClick={() => setPrintTagModalOpen(true)}
                          size="small"
                          startIcon={<Printer />}
                        >
                          {tt('In tag vé', 'Print Ticket Tags')}
                        </Button>
                      </Stack>
                    </>
                  )}
                  {transaction.status === 'normal' && transaction.paymentStatus === 'paid' && transaction.exportedTicketAt != null && (
                    <Stack spacing={2} direction={'row'}>
                      <Button size="small" startIcon={<SignIn />} onClick={checkInAllTickets}>
                        {tt('Check-in tất cả vé', 'Check-in All Tickets')}
                      </Button>
                      <Button size="small" startIcon={<SignOut />} onClick={checkOutAllTickets}>
                        {tt('Check-out tất cả vé', 'Check-out All Tickets')}
                      </Button>
                    </Stack>
                  )}

                  <Stack spacing={2} direction={'row'}>
                    {transaction.status === 'normal' &&
                      transaction.paymentMethod === 'napas247' &&
                      transaction.paymentStatus === 'waiting_for_payment' && (
                        <>
                          <Button onClick={resendInstructionNapas247Email}
                            size="small"
                            startIcon={<EnvelopeSimpleIcon />}
                          >
                            {tt('Gửi Hướng dẫn thanh toán qua Email', 'Send Payment Instruction via Email')}
                          </Button>
                          <Button onClick={resendInstructionNapas247Email}
                            size="small"
                            startIcon={<EnvelopeSimpleIcon />}
                          >
                            {tt('Gửi Hướng dẫn thanh toán qua Zalo', 'Send Payment Instruction via Zalo')}
                          </Button>
                        </>
                      )}
                    {transaction.status === 'normal' &&
                      transaction.paymentMethod !== 'napas247' &&
                      transaction.paymentStatus === 'waiting_for_payment' && (
                        <Button
                          onClick={() => setTransactionPaidStatus(params.event_id, params.transaction_id)}
                          size="small"
                          startIcon={<EnvelopeSimpleIcon />}
                        >
                          {tt('Chuyển trạng thái "Đã thanh toán"', 'Change Status to "Paid"')}
                        </Button>
                      )}

                    {(transaction.status === 'staff_locked' || transaction.status === 'customer_cancelled') &&
                      transaction.paymentStatus === 'paid' && (
                        <Button
                          onClick={() => setTransactionRefundStatus(params.event_id, params.transaction_id)}
                          size="small"
                          startIcon={<EnvelopeSimpleIcon />}
                        >
                          {tt('Hoàn tiền đơn hàng', 'Refund Order')}
                        </Button>
                      )}
                  </Stack>
                  <Grid container spacing={3}>
                    <Grid md={10} xs={9}>
                      <FormControl size='small' fullWidth>
                        <InputLabel>{tt('Hủy đơn hàng', 'Cancel Order')}</InputLabel>
                        <Select
                          label={tt('Hủy đơn hàng', 'Cancel Order')}
                          name="status"
                          value={selectedStatus}
                          onChange={(event) => setSelectedStatus(event.target.value)}
                        >
                          {transaction.status === 'wait_for_response' && (
                            <MenuItem value="normal">{tt('Phê duyệt đơn hàng', 'Approve Order')}</MenuItem>
                          )}
                          <MenuItem value="customer_cancelled">{tt('Huỷ bởi Khách hàng', 'Cancelled by Customer')}</MenuItem>
                          <MenuItem value="staff_locked">{tt('Khoá bởi Nhân viên', 'Locked by Staff')}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid md={2} xs={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        onClick={() => handleSetTransactionStatus(selectedStatus)}
                        disabled={!selectedStatus} // Disable if no status is selected
                      >
                        {tt('Lưu', 'Save')}
                      </Button>
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            {transaction.paymentMethod === 'napas247' && (
              <Card>
                <CardHeader title={tt('Chi tiết thanh toán Napas 247', 'Napas 247 Payment Details')} />
                <Divider />
                <CardContent>
                  <Stack spacing={2}>
                    <Grid container justifyContent="space-between">
                      <Typography variant="body1">{tt('Payment order code:', 'Payment order code:')}</Typography>
                      <Typography variant="body1">{transaction.paymentOrderCode}</Typography>
                    </Grid>
                    {transaction.paymentStatus === 'waiting_for_payment' && (
                      <>
                        <Grid container justifyContent="space-between">
                          <Typography variant="body1">{tt('Hạn thanh toán:', 'Payment Deadline:')}</Typography>
                          <Typography variant="body1">
                            {dayjs(transaction.paymentDueDatetime || 0).format('HH:mm:ss DD/MM/YYYY')}
                          </Typography>
                        </Grid>
                        <Grid container justifyContent="space-between">
                          <Typography variant="body1">{tt('Trang thanh toán:', 'Payment Page:')}</Typography>
                          <Typography variant="body1">
                            <Button
                              component={LocalizedLink}
                              href={transaction.paymentCheckoutUrl || ''}
                              size="small"
                              startIcon={<LightningIcon />}
                            >
                              {tt('Đến trang thanh toán', 'Go to Payment Page')}
                            </Button>
                          </Typography>
                        </Grid>
                      </>
                    )}
                    {transaction.paymentStatus === 'paid' && (
                      <Grid container justifyContent="space-between">
                        <Typography variant="body1">{tt('Thời gian thanh toán:', 'Payment Time:')}</Typography>
                        <Typography variant="body1">
                          {dayjs(transaction.paymentTransactionDatetime || 0).format('HH:mm:ss DD/MM/YYYY')}
                        </Typography>
                      </Grid>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader title={tt('Thông tin khác', 'Other Information')} />
              <Divider />
              <CardContent>
                <Stack spacing={0}>
                  {/* createdAt */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{tt('Thời gian khởi tạo:', 'Created At:')}</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {dayjs(transaction.createdAt).format('HH:mm:ss DD/MM/YYYY')}
                    </Typography>
                  </Grid>
                  {/* Created source */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{tt('Người khởi tạo:', 'Created By:')}</Typography>
                    </Stack>
                    <Typography variant="body1">{transaction.creator?.fullName || tt('Không có thông tin', 'No information')}</Typography>
                  </Grid>
                  {/* Created source */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{tt('Nguồn khởi tạo:', 'Created Source:')}</Typography>
                    </Stack>
                    <Typography variant="body1">{createdSource.label || tt('Chưa xác định', 'Not specified')}</Typography>
                  </Grid>
                  {/* sentPaymentInstructionAt */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{tt('Thời gian gửi hướng dẫn t.toán:', 'Payment Instruction Sent At:')}</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {transaction.sentPaymentInstructionAt ? dayjs(transaction.sentPaymentInstructionAt).format('HH:mm:ss DD/MM/YYYY') : tt("Chưa gửi", "Not sent")}
                    </Typography>
                  </Grid>
                  {/* createdAt */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{tt('Thời gian xuất vé:', 'Tickets Exported At:')}</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {transaction.exportedTicketAt ? dayjs(transaction.exportedTicketAt).format('HH:mm:ss DD/MM/YYYY') : tt("Chưa gửi", "Not sent")}
                    </Typography>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
        <Grid lg={7} md={7} xs={12} spacing={3}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title={tt('Thông tin người mua vé', 'Buyer Information')} />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  {/* Built-in fields driven by checkout runtime config */}
                  {(() => {
                    const nameCfg = checkoutFormFields.find((f) => f.internal_name === 'name');
                    const visible = !!nameCfg && nameCfg.visible;
                    const label = nameCfg?.label || tt('Danh xưng*  Họ và tên', 'Title* Full Name');
                    return (
                      visible && (
                        <Grid md={6} xs={12}>
                          <FormControl fullWidth required>
                            <InputLabel htmlFor="customer-name">{label}</InputLabel>
                            <OutlinedInput
                              id="customer-name"
                              name="name"
                              value={formData.name}
                              onChange={(event) => handleFormChange(event)}
                              label={label}
                              startAdornment={
                                <InputAdornment position="start">
                                  <Select
                                    variant="standard"
                                    disableUnderline
                                    value={formData.title || (locale === 'en' ? 'Mx.' : 'Bạn')}
                                    onChange={(event) =>
                                      setFormData({ ...formData, title: event.target.value })
                                    }
                                    sx={{ minWidth: 70 }}
                                  >
                                    {['Anh','Chị','Bạn','Em','Ông','Bà','Cô','Mr.','Ms.','Mx.','Miss','Thầy'].map((title) => (
                                      <MenuItem key={title} value={title}>{title}</MenuItem>
                                    ))}
                                  </Select>
                                </InputAdornment>
                              }
                            />
                          </FormControl>
                        </Grid>
                      )
                    );
                  })()}

                  {(() => {
                    const emailCfg = checkoutFormFields.find((f) => f.internal_name === 'email');
                    const visible = !!emailCfg && emailCfg.visible;
                    const label = emailCfg?.label || tt('Email', 'Email');
                    return (
                      visible && (
                        <Grid md={6} xs={12}>
                          <FormControl fullWidth required>
                            <InputLabel>{label}</InputLabel>
                            <OutlinedInput value={transaction.email} disabled label={label} />
                          </FormControl>
                        </Grid>
                      )
                    );
                  })()}

                  {(() => {
                    const phoneCfg = checkoutFormFields.find((f) => f.internal_name === 'phone_number');
                    const visible = !!phoneCfg && phoneCfg.visible;
                    const label = phoneCfg?.label || tt('Số điện thoại', 'Phone Number');
                    return (
                      visible && (
                        <Grid md={6} xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>{label}</InputLabel>
                            <OutlinedInput
                              value={formData.phoneNumber}
                              onChange={(event: any) => handleFormChange(event)}
                              name="phoneNumber"
                              label={label}
                              startAdornment={
                                <InputAdornment position="start">
                                  <Select
                                    variant="standard"
                                    disableUnderline
                                    value={formData.phoneCountryIso2}
                                    onChange={(event) =>
                                      setFormData({ ...formData, phoneCountryIso2: event.target.value })
                                    }
                                    sx={{ minWidth: 80 }}
                                    renderValue={(value) => {
                                      const country = PHONE_COUNTRIES.find(c => c.iso2 === value) || DEFAULT_PHONE_COUNTRY;
                                      return country.dialCode;
                                    }}
                                  >
                                    {PHONE_COUNTRIES.map((country) => (
                                      <MenuItem key={country.iso2} value={country.iso2}>
                                        {country.nameVi} ({country.dialCode})
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </InputAdornment>
                              }
                            />
                          </FormControl>
                        </Grid>
                      )
                    );
                  })()}

                  {(() => {
                    const dobCfg = checkoutFormFields.find((f) => f.internal_name === 'dob');
                    const visible = !!dobCfg && dobCfg.visible;
                    const label = dobCfg?.label || tt('Ngày tháng năm sinh', 'Date of Birth');
                    return (
                      visible && (
                        <Grid md={6} xs={12}>
                          <FormControl fullWidth required={!!dobCfg?.required}>
                            <InputLabel shrink>{label}</InputLabel>
                            <OutlinedInput
                              label={label}
                              name="dob"
                              type="date"
                              value={formData.dob}
                              onChange={(event: any) => handleFormChange(event)}
                              inputProps={{ max: new Date().toISOString().slice(0, 10) }}
                            />
                          </FormControl>
                        </Grid>
                      )
                    );
                  })()}

                  {(() => {
                    const addrCfg = checkoutFormFields.find((f) => f.internal_name === 'address');
                    const visible = !!addrCfg && addrCfg.visible;
                    const label = addrCfg?.label || tt('Địa chỉ', 'Address');
                    return (
                      visible && (
                        <Grid md={12} xs={12}>
                          <FormControl fullWidth required={!!addrCfg?.required}>
                            <InputLabel>{label}</InputLabel>
                            <OutlinedInput
                              value={formData.address}
                              onChange={(event: any) => handleFormChange(event)}
                              name="address"
                              label={label}
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
                    const label = idCfg?.label || tt('Căn cước công dân', 'ID Card Number');
                    return (
                      visible && (
                        <Grid md={12} xs={12}>
                          <FormControl fullWidth required={!!idCfg?.required}>
                            <InputLabel>{label}</InputLabel>
                            <OutlinedInput
                              value={(transaction as any).idcardNumber || ''}
                              disabled
                              label={label}
                            />
                          </FormControl>
                        </Grid>
                      )
                    );
                  })()}

                  {/* Custom checkout fields (visible only, editable in Event Studio) */}
                  {customCheckoutFields.map((field) => {
                    const rawValue = checkoutCustomAnswers[field.internal_name];

                    return (
                      <Grid key={field.internal_name} xs={12}>
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
                              value={rawValue ?? ''}
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
                              value={rawValue ?? ''}
                              onChange={(e) =>
                                setCheckoutCustomAnswers((prev) => ({
                                  ...prev,
                                  [field.internal_name]: e.target.value,
                                }))
                              }
                            />
                          )}

                          {field.field_type === 'radio' && field.options && (
                            <FormGroup>
                              <RadioGroup
                                value={rawValue ?? ''}
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
                            </FormGroup>
                          )}

                          {field.field_type === 'checkbox' && field.options && (
                            <FormGroup>
                              {field.options.map((opt) => {
                                const current: string[] = Array.isArray(rawValue) ? rawValue : [];
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
                                            const prevArr: string[] = prev[field.internal_name] ?? [];
                                            let nextArr: string[];
                                            if (e.target.checked) {
                                              nextArr = Array.from(new Set([...prevArr, opt.value]));
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

                          {!['text', 'number', 'date', 'time', 'datetime', 'radio', 'checkbox'].includes(
                            field.field_type
                          ) && (
                            <Typography variant="body2">{rawValue ?? '—'}</Typography>
                          )}
                        </Stack>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
              <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  onClick={updateTransaction}
                  >
                  {tt('Lưu', 'Save')}
                </Button>
              </CardActions>
            </Card>

            <Card>
              <CardHeader
                title={tt(`Danh sách vé: ${transaction.ticketQuantity} vé`, `Ticket List: ${transaction.ticketQuantity} tickets`)}
                action={
                  transaction.qrOption === 'shared' && requireGuestAvatar && (
                    <Avatar src={transaction.avatar || ''} sx={{ width: 36, height: 36 }} />
                  )
                }
              />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  {/* Loop through each transactionShowTicketCategory */}
                  {transaction.transactionTicketCategories.map((transactionTicketCategory, categoryIndex) => (
                    <div key={categoryIndex}>
                      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <TicketIcon fontSize="var(--icon-fontSize-md)" />
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{transactionTicketCategory.ticketCategory.show.name} - {transactionTicketCategory.ticketCategory.name}</Typography>
                        <IconButton size="small" sx={{ ml: 1, alignSelf: 'flex-start' }} onClick={() => openEditCategoryModal(transactionTicketCategory)}><Pencil /></IconButton>
                        </Stack>
                        <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                          <Typography variant="body2">{formatPrice(transactionTicketCategory.netPricePerOne || 0)}</Typography>
                          <Typography variant="body2">x {transactionTicketCategory.tickets.length}</Typography>
                          <Typography variant="body2">= {formatPrice((transactionTicketCategory.netPricePerOne || 0) * transactionTicketCategory.tickets.length)}</Typography>
                        </Stack>
                      </Stack>
                      {transactionTicketCategory.tickets.length > 0 && (
                        <Stack spacing={2}>
                          {transactionTicketCategory.tickets.map((ticket, ticketIndex) => (
                            <Stack direction="row" spacing={0} alignItems="center">
                              {requireGuestAvatar && transaction.qrOption === 'separate' && <Avatar src={ticket.holderAvatar || ''} sx={{ width: 32, height: 32 }} />}
                              <Box key={ticketIndex} sx={{ ml: 3, pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
                                  <>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      <div>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                          {ticketIndex + 1}. {ticket.holderName ? `${ticket.holderTitle || ''} ${ticket.holderName}`.trim() : tt('Chưa có thông tin', 'No information')}
                                        </Typography>
                                        {transaction.qrOption === 'separate' && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                          {(() => {
                                            const email = ticket.holderEmail || tt('Chưa có email', 'No email');
                                            if (!ticket.holderPhone) {
                                              return `${email} - ${tt('Chưa có SĐT', 'No phone number')}`;
                                            }
                                            // Parse E.164 phone to get country code and national number
                                            const parsedPhone = parseE164Phone(ticket.holderPhone);
                                            if (parsedPhone) {
                                              const country = PHONE_COUNTRIES.find(c => c.iso2 === parsedPhone.countryCode) || DEFAULT_PHONE_COUNTRY;
                                              return `${email} - ${country.dialCode} ${parsedPhone.nationalNumber}`;
                                            }
                                            return `${email} - ${ticket.holderPhone}`;
                                          })()}
                                        </Typography>
                                        )}
                                      </div>
                                    </Stack>
                                  </>
                                <div>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>TID-{ticket.id} {ticket.checkInAt ? tt(`Check-in lúc ${dayjs(ticket.checkInAt || 0).format('HH:mm:ss DD/MM/YYYY')}`, `Checked in at ${dayjs(ticket.checkInAt || 0).format('HH:mm:ss DD/MM/YYYY')}`) : tt('Chưa check-in', 'Not checked in')}</Typography>
                                  <IconButton size="small" sx={{ ml: 2 }} onClick={(e) => handleOpenTicketMenu(e.currentTarget, categoryIndex, ticketIndex)}>
                                    <DotsThreeOutline />
                                  </IconButton>
                                </div>
                              </Box>
                            </Stack>
                          ))}
                        </Stack>
                      )}
                      <Menu
                        anchorEl={ticketMenuAnchorEl}
                        open={Boolean(ticketMenuAnchorEl)}
                        onClose={handleCloseTicketMenu}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                      >
                        {/* <MenuItem onClick={handleCloseTicketMenu} sx={{ fontSize: '14px', color: 'primary' }}>
                          <EnvelopeSimpleIcon style={{ marginRight: 8 }} /> Gửi vé qua Email
                        </MenuItem>
                        <MenuItem onClick={handleCloseTicketMenu} sx={{ fontSize: '14px', color: 'primary' }}>
                          <DeviceMobile style={{ marginRight: 8 }} /> Gửi vé qua Zalo
                        </MenuItem> */}
                          <MenuItem disabled={!!isLoading || !!(activeMenuTicket && (() => {
                            const ticket = transaction.transactionTicketCategories[activeMenuTicket.categoryIndex]?.tickets[activeMenuTicket.ticketIndex];
                            if (!ticket) return true;
                            const latestCheckIn = ticket.historyCheckIns && ticket.historyCheckIns.length > 0 
                              ? ticket.historyCheckIns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
                              : null;
                            return latestCheckIn?.type === 'check-in';
                          })())} onClick={handleCheckInSpecificTicket} sx={{ fontSize: '14px', color: 'primary' }}>
                            <Check style={{ marginRight: 8 }} /> Check-in
                          </MenuItem>
                          <MenuItem disabled={!!isLoading || !!(activeMenuTicket && (() => {
                            const ticket = transaction.transactionTicketCategories[activeMenuTicket.categoryIndex]?.tickets[activeMenuTicket.ticketIndex];
                            if (!ticket) return true;
                            const latestCheckIn = ticket.historyCheckIns && ticket.historyCheckIns.length > 0 
                              ? ticket.historyCheckIns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
                              : null;
                            return !latestCheckIn || latestCheckIn.type !== 'check-in';
                          })())} onClick={handleCheckOutSpecificTicket} sx={{ fontSize: '14px', color: 'primary' }}>
                            <SignOut style={{ marginRight: 8 }} /> Check-out
                          </MenuItem>
                      </Menu>
                    </div>
                  ))}
                  {/* Additional details for this category */}
                  <Divider sx={{ marginY: 2 }} />
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <StackPlusIcon fontSize="var(--icon-fontSize-md)" />
                      <Typography variant="body1">{tt('Phụ phí:', 'Extra Fee:')}</Typography>
                    </Stack>
                    <Typography variant="body1">{formatPrice(transaction.extraFee || 0)}</Typography>
                  </Grid>

                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <SealPercentIcon fontSize="var(--icon-fontSize-md)" />
                      <Typography variant="body1">{tt('Giảm giá:', 'Discount:')}</Typography>
                    </Stack>
                    <Stack spacing={1} direction={'column'} sx={{ alignItems: 'flex-end' }}>
                      <Typography variant="body1">{formatPrice(transaction.discount || 0)}</Typography>
                      {transaction.discountCode && (
                        <Typography variant="caption" color="text.secondary">
                          {tt('Mã khuyến mãi:', 'Voucher code:')} {transaction.discountCode}
                        </Typography>
                      )}
                    </Stack>
                  </Grid>

                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <CoinsIcon fontSize="var(--icon-fontSize-md)" />
                      <Typography variant="body1">{tt('Thành tiền:', 'Total Amount:')}</Typography>
                    </Stack>
                    <Typography variant="body1">{formatPrice(transaction.totalAmount || 0)}</Typography>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title={tt('Tùy chọn bổ sung', 'Additional Options')} />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid xs>
                      <Typography variant="body2">{tt('Ảnh đại diện cho khách mời', 'Guest Avatar')}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {tt('Bạn cần tải lên ảnh đại diện cho khách mời.', 'You need to upload an avatar for guests.')}
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
                </Stack>

              </CardContent>
            </Card>
            <Card>
              <CardHeader title={tt('Lịch sử gửi', 'Sending History')} subheader={tt('Lịch sử gửi email và gửi Zalo đến khách hàng', 'History of sending emails and Zalo messages to customers')} />
              <Divider />
              <CardContent sx={{ overflow: 'auto', padding: 0, maxHeight: 300 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {/* <TableCell sx={{ width: '20px' }}></TableCell> */}
                      <TableCell>{tt('Thời gian', 'Time')}</TableCell>
                      <TableCell sx={{ minWidth: '200px' }}>{tt('Nội dung', 'Content')}</TableCell>
                      <TableCell>{tt('Kênh', 'Channel')}</TableCell>
                      <TableCell>{tt('Người thực hiện', 'Performed By')}</TableCell>
                      {/* <TableCell>Địa chỉ</TableCell>
                      <TableCell></TableCell> */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transaction.historySendings.map((historySending: HistorySending) => (
                      <TableRow hover key={historySending.id}>
                        <TableCell>
                          {dayjs(historySending.createdAt || 0).format('HH:mm:ss DD/MM/YYYY')}
                        </TableCell>
                        <TableCell>
                          {getHistorySendingTypeDetails(historySending.type, tt)}
                        </TableCell>
                        <TableCell>
                          {getHistorySendingChannelDetails(historySending.channel, tt)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{historySending.creator?.fullName}</Typography>
                          <Typography variant="body2">{historySending.creator?.email}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader title={tt('Lịch sử thao tác', 'Action History')} />
              <Divider />
              <CardContent sx={{ overflow: 'auto', padding: 0, maxHeight: 300 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {/* <TableCell sx={{ width: '20px' }}></TableCell> */}
                      <TableCell>{tt('Thời gian', 'Time')}</TableCell>
                      <TableCell sx={{ minWidth: '240px' }}>{tt('Nội dung', 'Content')}</TableCell>
                      <TableCell>{tt('Người thực hiện', 'Performed By')}</TableCell>
                      {/* <TableCell>Địa chỉ</TableCell>
                      <TableCell></TableCell> */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transaction.historyActions.map((historyAction: HistoryAction) => (
                      <TableRow hover key={historyAction.id}>
                        <TableCell>
                          {dayjs(historyAction.createdAt || 0).format('HH:mm:ss DD/MM/YYYY')}
                        </TableCell>
                        <TableCell>
                          {historyAction.content}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{historyAction.creator?.fullName}</Typography>
                          <Typography variant="body2">{historyAction.creator?.email}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader
                title={tt('Lịch sử check-in', 'Check-in History')}
                subheader={tt('Lịch sử check-in của khách hàng', 'Customer check-in history')}
              />
              <Divider />
              <CardContent sx={{ overflow: 'auto', padding: 0, maxHeight: 600 }}>
                <Table sx={{ width: '100%' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>{tt('Thời gian', 'Time')}</TableCell>
                      <TableCell sx={{ minWidth: '200px' }}>{tt('Nội dung', 'Content')}</TableCell>
                      <TableCell>{tt('Ảnh', 'Image')}</TableCell>
                      <TableCell>{tt('Người thực hiện', 'Performed By')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transaction.transactionTicketCategories.map((transactionTicketCategory: TransactionTicketCategory) => (
                      transactionTicketCategory.tickets.map((ticket: Ticket) => {
                        const checkInHistory = ticket.historyCheckIns || [];
                        return (
                          <React.Fragment key={ticket.id}>
                            <TableRow>
                              <TableCell colSpan={4} sx={{ backgroundColor: 'action.hover', fontWeight: 'bold', py: 1.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', m: 0 }}>
                                  {tt('Lịch sử check-in của TID-', 'Check-in history for TID-')}{ticket.id} {ticket.holderTitle} {ticket.holderName}
                                </Typography>
                              </TableCell>
                            </TableRow>
                            {checkInHistory.length > 0 ? (
                              checkInHistory.map((history: CheckInHistory) => (
                                <TableRow hover key={history.id}>
                                  <TableCell>
                                    {dayjs(history.createdAt || 0).format('HH:mm:ss DD/MM/YYYY')}
                                  </TableCell>
                                  <TableCell>
                                    {history.type === 'check-in' ? tt('Check-in thành công', 'Check-in successful') : tt('Check-out thành công', 'Check-out successful')}
                                  </TableCell>
                                  <TableCell>
                                    {history.imageUrl ? (
                                      <Box
                                        component="img"
                                        src={history.imageUrl}
                                        alt="Check-in image"
                                        sx={{
                                          width: 60,
                                          height: 60,
                                          objectFit: 'cover',
                                          borderRadius: 1,
                                          cursor: 'pointer'
                                        }}
                                        onClick={() => window.open(history.imageUrl || '', '_blank')}
                                      />
                                    ) : (
                                      <Typography variant="body2" color="text.secondary">
                                        {tt('Không có ảnh', 'No image')}
                                      </Typography>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">{history.creator?.fullName || 'N/A'}</Typography>
                                    <Typography variant="body2" color="text.secondary">{history.creator?.email || ''}</Typography>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={4} align="center">
                                  <Typography variant="body2" color="text.secondary">
                                    {tt('Chưa có lịch sử check-in', 'No check-in history')}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
              <Modal open={editCategoryModalOpen} onClose={() => setEditCategoryModalOpen(false)} aria-labelledby="edit-ticket-category-modal-title" aria-describedby="edit-ticket-category-modal-description">
                <Container maxWidth="xl">
                  <Card sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { md: '700px', xs: '95%' }, maxHeight: '90vh', bgcolor: 'background.paper', boxShadow: 24 }}>
                    <CardHeader title={`${editingCategory?.ticketCategory.show.name} - ${editingCategory?.ticketCategory.name}`} action={<IconButton onClick={() => setEditCategoryModalOpen(false)}><X /></IconButton>} />
                    <CardContent sx={{ pt: 0, maxHeight: '70vh', overflowY: 'auto' }}>
                      <Stack spacing={2}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{tt('Thông tin người tham dự', 'Participant Information')}</Typography>
                        <Grid container spacing={2}>
                          {editingHolderInfos.map((holder, index) => (
                            <React.Fragment key={`holder-${index}`}>
                              <Grid md={6} xs={12}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Box sx={{ position: 'relative', width: 40, height: 40, flexShrink: 0, '&:hover .avatarUploadBtn': { opacity: 1, visibility: 'visible' } }}>
                                    <Avatar src={holder.avatar || ''} sx={{ width: 40, height: 40 }} />
                                    <IconButton
                                      className="avatarUploadBtn"
                                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '50%', opacity: 0, visibility: 'hidden', backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.35)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
                                      onClick={() => {
                                        const input = document.getElementById(`upload-holder-avatar-${editingCategory?.tickets[index]?.id}`) as HTMLInputElement | null;
                                        input?.click();
                                      }}
                                    >
                                      <Plus size={14} />
                                    </IconButton>
                                    <input
                                      id={`upload-holder-avatar-${editingCategory?.tickets[index]?.id}`}
                                      type="file"
                                      accept="image/*"
                                      hidden
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (editingCategory?.tickets[index]?.id) {
                                          handleHolderAvatarFile(editingCategory.tickets[index].id, f);
                                        }
                                        e.currentTarget.value = '';
                                      }}
                                    />
                                  </Box>
                                  <FormControl fullWidth size="small" required>
                                    <InputLabel>{tt('Danh xưng* &emsp; Họ và tên vé', 'Title* Full Name Ticket')} {index + 1}</InputLabel>
                                    <OutlinedInput
                                      label={`${tt('Danh xưng* &emsp; Họ và tên vé', 'Title* Full Name Ticket')} ${index + 1}`}
                                      value={holder.name}
                                      onChange={(e) => {
                                        setEditingHolderInfos((prev) => {
                                          const next = [...prev];
                                          next[index] = { ...next[index], name: e.target.value };
                                          return next;
                                        });
                                      }}
                                      startAdornment={<InputAdornment position="start">
                                        <Select
                                          variant="standard"
                                          disableUnderline
                                          value={holder.title || (locale === 'en' ? 'Mx.' : 'Bạn')}
                                          onChange={(e) => {
                                            setEditingHolderInfos((prev) => {
                                              const next = [...prev];
                                              next[index] = { ...next[index], title: e.target.value as string };
                                              return next;
                                            });
                                          }}
                                          sx={{ minWidth: 65 }}
                                        >
                                          {locale === 'en' ? (
                                            ['Mr.', 'Ms.', 'Mx.'].map((title) => (
                                              <MenuItem key={title} value={title}>{title}</MenuItem>
                                            ))
                                          ) : (
                                            <>
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
                                            </>
                                          )}
                                        </Select>
                                      </InputAdornment>}
                                    />
                                  </FormControl>
                                </Stack>
                              </Grid>
                              <Grid md={3} xs={12}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>{tt('Email vé', 'Email Ticket')} {index + 1}</InputLabel>
                                  <OutlinedInput
                                    label={`${tt('Email vé', 'Email Ticket')} ${index + 1}`}
                                    type="email"
                                    value={holder.email}
                                    disabled
                                  />
                                </FormControl>
                              </Grid>
                              <Grid md={3} xs={12}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>{tt('SĐT vé', 'Phone Ticket')} {index + 1}</InputLabel>
                                  <OutlinedInput
                                    label={`${tt('SĐT vé', 'Phone Ticket')} ${index + 1}`}
                                    type="tel"
                                    value={holder.phone}
                                    onChange={(e) => {
                                      setEditingHolderInfos((prev) => {
                                        const next = [...prev];
                                        next[index] = { ...next[index], phone: e.target.value };
                                        return next;
                                      });
                                    }}
                                    startAdornment={
                                      <InputAdornment position="start">
                                        <Select
                                          variant="standard"
                                          disableUnderline
                                          value={holder.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2}
                                          onChange={(event) => {
                                            setEditingHolderInfos((prev) => {
                                              const next = [...prev];
                                              next[index] = { ...next[index], phoneCountryIso2: event.target.value };
                                              return next;
                                            });
                                          }}
                                          sx={{ minWidth: 50 }}
                                          renderValue={(value) => {
                                            const country = PHONE_COUNTRIES.find((c) => c.iso2 === value) || DEFAULT_PHONE_COUNTRY;
                                            return country.dialCode;
                                          }}
                                        >
                                          {PHONE_COUNTRIES.map((country) => (
                                            <MenuItem key={country.iso2} value={country.iso2}>
                                              {country.nameVi} ({country.dialCode})
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </InputAdornment>
                                    }
                                  />
                                </FormControl>
                              </Grid>
                            </React.Fragment>
                          ))}
                        </Grid>
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                      <Button size="small" variant="contained" onClick={handleSaveTicketHolders}>{tt('Lưu', 'Save')}</Button>
                    </CardActions>
                  </Card>
                </Container>
              </Modal>
          </Stack>
        </Grid>
      </Grid>
      </Stack>
      <PrintTagModal
        open={printTagModalOpen}
        onClose={() => setPrintTagModalOpen(false)}
        transaction={transaction}
        eventId={event_id}
      />
    </>
  );
}
