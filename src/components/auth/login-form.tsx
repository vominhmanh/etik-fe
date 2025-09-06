'use client'
import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlash as EyeSlashIcon } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { AuthRes } from '@/types/auth';
import { getDecodedReturnUrl } from '@/lib/auth/urls';
import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { useUser } from '@/hooks/use-user';

import Popup from '../core/alert-popup';
import NotificationContext from '@/contexts/notification-context';

const schema = zod.object({
  email: zod.string().min(1, { message: 'Email là bắt buộc' }).email(),
  password: zod.string().min(1, { message: 'Mật khẩu là bắt buộc' }),
});

type Values = zod.infer<typeof schema>;

const defaultValues = { email: '', password: '' } satisfies Values;

export function SignInForm(): React.JSX.Element {
  const router = useRouter();
  const [popupContent, setPopupContent] = React.useState<{
    type?: 'error' | 'success' | 'info' | 'warning';
    message: string;
  }>({ type: undefined, message: '' });

  const { checkSession, user } = useUser();
  const [showPassword, setShowPassword] = React.useState<boolean>();
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const searchParams = useSearchParams();
  const returnUrl = React.useMemo(() => getDecodedReturnUrl(searchParams.get('returnUrl'), '/event-studio/events'), [searchParams]);
  const errorParam = useSearchParams().get('error');
  const notificationCtx = React.useContext(NotificationContext);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);

      try {
        const res: AuthRes = await authClient.signInWithPassword({
          username: values.email,
          password: values.password
        });

        await checkSession();
        router.push(returnUrl);
      } catch (error: any) {
        setPopupContent({
          type: 'error',
          message: error.message || 'Có lỗi xảy ra, vui lòng thử lại sau',
        });
        setIsPending(false);
      }
    },
    [router, setError, returnUrl]
  );


  React.useEffect(() => {
    if (errorParam) {
      // notificationCtx.error(...) hoặc Popup của bạn
      const msg =
        errorParam === 'missing_userinfo' ? 'Không lấy được thông tin Google.'
        : errorParam === 'email_not_verified' ? 'Email Google chưa xác thực hoặc không khả dụng.'
        : errorParam === 'db_error' ? 'Có lỗi hệ thống, vui lòng thử lại.'
        : 'Đăng nhập Google thất bại, vui lòng thử lại.';
      // ví dụ:
      notificationCtx.error(msg);
    }
  }, [errorParam]);
  
  return (
    <Stack spacing={4}>
      {!!popupContent.message && (
        <Popup
          message={popupContent.message}
          open={!!popupContent.message}
          severity={popupContent?.type}
          onClose={() => setPopupContent({ type: undefined, message: '' })}
        />
      )}

      <Stack spacing={1}>
        <Typography variant="h4">Đăng nhập</Typography>
        <Typography color="text.secondary" variant="body2">
          Bạn chưa có tài khoản?{' '}
          <Link component={RouterLink} href={paths.auth.signUp} underline="hover" variant="subtitle2">
            Đăng ký
          </Link>
        </Typography>
      </Stack>
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
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormControl error={Boolean(errors.password)}>
                <InputLabel>Mật khẩu</InputLabel>
                <OutlinedInput
                  {...field}
                  endAdornment={
                    showPassword ? (
                      <EyeIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={(): void => {
                          setShowPassword(false);
                        }}
                      />
                    ) : (
                      <EyeSlashIcon
                        cursor="pointer"
                        fontSize="var(--icon-fontSize-md)"
                        onClick={(): void => {
                          setShowPassword(true);
                        }}
                      />
                    )
                  }
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                />
                {errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          <div>
            <Link component={RouterLink} href={paths.auth.resetPassword} variant="subtitle2">
              Quên mật khẩu?
            </Link>
          </div>
          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
          <Button disabled={isPending} type="submit" variant="contained">
            Đăng nhập
          </Button>
        </Stack>
      </form>
      <Stack spacing={2} sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={
            <svg width="20" height="20" viewBox="0 0 20 20" style={{ display: 'block' }}>
              <g>
                <path
                  d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.48a4.68 4.68 0 0 1-2.03 3.07v2.55h3.28c1.92-1.77 3.03-4.38 3.03-7.41z"
                  fill="#4285F4"
                />
                <path
                  d="M10 20c2.7 0 4.97-.9 6.63-2.44l-3.28-2.55c-.91.61-2.07.97-3.35.97-2.57 0-4.75-1.74-5.53-4.07H1.06v2.6A9.99 9.99 0 0 0 10 20z"
                  fill="#34A853"
                />
                <path
                  d="M4.47 11.91A5.99 5.99 0 0 1 4.01 10c0-.66.11-1.31.26-1.91V5.49H1.06A9.99 9.99 0 0 0 0 10c0 1.64.39 3.19 1.06 4.51l3.41-2.6z"
                  fill="#FBBC05"
                />
                <path
                  d="M10 4.01c1.47 0 2.78.51 3.81 1.5l2.85-2.85C14.97 1.13 12.7.01 10 .01A9.99 9.99 0 0 0 1.06 5.49l3.41 2.6C5.25 5.75 7.43 4.01 10 4.01z"
                  fill="#EA4335"
                />
              </g>
            </svg>
          }
          onClick={() => {
            // Redirect to Google OAuth endpoint
            window.location.href = process.env.NEXT_PUBLIC_BASE_URL + '/auth/login/google?returnUrl=' + encodeURIComponent(returnUrl);
          }}
          sx={{ textTransform: 'none', fontWeight: 500 }}
        >
          Đăng nhập bằng Google
        </Button>
      </Stack>
    </Stack>
  );
}
