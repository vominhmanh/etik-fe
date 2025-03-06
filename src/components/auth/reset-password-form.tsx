'use client';

import * as React from 'react';
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

const schema = zod.object({
  email: zod.string().email({ message: 'Email không hợp lệ' }),
  password: zod.string()
    .min(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    .max(64, { message: 'Mật khẩu không được dài hơn 64 ký tự' })
    .regex(/[A-Z]/, { message: 'Mật khẩu phải chứa ít nhất một chữ cái viết hoa' })
    .regex(/[a-z]/, { message: 'Mật khẩu phải chứa ít nhất một chữ cái viết thường' })
    .regex(/\d/, { message: 'Mật khẩu phải chứa ít nhất một chữ số' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt' }),
  otp: zod.string(), // For OTP input
});

type Values = zod.infer<typeof schema>;

const defaultValues = { email: '', password: '12A@1223a@', otp: '123456' } satisfies Values;

export function ResetPasswordForm(): React.JSX.Element {
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = React.useState<boolean>(false);
  const [showPasswordInput, setShowPasswordInput] = React.useState<boolean>(false);

  const notificationCtx = React.useContext(NotificationContext);

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
      setError('root', { type: 'server', message: err.message || "Lỗi" });
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
      notificationCtx.success('Đổi mật khẩu thành công.');
      // Redirect to login page
      window.location.href = '/auth/login';
    } catch (error: any) {
      setError('otp', { type: 'manual', message: error.message || 'Xác thực OTP không thành công' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Stack spacing={4}>
        <Typography variant="h5">Khôi phục mật khẩu</Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <FormControl error={Boolean(errors.email)}>
                  <InputLabel>Địa chỉ email</InputLabel>
                  <OutlinedInput {...field} label="Địa chỉ email" type="email" />
                  {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
                  {errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
                  {errors.otp ? <FormHelperText>{errors.otp.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            {errors.root ? <Alert severity="error">{errors.root.message}</Alert> : null}
            <Button disabled={isPending} type="submit" variant="contained">
              Tiếp theo
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
                <Typography variant="h5">Xác thực địa chỉ email</Typography>
                <form onSubmit={handleSubmit(handleResetPassword)}>
                  <Stack spacing={2}>
                    <Typography variant="body2">Kiểm tra email của bạn và điền mã OTP.</Typography>
                    <Controller
                      control={control}
                      name="otp"
                      render={({ field }) => (
                        <FormControl error={Boolean(errors.otp)}>
                          <InputLabel>Nhập mã OTP</InputLabel>
                          <OutlinedInput {...field} label="Nhập mã OTP" />
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
                            <InputLabel>Nhập mật khẩu mới</InputLabel>
                            <OutlinedInput {...field} label="Nhập mật khẩu mới" type="password" />
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
                        Tiếp theo
                      </Button>
                    ) : (
                      <Button variant="contained" type="submit" disabled={isPending}>
                        Đổi mật khẩu
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
