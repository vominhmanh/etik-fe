'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { Modal, Card, CardContent } from '@mui/material';
import { Container } from '@mui/system';

import { AuthRes } from '@/types/auth';
import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { useUser } from '@/hooks/use-user';

import Popup from '../core/alert-popup';

const schema = zod.object({
  fullName: zod.string().min(1, { message: 'Tên đầy đủ là bắt buộc' }),
  phoneNumber: zod.string().min(1, { message: 'Số điện thoại là bắt buộc' }),
  email: zod.string().email({ message: 'Email không hợp lệ' }),
  password: zod.string()
    .min(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    .max(64, { message: 'Mật khẩu không được dài hơn 64 ký tự' })
    .regex(/[A-Z]/, { message: 'Mật khẩu phải chứa ít nhất một chữ cái viết hoa' })
    .regex(/[a-z]/, { message: 'Mật khẩu phải chứa ít nhất một chữ cái viết thường' })
    .regex(/\d/, { message: 'Mật khẩu phải chứa ít nhất một chữ số' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt' }),
  terms: zod.boolean().refine((value) => value, 'Bạn phải chấp nhận điều khoản và điều kiện'),
  otp: zod.string().optional(), // For OTP input
});

type Values = zod.infer<typeof schema>;

const defaultValues = { fullName: '', phoneNumber: '', email: '', password: '', terms: false, otp: '' } satisfies Values;

export function SignUpForm(): React.JSX.Element {
  const router = useRouter();
  const { setUser, checkSession, getUser } = useUser();
  const [popupContent, setPopupContent] = React.useState<{ type?: 'error' | 'success' | 'info' | 'warning'; message: string; }>({ type: undefined, message: '' });
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = React.useState<boolean>(false); // State to manage OTP modal visibility
  const searchParams = useSearchParams();
  const { control, handleSubmit, setError, formState: { errors } } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });
  const returnUrl = searchParams.get('returnUrl') || '/event-studio/events';

  const onSubmit =
    async (values: Values): Promise<void> => {
      setIsPending(true);
      try {
        const res: AuthRes = await authClient.signUp(values);
        // setUser(res.user);
        setIsOtpModalOpen(true); // Open OTP modal on successful signup

      } catch (error: any) {
        setPopupContent({ type: 'error', message: error.message || 'Có lỗi xảy ra, vui lòng thử lại sau' });
      } finally {
        setIsPending(false);
      }
    }

  const handleResendOtp = async (email: string) => {
    try {
      await authClient.resendOtp(email); // Call resend OTP API
      setPopupContent({ type: 'success', message: 'OTP đã được gửi lại' });
    } catch (error: any) {
      setPopupContent({ type: 'error', message: error.message || 'Có lỗi xảy ra khi gửi lại OTP' });
    }
  };

  const handleVerifyOtp = async (values: Values) => {
    setIsPending(true);
    try {
      const res: AuthRes = await authClient.verifyOtp(values.email, values.otp || ""); // Call verify API
      setUser(res.user);
      localStorage.setItem('accessToken', res.access_token);

      const user = getUser()
      router.push(`${returnUrl}`)
    } catch (error: any) {
      setError("otp", { type: "manual", message: error.message || 'Xác thực OTP không thành công' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Stack spacing={3}>
        {!!popupContent.message && (
          <Popup
            message={popupContent.message}
            open={!!popupContent.message}
            severity={popupContent.type}
            onClose={() => setPopupContent({ type: undefined, message: '' })}
          />
        )}

        <Stack spacing={1}>
          <Typography variant="h4">Đăng ký</Typography>
          <Typography color="text.secondary" variant="body2">
            Bạn đã có tài khoản?{' '}
            <Link component={RouterLink} href={paths.auth.signIn} underline="hover" variant="subtitle2">
              Đăng nhập
            </Link>
          </Typography>
        </Stack>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <Controller
              control={control}
              name="fullName"
              render={({ field }) => (
                <FormControl error={Boolean(errors.fullName)}>
                  <InputLabel>Tên đầy đủ</InputLabel>
                  <OutlinedInput {...field} label="Tên đầy đủ" />
                  {errors.fullName ? <FormHelperText>{errors.fullName.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field }) => (
                <FormControl error={Boolean(errors.phoneNumber)}>
                  <InputLabel>Số điện thoại</InputLabel>
                  <OutlinedInput {...field} label="Số điện thoại" />
                  {errors.phoneNumber ? <FormHelperText>{errors.phoneNumber.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <FormControl error={Boolean(errors.email)}>
                  <InputLabel>Địa chỉ email</InputLabel>
                  <OutlinedInput {...field} label="Địa chỉ email" type="email" />
                  {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <FormControl error={Boolean(errors.password)}>
                  <InputLabel>Mật khẩu</InputLabel>
                  <OutlinedInput {...field} label="Mật khẩu" type="password" />
                  {errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="terms"
              render={({ field }) => (
                <div>
                  <FormControlLabel
                    control={<Checkbox {...field} />}
                    label={<React.Fragment>Tôi đã đọc và đồng ý với <Link>điều khoản và điều kiện</Link></React.Fragment>}
                  />
                  {errors.terms ? <FormHelperText error>{errors.terms.message}</FormHelperText> : null}
                </div>
              )}
            />
            {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
            <Button disabled={isPending} type="submit" variant="contained">
              Đăng ký
            </Button>
          </Stack>
        </form>
      </Stack>

      <Modal open={isOtpModalOpen} onClose={() => setIsOtpModalOpen(false)}>
        <Container maxWidth="xl">
          <Card sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { sm: '500px', xs: '90%' }, bgcolor: 'background.paper', boxShadow: 24 }}>
            <CardContent>
              <Stack spacing={4}>
                <Typography variant="h5">Xác thực địa chỉ email</Typography>
                <form onSubmit={handleSubmit(handleVerifyOtp)}>
                  <Stack spacing={2}>
                    <Typography variant='body2'>Kiểm tra email của bạn và điền mã OTP để hoàn tất đăng ký.</Typography>
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
                    <Button variant="contained" type="submit" disabled={isPending}>
                      Xác thực
                    </Button>
                    {/* <Button variant="outlined" disabled={isPending}>
                      Gửi lại
                    </Button> */}
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
