'use client'

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircularProgress, Typography, Box } from '@mui/material';
import { useTranslation } from '@/contexts/locale-context';
import NotificationContext from '@/contexts/notification-context';

export default function SSOCallbackPage(): React.JSX.Element {
  const { tt } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const notificationCtx = React.useContext(NotificationContext);
  const [isProcessing, setIsProcessing] = React.useState(true);
  const hasProcessed = React.useRef(false);

  React.useEffect(() => {
    // Prevent duplicate calls
    if (hasProcessed.current) {
      return;
    }

    const handleCallback = async () => {
      hasProcessed.current = true;
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const returnUrl = searchParams.get('returnUrl') || '/dashboard';

      // Handle errors
      if (error) {
        setIsProcessing(false);
        const errorMessages: Record<string, string> = {
          missing_userinfo: tt('Không lấy được thông tin Google.', 'Unable to retrieve Google information.'),
          email_not_verified: tt('Email Google chưa xác thực hoặc không khả dụng.', 'Google email not verified or unavailable.'),
          account_disabled: tt('Tài khoản đang bị khóa. Vui lòng liên hệ Quản trị viên.', 'Account is locked. Please contact Administrator.'),
          db_error: tt('Có lỗi hệ thống, vui lòng thử lại.', 'System error, please try again.'),
          google_failed: tt('Đăng nhập Google thất bại, vui lòng thử lại.', 'Google login failed, please try again.'),
        };
        const message = errorMessages[error] || errorMessages.google_failed;
        notificationCtx.error(message);
        router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }

      // Exchange auth_code for tokens
      if (code) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://api.etik.vn';
          const response = await fetch(`${apiUrl}/sso/token?code=${code}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to exchange authorization code');
          }

          const data = await response.json();

          // Store tokens in localStorage
          if (data.access_token && data.refresh_token) {
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);

            // Redirect to returnUrl
            router.push(returnUrl);
          } else {
            throw new Error('Tokens not received');
          }
        } catch (error: any) {
          setIsProcessing(false);
          notificationCtx.error(
            error.message || tt('Có lỗi xảy ra khi đăng nhập, vui lòng thử lại.', 'An error occurred during login, please try again.')
          );
          router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        }
      } else {
        setIsProcessing(false);
        notificationCtx.error(tt('Mã xác thực không hợp lệ.', 'Invalid authorization code.'));
        router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      }
    };

    handleCallback();
  }, [searchParams, router, notificationCtx, tt]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      {isProcessing ? (
        <>
          <CircularProgress />
          <Typography variant="body1" color="text.secondary">
            {tt('Đang xử lý đăng nhập...', 'Processing login...')}
          </Typography>
        </>
      ) : (
        <Typography variant="body1" color="text.secondary">
          {tt('Đang chuyển hướng...', 'Redirecting...')}
        </Typography>
      )}
    </Box>
  );
}

