'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { authClient } from '@/lib/auth/client';
import { Modal, Card, CardContent } from '@mui/material';
import { Container } from '@mui/system';
import { AxiosError, AxiosResponse } from 'axios';
import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';

type Values = {
  email: string;
  password: string;
  otp: string;
};

const defaultValues = { email: '', password: '12A@1223a@', otp: '123456' } satisfies Values;

export function ResetPasswordForm(): React.JSX.Element {
  const { tt, locale } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = React.useState<boolean>(false);
  const [showPasswordInput, setShowPasswordInput] = React.useState<boolean>(false);

  const notificationCtx = React.useContext(NotificationContext);
  
  // Helper to make path locale-aware
  const getLocalizedPath = React.useCallback((path: string): string => {
    if (locale === 'en' && !path.startsWith('/en')) {
      return `/en${path}`;
    }
    if (locale === 'vi' && path.startsWith('/en')) {
      return path.substring(3) || '/';
    }
    return path;
  }, [locale]);

  const schema = React.useMemo(() => zod.object({
    email: zod.string().email({ message: tt('Email không hợp lệ', 'Invalid email') }),
    password: zod.string()
      .min(8, { message: tt('Mật khẩu phải có ít nhất 8 ký tự', 'Password must be at least 8 characters') })
      .max(64, { message: tt('Mật khẩu không được dài hơn 64 ký tự', 'Password must not exceed 64 characters') })
      .regex(/[A-Z]/, { message: tt('Mật khẩu phải chứa ít nhất một chữ cái viết hoa', 'Password must contain at least one uppercase letter') })
      .regex(/[a-z]/, { message: tt('Mật khẩu phải chứa ít nhất một chữ cái viết thường', 'Password must contain at least one lowercase letter') })
      .regex(/\d/, { message: tt('Mật khẩu phải chứa ít nhất một chữ số', 'Password must contain at least one number') })
      .regex(/[^a-zA-Z0-9]/, { message: tt('Mật khẩu phải chứa ít nhất một ký tự đặc biệt', 'Password must contain at least one special character') }),
    otp: zod.string(),
  }), [tt]);

  const {
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = async (values: Values): Promise<void> => {
    setIsPending(true);

    try {
      const res: AxiosResponse = await baseHttpServiceInstance.post('/auth/send-otp-to-reset-password', {
        email: values.email,
      });
      setValue('password', '')
      setValue('otp', '')
      setIsOtpModalOpen(true);
    } catch (error: any) {
      const err = error as AxiosError
      setError('root', { type: 'server', message: err.message || tt('Lỗi', 'Error') });
    } finally {
      setIsPending(false);
    }
  };

  const handleResetPassword = async (values: Values) => {
    setIsPending(true);
    try {
      const res: AxiosResponse = await baseHttpServiceInstance.post('/auth/reset-password', {
        email: values.email,
        otp: values.otp,
        password: values.password
      });
      notificationCtx.success(tt('Đổi mật khẩu thành công.', 'Password changed successfully.'));
      // Redirect to login page with locale-aware path
      const localizedLoginPath = getLocalizedPath('/auth/login');
      router.push(localizedLoginPath);
    } catch (error: any) {
      setError('otp', { type: 'manual', message: error.message || tt('Xác thực OTP không thành công', 'OTP verification failed') });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Stack spacing={4}>
        <Typography variant="h5">{tt('Khôi phục mật khẩu', 'Reset Password')}</Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <FormControl error={Boolean(errors.email)}>
                  <InputLabel>{tt('Địa chỉ email', 'Email address')}</InputLabel>
                  <OutlinedInput {...field} label={tt('Địa chỉ email', 'Email address')} type="email" />
                  {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
                  {errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
                  {errors.otp ? <FormHelperText>{errors.otp.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            {errors.root ? <Alert severity="error">{errors.root.message}</Alert> : null}
            <Button disabled={isPending} type="submit" variant="contained">
              {tt('Tiếp theo', 'Next')}
            </Button>
          </Stack>
        </form>
      </Stack>
      <Modal open={isOtpModalOpen} onClose={() => setIsOtpModalOpen(false)}>
        <Container maxWidth="xl">
          <Card
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { sm: '500px', xs: '90%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
              display: isOtpModalOpen ? 'block' : 'none'
            }}
          >
            <CardContent>
              <Stack spacing={4}>
                <Typography variant="h5">{tt('Xác thực địa chỉ email', 'Verify Email Address')}</Typography>
                <form onSubmit={handleSubmit(handleResetPassword)}>
                  <Stack spacing={2}>
                    <Typography variant="body2">{tt('Kiểm tra email của bạn và điền mã OTP.', 'Check your email and enter the OTP code.')}</Typography>
                    <Controller
                      control={control}
                      name="otp"
                      render={({ field }) => (
                        <FormControl error={Boolean(errors.otp)}>
                          <InputLabel>{tt('Nhập mã OTP', 'Enter OTP code')}</InputLabel>
                          <OutlinedInput {...field} label={tt('Nhập mã OTP', 'Enter OTP code')} />
                          {errors.otp ? <FormHelperText>{errors.otp.message}</FormHelperText> : null}
                        </FormControl>
                      )}
                    />
                    {showPasswordInput ? (
                      <Controller
                        control={control}
                        name="password"
                        render={({ field }) => (
                          <FormControl error={Boolean(errors.password)}>
                            <InputLabel>{tt('Nhập mật khẩu mới', 'Enter new password')}</InputLabel>
                            <OutlinedInput {...field} label={tt('Nhập mật khẩu mới', 'Enter new password')} type="password" />
                            {errors.password ? (
                              <FormHelperText>{errors.password.message}</FormHelperText>
                            ) : null}
                          </FormControl>
                        )}
                      />
                    ) : null}
                    {!showPasswordInput ? (
                      <Button
                        variant="contained"
                        onClick={(e) => {e.preventDefault();setShowPasswordInput(true)}}
                      >
                        {tt('Tiếp theo', 'Next')}
                      </Button>
                    ) : (
                      <Button variant="contained" type="submit" disabled={isPending}>
                        {tt('Đổi mật khẩu', 'Change Password')}
                      </Button>
                    )}
                  </Stack>
                </form>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>
    </>
  );
}
