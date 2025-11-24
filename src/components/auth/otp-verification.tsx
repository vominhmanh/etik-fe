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

import { useTranslation } from '@/contexts/locale-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { AxiosResponse } from 'axios';

type Values = {
  email: string;
};

const defaultValues = { email: '' } satisfies Values;

export function OTPVerification(): React.JSX.Element {
  const { tt } = useTranslation();
  const [isPending, setIsPending] = React.useState<boolean>(false);

  const schema = React.useMemo(() => zod.object({ 
    email: zod.string().min(1, { message: tt('Email là bắt buộc', 'Email is required') }).email({ message: tt('Email không hợp lệ', 'Invalid email') }) 
  }), [tt]);

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
        const res: AxiosResponse = await baseHttpServiceInstance.post('/auth/send-otp-to-reset-password', {
          email: values.email,
        });
        // Success - OTP sent (component doesn't handle next step, just sends OTP)
        setIsPending(false);
      } catch (error: any) {
        setError('root', { type: 'server', message: error?.response?.data?.message || error?.message || tt('Có lỗi xảy ra', 'An error occurred') });
        setIsPending(false);
      }
    },
    [setError, tt]
  );

  return (
    <Stack spacing={4}>
      <Typography variant="h5">{tt('Xác thực địa chỉ email', 'Verify Email Address')}</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Typography variant='body2'>{tt('Kiểm tra email của bạn và điền mã OTP để hoàn tất đăng ký.', 'Check your email and enter the OTP code to complete registration.')}</Typography>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormControl error={Boolean(errors.email)}>
                <InputLabel>{tt('Mã OTP', 'OTP Code')}</InputLabel>
                <OutlinedInput {...field} label={tt('Mã OTP', 'OTP Code')} type="email" />
                {errors.email ? <FormHelperText>{errors.email.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
          <Button disabled={isPending} type="submit" variant="contained">
            {tt('Xác thực', 'Verify')}
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
