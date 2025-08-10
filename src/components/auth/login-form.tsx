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
import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { useUser } from '@/hooks/use-user';

import Popup from '../core/alert-popup';

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

  const { checkSession, setUser, getUser } = useUser();
  const [showPassword, setShowPassword] = React.useState<boolean>();
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/event-studio/events';
  
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
          password: values.password,
        });
        localStorage.setItem('accessToken', res.access_token);

        setUser(res.user);
        const user = getUser();
        router.push(returnUrl);
      } catch (error: any) {
        setPopupContent({
          type: 'error',
          message: error.message || 'Có lỗi xảy ra, vui lòng thử lại sau',
        });
        setIsPending(false);
      }
    },
    [router, setError]
  );

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
    </Stack>
  );
}
