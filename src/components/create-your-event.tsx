"use client"
import Image from "next/image";
import Stripes from "@/images/stripes-dark.svg";
import { useState } from "react";
import { AxiosResponse } from "axios";
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import NotificationContext from "@/contexts/notification-context";
import React from "react";
import { Modal, Card, CardContent, Typography, FormControl, InputLabel, OutlinedInput, FormHelperText, Button, Backdrop, CircularProgress } from "@mui/material";
import { Container, Stack } from "@mui/system";
import { useRouter } from 'next/navigation';
import { useUser } from "@/hooks/use-user";
import { AuthRes } from "@/types/auth";
import { authClient } from "@/lib/auth/client";
import { eventNames } from "process";
import { User } from '@/types/auth';
import { useTranslation } from '@/contexts/locale-context';

type EventCreatedResponse = {
  eventId: number;
  message: string;
};

export default function CreateYourEvent() {
  const { tt, locale } = useTranslation();
  const notificationCtx = React.useContext(NotificationContext);
  const router = useRouter(); // Use useRouter from next/navigation
  const [formData, setFormData] = useState({
    eventName: "",
    organizer: "",
    organizerEmail: "",
    organizerPhoneNumber: "",
  });
  const [passwordInput, setPasswordInput] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [isVerifyOtpStep, setIsVerifyOtpStep] = useState(false)
  const [isLoading, setIsLoading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);
  const [otpAndPasswordModalOpen, setOtpAndPasswordModalOpen] = useState<boolean>(false);
  const { checkSession, user } = useUser();
  const [loggedUser, setLoggedUser] = React.useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);


  React.useEffect(() => {
    const fetchUser = async () => {
      setLoggedUser(user);
      if (user) {
        setFormData((prevData) => ({ ...prevData, organizerEmail: user.email, organizerPhoneNumber: user.phoneNumber }));
      }
    };

    fetchUser();

  }, [user]);

  // Handle input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle form submit
  const handleStartCreateEventStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    // Kiểm tra dữ liệu form
    if (!formData.eventName || formData.eventName.trim() === '') {
      setError(tt('Tên sự kiện là bắt buộc', 'Event name is required'));
      return;
    }

    if (!formData.organizer || formData.organizer.trim() === '') {
      setError(tt('Tên đơn vị tổ chức là bắt buộc', 'Organizer name is required'));
      return;
    }

    if (!formData.organizerEmail || !validateEmail(formData.organizerEmail)) {
      setError(tt('Email đơn vị tổ chức không hợp lệ', 'Invalid organizer email'));
      return;
    }

    if (
      !formData.organizerPhoneNumber
    ) {
      setError(tt('Số điện thoại không hợp lệ', 'Invalid phone number'));
      return;
    }

    try {
      setIsLoading(true);
      const response: AxiosResponse<{ status: 'not_logged_in' | 'logged_in' | 'not_registered' }> = await baseHttpServiceInstance.post(
        "/homepages/check-account-status",
        { email: formData.organizerEmail }
      );
      const accountStatus = response.data.status;
      if (accountStatus === 'logged_in') {
        // call api create event
        handleCreateEvent()
      } else if (accountStatus === 'not_logged_in') {
        // show popup modal with password, 
        setPasswordModalOpen(true)
      } else if (accountStatus === 'not_registered') {
        // show popup modal with otp and password, 
        setOtpAndPasswordModalOpen(true)
        // if user enters password, then call api signup, if signup success, then call api create event
      }
    } catch (error: any) {
      setError(error?.response?.data?.message || tt('Đã xảy ra lỗi khi tạo sự kiện', 'An error occurred while creating the event'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    // Using httpOnly cookie auth; no token check client-side

    // Kiểm tra dữ liệu form
    if (!formData.eventName || formData.eventName.trim() === '') {
      setError(tt('Tên sự kiện là bắt buộc', 'Event name is required'));
      return;
    }

    if (!formData.organizer || formData.organizer.trim() === '') {
      setError(tt('Tên đơn vị tổ chức là bắt buộc', 'Organizer name is required'));
      return;
    }

    if (!formData.organizerEmail || !validateEmail(formData.organizerEmail)) {
      setError(tt('Email đơn vị tổ chức không hợp lệ', 'Invalid organizer email'));
      return;
    }

    if (
      !formData.organizerPhoneNumber
    ) {
      setError(tt('Số điện thoại không hợp lệ', 'Invalid phone number'));
      return;
    }

    try {
      setIsLoading(true);
      const response: AxiosResponse<EventCreatedResponse> = await baseHttpServiceInstance.post(
        '/event-studio/events',
        {
          name: formData.eventName,
          organizer: formData.organizer,
          organizerEmail: formData.organizerEmail,
          organizerPhoneNumber: formData.organizerPhoneNumber,
        }
      );

      if (response.data) {
        const path = '/event-studio/events/';
        router.push(locale === 'en' ? `/en${path}` : path); // Điều hướng đến trang khác nếu thành công
      } else {
        setError(response.statusText || tt('Có lỗi không xác định xảy ra', 'An unknown error occurred'));
      }
    } catch (error: any) {
      setError(error?.response?.data?.message || tt('Đã xảy ra lỗi khi tạo sự kiện', 'An error occurred while creating the event'));
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm phụ để kiểm tra email hợp lệ
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };


  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      const res: AuthRes = await authClient.signInWithPassword({
        username: formData.organizerEmail,
        password: passwordInput,
      });
      handleCreateEvent()
      // router.refresh();
    } catch (error: any) {
      setError(error.message || tt("Xảy ra lỗi khi tạo sự kiện", "An error occurred while creating the event"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    try {
      const res: AuthRes = await authClient.signUp({
        fullName: formData.organizer,
        email: formData.organizerEmail,
        phoneNumber: formData.organizerPhoneNumber,
        password: passwordInput,
      });

      setIsVerifyOtpStep(true) 
      // router.refresh();
    } catch (error: any) {
      setError(error.message || tt("Xảy ra lỗi khi đăng ký", "An error occurred during registration"));
    } finally {
      setIsLoading(false);
    }
  }

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      const res: AuthRes = await authClient.verifyOtp(formData.organizerEmail, otpInput || ""); // Call verify API
      handleCreateEvent()
    } catch (error: any) {
      setError(error.message || tt("Xảy ra lỗi khi xác thực OTP", "An error occurred while verifying OTP"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
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
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div
          className="relative overflow-hidden rounded-2xl text-center shadow-xl before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:bg-gray-900"
          data-aos="zoom-y-out"
        >
          {/* Glow */}
          <div
            className="absolute bottom-0 left-1/2 -z-10 -translate-x-1/2 translate-y-1/2"
            aria-hidden="true"
          >
            <div className="h-56 w-[480px] rounded-full border-[20px] border-blue-500 blur-3xl" />
          </div>
          {/* Stripes illustration */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 -z-10 -translate-x-1/2 transform"
            aria-hidden="true"
          >
            <Image
              className="max-w-none"
              src={Stripes}
              width={768}
              height={432}
              alt="Stripes"
            />
          </div>
          <div className="px-4 py-12 md:px-12 md:py-20">
            <h2 className="mb-6 border-y text-3xl font-bold text-gray-200 [border-image:linear-gradient(to_right,transparent,theme(colors.slate.700/.7),transparent)1] md:mb-12 md:text-4xl">
              {tt("Bắt đầu tạo sự kiện của bạn với ETIK", "Start creating your event with ETIK")}
            </h2>

            <div
              className="grid grid-cols-12 gap-4 lg:col-span-6"
              data-aos="zoom-y-out"
              data-aos-delay={150}
            >
              <div className="col-span-12 sm:col-span-6">
                <input
                  type="text"
                  id="name"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
                  placeholder={tt("Nhập tên sự kiện", "Enter event name")}
                  required
                />
              </div>
              <div className="col-span-12 sm:col-span-6">
                <input
                  type="text"
                  id="organizer"
                  name="organizer"
                  value={formData.organizer}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
                  placeholder={tt("Nhập đơn vị tổ chức", "Enter organizer name")}
                  required
                />
              </div>
              <div className="col-span-12 sm:col-span-6">
                <input
                  type="organizerEmail"
                  id="organizerEmail"
                  name="organizerEmail"
                  value={formData.organizerEmail}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
                  placeholder={tt("Nhập email của bạn", "Enter your email")}
                  required
                />
              </div>
              <div className="col-span-12 sm:col-span-6">
                <input
                  type="tel"
                  id="organizerPhoneNumber"
                  name="organizerPhoneNumber"
                  value={formData.organizerPhoneNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
                  placeholder={tt("Nhập số điện thoại", "Enter phone number")}
                  required
                />
              </div>
            </div>

            <div className="mt-6 mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center">
              <a
                className="btn group mb-4 w-full bg-gradient-to-t from-blue-600 to-blue-500 bg-[length:100%_100%] bg-[bottom] text-white shadow hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                href="#0"
                onClick={handleStartCreateEventStep1}
              >
                <span className="relative inline-flex items-center">
                  {tt("Tạo sự kiện ngay", "Create Event Now")}
                  <span className="ml-1 tracking-normal text-blue-300 transition-transform group-hover:translate-x-0.5">
                    -&gt;
                  </span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
      <Modal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)}>
        <Container maxWidth="xl">
          <Card sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { sm: '500px', xs: '90%' }, bgcolor: 'background.paper', boxShadow: 24 }}>
            <CardContent>
              <Stack spacing={4}>
                <Typography variant="h5">{tt("Đăng nhập để tạo sự kiện", "Login to Create Event")}</Typography>
                <Stack spacing={2}>
                  <Typography variant='body2'>{tt("Bạn đã đăng ký tài khoản ETIK trước đây. Vui lòng đăng nhập với email", "You have registered an ETIK account before. Please login with email")} <b>{formData.organizerEmail}</b> {tt("để tiếp tục.", "to continue.")}</Typography>

                  <FormControl fullWidth>
                    <InputLabel>{tt("Nhập mật khẩu", "Enter Password")}</InputLabel>
                    <OutlinedInput
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      label={tt("Nhập mật khẩu", "Enter Password")}
                      type="password"
                    />
                  </FormControl>

                  <Button variant="contained" onClick={handleSignIn} disabled={isLoading}>
                    {tt("Tạo sự kiện", "Create Event")}
                  </Button>

                  
                  <Button
                    variant="outlined"
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        await authClient.signInWithOAuthPopup({ provider: 'google' });
                        await checkSession();
                        await handleCreateEvent();
                        setPasswordModalOpen(false);
                      } catch (e: any) {
                        setError(e?.message || tt('Đăng nhập Google thất bại, vui lòng thử lại.', 'Google login failed, please try again.'));
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    sx={{ textTransform: 'none' }}
                    startIcon={
                      <svg width="20" height="20" viewBox="0 0 20 20" style={{ display: 'block' }}>
                        <g>
                          <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.48a4.68 4.68 0 0 1-2.03 3.07v2.55h3.28c1.92-1.77 3.03-4.38 3.03-7.41z" fill="#4285F4" />
                          <path d="M10 20c2.7 0 4.97-.9 6.63-2.44l-3.28-2.55c-.91.61-2.07.97-3.35.97-2.57 0-4.75-1.74-5.53-4.07H1.06v2.6A9.99 9.99 0 0 0 10 20z" fill="#34A853" />
                          <path d="M4.47 11.91A5.99 5.99 0 0 1 4.01 10c0-.66.11-1.31.26-1.91V5.49H1.06A9.99 9.99 0 0 0 0 10c0 1.64.39 3.19 1.06 4.51l3.41-2.6z" fill="#FBBC05" />
                          <path d="M10 4.01c1.47 0 2.78.51 3.81 1.5l2.85-2.85C14.97 1.13 12.7.01 10 .01A9.99 9.99 0 0 0 1.06 5.49l3.41 2.6C5.25 5.75 7.43 4.01 10 4.01z" fill="#EA4335" />
                        </g>
                      </svg>
                    }
                  >
                    {tt("Hoặc sử dụng Google để đăng nhập và tạo", "Or use Google to login and create")}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>
      <Modal open={otpAndPasswordModalOpen} onClose={() => setOtpAndPasswordModalOpen(false)}>
        <Container maxWidth="xl">
          <Card sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { sm: '500px', xs: '90%' }, bgcolor: 'background.paper', boxShadow: 24 }}>
            <CardContent>
              <Stack spacing={4}>
                <Typography variant="h5">{tt("Bước xác thực", "Verification Step")}</Typography>
                <Stack spacing={2}>

                  <FormControl fullWidth>
                    <InputLabel>{tt("Tạo mật khẩu của bạn", "Create Your Password")}</InputLabel>
                    <OutlinedInput
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      type="password"
                      label={tt("Tạo mật khẩu của bạn", "Create Your Password")}
                    />
                  </FormControl>

                  {isVerifyOtpStep &&
                    <>
                      <Typography variant='body2'>{tt("Kiểm tra email của bạn và điền mã OTP để hoàn tất.", "Check your email and enter the OTP code to complete.")}</Typography>
                      <FormControl>
                        <InputLabel>{tt("Nhập mã OTP", "Enter OTP Code")}</InputLabel>
                        <OutlinedInput
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          label={tt("Nhập mã OTP", "Enter OTP Code")}
                        />
                      </FormControl>
                    </>
                  }


                  {!isVerifyOtpStep ?
                    <Button variant="contained" onClick={() => { handleSignUp() }} disabled={isLoading}>
                      {tt("Tiếp theo", "Next")}
                    </Button>
                    :
                    // call api register, then call api create event 
                    <Button variant="contained" onClick={handleVerifyOtp} disabled={isLoading}>
                      {tt("Tạo sự kiện", "Create Event")}
                    </Button>
                  }
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>
      <Modal open={!!error} onClose={() => setError(null)}>
        <Container maxWidth="sm">
          <Card
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              padding: 4,
            }}
          >
            <CardContent>
              <Typography variant="h6" color="error">
                {tt("Lỗi", "Error")}
              </Typography>
              <Typography variant="body1">{error}</Typography>
              <Button
                sx={{ mt: 2 }}
                variant="contained"
                color="primary"
                onClick={() => setError(null)}
              >
                {tt("Đóng", "Close")}
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Modal>
    </section >
  );
}
