'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ArrowLeft as ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import RouterLink from 'next/link';
import * as React from 'react';

import { config } from '@/config';
import { paths } from '@/paths';
import { useTranslation } from '@/contexts/locale-context';

export default function NotFound(): React.JSX.Element {
  const { tt } = useTranslation();

  React.useEffect(() => {
    document.title = tt(`Không tìm thấy trang | ${config.site.name}`, `Page Not Found | ${config.site.name}`);
  }, [tt]);
  return (
    <Box component="main" sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: '100%' }}>
      <Stack spacing={3} sx={{ alignItems: 'center', maxWidth: 'md' }}>
        <Box>
          <Box
            component="img"
            alt="Under development"
            src="/assets/error-404.png"
            sx={{ display: 'inline-block', height: 'auto', maxWidth: '100%', width: '400px' }}
          />
        </Box>
        <Typography variant="h3" sx={{ textAlign: 'center' }}>
          404: {tt('Trang bạn đang tìm kiếm không tồn tại', "The page you are looking for isn't here")}
        </Typography>
        <Typography color="text.secondary" variant="body1" sx={{ textAlign: 'center' }}>
          {tt('Bạn đã thử một đường dẫn không hợp lệ hoặc đến đây nhầm. Dù sao đi nữa, vui lòng sử dụng thanh điều hướng.', "You either tried some shady route or you came here by mistake. Whichever it is, try using the navigation")}
        </Typography>
        <Button
          component={RouterLink}
          href={paths.home}
          startIcon={<ArrowLeftIcon fontSize="var(--icon-fontSize-md)" />}
          variant="contained"
        >
          {tt('Về trang chủ', 'Go back to home')}
        </Button>
      </Stack>
    </Box>
  );
}
