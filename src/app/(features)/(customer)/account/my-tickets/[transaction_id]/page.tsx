'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Avatar, Box, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, InputAdornment, Stack, Tooltip, Checkbox, FormGroup, FormControlLabel, RadioGroup, Radio } from '@mui/material';
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
import { Ticket as TicketIcon, Bank as BankIcon, FacebookLogo, ImageSquare, Info, Lightning as LightningIcon, Money as MoneyIcon, WarningCircle, X } from '@phosphor-icons/react/dist/ssr'; // Example icons
import { LocalizedLink } from '@/components/localized-link';

import * as React from 'react';
import { useEffect, useState } from 'react';

import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Coins as CoinsIcon } from '@phosphor-icons/react/dist/ssr/Coins';
import { Hash as HashIcon } from '@phosphor-icons/react/dist/ssr/Hash';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { SealPercent as SealPercentIcon } from '@phosphor-icons/react/dist/ssr/SealPercent';
import { StackPlus as StackPlusIcon } from '@phosphor-icons/react/dist/ssr/StackPlus';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import dayjs from 'dayjs';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { Link } from '@phosphor-icons/react';
import { AxiosResponse } from 'axios';
import { parseE164Phone, PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY } from '@/config/phone-countries';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Function to map payment methods to corresponding labels and icons
const getPaymentMethodDetails = (
  paymentMethod: string,
  tt: (vi: string, en: string) => string
): { label: string; icon?: React.ReactElement } => {
  switch (paymentMethod) {
    case 'cash':
      return { label: tt('Tiền mặt', 'Cash'), icon: <MoneyIcon /> };
    case 'transfer':
      return { label: tt('Chuyển khoản', 'Bank Transfer'), icon: <BankIcon /> };
    case 'napas247':
      return { label: 'Napas 247', icon: <LightningIcon /> };
    default:
      return { label: tt('Không rõ', 'Unknown') };
  }
};

// Function to map created source to label
const getCreatedSource = (paymentMethod: string) => {
  switch (paymentMethod) {
    case 'event_studio':
      return { label: 'Event Studio' };
    case 'marketplace':
      return { label: 'Marketplace' };
    case 'api':
      return { label: 'API' };
    default:
      return { label: 'Unknown', icon: null };
  }
};

// Function to map payment statuses to corresponding labels and colors
const getPaymentStatusDetails = (
  paymentStatus: string,
  tt: (vi: string, en: string) => string
): { label: string; color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (paymentStatus) {
    case 'waiting_for_payment':
      return { label: tt('Chờ thanh toán', 'Awaiting Payment'), color: 'warning' };
    case 'paid':
      return { label: tt('Đã thanh toán', 'Paid'), color: 'success' };
    case 'refund':
      return { label: tt('Đã hoàn tiền', 'Refunded'), color: 'secondary' };
    default:
      return { label: tt('Không rõ', 'Unknown'), color: 'default' };
  }
};

// Function to map row statuses to corresponding labels and colors
const getRowStatusDetails = (status: string, tt: (vi: string, en: string) => string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
    case 'normal':
      return { label: tt('Bình thường', 'Normal'), color: 'success' };
    case 'wait_for_response':
      return { label: tt('Đang chờ', 'Waiting'), color: 'warning' };
    case 'customer_cancelled':
      return { label: tt('Huỷ bởi KH', 'Cancelled by Customer'), color: 'error' };
    case 'staff_locked':
      return { label: tt('Khoá bởi NV', 'Locked by Staff'), color: 'error' };
    default:
      return { label: tt('Không rõ', 'Unknown'), color: 'default' };
  }
};

const getSentEmailTicketStatusDetails = (status: string, tt: (vi: string, en: string) => string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
    case 'sent':
      return { label: tt('Đã xuất', 'Exported'), color: 'success' };
    case 'not_sent':
      return { label: tt('Chưa xuất', 'Not Exported'), color: 'default' };
    default:
      return { label: tt('Không rõ', 'Unknown'), color: 'default' };
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
  holderPhone: string;        // Name of the ticket holder
  holderEmail: string;        // Name of the ticket holder
  holderTitle: string;        // Name of the ticket holder
  createdAt: string;   // The date the ticket was created
  checkInAt: string | null; // The date/time the ticket was checked in, nullable
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
}

export interface Creator {
  id: number;                        // Unique identifier for the creator
  fullName: string;                 // Full name of the creator
  email: string;                    // Email of the creator
}

export interface Transaction {
  id: number;                       // Unique identifier for the transaction
  eventId: number;                  // ID of the related event
  customerId: number;               // ID of the customer who made the transaction
  email: string;                    // Email of the customer
  name: string;                     // Name of the customer
  gender: string;                   // Gender of the customer
  title: string;                   // Gender of the customer
  phoneNumber: string;              // Customer's phone number
  address: string | null;           // Customer's address, nullable
  dob: string | null;               // Date of birth, nullable
  transactionTicketCategories: TransactionTicketCategory[]; // List of ticket categories in the transaction
  ticketQuantity: number;           // Number of tickets purchased
  extraFee: number;                 // Extra fees for the transaction
  discount: number;                 // Discount applied to the transaction
  totalAmount: number;              // Total amount for the transaction
  paymentMethod: string;            // Payment method used
  paymentStatus: string;            // Current status of the payment
  paymentOrderCode: number | null;  // Order code for the payment, nullable
  paymentDueDatetime: string | null; // Due date for the payment, nullable
  paymentCheckoutUrl: string | null; // URL for payment checkout, nullable
  paymentTransactionDatetime: string | null; // Date of the payment transaction, nullable
  note: string | null;              // Optional note for the transaction, nullable
  status: string;                   // Current status of the transaction
  // createdBy: number | null;         // ID of the user who created the transaction, nullable
  createdAt: string;                // The date the transaction was created
  createdSource: string;            // Source of the transaction creation
  // creator: Creator | null;          // Related creator of the transaction, nullable
  exportedTicketAt: string | null
  sentPaymentInstructionAt: string | null
  cancelRequestStatus: string | null
  shareUuid: string | null
  event: Event
  qrOption: string
  requireGuestAvatar: boolean
  // Dynamic checkout form answers (ETIK Forms)
  formAnswers?: Record<string, any>
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


export interface ECodeResponse {
  eCode: string;
}

interface CancelTransactionResponse {
  message: string;
  cancelRequestStatus: 'pending' | 'accepted' | 'rejected';
}

export default function Page({ params }: { params: { transaction_id: number } }): React.JSX.Element {
  const { tt } = useTranslation();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [eCode, setECode] = useState<string | null>(null);
  const { transaction_id } = params;
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleConfirmCancel = async () => {
    await cancelTransaction();
    handleClose();
  };

  function shareTicket(eventSlug: string, txUuid: string, eventName: string, buyerName: string, ticketQuantity: number) {
    const shareUrl = `https://etik.vn/share/${eventSlug}/${txUuid}`;
    const text = `${buyerName} ${tt('đã sở hữu vé của sự kiện', 'has purchased tickets for')} ${eventName} ${tt('trên ETIK', 'on ETIK')}`;
    const webSharer = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

    // Prefer native share sheet (lets user pick Instagram, Messenger, Facebook, etc.)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      void (navigator as any).share({ title: 'ETIK', text, url: shareUrl }).catch(() => { });
      return;
    }

    // Fallback: open Facebook sharer in a new tab (no small popup)
    window.open(webSharer, '_blank', 'noopener,noreferrer');
  }

  function copyShareLink(eventSlug: string, txUuid: string) {
    const shareUrl = `https://etik.vn/share/${eventSlug}/${txUuid}`;
    navigator.clipboard.writeText(shareUrl);
    notificationCtx.success(tt('Đã sao chép liên kết chia sẻ', 'Share link copied'));
  }

  React.useEffect(() => {
    document.title = tt("Vé của tôi", "My Tickets") + " | ETIK - " + tt("Vé điện tử & Quản lý sự kiện", "E-Tickets & Event Management");
  }, [tt]);

  // Fetch transaction details
  useEffect(() => {
    const fetchTransactionDetails = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<Transaction> = await baseHttpServiceInstance.get(
          `/account/transactions/${transaction_id}`
        );
        setTransaction(response.data);
      } catch (error) {
        notificationCtx.error(tt('Lỗi:', 'Error:'), error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [transaction_id]);

  // Fetch checkout form runtime configuration (Marketplace)
  const [checkoutFormFields, setCheckoutFormFields] = useState<CheckoutRuntimeField[]>([]);

  const builtinInternalNames = React.useMemo(
    () => new Set(['name', 'email', 'phone_number', 'address', 'dob', 'idcard_number']),
    []
  );

  const customCheckoutFields = React.useMemo(
    () => checkoutFormFields.filter((f) => !builtinInternalNames.has(f.internal_name)),
    [checkoutFormFields, builtinInternalNames]
  );

  useEffect(() => {
    const fetchCheckoutForm = async () => {
      if (!transaction?.event?.slug) return;
      try {
        const resp: AxiosResponse<{ fields: CheckoutRuntimeField[] }> =
          await baseHttpServiceInstance.get(
            `/marketplace/events/${transaction.event.slug}/forms/checkout/runtime`
          );
        setCheckoutFormFields(resp.data.fields || []);
      } catch (error) {
        // Nếu form chưa cấu hình hoặc lỗi, bỏ qua, tiếp tục dùng layout mặc định tối thiểu
        console.error('Failed to load checkout form runtime', error);
      }
    };
    fetchCheckoutForm();
  }, [transaction?.event?.slug]);

  useEffect(() => {
    const fetchCheckInECode = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<ECodeResponse> = await baseHttpServiceInstance.get(
          `/account/transactions/${transaction_id}/check-in-e-code`
        );
        setECode(response.data.eCode);
      } catch (error) {
        // notificationCtx.error('Error fetching ecode', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCheckInECode();
  }, [transaction_id]);


  const cancelTransaction = async () => {
    if (!transaction_id) {
      notificationCtx.error(tt('Không tìm thấy đơn hàng hợp lệ.', 'Valid order not found.'));
      return;
    }

    try {
      setIsLoading(true);
      const response: AxiosResponse<CancelTransactionResponse> = await baseHttpServiceInstance.post(
        `/account/transactions/${transaction_id}/cancel-transaction`
      );

      notificationCtx.success(response.data.message);
      if (response.data.cancelRequestStatus === 'pending') {
        setTransaction(transaction ? { ...transaction, cancelRequestStatus: response.data.cancelRequestStatus } : transaction)
      }
      if (response.data.cancelRequestStatus === 'accepted') {
        setTransaction(transaction ? { ...transaction, cancelRequestStatus: response.data.cancelRequestStatus, status: 'customer_cancelled' } : transaction)
      }

    } catch (error: any) {
      notificationCtx.error(
        error || tt('Lỗi khi hủy đơn hàng, vui lòng thử lại.', 'Error canceling order, please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };


  if (!transaction) {
    return <Typography>{tt('Đang tải...', 'Loading...')}</Typography>;
  }


  const paymentMethodDetails = getPaymentMethodDetails(transaction.paymentMethod, tt);
  const paymentStatusDetails = getPaymentStatusDetails(transaction.paymentStatus, tt);
  const statusDetails = getRowStatusDetails(transaction.status, tt);
  const createdSource = getCreatedSource(transaction.createdSource);

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

      <div>
        <Typography variant="h4">{tt('Chi tiết đơn hàng của', 'Order details for')} {transaction.name}</Typography>
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
                        <Box component="img" src={transaction.event.avatarUrl} alt={`${transaction.event.name} avatar`} style={{ height: '80px', width: '80px', borderRadius: '50%' }} />
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
                    <HouseLineIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {tt('Đơn vị tổ chức:', 'Organizer:')} {transaction.event.organizer}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {transaction.event.startDateTime && transaction.event.endDateTime
                        ? `${dayjs(transaction.event.startDateTime || 0).format('HH:mm DD/MM/YYYY')} - ${dayjs(transaction.event.endDateTime || 0).format('HH:mm DD/MM/YYYY')}`
                        : tt('Chưa xác định', 'To be determined')} {transaction.event.timeInstruction ? `(${transaction.event.timeInstruction})` : ''}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {transaction.event.place ? transaction.event.place : tt('Chưa xác định', 'To be determined')} {transaction.event.locationInstruction ? `(${transaction.event.locationInstruction})` : ''}
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
                    <Stack spacing={0} direction="row">
                      <Chip color={statusDetails.color} label={statusDetails.label} />
                      {transaction.cancelRequestStatus === 'pending' &&
                        <Tooltip title={
                          <Typography>{tt('Khách hàng yêu cầu hủy', 'Customer requested cancellation')}</Typography>
                        }>
                          <Chip color="error" label={<WarningCircle size={16} />} />
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
                    <Typography variant="body1">{tt('Trạng thái xuất vé:', 'Ticket Export Status:')}</Typography>
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
            
            {transaction.paymentMethod === 'napas247' && (
              <Card>
                <CardHeader title={tt('Chi tiết thanh toán Napas 247', 'Napas 247 Payment Details')} />
                <Divider />
                <CardContent>
                  <Stack spacing={2}>
                    <Grid container justifyContent="space-between">
                      <Typography variant="body1">Payment order code:</Typography>
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
                              {tt('Đến trang thanh toán', 'Go to payment page')}
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
                    <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{tt('Thời gian khởi tạo:', 'Created At:')}</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {dayjs(transaction.createdAt).format('HH:mm:ss DD/MM/YYYY')}
                    </Typography>
                  </Grid>
                  {/* Created source */}
                  {/* <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{tt('Người khởi tạo:', 'Created By:')}</Typography>
                    </Stack>
                    <Typography variant="body1">{transaction.creator?.fullName || tt('Không có thông tin', 'No information')}</Typography>
                  </Grid> */}
                  {/* Created source */}
                  {/* <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{tt('Nguồn khởi tạo:', 'Created Source:')}</Typography>
                    </Stack>
                    <Typography variant="body1">{createdSource.label || tt('Chưa xác định', 'Not specified')}</Typography>
                  </Grid> */}
                  {/* sentPaymentInstructionAt */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{tt('Thời gian gửi hướng dẫn t.toán:', 'Payment Instructions Sent:')}</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {transaction.sentPaymentInstructionAt ? dayjs(transaction.sentPaymentInstructionAt).format('HH:mm:ss DD/MM/YYYY') : tt("Chưa gửi", "Not sent")}
                    </Typography>
                  </Grid>
                  {/* exportedTicketAt */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{tt('Thời gian xuất vé:', 'Ticket Export Time:')}</Typography>
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
              <CardHeader title={tt('Thông tin người mua vé', 'Information')} />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  {/* Built-in fields driven by checkout runtime config */}
                  {(() => {
                    const nameCfg = checkoutFormFields.find((f) => f.internal_name === 'name');
                    const visible = !!nameCfg && nameCfg.visible;
                    const label = nameCfg?.label || tt('Danh xưng * - Họ và tên', 'Title * - Full Name');
                    return (
                      visible && (
                        <Grid md={6} xs={12}>
                          <FormControl fullWidth required>
                            <InputLabel htmlFor="customer-name">{label}</InputLabel>
                            <OutlinedInput
                              id="customer-name"
                              name="name"
                              value={transaction.name}
                              disabled
                              label={label}
                              startAdornment={
                                <InputAdornment position="start">
                                  <Typography sx={{ width: 50 }}>{transaction.title}</Typography>
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
                    const label = emailCfg?.label || 'Email';
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
                    const label =
                      phoneCfg?.label || tt('Số điện thoại', 'Phone Number');
                    return (
                      visible && (
                        <Grid md={6} xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>{label}</InputLabel>
                            <OutlinedInput value={transaction.phoneNumber} disabled label={label} />
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
                        <Grid md={6} xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>{label}</InputLabel>
                            <OutlinedInput value={transaction.address} disabled label={label} />
                          </FormControl>
                        </Grid>
                      )
                    );
                  })()}

                  {(() => {
                    const dobCfg = checkoutFormFields.find((f) => f.internal_name === 'dob');
                    const visible = !!dobCfg && dobCfg.visible;
                    const label =
                      dobCfg?.label || tt('Ngày tháng năm sinh', 'Date of Birth');
                    return (
                      visible && (
                        <Grid md={6} xs={12}>
                          <FormControl fullWidth>
                            <InputLabel shrink>{label}</InputLabel>
                            <OutlinedInput
                              label={label}
                              value={transaction.dob || ''}
                              disabled
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
                    const label =
                      idCfg?.label || tt('Căn cước công dân', 'ID Card Number');
                    return (
                      visible && (
                        <Grid md={6} xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>{label}</InputLabel>
                            <OutlinedInput
                              label={label}
                              value={(transaction as any).idcardNumber || ''}
                              disabled
                            />
                          </FormControl>
                        </Grid>
                      )
                    );
                  })()}

                  {/* Custom checkout fields (visible only, rendered as disabled form controls) */}
                  {customCheckoutFields.map((field) => {
                    const rawValue = transaction.formAnswers?.[field.internal_name];
                    const disabled = true;

                    return (
                      <Grid key={field.internal_name} xs={12}>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {field.label}
                          </Typography>
                          {field.note && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {field.note}
                            </Typography>
                          )}

                          {['text', 'number'].includes(field.field_type) && (
                            <OutlinedInput
                              fullWidth
                              size="small"
                              type={field.field_type === 'number' ? 'number' : 'text'}
                              value={rawValue ?? ''}
                              disabled={disabled}
                            />
                          )}

                          {['date', 'time', 'datetime'].includes(field.field_type) && (
                            <OutlinedInput
                              fullWidth
                              size="small"
                              type={
                                field.field_type === 'date'
                                  ? 'date'
                                  : field.field_type === 'time'
                                  ? 'time'
                                  : 'datetime-local'
                              }
                              value={rawValue ?? ''}
                              disabled={disabled}
                              inputProps={{}}
                            />
                          )}

                          {field.field_type === 'radio' && field.options && (
                            <FormGroup>
                              <RadioGroup value={rawValue ?? ''}>
                                {field.options.map((opt) => (
                                  <FormControlLabel
                                    key={opt.value}
                                    value={opt.value}
                                    control={<Radio size="small" disabled />}
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
                                    control={<Checkbox size="small" checked={checked} disabled />}
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
            </Card>
            <Card>
              <CardHeader
                title={`${tt('Danh sách vé:', 'Ticket List:')} ${transaction.ticketQuantity} ${tt('vé', 'tickets')}`}
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
                                            return `${email} - ${tt('Chưa có SĐT', 'No phone')}`;
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
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>TID-{ticket.id} {ticket.checkInAt ? `${tt('Check-in lúc', 'Checked in at')} ${dayjs(ticket.checkInAt || 0).format('HH:mm:ss DD/MM/YYYY')}` : tt('Chưa check-in', 'Not checked in')}</Typography>
                                </div>
                              </Box>
                            </Stack>
                          ))}
                        </Stack>
                      )}
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
                    <Typography variant="body1">{formatPrice(transaction.discount || 0)}</Typography>
                  </Grid>

                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <CoinsIcon fontSize="var(--icon-fontSize-md)" />
                      <Typography variant="body1">{tt('Thành tiền:', 'Total:')}</Typography>
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
                        checked={transaction.requireGuestAvatar || false}
                        disabled
                      />
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
            {Boolean(eCode) && (
              <Card>
                <CardHeader title={tt('Mã QR check-in', 'Check-in QR Code')} subheader={tt('Vui lòng bảo mật mã QR check-in', 'Please keep your check-in QR code secure')} />
                <Divider />
                <CardContent>
                  <Stack spacing={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100px' }}>
                      <Box component="img" src={`https://api.qrserver.com/v1/create-qr-code/?margin=16&size=100x100&data=${eCode}`} alt="Check-in QR code" />
                    </div>
                    <Typography sx={{ textAlign: 'center' }}>{eCode}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader title={tt('Hành động', 'Actions')} />
              <Divider />
              <CardContent>
                <Stack spacing={2} direction="row" sx={{flexWrap:'wrap'}}>
                  <Button size="small" color="error" startIcon={<X />} onClick={handleOpen} disabled={transaction.cancelRequestStatus != null || ['customer_cancelled', 'staff_locked'].includes(transaction.status)}>
                    {transaction.cancelRequestStatus === 'pending' ? tt('Đang chờ phản hồi hủy đơn hàng', 'Awaiting cancellation response') : transaction.cancelRequestStatus == 'accepted' ? tt('Đơn hàng đã được hủy', 'Order has been cancelled') : transaction.cancelRequestStatus == 'rejected' ? tt('Yêu cầu hủy bị từ chối', 'Cancellation request rejected') : tt('Hủy đơn hàng', 'Cancel Order')}
                  </Button>
                  <Button
                    onClick={() => window.open(`/account/my-tickets/${transaction_id}/invitation-letter`, '_blank')}
                    size="small"
                    startIcon={<ImageSquare />}
                  >
                    {tt('Xem ảnh thư mời', 'View Invitation Image')}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Link />}
                    onClick={() => copyShareLink(transaction.event.slug!, transaction.shareUuid!)}
                  >
                    {tt('Copy liên kết chia sẻ', 'Copy Share Link')}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<FacebookLogo />}
                    onClick={() => shareTicket(transaction.event.slug!, transaction.shareUuid!, transaction.event.name, transaction.name, transaction.ticketQuantity)}
                  >
                    {tt('Khoe với bạn bè', 'Share with Friends')}
                  </Button>
                </Stack>
                <Typography variant='caption'>
                  {tt('Xin lưu ý: Việc chia sẻ xác nhận sở hữu vé sẽ tiết lộ', 'Please note: Sharing ticket ownership confirmation will reveal')} <b>{tt('tên người mua, số lượng vé, và thông tin công khai của sự kiện', 'buyer name, ticket quantity, and public event information')}</b>. {tt('Các thông tin khác được bảo mật.', 'Other information is kept confidential.')}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
      {/* Confirm Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{tt('Xác nhận hủy đơn hàng', 'Confirm Order Cancellation')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {tt('Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.', 'Are you sure you want to cancel this order? This action cannot be undone.')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {tt('Hủy bỏ', 'Cancel')}
          </Button>
          <Button onClick={handleConfirmCancel} color="error" disabled={isLoading}>
            {isLoading ? tt('Đang hủy...', 'Cancelling...') : tt('Xác nhận', 'Confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
