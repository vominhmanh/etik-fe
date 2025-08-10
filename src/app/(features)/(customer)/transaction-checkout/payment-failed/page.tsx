'use client';

import { Stack } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import * as React from 'react';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';



export default function Page(): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Giao dịch không thành công | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);

  return (
    <Stack spacing={3}>
      <Card sx={{
        scrollBehavior: 'smooth',
        backgroundColor: '#d1f9db',
        backgroundImage: `linear-gradient(356deg, #d1f9db 0%, #fffed9 100%)`,
      }}>
        <CardContent>
          <Stack spacing={3} direction={{ sm: 'row', xs: 'column' }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '150px', height: '150px', borderRadius: '20px', }}>
                <DotLottieReact
                  src="/assets/animations/failure.lottie"
                  loop
                  width={'100%'}
                  height={'100%'}
                  style={{
                    borderRadius: '20px'
                  }}
                  autoplay
                />
              </div>
            </div>

            <Stack spacing={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '450px', maxWidth: '100%' }}>
              <Typography variant="h5">Giao dịch không thành công</Typography>
              <Typography variant="body1" sx={{ textAlign: 'justify' }}>Quý khách vui lòng thử lại sau hoặc liên hệ với chúng tôi để được hỗ trợ.</Typography>
              <Typography variant="body2" sx={{ textAlign: 'justify' }}>Nếu quý khách cần hỗ trợ thêm, vui lòng gửi yêu cầu hỗ trợ <a style={{ textDecoration: 'none' }} target='_blank' href="https://forms.gle/2mogBbdUxo9A2qRk8">tại đây.</a></Typography>
            </Stack>
          </Stack>

        </CardContent>
      </Card>
    </Stack>
  );
}
