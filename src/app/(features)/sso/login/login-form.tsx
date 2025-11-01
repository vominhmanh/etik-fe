'use client';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { LocalizedLink } from '@/components/localized-link';

import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { useUser } from '@/hooks/use-user';
import { paths } from '@/paths';
import { AuthRes } from '@/types/auth';

import Popup from '@/components/core/alert-popup';
import NotificationContext from '@/contexts/notification-context';
import AuthService from '@/services/Auth.service';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Backdrop, Card, CardContent, CardHeader, CircularProgress } from '@mui/material';
import { AxiosResponse } from 'axios';

const schema = zod.object({
  email: zod.string().min(1, { message: 'Email là bắt buộc' }).email(),
  password: zod.string().min(1, { message: 'Mật khẩu là bắt buộc' }),
});

type Values = zod.infer<typeof schema>;

const defaultValues = { email: '', password: '' } satisfies Values;

export function SignInForm(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';

  const [popupContent, setPopupContent] = React.useState<{
    type?: 'error' | 'success' | 'info' | 'warning';
    message: string;
  }>({ type: undefined, message: '' });

  const { checkSession, user } = useUser();
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const [ssoUser, setSsoUser] = React.useState<{ fullName: string; email: string; authCode: string; expiresIn: number } | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const notificationCtx = React.useContext(NotificationContext);

  React.useEffect(() => {
    const handleSSOLogin = async () => {
      try {
        setIsLoading(true)
        const response = await AuthService.meSso();

        if (response?.authCode && response?.fullName && response?.email) {
          setSsoUser({
            fullName: response.fullName,
            email: response.email,
            authCode: response.authCode,
            expiresIn: response.expiresIn,
          });
          return;
        }
      } catch (error) {
        // ignore; user not logged in
      } finally {
        setIsLoading(false)
      }
    };

    handleSSOLogin();
  }, []);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      

      try {
        setIsPending(true);
        const data = {
          username: values.email,
          password: values.password,
        };
        const response: AxiosResponse<AuthRes> = await baseHttpServiceInstance.post(`/sso/login`, data, {
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        console.log(response.data)
        const authCode = response.data.auth_code;
        const expiresIn = response.data.auth_code_expires_in;

        router.push(`${returnUrl}&authCode=${authCode}&expiresIn=${expiresIn}`);
      } catch (error: any) {
        setPopupContent({
          type: 'error',
          message: error.message || 'Có lỗi xảy ra, vui lòng thử lại sau',
        });
      } finally {
        setIsPending(false);
      }
    },
    [router, returnUrl]
  );

  const handleContinueSSO = () => {
    if (ssoUser) {
      router.push(`${returnUrl}&authCode=${ssoUser.authCode}&expiresIn=${ssoUser.expiresIn}`);
    }
  };

  if (isLoading) {
    return (
    <Backdrop
      open={isLoading}
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        marginLeft: '0px !important',
      }}
    >
      <CircularProgress color="inherit" />
    </Backdrop>)
  }

  if (ssoUser) {
    return (
      <Stack spacing={4}>
        <Typography variant="h4">Đăng nhập bằng SSO</Typography>
        <Card>
          <CardHeader subheader="Bạn đang đăng nhập bằng tài khoản" />
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="h6">{ssoUser.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">{ssoUser.email}</Typography>
            </Stack>
          </CardContent>

        </Card>


        <Stack spacing={5} direction="row">
          <Button variant="contained" color="primary" onClick={handleContinueSSO} disabled={isPending}>
            Tiếp tục
          </Button>
          <Button variant="text" color="secondary" onClick={() => setSsoUser(null)}>
            Không phải tôi
          </Button>
        </Stack>
      </Stack>
    );
  }

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
          <Link component={LocalizedLink} href={paths.auth.signUp} underline="hover" variant="subtitle2">
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
                {errors.email && <FormHelperText>{errors.email.message}</FormHelperText>}
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
                      <EyeIcon cursor="pointer" fontSize="var(--icon-fontSize-md)" onClick={() => setShowPassword(false)} />
                    ) : (
                      <EyeSlashIcon cursor="pointer" fontSize="var(--icon-fontSize-md)" onClick={() => setShowPassword(true)} />
                    )
                  }
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                />
                {errors.password && <FormHelperText>{errors.password.message}</FormHelperText>}
              </FormControl>
            )}
          />
          <Button disabled={isPending} type="submit" variant="contained">
            Đăng nhập
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
