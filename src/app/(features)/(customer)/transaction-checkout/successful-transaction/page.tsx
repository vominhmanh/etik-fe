'use client';

import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Box, Chip, Stack, Tooltip, Checkbox, FormControl, InputLabel, OutlinedInput, FormGroup, FormControlLabel, RadioGroup, Radio } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Bank as BankIcon, Info, Lightning as LightningIcon, Money as MoneyIcon, Ticket, WarningCircle } from '@phosphor-icons/react/dist/ssr'; // Example icons
import { Coins as CoinsIcon } from '@phosphor-icons/react/dist/ssr/Coins';
import { SealPercent as SealPercentIcon } from '@phosphor-icons/react/dist/ssr/SealPercent';
import { StackPlus as StackPlusIcon } from '@phosphor-icons/react/dist/ssr/StackPlus';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import { LocalizedLink } from '@/components/localized-link';

import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/contexts/locale-context';
import { parseE164Phone, PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY } from '@/config/phone-countries';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
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
  exportedTicketAt: string | null;                // The date the transaction was created
  sentPaymentInstructionAt: string | null;                // The date the transaction was created
  createdSource: string;            // Source of the transaction creation
  creator: Creator | null;          // Related creator of the transaction, nullable
  cancelRequestStatus: string | null;
  qrOption: string;
  // Event info for runtime form lookup
  event?: {
    slug: string;
    name: string;
    organizer: string;
  };
  // Dynamic checkout form answers (ETIK Forms)
  formAnswers?: Record<string, any>;
  checkoutFormFields?: CheckoutRuntimeField[];
}


export interface ECodeResponse {
  eCode: string;
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

export default function Page(): React.JSX.Element {
  const { tt } = useTranslation();

  React.useEffect(() => {
    document.title = tt("Giao dịch thành công", "Transaction Successful") + " | ETIK - " + tt("Vé điện tử & Quản lý sự kiện", "E-Tickets & Event Management");
  }, [tt]);

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [eCode, setECode] = useState<string | null>(null);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [checkoutFormFields, setCheckoutFormFields] = useState<CheckoutRuntimeField[]>([]);

  const builtinInternalNames = React.useMemo(
    () => new Set(['name', 'email', 'phone_number', 'address', 'dob', 'idcard_number']),
    []
  );

  const customCheckoutFields = React.useMemo(
    () => checkoutFormFields.filter((f) => !builtinInternalNames.has(f.internal_name)),
    [checkoutFormFields, builtinInternalNames]
  );

  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const transactionId = searchParams.get('transaction_id');

  // Helper functions that use tt
  const getPaymentMethodDetails = React.useCallback((paymentMethod: string) => {
    switch (paymentMethod) {
      case 'cash':
        return { label: tt('Tiền mặt', 'Cash'), icon: <MoneyIcon /> };
      case 'transfer':
        return { label: tt('Chuyển khoản', 'Bank Transfer'), icon: <BankIcon /> };
      case 'napas247':
        return { label: 'Napas 247', icon: <LightningIcon /> };
      default:
        return { label: 'Unknown', icon: undefined };
    }
  }, [tt]);

  const getCreatedSource = React.useCallback((paymentMethod: string): { label: string } => {
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
  }, []);

  const getPaymentStatusDetails = React.useCallback((
    paymentStatus: string
  ): { label: string; color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
    switch (paymentStatus) {
      case 'waiting_for_payment':
        return { label: tt('Chờ thanh toán', 'Waiting for payment'), color: 'warning' };
      case 'paid':
        return { label: tt('Đã thanh toán', 'Paid'), color: 'success' };
      case 'refund':
        return { label: tt('Đã hoàn tiền', 'Refunded'), color: 'secondary' };
      default:
        return { label: 'Unknown', color: 'default' };
    }
  }, [tt]);

  const getRowStatusDetails = React.useCallback((status: string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
    switch (status) {
      case 'normal':
        return { label: tt('Bình thường', 'Normal'), color: 'success' };
      case 'wait_for_response':
        return { label: tt('Đang chờ', 'Waiting'), color: 'warning' };
      case 'wait_for_transfering':
        return { label: tt('Chờ chuyển nhượng', 'Waiting for Transfer'), color: 'warning' };
      case 'transfered':
        return { label: tt('Đã chuyển nhượng', 'Transferred'), color: 'error' };
      case 'customer_cancelled':
        return { label: tt('Huỷ bởi KH', 'Cancelled by customer'), color: 'error' };
      case 'staff_locked':
        return { label: tt('Khoá bởi NV', 'Locked by staff'), color: 'error' };
      default:
        return { label: 'Unknown', color: 'default' };
    }
  }, [tt]);

  const getSentEmailTicketStatusDetails = React.useCallback((status: string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
    switch (status) {
      case 'sent':
        return { label: tt('Đã xuất', 'Exported'), color: 'success' };
      case 'not_sent':
        return { label: tt('Chưa xuất', 'Not exported'), color: 'default' };
      default:
        return { label: 'Unknown', color: 'default' };
    }
  }, [tt]);

  // Fetch transaction details
  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!token || !transactionId) return;

      try {
        setIsLoading(true);
        const response: AxiosResponse<Transaction> = await baseHttpServiceInstance.get(
          `/customers/transactions/${transactionId}?token=${token}`
        );
        setTransaction(response.data);
        setCheckoutFormFields(response.data.checkoutFormFields || []);
      } catch (error) {
        notificationCtx.error(tt('Lỗi:', 'Error:'), error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [transactionId, token, tt, notificationCtx]);


  // Fetch check-in eCode
  useEffect(() => {
    const fetchCheckInECode = async () => {
      if (!token || !transactionId) return <React.Suspense fallback={<div>Loading...</div>}></React.Suspense>; // Ensure token exists before making the request
      try {
        setIsLoading(true);
        const response: AxiosResponse<ECodeResponse> = await baseHttpServiceInstance.get(
          `/customers/transactions/${transactionId}/check-in-e-code?token=${token}`
        );
        setECode(response.data.eCode);
      } catch (error) {
        // notificationCtx.error('Error fetching eCode', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCheckInECode();
  }, [transactionId, token]);


  const paymentMethodDetails = React.useMemo(() => getPaymentMethodDetails(transaction?.paymentMethod || ''), [transaction, getPaymentMethodDetails]);
  const paymentStatusDetails = React.useMemo(() => getPaymentStatusDetails(transaction?.paymentStatus || ''), [transaction, getPaymentStatusDetails]);
  const statusDetails = React.useMemo(() => getRowStatusDetails(transaction?.status || ''), [transaction, getRowStatusDetails]);
  const createdSource = React.useMemo(() => getCreatedSource(transaction?.createdSource || ''), [transaction, getCreatedSource]);

  return (
    <Stack spacing={3}>
      <Card sx={{
        scrollBehavior: 'smooth',
        backgroundColor: '#d1f9db',
        backgroundImage: `linear-gradient(356deg, #d1f9db 0%, #fffed9 100%)`,
      }}>
        <CardContent>
          <Stack spacing={3} direction={{ sm: 'row', xs: 'column' }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '150px', height: '150px', borderRadius: '20px', }}>
                <DotLottieReact
                  src="/assets/animations/ticket-gold.lottie"
                  loop
                  width={'100%'}
                  height={'100%'}
                  style={{
                    borderRadius: '20px'
                  }}
                  autoplay
                />
              </div>
            </div>

            <Stack spacing={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '450px', maxWidth: '100%' }}>
              <Typography variant="h5">{tt('Mua vé thành công !', 'Ticket purchase successful!')}</Typography>
              <Typography variant="body1" sx={{ textAlign: 'justify' }}>{tt('Cảm ơn quý khách đã sử dụng ETIK, dưới đây là vé mời của quý khách.', 'Thank you for using ETIK, below are your tickets.')}</Typography>
              <Typography variant="body2" sx={{ textAlign: 'justify' }}>{tt('Hãy', 'Please')} <b>{tt('chụp màn hình', 'take a screenshot')}</b> {tt('mã QR để sử dụng khi check-in. Quý khách có thể', 'of the QR code to use for check-in. You can')} <a style={{ textDecoration: 'none' }} target='_blank'
                href="/auth/login">{tt('đăng ký/ đăng nhập', 'register/login')}</a> {tt('bằng email mua vé để xem lại vé đã mua.', 'using your purchase email to view your purchased tickets.')}</Typography>
              <Typography variant="body2" sx={{ textAlign: 'justify' }}>{tt('Nếu quý khách cần hỗ trợ thêm, vui lòng gửi yêu cầu hỗ trợ', 'If you need additional support, please submit a support request')} <a style={{ textDecoration: 'none' }} target='_blank' href="https://forms.gle/2mogBbdUxo9A2qRk8">{tt('tại đây.', 'here.')}</a></Typography>
            </Stack>
          </Stack>

        </CardContent>
      </Card>
      {isLoading && <CircularProgress color="inherit" />}
      {transaction &&
        <>
          <div>
            <Typography variant="h4">{tt('Chi tiết đơn hàng của', 'Order details for')} {transaction.name}</Typography>
          </div>
          <Grid container spacing={3}>
            <Grid lg={5} md={5} xs={12} spacing={3}>
              <Stack spacing={3}>

                <Card>
                  <CardHeader title={tt('Thanh toán', 'Payment')} />
                  <Divider />
                  <CardContent>
                    <Stack spacing={2}>
                      <Grid container justifyContent="space-between">
                        <Typography variant="body1">{tt('Trạng thái đơn:', 'Order status:')}</Typography>
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
                        <Typography variant="body1">{tt('Phương thức thanh toán:', 'Payment method:')}</Typography>
                        <Chip icon={paymentMethodDetails.icon} label={paymentMethodDetails.label} />
                      </Grid>
                      <Grid container justifyContent="space-between">
                        <Typography variant="body1">{tt('Trạng thái thanh toán:', 'Payment status:')}</Typography>
                        <Chip label={paymentStatusDetails.label} color={paymentStatusDetails.color} />
                      </Grid>
                      <Grid container justifyContent="space-between">
                        <Typography variant="body1">{tt('Trạng thái xuất vé:', 'Ticket export status:')}</Typography>
                        <Chip
                          color={getSentEmailTicketStatusDetails(transaction?.exportedTicketAt ? 'sent' : 'not_sent').color}
                          label={getSentEmailTicketStatusDetails(transaction?.exportedTicketAt ? 'sent' : 'not_sent').label}
                        />
                      </Grid>
                      <Grid container justifyContent="space-between">
                        <Typography variant="body1">{tt('Tổng số tiền:', 'Total amount:')}</Typography>
                        <Chip
                          icon={<MoneyIcon />}
                          label={`${transaction.totalAmount.toLocaleString()} VND`}
                          color="success"
                        />
                      </Grid>
                    </Stack>
                  </CardContent>
                </Card>
                {eCode && (
                  <Card sx={{
                    scrollBehavior: 'smooth',
                    backgroundColor: '#d1f9db',
                    backgroundImage: `linear-gradient(356deg, #d1f9db 0%, #fffed9 100%)`,
                  }}>
                    <CardHeader title={tt('Mã QR check-in', 'Check-in QR code')} subheader={tt('Vui lòng bảo mật mã QR check-in', 'Please keep your check-in QR code secure')} />
                    <Divider />
                    <CardContent>
                      <Stack spacing={1} sx={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '100px' }}>
                          <Box component="img" src={`https://api.qrserver.com/v1/create-qr-code/?margin=16&size=100x100&data=${eCode}`} />
                        </div>
                        <Typography sx={{ textAlign: 'center' }}>{eCode}</Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                )}
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
                              <Typography variant="body1">{tt('Hạn thanh toán:', 'Payment deadline:')}</Typography>
                              <Typography variant="body1">
                                {dayjs(transaction.paymentDueDatetime || 0).format('HH:mm:ss DD/MM/YYYY')}
                              </Typography>
                            </Grid>
                            <Grid container justifyContent="space-between">
                              <Typography variant="body1">{tt('Trang thanh toán:', 'Payment page:')}</Typography>
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
                            <Typography variant="body1">{tt('Thời gian thanh toán:', 'Payment time:')}</Typography>
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
                          <Typography variant="body1">{tt('Thời gian gửi hướng dẫn t.toán:', 'Payment Instructions Sent:')}</Typography>
                        </Stack>
                        <Typography variant="body1">
                          {transaction.sentPaymentInstructionAt ? dayjs(transaction.sentPaymentInstructionAt).format('HH:mm:ss DD/MM/YYYY') : tt("Chưa gửi", "Not sent")}
                        </Typography>
                      </Grid>
                      {/* exportedTicketAt */}
                      <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
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
                {transaction.ticketQuantity > 1 && (
                  <Card>
                    <CardHeader title={tt('Tùy chọn bổ sung', 'Additional Options')} />
                    <Divider />
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Stack>
                          <Typography variant="body2">{tt('Sử dụng mã QR riêng cho từng vé', 'Use separate QR code for each ticket')}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {tt('Bạn cần nhập thông tin cho từng vé.', 'You need to enter information for each ticket.')}
                          </Typography>
                        </Stack>
                        <Checkbox
                          checked={transaction.qrOption === 'separate'}
                          disabled
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader title={tt('Thông tin người mua vé', 'Buyer Information')} />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      {/* Built-in fields driven by checkout runtime config */}
                      {(() => {
                        const nameCfg = checkoutFormFields.find((f) => f.internal_name === 'name');
                        const visible = !!nameCfg && nameCfg.visible;
                        const label =
                          nameCfg?.label || tt('Tên người mua', 'Buyer Name');
                        return (
                          visible && (
                            <Grid md={6} xs={12}>
                              <FormControl fullWidth required>
                                <InputLabel>{label}</InputLabel>
                                <OutlinedInput value={transaction.name} disabled label={label} />
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
                              <Ticket fontSize="var(--icon-fontSize-md)" />
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
                                <Box key={ticketIndex} sx={{ ml: 3, pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
                                  {transaction.qrOption === 'separate' && (
                                    <>
                                      <div>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                          {ticketIndex + 1}. {ticket.holderName ? `${ticket.holderTitle || ''} ${ticket.holderName}`.trim() : tt('Chưa có thông tin', 'No information')}
                                        </Typography>
                                      </div>
                                      <div>
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
                                      </div>
                                    </>
                                  )}
                                  <div>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>TID-{ticket.id} {ticket.checkInAt ? `${tt('Check-in lúc', 'Checked in at')} ${dayjs(ticket.checkInAt || 0).format('HH:mm:ss DD/MM/YYYY')}` : tt('Chưa check-in', 'Not checked in')}</Typography>
                                  </div>
                                </Box>
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

              </Stack>
            </Grid>
          </Grid>
        </>}
    </Stack>
  );
}
