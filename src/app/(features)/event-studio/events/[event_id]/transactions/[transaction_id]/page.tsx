'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Avatar, Chip, InputAdornment, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip } from '@mui/material';
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
import { Bank as BankIcon, Check, Clock, DeviceMobile, HouseLine, ImageSquare, Info, Lightning as LightningIcon, MapPin, Money as MoneyIcon, SignIn, SignOut, WarningCircle, X } from '@phosphor-icons/react/dist/ssr'; // Example icons
import RouterLink from 'next/link';
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
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';

import NotificationContext from '@/contexts/notification-context';
import { useRouter, useSearchParams } from 'next/navigation';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Function to map payment methods to corresponding labels and icons
const getPaymentMethodDetails = (paymentMethod: string): { label: string, icon: any } => {
  switch (paymentMethod) {
    case 'cash':
      return { label: 'Tiền mặt', icon: <MoneyIcon /> };
    case 'transfer':
      return { label: 'Chuyển khoản', icon: <BankIcon /> };
    case 'napas247':
      return { label: 'Napas 247', icon: <LightningIcon /> };
    default:
      return { label: 'Unknown', icon: null };
  }
};

// Function to map created source to label
const getCreatedSource = (paymentMethod: string): { label: string } => {
  switch (paymentMethod) {
    case 'event_studio':
      return { label: 'Event Studio' };
    case 'marketplace':
      return { label: 'Marketplace' };
    case 'api':
      return { label: 'API' };
    default:
      return { label: 'Unknown' };
  }
};

// Function to map payment statuses to corresponding labels and colors
const getPaymentStatusDetails = (status: string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
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


const getHistorySendingTypeDetails = (type: SendingType) => {
  switch (type) {
    case SendingType.TICKET:
      return 'Gửi vé điện tử';
    case SendingType.PAYMENT_INSTRUCTION:
      return 'Gửi hướng dẫn thanh toán';
    case SendingType.CANCEL_TICKET:
      return 'Gửi thư huỷ vé';
    case SendingType.EMAIL_MARKETING:
      return 'Gửi email marketing';
  }
};

const getHistorySendingChannelDetails = (channel: SendingChannel) => {
  switch (channel) {
    case SendingChannel.EMAIL:
      return 'Email';
    case SendingChannel.ZALO:
      return 'Zalo';
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
  holder: string;        // Name of the ticket holder
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
  exportedTicketAt: string | null; // The date the transaction was created
  sentPaymentInstructionAt: string | null; // The date the transaction was created
  createdSource: string;            // Source of the transaction creation
  creator: Creator | null;          // Related creator of the transaction, nullable
  historySendings: HistorySending[];
  historyActions: HistoryAction[];
  cancelRequestStatus: string | null;
  event: Event
}


export default function Page({ params }: { params: { event_id: number; transaction_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Chi tiết đơn hàng | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const notificationCtx = React.useContext(NotificationContext);
  const { event_id, transaction_id } = params;
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: transaction?.name || '',
    title: transaction?.title || '',
    phoneNumber: transaction?.phoneNumber || '',
    address: transaction?.address || '',
    dob: transaction?.dob || null,
    status: ''
  });
  // grab ?checkInCode=… from the browser URL
  const searchParams = useSearchParams()
  const checkInCode = searchParams.get('checkInCode') || undefined
  const [selectedStatus, setSelectedStatus] = useState<string>(formData.status || '');

  const router = useRouter(); // Use useRouter from next/navigation

  const handleFormChange = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const updateTransaction = async () => {
    try {
      const response: AxiosResponse = await baseHttpServiceInstance.patch(
        `/event-studio/events/${params.event_id}/transactions/${params.transaction_id}`,
        {
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          dob: formData.dob,
          title: formData.title,
          address: formData.address,
        }
      );

      if (response.status === 200) {
        notificationCtx.success('Thông tin đơn hàng đã được cập nhật thành công!');
        setTransaction((prev) => prev ? {
          ...prev, name: formData.name,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          dob: formData.dob,
          title: formData.title,
        } : prev);

      }
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
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
        setFormData({
          title: response.data?.title || 'Bạn',
          name: response.data?.name || '',
          phoneNumber: response.data?.phoneNumber || '',
          dob: response.data?.dob || null,
          address: response.data?.address || '',
          status: '',
        });
      } catch (error) {
        notificationCtx.error('Lỗi:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [event_id, transaction_id]);


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
      notificationCtx.error('Có lỗi xảy ra khi gửi email vé:', error);
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
        notificationCtx.success('Hướng dẫn thanh toán đã được gửi thành công!');
      }
    } catch (error) {
      notificationCtx.error('Có lỗi xảy ra khi gửi hướng dẫn thanh toán:', error);
    } finally {
      setIsLoading(false); // Optional: Hide loading state
    }
  };

  const setTransactionPaidStatus = async (eventId: number, transactionId: number) => {
    try {
      const response: AxiosResponse = await baseHttpServiceInstance.put(
        `/event-studio/events/${eventId}/transactions/${transactionId}/set-paid-for-transaction`
      );

      if (response.status === 200) {
        notificationCtx.success('Trạng thái đơn hàng đã được chuyển sang "Đã thanh toán" thành công!');
        setTransaction((prev) => prev ? { ...prev, paymentStatus: 'paid' } : prev);
      }
    } catch (error) {
      notificationCtx.error('Có lỗi xảy ra khi cập nhật trạng thái đơn hàng:', error);
    }
  };


  const setTransactionRefundStatus = async (eventId: number, transactionId: number) => {
    try {
      const response: AxiosResponse = await baseHttpServiceInstance.put(
        `/event-studio/events/${eventId}/transactions/${transactionId}/set-refund-for-transaction`
      );

      if (response.status === 200) {
        notificationCtx.success('Trạng thái đơn hàng đã được chuyển sang "Đã hoàn tiền" thành công!');
        setTransaction((prev) => prev ? { ...prev, paymentStatus: 'refund' } : prev);
      }
    } catch (error) {
      notificationCtx.error('Có lỗi xảy ra khi cập nhật trạng thái hoàn tiền:', error);
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
        notificationCtx.success('Đã chấp nhận yêu cầu hủy đơn hàng.');
        setTransaction(transaction ? { ...transaction, cancelRequestStatus: 'accepted', status: 'customer_cancelled' } : transaction)

      } else {
        notificationCtx.success('Đã từ chối yêu cầu hủy đơn hàng.');
        setTransaction(transaction ? { ...transaction, cancelRequestStatus: 'rejected' } : transaction)

      }
    } catch (error) {
      // Handle error
      notificationCtx.error(error || 'Đã xảy ra lỗi, vui lòng thử lại.');
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
                      Đơn vị tổ chức: {transaction.event.organizer}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Clock fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {transaction.event.startDateTime && transaction.event.endDateTime
                        ? `${dayjs(transaction.event.startDateTime || 0).format('HH:mm DD/MM/YYYY')} - ${dayjs(transaction.event.endDateTime || 0).format('HH:mm DD/MM/YYYY')}`
                        : 'Chưa xác định'} {transaction.event.timeInstruction ? `(${transaction.event.timeInstruction})` : ''}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <MapPin fontSize="var(--icon-fontSize-sm)" />
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
                    <Stack spacing={0} direction={'row'}>
                      <Chip color={statusDetails.color} label={statusDetails.label} />
                      {transaction.cancelRequestStatus == 'pending' &&
                        <Tooltip title={
                          <Typography>Khách hàng yêu cầu hủy</Typography>
                        }>
                          <Chip color={'error'} label={<WarningCircle size={16} />} />
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
              <CardHeader title="Hành động" />
              <Divider />
              <CardContent>
                <Stack spacing={3}>
                  {transaction.cancelRequestStatus === 'pending' &&
                    <>
                      <Typography variant='body2' color={'error'} sx={{ fontWeight: 'bold' }}>
                        Khách hàng yêu cầu hủy đơn hàng:
                      </Typography>
                      <Stack spacing={2} direction={'row'}>
                        <Button
                          onClick={() => handleProcessCancelRequestStatus(transaction.id, event_id, 'reject')}
                          size="small"
                        >
                          Từ chối hủy
                        </Button>
                        <Button
                          onClick={() => handleProcessCancelRequestStatus(transaction.id, event_id, 'accept')}
                          size="small"
                          color='error'
                          startIcon={<Check />}
                        >
                          Chấp nhận hủy
                        </Button>
                      </Stack>
                      <Divider />
                    </>

                  }
                  {transaction.status === 'wait_for_response' &&
                    <Stack spacing={2} direction={'row'}>
                      <Button onClick={() => handleSetTransactionStatus('normal')} size="small" startIcon={<Check />}>
                        Phê duyệt đơn hàng
                      </Button>
                      <Button onClick={() => handleSetTransactionStatus('staff_locked')} size="small" startIcon={<X />}>
                        Từ chối đơn hàng
                      </Button>
                    </Stack>
                  }
                  {transaction.status === 'normal' && transaction.paymentStatus === 'paid' && transaction.exportedTicketAt == null && (
                    <>
                      <Stack spacing={1} direction={'row'} flexWrap={'wrap'}>
                        <Button onClick={() => sendTicket('email')} size="small" startIcon={<EnvelopeSimpleIcon />}>
                          Xuất vé + gửi email
                        </Button>
                        <Button onClick={() => sendTicket('zalo')} size="small" startIcon={<DeviceMobile />}>
                          Xuất vé + gửi Zalo
                        </Button>
                        <Button onClick={() => sendTicket(null)} size="small" startIcon={<TicketIcon />}>
                          Xuất vé không gửi
                        </Button>
                      </Stack>
                    </>
                  )}
                  {transaction.status === 'normal' && transaction.paymentStatus === 'paid' && transaction.exportedTicketAt != null && (
                    <Stack spacing={0} direction={'row'} flexWrap={'wrap'}>
                      <Button onClick={() => sendTicket('email')} size="small" startIcon={<EnvelopeSimpleIcon />}>
                        Gửi vé qua Email
                      </Button>
                      <Button onClick={() => sendTicket('zalo')} size="small" startIcon={<DeviceMobile />}>
                        Gửi vé qua Zalo
                      </Button>
                      <Button
                        onClick={() => window.open(`/event-studio/events/${event_id}/transactions/${transaction_id}/invitation-letter`, '_blank')}
                        size="small"
                        startIcon={<ImageSquare />} // Icon for document-like invitation letter
                      >
                        Xem ảnh thư mời
                      </Button>
                    </Stack>
                  )}
                  {transaction.status === 'normal' && transaction.paymentStatus === 'paid' && transaction.exportedTicketAt != null && (
                    <Stack spacing={2} direction={'row'}>
                      <Button size="small" startIcon={<SignIn />}>
                        Check-in
                      </Button>
                      <Button size="small" startIcon={<SignOut />}>
                        Check-out
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
                            Gửi Hướng dẫn thanh toán qua Email
                          </Button>
                          <Button onClick={resendInstructionNapas247Email}
                            size="small"
                            startIcon={<EnvelopeSimpleIcon />}
                          >
                            Gửi Hướng dẫn thanh toán qua Zalo
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
                          Chuyển trạng thái "Đã thanh toán"
                        </Button>
                      )}

                    {(transaction.status === 'staff_locked' || transaction.status === 'customer_cancelled') &&
                      transaction.paymentStatus === 'paid' && (
                        <Button
                          onClick={() => setTransactionRefundStatus(params.event_id, params.transaction_id)}
                          size="small"
                          startIcon={<EnvelopeSimpleIcon />}
                        >
                          Hoàn tiền đơn hàng
                        </Button>
                      )}
                  </Stack>
                  <Grid container spacing={3}>
                    <Grid md={10} xs={9}>
                      <FormControl size='small' fullWidth>
                        <InputLabel>Hủy đơn hàng</InputLabel>
                        <Select
                          label="Hủy đơn hàng"
                          name="status"
                          value={selectedStatus}
                          onChange={(event) => setSelectedStatus(event.target.value)}
                        >
                          {transaction.status === 'wait_for_response' && (
                            <MenuItem value="normal">Phê duyệt đơn hàng</MenuItem>
                          )}
                          <MenuItem value="customer_cancelled">Huỷ bởi Khách hàng</MenuItem>
                          <MenuItem value="staff_locked">Khoá bởi Nhân viên</MenuItem>
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
                        Lưu
                      </Button>
                    </Grid>
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
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Show:</Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{transactionTicketCategory.ticketCategory.show.name}</Typography>
                      </Grid>

                      {/* Ticket Category Name */}
                      <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1">Loại vé:</Typography>
                        </Stack>
                        <Typography variant="body1">{transactionTicketCategory.ticketCategory.name}</Typography>
                      </Grid>

                      <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <HashIcon fontSize="var(--icon-fontSize-md)" />
                          <Typography variant="body1">Số lượng:</Typography>
                        </Stack>
                        <Typography variant="body1">{transactionTicketCategory.tickets.length}</Typography>
                      </Grid>
                      {/* Loop through tickets for this category */}
                      {transactionTicketCategory.tickets.map((ticket, ticketIndex) => (
                        <Grid key={ticketIndex} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">Người tham dự {ticketIndex + 1}:</Typography>
                          </Stack>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">{ticket.holder}</Typography>
                            <Tooltip title={
                              <Stack spacing={1}>
                                <Typography>Trạng thái check-in: {ticket.checkInAt ? `Check-in lúc ${dayjs(ticket.checkInAt || 0).format('HH:mm:ss DD/MM/YYYY')}` : 'Chưa check-in'}</Typography>
                                {/* <Typography>ID giao dịch: {row.transactionId}</Typography> */}
                              </Stack>
                            }>
                              <Typography variant="subtitle2"><Info /></Typography>
                            </Tooltip>
                          </Stack>
                        </Grid>
                      ))}
                      <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
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
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <StackPlusIcon fontSize="var(--icon-fontSize-md)" />
                      <Typography variant="body1">Phụ phí:</Typography>
                    </Stack>
                    <Typography variant="body1">{formatPrice(transaction.extraFee || 0)}</Typography>
                  </Grid>

                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <SealPercentIcon fontSize="var(--icon-fontSize-md)" />
                      <Typography variant="body1">Giảm giá:</Typography>
                    </Stack>
                    <Typography variant="body1">{formatPrice(transaction.discount || 0)}</Typography>
                  </Grid>

                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
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
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">Thời gian khởi tạo:</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {dayjs(transaction.createdAt).format('HH:mm:ss DD/MM/YYYY')}
                    </Typography>
                  </Grid>
                  {/* Created source */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">Người khởi tạo:</Typography>
                    </Stack>
                    <Typography variant="body1">{transaction.creator?.fullName || 'Không có thông tin'}</Typography>
                  </Grid>
                  {/* Created source */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">Nguồn khởi tạo:</Typography>
                    </Stack>
                    <Typography variant="body1">{createdSource.label || 'Chưa xác định'}</Typography>
                  </Grid>
                  {/* sentPaymentInstructionAt */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">Thời gian gửi hướng dẫn t.toán:</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {transaction.sentPaymentInstructionAt ? dayjs(transaction.sentPaymentInstructionAt).format('HH:mm:ss DD/MM/YYYY') : "Chưa gửi"}
                    </Typography>
                  </Grid>
                  {/* createdAt */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
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
                      <InputLabel htmlFor="customer-name">Người mua</InputLabel>
                      <OutlinedInput
                        id="customer-name"
                        name="name"
                        value={formData.name}
                        onChange={(event) => handleFormChange(event)}
                        label="Người mua"
                        startAdornment={
                          <InputAdornment position="start">
                            <Select
                              variant="standard"
                              disableUnderline
                              value={formData.title || "Bạn"}
                              onChange={(event) =>
                                setFormData({ ...formData, title: event.target.value })
                              }
                              sx={{ minWidth: 70 }} // cho vừa gọn
                            >
                              <MenuItem value="Anh">Anh</MenuItem>
                              <MenuItem value="Chị">Chị</MenuItem>
                              <MenuItem value="Bạn">Bạn</MenuItem>
                              <MenuItem value="Em">Em</MenuItem>
                              <MenuItem value="Ông">Ông</MenuItem>
                              <MenuItem value="Bà">Bà</MenuItem>
                              <MenuItem value="Cô">Cô</MenuItem>
                              <MenuItem value="Mr.">Mr.</MenuItem>
                              <MenuItem value="Ms.">Ms.</MenuItem>
                              <MenuItem value="Miss">Miss</MenuItem>
                              <MenuItem value="Thầy">Thầy</MenuItem>
                            </Select>
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
                      <OutlinedInput
                        value={formData.phoneNumber}
                        onChange={(event: any) => handleFormChange(event)}
                        name="phoneNumber"
                        label="Số điện thoại"
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel shrink>Ngày tháng năm sinh</InputLabel>
                      <OutlinedInput
                        label="Ngày tháng năm sinh"
                        name="dob"
                        type='date'
                        value={formData.dob}
                        onChange={(event: any) => handleFormChange(event)}
                        inputProps={{ max: new Date().toISOString().slice(0, 10) }}

                      />
                    </FormControl>
                  </Grid>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Địa chỉ</InputLabel>
                      <OutlinedInput
                        value={formData.address}
                        onChange={(event: any) => handleFormChange(event)}
                        name="address"
                        label="Địa chỉ"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
                <Grid sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" variant="contained" onClick={updateTransaction}>
                    Lưu
                  </Button>
                </Grid>
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Lịch sử gửi" subheader='Lịch sử gửi email và gửi tin nhắn Zalo đến khách hàng' />
              <Divider />
              <CardContent sx={{ overflow: 'auto', padding: 0, maxHeight: 300 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {/* <TableCell sx={{ width: '20px' }}></TableCell> */}
                      <TableCell>Thời gian</TableCell>
                      <TableCell sx={{ minWidth: '200px' }}>Nội dung</TableCell>
                      <TableCell>Kênh</TableCell>
                      <TableCell>Người thực hiện</TableCell>
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
                          {getHistorySendingTypeDetails(historySending.type)}
                        </TableCell>
                        <TableCell>
                          {getHistorySendingChannelDetails(historySending.channel)}
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
              <CardHeader title="Lịch sử thao tác" />
              <Divider />
              <CardContent sx={{ overflow: 'auto', padding: 0, maxHeight: 300 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {/* <TableCell sx={{ width: '20px' }}></TableCell> */}
                      <TableCell>Thời gian</TableCell>
                      <TableCell sx={{ minWidth: '240px' }}>Nội dung</TableCell>
                      <TableCell>Người thực hiện</TableCell>
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


          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
