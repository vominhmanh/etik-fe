'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Box, Checkbox, Container, FormControlLabel, FormGroup, Modal, Stack } from '@mui/material';
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
import { ArrowRight, Bank as BankIcon, CheckCircle, Lightning as LightningIcon, Money as MoneyIcon } from '@phosphor-icons/react/dist/ssr'; // Example icons
import * as React from 'react';
import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';

import NotificationContext from '@/contexts/notification-context';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import CircularProgress from '@mui/material/CircularProgress';
import { blue } from '@mui/material/colors';
import { Hash as HashIcon } from '@phosphor-icons/react/dist/ssr/Hash';
import { AxiosResponse } from 'axios';
import { useSearchParams } from 'next/navigation';
import ReCAPTCHA from 'react-google-recaptcha';

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
  ticketCategory: TicketCategory;    // Ticket category information
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
  createdSource: string;            // Source of the transaction creation
  creator: Creator | null;          // Related creator of the transaction, nullable
}


export interface ECodeResponse {
  eCode: string;
}


export default function Page(): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Xác nhận tham dự & Quy định sự kiện | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const captchaRef = React.useRef<ReCAPTCHA | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [eCode, setECode] = useState<string | null>(null);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get('response_token');
  const transactionId = searchParams.get('transaction_id');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [checked, setChecked] = useState({
    agreeRules: false,
    confirmAttendance: false,
    correctInformation: false,
  });

  const handleCloseModal = (event: {}, reason: "backdropClick" | "escapeKeyDown") => {
    if (reason && reason == "backdropClick" && "escapeKeyDown")
      return;
    setModalOpen(false);
  }
  useEffect(() => {
    // Enable button only if all checkboxes are checked
    setIsButtonEnabled(checked.agreeRules && checked.correctInformation && checked.confirmAttendance);
  }, [checked]);

  const handleButtonClick = async () => {
    if (!transactionId || !token) return;
    const captchaValue = captchaRef.current?.getValue(); // Get the captcha response token

    if (!captchaValue) {
      notificationCtx.warning('Vui lòng xác nhận reCAPTCHA!');
      return;
    }

    try {
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/marketplace/special_events/mixi-cup/transactions/send-ticket-email?transaction_id=${transactionId}&response_token=${token}`, { captchaValue: captchaValue }
      );
      notificationCtx.success(response.data.message);
      setModalOpen(true);
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      captchaRef.current?.reset()
    }
  };

  const goToEkycRegister = () => {
    const redirectUrl = `https://ekyc.etik.io.vn/ekyc-register?event_slug=mixi-cup&transaction_id=${transactionId}&response_token=${token}`;
    window.location.href = redirectUrl;
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setChecked({
      ...checked,
      [event.target.name]: event.target.checked,
    });
  };
  // Fetch transaction details
  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!token || !transactionId) return <React.Suspense fallback={<div>Loading...</div>}></React.Suspense>; // Ensure token exists before making the request

      try {
        setIsLoading(true);
        const response: AxiosResponse<Transaction> = await baseHttpServiceInstance.get(
          `/marketplace/special_events/mixi-cup/transactions/get-transaction-info?transaction_id=${transactionId}&response_token=${token}`
        );
        setTransaction(response.data);
      } catch (error) {
        notificationCtx.error('Error fetching transaction details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [transactionId, token]);

  const paymentMethodDetails = React.useMemo(() => getPaymentMethodDetails(transaction?.paymentMethod || ''), [transaction]);
  const paymentStatusDetails = React.useMemo(() => getPaymentStatusDetails(transaction?.paymentStatus || ''), [transaction]);
  const statusDetails = React.useMemo(() => getRowStatusDetails(transaction?.status || ''), [transaction]);
  const createdSource = React.useMemo(() => getCreatedSource(transaction?.createdSource || ''), [transaction]);

  return (
    <>
      <Container maxWidth="xl">
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
                  <Typography variant="h5">Xác nhận tham dự & Quy định sự kiện </Typography>
                  {/* <Typography variant="body1" sx={{ textAlign: 'justify' }}></Typography> */}
                  <Typography variant="body2" sx={{ textAlign: 'justify' }}>Trân trọng cảm ơn Quý khách đã đăng ký tham gia sự kiện Mixi Cup.</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'justify' }}>Chúc mừng Quý khách đã đăng ký thành công. Để công tác tổ chức được chu đáo và đảm bảo an ninh, an toàn cho sự kiện, Quý khách vui lòng <b>kiểm tra thông tin đăng ký</b>, <b>xác nhận chắc chắn tham dự</b> và lưu ý các <b>Quy định sự kiện</b> sau đây trước khi nhận vé mời.</Typography>
                </Stack>
              </Stack>

            </CardContent>
          </Card>
          {isLoading && <CircularProgress color="inherit" />}
          {transaction &&
            <>
              <div>
                <Typography variant="h4">Chi tiết đơn hàng của {transaction.name}</Typography>
              </div>
              <Grid container spacing={3}>
                <Grid lg={5} md={5} xs={12} spacing={3}>
                  <Stack spacing={3}>
                    <Card>
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
                                  </Stack>
                                </Grid>
                              ))}
                              <Divider sx={{ marginY: 2 }} />
                            </div>
                          ))}
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
                              <OutlinedInput value={transaction.name} disabled label="Tên người mua" />
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
                    <Card>
                      <CardHeader title="Quy định sự kiện" subheader="Quý khách vui lòng đọc kỹ Quy định sự kiện sau đây" />
                      <Divider />
                      <CardContent>
                        <ol>
                          <li>Check-in đúng khán đài đã được ghi trên vé.</li>
                          <li>Vé chỉ dành cho 01 người trên 16 tuổi, không kèm trẻ em.</li>
                          <li>Vui lòng xếp hàng và xuất trình mã vé điện tử tại cổng check-in. Không chen lấn, xô đẩy trước, trong và sau sự kiện.</li>
                          <li>Vui lòng không đi vào những khu vực nội bộ, khu vực cấm trong khuôn viên sự kiện.</li>
                          <li>Không hút thuốc lá hoặc thuốc lá điện tử trong khu vực diễn ra sự kiện.</li>
                          <li>Bỏ rác đúng nơi quy định.</li>
                          <li>Trang phục lịch sự.</li>
                          <li>Khán giả vui lòng đến đúng giờ.</li>
                          <li>Không mang đồ ăn, thức uống từ bên ngoài vào khuôn viên sự kiện.</li>
                          <li>Nghiêm cấm mang theo chất kích thích, chất gây nghiện, chất gây cháy nổ, vũ khí, vật liệu sắc nhọn và vật nuôi.</li>
                          <li>Vui lòng tự bảo quản tư trang vật dụng, tài sản cá nhân khi tham gia sự kiện.</li>
                          <li>Khi tham gia sự kiện đồng nghĩa với việc người tham gia đồng ý cho phép sử dụng hình ảnh của mình để khai thác cho sản phẩm ghi hình, thu âm.</li>
                          <li>BTC có quyền từ chối sự tham gia của bất kỳ khán giả nào không tuân thủ quy định và không hoàn trả lại tiền vé.</li>
                        </ol>
                      </CardContent>
                    </Card>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={checked.agreeRules}
                            onChange={handleChange}
                            name="agreeRules"
                          />
                        }
                        label="Tôi đã đọc và đồng ý với Quy định sự kiện."
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={checked.correctInformation}
                            onChange={handleChange}
                            name="correctInformation"
                          />
                        }
                        label="Tôi xác nhận thông tin đăng ký chính xác."
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={checked.confirmAttendance}
                            onChange={handleChange}
                            name="confirmAttendance"
                          />
                        }
                        label="Tôi xác nhận chắc chắn tham dự sự kiện."
                      />
                    </FormGroup>
                    <Grid spacing={3} sx={{ alignItems: 'center', mt: '3' }}>
                      <Grid sm={8} xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', }}>
                        <ReCAPTCHA
                          sitekey="6LdRnq4aAAAAAFT6htBYNthM-ksGymg70CsoYqHR"
                          onChange={() => { }}
                          ref={captchaRef}
                        />
                      </Grid>
                      <Grid sm={4} xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          onClick={handleButtonClick}
                          disabled={!isButtonEnabled}
                        >
                          Nhận vé ngay
                        </Button>
                      </Grid>
                    </Grid>
                    <Grid spacing={3} sx={{ alignItems: 'left', mt: '3' }}>
                      <small>Nếu Quý khách gặp lỗi, vui lòng chụp màn hình và báo lỗi <a style={{ textDecoration: 'none' }} target='_blank' href="https://forms.gle/2mogBbdUxo9A2qRk8">tại đây.</a></small>
                    </Grid>
                  </Stack>
                </Grid>
              </Grid>
            </>}
        </Stack>
      </Container>
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Container maxWidth="xl">
          <Card sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { sm: '500px', xs: '90%' },
            bgcolor: 'background.paper',
            boxShadow: 24,
          }}>
            <CardHeader title="Đăng ký khuôn mặt - Check-in tức thì" />
            <CardContent>
              <Stack spacing={3} direction={{ sm: 'row', xs: 'column' }} >
                <div>
                  <Box component="img" src="/assets/inline-gate-curved.jpg" sx={{ borderRadius: '20px', maxWidth: '200px', width: '100%' }} alt="" />
                </div>
                <Stack spacing={3}>
                  <Stack spacing={1} direction={'row'}>
                    <CheckCircle fontSize="var(--icon-fontSize-lg)" color={blue[500]} />
                    <Typography variant='body2'>
                      Không cần xuất trình vé.
                    </Typography>
                  </Stack>
                  <Stack spacing={1} direction={'row'}>
                    <CheckCircle fontSize="var(--icon-fontSize-lg)" color={blue[500]} />
                    <Typography variant='body2'>
                      Nhanh chóng, tiện lợi.
                    </Typography>
                  </Stack>
                  <Stack spacing={1} direction={'row'}>
                    <CheckCircle fontSize="var(--icon-fontSize-lg)" color={blue[500]} />
                    <Typography variant='body2'>
                      An toàn, bảo mật.
                    </Typography>
                  </Stack>
                  <div style={{ marginTop: '20px' }}>
                    <Button fullWidth variant='contained' onClick={goToEkycRegister} size="small" endIcon={<ArrowRight />}>
                      Bắt đầu
                    </Button>
                    <Typography variant='body2'>
                      <small>* Bước đăng ký khuôn mặt là <b>không bắt buộc</b>. Quý khách vẫn có thể sử dụng mã QR để check-in.</small>
                    </Typography>
                  </div>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container >
      </Modal>
    </>
  );
}
