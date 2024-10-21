'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Grid from '@mui/material/Unstable_Grid2';
import { Stack, Chip, MenuItem, Select } from '@mui/material';
import axios, { AxiosResponse } from 'axios';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Money as MoneyIcon, Bank as BankIcon, Lightning as LightningIcon } from '@phosphor-icons/react/dist/ssr'; // Example icons
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { Coins as CoinsIcon } from '@phosphor-icons/react/dist/ssr/Coins';
import { Hash as HashIcon } from '@phosphor-icons/react/dist/ssr/Hash';
import { StackPlus as StackPlusIcon } from '@phosphor-icons/react/dist/ssr/StackPlus';
import { SealPercent as SealPercentIcon } from '@phosphor-icons/react/dist/ssr/SealPercent';
import { EnvelopeSimple as EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';

import dayjs from 'dayjs';

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
    case 'initial':
      return { label: 'Khởi tạo', color: 'default' };
    case 'active':
      return { label: 'Khả dụng', color: 'success' };
    case 'customer_cancelled':
      return { label: 'Huỷ bởi KH', color: 'error' }; // error for danger
    case 'staff_locked':
      return { label: 'Khoá bởi NV', color: 'error' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};
export interface Ticket {
  id: number;
  holder: string;
  createdAt: string;
  checkInAt: string | null;
}

export interface TicketCategory {
  id: number;
  name: string;
  type: string;
  price: number;
  avatar: string | null;
  quantity: number;
  sold: number;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  eventId: number;
  customerId: number;
  email: string;
  name: string;
  gender: string;
  phoneNumber: string;
  address: string;
  dob: string | null;
  ticketCategory: TicketCategory;
  ticketQuantity: number;
  netPricePerOne: number;
  extraFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentOrderCode: string | null;
  paymentDueDatetime: string | null;
  paymentCheckoutUrl: string | null;
  paymentTransactionDatetime: string | null;
  note: string | null;
  status: string;
  createdBy: number;
  createdAt: string;
  tickets: Ticket[];
}


export default function Page({ params }: { params: { event_id: number, transaction_id: number } }): React.JSX.Element {
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  const { event_id, transaction_id } = params;

  // Fetch transaction details
  useEffect(() => {
    const fetchTransactionDetails = async () => {
      try {
        const response: AxiosResponse<Transaction> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/transactions/${transaction_id}`
        );
        setTransaction(response.data);
      } catch (error) {
        console.error('Error fetching transaction details:', error);
      }
    };

    fetchTransactionDetails();
  }, [event_id, transaction_id]);

  if (!transaction) {
    return <Typography>Loading...</Typography>;
  }

  const paymentMethodDetails = getPaymentMethodDetails(transaction.paymentMethod);
  const paymentStatusDetails = getPaymentStatusDetails(transaction.paymentStatus);
  const statusDetails = getRowStatusDetails(transaction.status);

  return (
    <Stack spacing={3}>
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
                    <Chip
                      color={statusDetails.color}
                      label={statusDetails.label}
                    />
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Phương thức thanh toán:</Typography>
                    <Chip
                      icon={paymentMethodDetails.icon}
                      label={paymentMethodDetails.label}
                    />
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Trạng thái thanh toán:</Typography>
                    <Chip
                      label={paymentStatusDetails.label}
                      color={paymentStatusDetails.color}
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
              <CardHeader title="Chi tiết" />
              <Divider />
              <CardContent>
                <Stack spacing={0}>
                  {/* Ticket Category */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <TicketIcon fontSize="var(--icon-fontSize-md)" />
                      <Typography variant="body1">Loại vé:</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {transaction.ticketCategory?.name || 'Chưa xác định'}
                    </Typography>
                  </Grid>

                  {/* Unit Price */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <TagIcon fontSize="var(--icon-fontSize-md)" />
                      <Typography variant="body1">Đơn giá:</Typography>
                    </Stack>
                    <Typography variant="body1">{formatPrice(transaction.ticketCategory?.price || 0)}</Typography>
                  </Grid>

                  {/* Ticket Quantity */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <HashIcon fontSize="var(--icon-fontSize-md)" />
                      <Typography variant="body1">Số lượng:</Typography>
                    </Stack>
                    <Typography variant="body1">{transaction.ticketQuantity}</Typography>
                  </Grid>

                  {/* Extra Fee */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <StackPlusIcon fontSize="var(--icon-fontSize-md)" />
                      <Typography variant="body1">Phụ phí:</Typography>
                    </Stack>
                    <Typography variant="body1">{formatPrice(transaction.extraFee || 0)}</Typography>
                  </Grid>

                  {/* Discount */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <SealPercentIcon fontSize="var(--icon-fontSize-md)" />
                      <Typography variant="body1">Giảm giá:</Typography>
                    </Stack>
                    <Typography variant="body1">{formatPrice(transaction.discount || 0)}</Typography>
                  </Grid>

                  {/* Total Amount */}
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
                        value={transaction.name}
                        disabled
                        label="Tên người mua"
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Email</InputLabel>
                      <OutlinedInput
                        value={transaction.email}
                        disabled
                        label="Email"
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Số điện thoại</InputLabel>
                      <OutlinedInput
                        value={transaction.phoneNumber}
                        disabled
                        label="Số điện thoại"
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Địa chỉ</InputLabel>
                      <OutlinedInput
                        value={transaction.address}
                        disabled
                        label="Địa chỉ"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Card>
              <CardHeader
                title="Số lượng vé"
                action={
                  <OutlinedInput
                    disabled
                    sx={{ maxWidth: 180 }}
                    type="number"
                    value={transaction.ticketQuantity}
                  />
                }
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  {transaction.tickets.map((ticket, index) => (
                    <Grid md={12} xs={12} key={index}>
                      <FormControl fullWidth required>
                        <InputLabel>Họ và tên người tham dự {index + 1}</InputLabel>
                        <OutlinedInput
                          label={`Họ và tên người tham dự ${index + 1}`}
                          value={ticket.holder}
                        // onChange={(e) => handleTicketHolderChange(index, e.target.value)}
                        />
                      </FormControl>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
            <Card>
              <CardHeader title="Hành động" />
              <Divider />
              <CardContent>
                <Grid container justifyContent="space-between">
                  <FormControl fullWidth required>
                    <InputLabel>Chọn trạng thái vé:</InputLabel>
                    <Select
                      label="Chọn trạng thái thanh toán"
                      name="type"
                    >
                      <MenuItem value="waiting_for_payment" selected>Khởi tạo</MenuItem>
                      <MenuItem value="paid">Khả dụng</MenuItem>
                      <MenuItem value="refund">Huỷ bởi Khách hàng</MenuItem>
                      <MenuItem value="refund">Khoá bởi Nhân viên</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Stack spacing={2} direction={'row'}>
                  {transaction.status === 'active' &&
                    <Button href={transaction.paymentCheckoutUrl || ""} size="small" startIcon={<EnvelopeSimpleIcon />}>
                      Gửi Email vé
                    </Button>}
                  {transaction.status === 'initial' && transaction.paymentMethod === 'napas247' && transaction.paymentStatus === 'waiting_for_payment' &&
                    <Button href={transaction.paymentCheckoutUrl || ""} size="small" startIcon={<EnvelopeSimpleIcon />}>
                      Gửi Hướng dẫn thanh toán
                    </Button>}
                </Stack>
              </CardContent>
            </Card>
            {transaction.paymentMethod === 'napas247' &&
              <Card>
                <CardHeader title="Chi tiết thanh toán Napas 247" />
                <Divider />
                <CardContent>
                  <Stack spacing={2}>
                    <Grid container justifyContent="space-between">
                      <Typography variant="body1">Payment order code:</Typography>
                      <Typography variant="body1">{transaction.paymentOrderCode}</Typography>
                    </Grid>
                    {transaction.paymentStatus === 'waiting_for_payment' &&
                      <>
                        <Grid container justifyContent="space-between">
                          <Typography variant="body1">Hạn thanh toán:</Typography>
                          <Typography variant="body1">{dayjs(transaction.paymentDueDatetime || 0).format('HH:mm:ss DD/MM/YYYY')}</Typography>
                        </Grid>
                        <Grid container justifyContent="space-between">
                          <Typography variant="body1">Trang thanh toán:</Typography>
                          <Typography variant="body1">
                            <Button href={transaction.paymentCheckoutUrl || ""} size="small" startIcon={<LightningIcon />}>
                              Đến trang thanh toán
                            </Button>
                          </Typography>
                        </Grid>
                      </>}
                    {transaction.paymentStatus === 'paid' &&
                      <Grid container justifyContent="space-between">
                        <Typography variant="body1">Thời gian thanh toán:</Typography>
                        <Typography variant="body1">{dayjs(transaction.paymentTransactionDatetime || 0).format('HH:mm:ss DD/MM/YYYY')}</Typography>
                      </Grid>
                    }

                  </Stack>
                </CardContent>
              </Card>
            }
            {transaction.paymentMethod !== 'napas247' &&
              <Card>
                <CardHeader title={`Chi tiết thanh toán ${getPaymentMethodDetails(transaction.paymentMethod).label}`} />
                <Divider />
                <CardContent>
                  <Stack spacing={2}>
                    <Grid container justifyContent="space-between">
                      <FormControl fullWidth required>
                        <InputLabel>Chọn trạng thái thanh toán:</InputLabel>
                        <Select
                          label="Chọn trạng thái thanh toán"
                          name="type"
                        >
                          <MenuItem value="waiting_for_payment" selected>Đang chờ thanh toán</MenuItem>
                          <MenuItem value="paid">Đã thanh toán</MenuItem>
                          <MenuItem value="refund">Đã hoàn tiền</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            }
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button type="submit" variant="contained">
                Lưu
              </Button>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Stack>



  );
}
