import * as React from 'react';
import Head from 'next/head';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function Page() {
  return (
    <>
      <Head>
        <title>ETIK - Nền tảng Vé điện tử và Quản lý sự kiện</title>
        <meta
          name="description"
          content="ETIK là nền tảng chuyên nghiệp và hiện đại cho vé điện tử và quản lý sự kiện. Khám phá các tính năng hàng đầu để tổ chức sự kiện thành công."
        />
        <meta name="keywords" content="ETIK, vé điện tử, quản lý sự kiện, nền tảng sự kiện, vé sự kiện" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https:etik.io.vn/" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Box
        sx={{
          display: { xs: 'flex', lg: 'grid' },
          flexDirection: 'column',
          minHeight: '100%',
        }}
      >
        <Box
          sx={{
            alignItems: 'center',
            background: 'radial-gradient(50% 50% at 50% 50%, #122647 0%, #090E23 100%)',
            color: 'var(--mui-palette-common-white)',
            display: { xs: 'none', lg: 'flex' },
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography
                color="inherit"
                sx={{ fontSize: '24px', lineHeight: '32px', textAlign: 'center' }}
                variant="h1"
              >
                Chào mừng bạn đến với{' '}
                <Box component="span" sx={{ color: '#15b79e' }}>
                  ETIK
                </Box>
              </Typography>
              <Typography align="center" variant="subtitle1">
                Nền tảng Vé điện tử và Quản lý sự kiện chuyên nghiệp, hiện đại.
              </Typography>
            </Stack>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                component="img"
                alt="Ảnh nền tảng Vé điện tử và Quản lý sự kiện chuyên nghiệp"
                src="/assets/auth-widgets.png"
                sx={{ height: 'auto', width: '100%', maxWidth: '600px' }}
              />
            </Box>
          </Stack>
        </Box>
      </Box>
    </>
  );
}
