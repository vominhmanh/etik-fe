'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Chip, MenuItem, Select, Stack } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Bank as BankIcon, Lightning as LightningIcon, Money as MoneyIcon } from '@phosphor-icons/react/dist/ssr'; // Example icons

import { Coins as CoinsIcon } from '@phosphor-icons/react/dist/ssr/Coins';
import { EnvelopeSimple as EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { Hash as HashIcon } from '@phosphor-icons/react/dist/ssr/Hash';
import { SealPercent as SealPercentIcon } from '@phosphor-icons/react/dist/ssr/SealPercent';
import { StackPlus as StackPlusIcon } from '@phosphor-icons/react/dist/ssr/StackPlus';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import axios, { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

import NotificationContext from '@/contexts/notification-context';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Function to map payment methods to corresponding labels and icons
const getPaymentMethodDetails = (paymentMethod: string) => {
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
const getPaymentStatusDetails = (paymentStatus: string) => {
  switch (paymentStatus) {
    case 'waiting_for_payment':
      return { label: 'Đang chờ thanh toán', color: 'warning' };
    case 'paid':
      return { label: 'Đã thanh toán', color: 'success' };
    case 'refund':
      return { label: 'Đã hoàn tiền', color: 'secondary' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

// Function to map row statuses to corresponding labels and colors
const getRowStatusDetails = (status: string) => {
  switch (status) {
    case 'normal':
      return { label: 'Bình thường', color: 'default' };
    case 'customer_cancelled':
      return { label: 'Huỷ bởi KH', color: 'error' }; // error for danger
    case 'staff_locked':
      return { label: 'Khoá bởi NV', color: 'error' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

export interface Ticket {
  id: number;             // Unique identifier for the ticket
  holder: string;        // Name of the ticket holder
  // createdAt: string;   // The date the ticket was created
  // checkInAt: string | null; // The date/time the ticket was checked in, nullable
}

export interface Show {
  id: number;            // Unique identifier for the show
  name: string;          // Name of the show
}

export interface TicketCategory {
  id: number;            // Unique identifier for the ticket category
  name: string;          // Name of the ticket category
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

export interface ShowTicketCategory {
  show: Show;                       // Show information
  ticketCategory: TicketCategory;    // Ticket category information
}

export interface TransactionShowTicketCategory {
  netPricePerOne: number;           // Net price per ticket
  tickets: Ticket[];                 // Array of related tickets
  showTicketCategory: ShowTicketCategory; // Related show and ticket category information
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
  phoneNumber: string;              // Customer's phone number
  address: string | null;           // Customer's address, nullable
  dob: string | null;               // Date of birth, nullable
  transactionShowTicketCategories: TransactionShowTicketCategory[]; // List of ticket categories in the transaction
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
}


export default function Page({ params }: { params: { event_id: number; transaction_id: number } }): React.JSX.Element {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const notificationCtx = React.useContext(NotificationContext);
  const { event_id, transaction_id } = params;
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: transaction?.name || '',
    phoneNumber: transaction?.phoneNumber || '',
    address: transaction?.address || '',
    status: null,
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
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
          address: formData.address,
          status: formData.status,
        }
      );

      if (response.status === 200) {
        notificationCtx.success('Thông tin giao dịch đã được cập nhật thành công!');
      }
    } catch (error) {
      notificationCtx.error('Có lỗi xảy ra khi cập nhật thông tin giao dịch:', error);
    }
  };

  // Fetch transaction details
  useEffect(() => {
    const fetchTransactionDetails = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<Transaction> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/transactions/${transaction_id}`
        );
        setTransaction(response.data);
        setFormData({
          name: response.data?.name || '',
          phoneNumber: response.data?.phoneNumber || '',
          address: response.data?.address || '',
          status: null,
        });
      } catch (error) {
        notificationCtx.error('Error fetching transaction details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [event_id, transaction_id]);


  const resendTicketEmail = async () => {
    try {
      setIsLoading(true); // Optional: Show loading state
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/transactions/${transaction_id}/resend-ticket-email`
      );

      // Optionally handle response
      if (response.status === 200) {
        notificationCtx.success('Email vé đã được gửi thành công!');
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
        notificationCtx.success('Trạng thái giao dịch đã được chuyển sang "Đã thanh toán" thành công!');
        window.location.reload();
      }
    } catch (error) {
      notificationCtx.error('Có lỗi xảy ra khi cập nhật trạng thái giao dịch:', error);
    }
  };


  const setTransactionRefundStatus = async (eventId: number, transactionId: number) => {
    try {
      const response: AxiosResponse = await baseHttpServiceInstance.put(
        `/event-studio/events/${eventId}/transactions/${transactionId}/set-refund-for-transaction`
      );

      if (response.status === 200) {
        notificationCtx.success('Trạng thái giao dịch đã được chuyển sang "Đã hoàn tiền" thành công!');
      }
    } catch (error) {
      notificationCtx.error('Có lỗi xảy ra khi cập nhật trạng thái hoàn tiền:', error);
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
        <Typography variant="h4">Chi tiết vé của {transaction.name}</Typography>
      </div>
      <Grid container spacing={3}>
        <Grid lg={5} md={5} xs={12} spacing={3}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title="Thanh toán" />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Trạng thái vé:</Typography>
                    <Chip color={statusDetails.color} label={statusDetails.label} />
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
                  {transaction.transactionShowTicketCategories.map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                      {/* Show Name */}
                      <Grid sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Show:</Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{category.showTicketCategory.show.name}</Typography>
                      </Grid>

                      {/* Ticket Category Name */}
                      <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1">Loại vé:</Typography>
                        </Stack>
                        <Typography variant="body1">{category.showTicketCategory.ticketCategory.name}</Typography>
                      </Grid>

                      {/* Loop through tickets for this category */}
                      {category.tickets.map((ticket, ticketIndex) => (
                        <Grid key={ticketIndex} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">Người tham dự {ticketIndex + 1}:</Typography>
                          </Stack>
                          <Typography variant="body1">{ticket.holder}</Typography>
                        </Grid>
                      ))}
                      <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <TagIcon fontSize="var(--icon-fontSize-md)" />
                          <Typography variant="body1">Đơn giá:</Typography>
                        </Stack>
                        <Typography variant="body1">{formatPrice(category.netPricePerOne || 0)}</Typography>
                      </Grid>

                      <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <HashIcon fontSize="var(--icon-fontSize-md)" />
                          <Typography variant="body1">Số lượng:</Typography>
                        </Stack>
                        <Typography variant="body1">{category.tickets.length}</Typography>
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
                      <InputLabel>Tên người mua</InputLabel>
                      <OutlinedInput
                        value={formData.name}
                        onChange={handleFormChange}
                        name="name"
                        label="Tên người mua"
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
                        onChange={handleFormChange}
                        name="phoneNumber"
                        label="Số điện thoại"
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Địa chỉ</InputLabel>
                      <OutlinedInput
                        value={formData.address}
                        onChange={handleFormChange}
                        name="address"
                        label="Địa chỉ"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Hành động" />
              <Divider />
              <CardContent>
                <Grid container justifyContent="space-between">
                  <FormControl fullWidth required>
                    <InputLabel>Thay đổi trạng thái vé</InputLabel>
                    <Select
                      label="Thay đổi trạng thái vé"
                      name="status"
                      defaultValue=''
                      value={formData.status}
                      onChange={handleFormChange}
                    >
                      <MenuItem value="customer_cancelled">Huỷ bởi Khách hàng</MenuItem>
                      <MenuItem value="staff_locked">Khoá bởi Nhân viên</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Stack spacing={2} direction={'row'}>
                  {transaction.status === 'normal' && transaction.paymentStatus === 'paid' && (
                    <Button onClick={resendTicketEmail} size="small" startIcon={<EnvelopeSimpleIcon />}>
                      Gửi Email vé
                    </Button>
                  )}
                  {transaction.status === 'normal' &&
                    transaction.paymentMethod === 'napas247' &&
                    transaction.paymentStatus === 'waiting_for_payment' && (
                      <Button onClick={resendInstructionNapas247Email}
                        size="small"
                        startIcon={<EnvelopeSimpleIcon />}
                      >
                        Gửi Hướng dẫn thanh toán
                      </Button>
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
                        Chuyển trạng thái "Đã hoàn tiền"
                      </Button>
                    )}

                </Stack>
              </CardContent>
            </Card>


            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button type="submit" variant="contained" onClick={updateTransaction}>
                Lưu
              </Button>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
