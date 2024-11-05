import * as React from 'react';
import NotificationContext from '@/contexts/notification-context';
import type { Metadata } from 'next';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { config } from '@/config';
import { Notifications } from '@/components/dashboard/settings/notifications';
import { UpdatePasswordForm } from '@/components/dashboard/settings/update-password-form';

export const metadata = { title: `Cài đặt | Dashboard | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Settings</Typography>
      </div>
      <Notifications />
      <UpdatePasswordForm />
    </Stack>
  );
}
