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

type EventCreatedResponse = {
  eventId: number;
  message: string;
};

export default function CreateYourEvent() {
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
  const { checkSession, setUser, getUser } = useUser();
  const [loggedUser, setLoggedUser] = React.useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);


  React.useEffect(() => {
    const fetchUser = async () => {
      const fetchedUser = getUser();
      setLoggedUser(fetchedUser);
      if (fetchedUser) {
        setFormData((prevData) => ({ ...prevData, organizerEmail: fetchedUser.email, organizerPhoneNumber: fetchedUser.phoneNumber }));
      }
    };

    fetchUser();

  }, [getUser]);

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
      setError('Tên sự kiện là bắt buộc');
      return;
    }

    if (!formData.organizer || formData.organizer.trim() === '') {
      setError('Tên đơn vị tổ chức là bắt buộc');
      return;
    }

    if (!formData.organizerEmail || !validateEmail(formData.organizerEmail)) {
      setError('Email đơn vị tổ chức không hợp lệ');
      return;
    }

    if (
      !formData.organizerPhoneNumber
    ) {
      setError('Số điện thoại không hợp lệ');
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
      setError(error?.response?.data?.message || 'Đã xảy ra lỗi khi tạo sự kiện');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    const token = localStorage.getItem('accessToken'); // Lấy token xác thực từ localStorage

    if (!token) {
      setError('Không tìm thấy token xác thực');
      return;
    }

    // Kiểm tra dữ liệu form
    if (!formData.eventName || formData.eventName.trim() === '') {
      setError('Tên sự kiện là bắt buộc');
      return;
    }

    if (!formData.organizer || formData.organizer.trim() === '') {
      setError('Tên đơn vị tổ chức là bắt buộc');
      return;
    }

    if (!formData.organizerEmail || !validateEmail(formData.organizerEmail)) {
      setError('Email đơn vị tổ chức không hợp lệ');
      return;
    }

    if (
      !formData.organizerPhoneNumber
    ) {
      setError('Số điện thoại không hợp lệ');
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
        router.push('/event-studio/events/'); // Điều hướng đến trang khác nếu thành công
      } else {
        setError(response.statusText || 'Có lỗi không xác định xảy ra');
      }
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Đã xảy ra lỗi khi tạo sự kiện');
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

      setUser(res.user);
      await checkSession?.();
      handleCreateEvent()
      // router.refresh();
    } catch (error: any) {
      setError(error.message || "Xảy ra lỗi khi tạo sự kiện");
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
      setError(error.message || "Xảy ra lỗi khi đăng ký");
    } finally {
      setIsLoading(false);
    }
  }

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      const res: AuthRes = await authClient.verifyOtp(formData.organizerEmail, otpInput || ""); // Call verify API
      setUser(res.user);
      await checkSession?.();
      handleCreateEvent()
    } catch (error: any) {
      setError(error.message || "Xảy ra lỗi khi xác thực OTP");
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
              Bắt đầu tạo sự kiện của bạn với ETIK
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
                  placeholder="Nhập tên sự kiện"
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
                  placeholder="Nhập đơn vị tổ chức"
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
                  placeholder="Nhập email của bạn"
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
                  placeholder="Nhập số điện thoại"
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
                  Tạo sự kiện ngay
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
                <Typography variant="h5">Nhập mật khẩu của bạn để tiếp tục</Typography>
                <Stack spacing={2}>
                  <Typography variant='body2'>Bạn đã đăng ký tài khoản ETIK trước đây. Vui lòng nhập mật khẩu cho email <b>{formData.organizerEmail}</b> để tiếp tục.</Typography>

                  <FormControl fullWidth>
                    <InputLabel>Nhập mật khẩu</InputLabel>
                    <OutlinedInput
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      label="Nhập mật khẩu"
                      type="password"
                    />
                  </FormControl>

                  <Button variant="contained" onClick={handleSignIn} disabled={isLoading}>
                    Tạo sự kiện
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
                <Typography variant="h5">Bước xác thực</Typography>
                <Stack spacing={2}>

                  <FormControl fullWidth>
                    <InputLabel>Tạo mật khẩu của bạn</InputLabel>
                    <OutlinedInput
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      type="password"
                      label="Tạo mật khẩu của bạn"
                    />
                  </FormControl>

                  {isVerifyOtpStep &&
                    <>
                      <Typography variant='body2'>Kiểm tra email của bạn và điền mã OTP để hoàn tất.</Typography>
                      <FormControl>
                        <InputLabel>Nhập mã OTP</InputLabel>
                        <OutlinedInput
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          label="Nhập mã OTP"
                        />
                      </FormControl>
                    </>
                  }


                  {!isVerifyOtpStep ?
                    <Button variant="contained" onClick={() => { handleSignUp() }} disabled={isLoading}>
                      Tiếp theo
                    </Button>
                    :
                    // call api register, then call api create event 
                    <Button variant="contained" onClick={handleVerifyOtp} disabled={isLoading}>
                      Tạo sự kiện
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
                Lỗi
              </Typography>
              <Typography variant="body1">{error}</Typography>
              <Button
                sx={{ mt: 2 }}
                variant="contained"
                color="primary"
                onClick={() => setError(null)}
              >
                Đóng
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Modal>
    </section >
  );
}
