'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Avatar, Box, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, InputAdornment, Select, Stack, Tooltip } from '@mui/material';
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
import { Bank as BankIcon, FacebookLogo, ImageSquare, Info, Lightning as LightningIcon, Money as MoneyIcon, WarningCircle, X } from '@phosphor-icons/react/dist/ssr'; // Example icons
import RouterLink from 'next/link';
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
import { Link } from '@phosphor-icons/react';
import { AxiosResponse } from 'axios';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Function to map payment methods to corresponding labels and icons
const getPaymentMethodDetails = (
  paymentMethod: string
): { label: string; icon?: React.ReactElement } => {
  switch (paymentMethod) {
    case 'cash':
      return { label: 'Tiền mặt', icon: <MoneyIcon /> };
    case 'transfer':
      return { label: 'Chuyển khoản', icon: <BankIcon /> };
    case 'napas247':
      return { label: 'Napas 247', icon: <LightningIcon /> };
    default:
      return { label: 'Unknown' };
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
  paymentStatus: string
): { label: string; color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (paymentStatus) {
    case 'waiting_for_payment':
      return { label: 'Chờ thanh toán', color: 'warning' };
    case 'paid':
      return { label: 'Đã thanh toán', color: 'success' };
    case 'refund':
      return { label: 'Đã hoàn tiền', color: 'secondary' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

// Function to map row statuses to corresponding labels and colors
const getRowStatusDetails = (status: string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
    case 'normal':
      return { label: 'Bình thường', color: 'success' };
    case 'wait_for_response':
      return { label: 'Đang chờ', color: 'warning' };
    case 'customer_cancelled':
      return { label: 'Huỷ bởi KH', color: 'error' }; // error for danger
    case 'staff_locked':
      return { label: 'Khoá bởi NV', color: 'error' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

const getSentEmailTicketStatusDetails = (status: string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
    case 'sent':
      return { label: 'Đã xuất', color: 'success' };
    case 'not_sent':
      return { label: 'Chưa xuất', color: 'default' }; // error for danger
    default:
      return { label: 'Unknown', color: 'default' };
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
  createdBy: number | null;         // ID of the user who created the transaction, nullable
  createdAt: string;                // The date the transaction was created
  createdSource: string;            // Source of the transaction creation
  creator: Creator | null;          // Related creator of the transaction, nullable
  exportedTicketAt: string | null
  sentPaymentInstructionAt: string | null
  cancelRequestStatus: string | null
  shareUuid: string | null
  event: Event
}


export interface ECodeResponse {
  eCode: string;
}

interface CancelTransactionResponse {
  message: string;
  cancelRequestStatus: 'pending' | 'accepted' | 'rejected';
}

export default function Page({ params }: { params: { transaction_id: number } }): React.JSX.Element {
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
    const text = `${buyerName} đã sở hữu vé của sự kiện ${eventName} trên ETIK`;
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
    notificationCtx.success('Đã sao chép liên kết chia sẻ');
  }

  React.useEffect(() => {
    document.title = "Vé của tôi | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);

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
        notificationCtx.error('Lỗi:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [transaction_id]);

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
      notificationCtx.error('Không tìm thấy đơn hàng hợp lệ.');
      return;
    }

    try {
      setIsLoading(true);
      const response: AxiosResponse<CancelTransactionResponse> = await baseHttpServiceInstance.get(
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
        error || 'Lỗi khi hủy đơn hàng, vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };


  if (!transaction) {
    return <Typography>Loading...</Typography>;
  }


  const paymentMethodDetails = getPaymentMethodDetails(transaction.paymentMethod);
  const paymentStatusDetails = getPaymentStatusDetails(transaction.paymentStatus);
  const statusDetails = getRowStatusDetails(transaction.status);
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
        <Typography variant="h4">Chi tiết đơn hàng của {transaction.name}</Typography>
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
                      Đơn vị tổ chức: {transaction.event.organizer}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {transaction.event.startDateTime && transaction.event.endDateTime
                        ? `${dayjs(transaction.event.startDateTime || 0).format('HH:mm DD/MM/YYYY')} - ${dayjs(transaction.event.endDateTime || 0).format('HH:mm DD/MM/YYYY')}`
                        : 'Chưa xác định'} {transaction.event.timeInstruction ? `(${transaction.event.timeInstruction})` : ''}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {transaction.event.place ? transaction.event.place : 'Chưa xác định'} {transaction.event.locationInstruction ? `(${transaction.event.locationInstruction})` : ''}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Thanh toán" />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Trạng thái đơn:</Typography>
                    <Stack spacing={0} direction="row">
                      <Chip color={statusDetails.color} label={statusDetails.label} />
                      {transaction.cancelRequestStatus === 'pending' &&
                        <Tooltip title={
                          <Typography>Khách hàng yêu cầu hủy</Typography>
                        }>
                          <Chip color="error" label={<WarningCircle size={16} />} />
                        </Tooltip>
                      }
                    </Stack>
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Phương thức thanh toán:</Typography>
                    <Chip icon={paymentMethodDetails.icon} label={paymentMethodDetails.label} />
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Trạng thái thanh toán:</Typography>
                    <Chip label={paymentStatusDetails.label} color={paymentStatusDetails.color} />
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Trạng thái xuất vé:</Typography>
                    <Chip
                      color={getSentEmailTicketStatusDetails(transaction?.exportedTicketAt ? 'sent' : 'not_sent').color}
                      label={getSentEmailTicketStatusDetails(transaction?.exportedTicketAt ? 'sent' : 'not_sent').label}
                    />
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Tổng số tiền:</Typography>
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
              <CardHeader
                title="Số lượng vé"
                action={
                  <OutlinedInput disabled sx={{ maxWidth: 180 }} type="number" value={transaction.ticketQuantity} />
                }
              />
              <Divider />
              <CardContent>
                <Stack spacing={0}>
                  {/* Loop through each transactionShowTicketCategory */}
                  {transaction.transactionTicketCategories.map((transactionTicketCategory, categoryIndex) => (
                    <div key={categoryIndex}>
                      {/* Show Name */}
                      <Grid sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Show:</Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{transactionTicketCategory.ticketCategory.show.name}</Typography>
                      </Grid>

                      {/* Ticket Category Name */}
                      <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1">Loại vé:</Typography>
                        </Stack>
                        <Typography variant="body1">{transactionTicketCategory.ticketCategory.name}</Typography>
                      </Grid>
                      <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                          <HashIcon fontSize="var(--icon-fontSize-md)" />
                          <Typography variant="body1">Số lượng:</Typography>
                        </Stack>
                        <Typography variant="body1">{transactionTicketCategory.tickets.length}</Typography>
                      </Grid>

                      {/* Loop through tickets for this category */}
                      {transactionTicketCategory.tickets.map((ticket, ticketIndex) => (
                        <Grid key={ticketIndex} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">Người tham dự {ticketIndex + 1}:</Typography>
                          </Stack>
                          <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">{ticket.holder}</Typography>
                            <Tooltip title={
                              <Stack spacing={1}>
                                <Typography>Trạng thái check-in: {ticket.checkInAt ? `Check-in lúc ${dayjs(ticket.checkInAt || 0).format('HH:mm:ss DD/MM/YYYY')}` : 'Chưa check-in'}</Typography>
                                {/* <Typography>ID đơn hàng: {row.transactionId}</Typography> */}
                              </Stack>
                            }>
                              <Typography variant="subtitle2"><Info /></Typography>
                            </Tooltip>
                          </Stack>
                        </Grid>
                      ))}
                      <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                          <TagIcon fontSize="var(--icon-fontSize-md)" />
                          <Typography variant="body1">Đơn giá:</Typography>
                        </Stack>
                        <Typography variant="body1">{formatPrice(transactionTicketCategory.netPricePerOne || 0)}</Typography>
                      </Grid>

                      <Divider sx={{ marginY: 2 }} />
                    </div>
                  ))}
                  {/* Additional details for this category */}

                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                      <StackPlusIcon fontSize="var(--icon-fontSize-md)" />
                      <Typography variant="body1">Phụ phí:</Typography>
                    </Stack>
                    <Typography variant="body1">{formatPrice(transaction.extraFee || 0)}</Typography>
                  </Grid>

                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                      <SealPercentIcon fontSize="var(--icon-fontSize-md)" />
                      <Typography variant="body1">Giảm giá:</Typography>
                    </Stack>
                    <Typography variant="body1">{formatPrice(transaction.discount || 0)}</Typography>
                  </Grid>

                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                      <CoinsIcon fontSize="var(--icon-fontSize-md)" />
                      <Typography variant="body1">Thành tiền:</Typography>
                    </Stack>
                    <Typography variant="body1">{formatPrice(transaction.totalAmount || 0)}</Typography>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
            {transaction.paymentMethod === 'napas247' && (
              <Card>
                <CardHeader title="Chi tiết thanh toán Napas 247" />
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
                          <Typography variant="body1">Hạn thanh toán:</Typography>
                          <Typography variant="body1">
                            {dayjs(transaction.paymentDueDatetime || 0).format('HH:mm:ss DD/MM/YYYY')}
                          </Typography>
                        </Grid>
                        <Grid container justifyContent="space-between">
                          <Typography variant="body1">Trang thanh toán:</Typography>
                          <Typography variant="body1">
                            <Button
                              component={RouterLink}
                              href={transaction.paymentCheckoutUrl || ''}
                              size="small"
                              startIcon={<LightningIcon />}
                            >
                              Đến trang thanh toán
                            </Button>
                          </Typography>
                        </Grid>
                      </>
                    )}
                    {transaction.paymentStatus === 'paid' && (
                      <Grid container justifyContent="space-between">
                        <Typography variant="body1">Thời gian thanh toán:</Typography>
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
              <CardHeader title="Thông tin khác" />
              <Divider />
              <CardContent>
                <Stack spacing={0}>
                  {/* createdAt */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">Thời gian khởi tạo:</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {dayjs(transaction.createdAt).format('HH:mm:ss DD/MM/YYYY')}
                    </Typography>
                  </Grid>
                  {/* Created source */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">Người khởi tạo:</Typography>
                    </Stack>
                    <Typography variant="body1">{transaction.creator?.fullName || 'Không có thông tin'}</Typography>
                  </Grid>
                  {/* Created source */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">Nguồn khởi tạo:</Typography>
                    </Stack>
                    <Typography variant="body1">{createdSource.label || 'Chưa xác định'}</Typography>
                  </Grid>
                  {/* sentPaymentInstructionAt */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">Thời gian gửi hướng dẫn t.toán:</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {transaction.sentPaymentInstructionAt ? dayjs(transaction.sentPaymentInstructionAt).format('HH:mm:ss DD/MM/YYYY') : "Chưa gửi"}
                    </Typography>
                  </Grid>
                  {/* exportedTicketAt */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction="row" sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">Thời gian xuất vé:</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {transaction.exportedTicketAt ? dayjs(transaction.exportedTicketAt).format('HH:mm:ss DD/MM/YYYY') : "Chưa gửi"}
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
              <CardHeader title="Thông tin người mua vé" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>

                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel htmlFor="customer-name">Danh xưng * - Họ và tên</InputLabel>
                      <OutlinedInput
                        id="customer-name"
                        name="name"
                        value={transaction.name}
                        disabled
                        label="Danh xưng * - Họ và tên"
                        startAdornment={
                          <InputAdornment position="start">
                            <Typography sx={{ width: 50 }}>{transaction.title}</Typography>
                          </InputAdornment>
                        }
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Email</InputLabel>
                      <OutlinedInput value={transaction.email} disabled label="Email" />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Số điện thoại</InputLabel>
                      <OutlinedInput value={transaction.phoneNumber} disabled label="Số điện thoại" />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Địa chỉ</InputLabel>
                      <OutlinedInput value={transaction.address} disabled label="Địa chỉ" />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {Boolean(eCode) && (
              <Card>
                <CardHeader title="Mã QR check-in" subheader="Vui lòng bảo mật mã QR check-in" />
                <Divider />
                <CardContent>
                  <Stack spacing={1} sx={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100px' }}>
                      <Box component="img" src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${eCode}`} alt="Check-in QR code" />
                    </div>
                    <Typography sx={{ textAlign: 'center' }}>{eCode}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader title="Hành động" />
              <Divider />
              <CardContent>
                <Stack spacing={2} direction="row" sx={{flexWrap:'wrap'}}>
                  <Button size="small" color="error" startIcon={<X />} onClick={handleOpen} disabled={transaction.cancelRequestStatus != null || ['customer_cancelled', 'staff_locked'].includes(transaction.status)}>
                    {transaction.cancelRequestStatus === 'pending' ? 'Đang chờ phản hồi hủy đơn hàng' : transaction.cancelRequestStatus == 'accepted' ? 'Đơn hàng đã được hủy' : transaction.cancelRequestStatus == 'rejected' ? 'Yêu cầu hủy bị từ chối' : 'Hủy đơn hàng'}
                  </Button>
                  <Button
                    onClick={() => window.open(`/account/my-tickets/${transaction_id}/invitation-letter`, '_blank')}
                    size="small"
                    startIcon={<ImageSquare />} // Icon for document-like invitation letter
                  >
                    Xem ảnh thư mời
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Link />}
                    onClick={() => copyShareLink(transaction.event.slug!, transaction.shareUuid!)}
                  >
                    Copy liên kết chia sẻ
                  </Button>
                  <Button
                    size="small"
                    startIcon={<FacebookLogo />}
                    onClick={() => shareTicket(transaction.event.slug!, transaction.shareUuid!, transaction.event.name, transaction.name, transaction.ticketQuantity)}
                  >
                    Khoe với bạn bè
                  </Button>
                </Stack>
                <Typography variant='caption'>
                  Xin lưu ý: Việc chia sẻ xác nhận sở hữu vé sẽ tiết lộ <b>tên người mua, số lượng vé, và thông tin công khai của sự kiện</b>. Các thông tin khác được bảo mật.
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
      {/* Confirm Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Xác nhận hủy đơn hàng</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Hủy bỏ
          </Button>
          <Button onClick={handleConfirmCancel} color="error" disabled={isLoading}>
            {isLoading ? 'Đang hủy...' : 'Xác nhận'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
