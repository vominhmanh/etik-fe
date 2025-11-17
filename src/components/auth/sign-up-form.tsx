'use client';

import * as React from 'react';
import { LocalizedLink } from '@/components/localized-link';

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
import InputAdornment from '@mui/material/InputAdornment';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { Modal, Card, CardContent } from '@mui/material';
import { Container } from '@mui/system';
import { PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY } from '@/config/phone-countries';

import { AuthRes, SignUpReq } from '@/types/auth';
import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { useUser } from '@/hooks/use-user';

import Popup from '../core/alert-popup';
import { useTranslation } from '@/contexts/locale-context';

type Values = {
  fullName: string;
  phoneNumber: string;
  phoneCountryIso2: string;
  email: string;
  password: string;
  terms: boolean;
  otp?: string;
};

const defaultValues = { fullName: '', phoneNumber: '', phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2, email: '', password: '', terms: false, otp: '' } satisfies Values;

export function SignUpForm(): React.JSX.Element {
  const { tt } = useTranslation();
  const router = useRouter();
  const { checkSession, user } = useUser();
  const [popupContent, setPopupContent] = React.useState<{ type?: 'error' | 'success' | 'info' | 'warning'; message: string; }>({ type: undefined, message: '' });
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = React.useState<boolean>(false); // State to manage OTP modal visibility
  const searchParams = useSearchParams();
  
  const schema = React.useMemo(() => zod.object({
    fullName: zod.string().min(1, { message: tt('Tên đầy đủ là bắt buộc', 'Full name is required') }),
    phoneNumber: zod.string().min(1, { message: tt('Số điện thoại là bắt buộc', 'Phone number is required') }),
    email: zod.string().email({ message: tt('Email không hợp lệ', 'Invalid email') }),
    password: zod.string()
      .min(8, { message: tt('Mật khẩu phải có ít nhất 8 ký tự', 'Password must be at least 8 characters') })
      .max(64, { message: tt('Mật khẩu không được dài hơn 64 ký tự', 'Password must not exceed 64 characters') })
      .regex(/[A-Z]/, { message: tt('Mật khẩu phải chứa ít nhất một chữ cái viết hoa', 'Password must contain at least one uppercase letter') })
      .regex(/[a-z]/, { message: tt('Mật khẩu phải chứa ít nhất một chữ cái viết thường', 'Password must contain at least one lowercase letter') })
      .regex(/\d/, { message: tt('Mật khẩu phải chứa ít nhất một chữ số', 'Password must contain at least one number') })
      .regex(/[^a-zA-Z0-9]/, { message: tt('Mật khẩu phải chứa ít nhất một ký tự đặc biệt', 'Password must contain at least one special character') }),
    terms: zod.boolean().refine((value) => value, tt('Bạn phải chấp nhận điều khoản và điều kiện', 'You must accept the terms and conditions')),
    otp: zod.string().optional(),
  }), [tt]);
  
  const { control, handleSubmit, setError, formState: { errors } } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const onSubmit =
    async (values: Values): Promise<void> => {
      setIsPending(true);
      try {
        // Derive NSN from phone number (strip leading '0' if present)
        const digits = values.phoneNumber.replace(/\D/g, '');
        const phoneNSN = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;

        const signUpData: SignUpReq = {
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          phoneCountry: values.phoneCountryIso2,
          phoneNationalNumber: phoneNSN,
          password: values.password,
        };
        const res: AuthRes = await authClient.signUp(signUpData);
        setIsOtpModalOpen(true); // Open OTP modal on successful signup

      } catch (error: any) {
        setPopupContent({ type: 'error', message: error.message || tt('Có lỗi xảy ra, vui lòng thử lại sau', 'An error occurred, please try again later') });
      } finally {
        setIsPending(false);
      }
    }

  const handleResendOtp = async (email: string) => {
    try {
      await authClient.resendOtp(email); // Call resend OTP API
      setPopupContent({ type: 'success', message: tt('OTP đã được gửi lại', 'OTP has been resent') });
    } catch (error: any) {
      setPopupContent({ type: 'error', message: error.message || tt('Có lỗi xảy ra khi gửi lại OTP', 'An error occurred while resending OTP') });
    }
  };

  const handleVerifyOtp = async (values: Values) => {
    setIsPending(true);
    try {
      const res: AuthRes = await authClient.verifyOtp(values.email, values.otp || ""); // Call verify API
      localStorage.setItem('accessToken', res.access_token);

      const authUser = user
      router.push(`${returnUrl}`)
    } catch (error: any) {
      setError("otp", { type: "manual", message: error.message || tt('Xác thực OTP không thành công', 'OTP verification failed') });
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
          <Typography variant="h4">{tt('Đăng ký', 'Sign Up')}</Typography>
          <Typography color="text.secondary" variant="body2">
            {tt('Bạn đã có tài khoản?', 'Already have an account?')}{' '}
            <Link component={LocalizedLink} href={paths.auth.signIn} underline="hover" variant="subtitle2">
              {tt('Đăng nhập', 'Sign In')}
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
                  <InputLabel>{tt('Tên đầy đủ', 'Full Name')}</InputLabel>
                  <OutlinedInput {...field} label={tt('Tên đầy đủ', 'Full Name')} />
                  {errors.fullName ? <FormHelperText>{errors.fullName.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field }) => (
                <FormControl error={Boolean(errors.phoneNumber)} fullWidth>
                  <InputLabel>{tt('Số điện thoại', 'Phone Number')}</InputLabel>
                  <OutlinedInput
                    {...field}
                    label={tt('Số điện thoại', 'Phone Number')}
                    type="tel"
                    startAdornment={
                      <InputAdornment position="start">
                        <Controller
                          control={control}
                          name="phoneCountryIso2"
                          render={({ field: countryField }) => (
                            <Select
                              variant="standard"
                              disableUnderline
                              value={countryField.value}
                              onChange={countryField.onChange}
                              sx={{ minWidth: 80 }}
                              renderValue={(value) => {
                                const country =
                                  PHONE_COUNTRIES.find((c) => c.iso2 === value) || DEFAULT_PHONE_COUNTRY;
                                return country.dialCode;
                              }}
                            >
                              {PHONE_COUNTRIES.map((country) => (
                                <MenuItem key={country.iso2} value={country.iso2}>
                                  {country.nameVi} ({country.dialCode})
                                </MenuItem>
                              ))}
                            </Select>
                          )}
                        />
                      </InputAdornment>
                    }
                  />
                  {errors.phoneNumber ? <FormHelperText>{errors.phoneNumber.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <FormControl error={Boolean(errors.email)}>
                  <InputLabel>{tt('Địa chỉ email', 'Email address')}</InputLabel>
                  <OutlinedInput {...field} label={tt('Địa chỉ email', 'Email address')} type="email" />
                  {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
                </FormControl>
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <FormControl error={Boolean(errors.password)}>
                  <InputLabel>{tt('Mật khẩu', 'Password')}</InputLabel>
                  <OutlinedInput {...field} label={tt('Mật khẩu', 'Password')} type="password" />
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
                    label={
                      <React.Fragment>
                        {tt('Tôi đã đọc và đồng ý với', 'I have read and agree to the')} <Link>{tt('điều khoản và điều kiện', 'terms and conditions')}</Link>
                      </React.Fragment>
                    }
                  />
                  {errors.terms ? <FormHelperText error>{errors.terms.message}</FormHelperText> : null}
                </div>
              )}
            />
            {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
            <Button disabled={isPending} type="submit" variant="contained">
              {tt('Đăng ký', 'Sign Up')}
            </Button>
          </Stack>
        </form>
      </Stack>

      <Modal open={isOtpModalOpen} onClose={() => setIsOtpModalOpen(false)}>
        <Container maxWidth="xl">
          <Card sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { sm: '500px', xs: '90%' }, bgcolor: 'background.paper', boxShadow: 24 }}>
            <CardContent>
              <Stack spacing={4}>
                <Typography variant="h5">{tt('Xác thực địa chỉ email', 'Verify Email Address')}</Typography>
                <form onSubmit={handleSubmit(handleVerifyOtp)}>
                  <Stack spacing={2}>
                    <Typography variant='body2'>{tt('Kiểm tra email của bạn và điền mã OTP để hoàn tất đăng ký.', 'Check your email and enter the OTP code to complete registration.')}</Typography>
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
                    <Button variant="contained" type="submit" disabled={isPending}>
                      {tt('Xác thực', 'Verify')}
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
