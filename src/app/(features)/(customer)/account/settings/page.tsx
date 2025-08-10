import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Metadata } from 'next';
import * as React from 'react';

import { Notifications } from '@/components/dashboard/settings/notifications';
import { config } from '@/config';

export const metadata = { title: `Cài đặt | Dashboard | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Cài đặt</Typography>
      </div>
      <Notifications />
    </Stack>
  );
}
