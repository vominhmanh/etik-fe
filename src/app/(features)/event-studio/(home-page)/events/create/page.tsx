'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useState } from 'react';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';

type EventCreatedResponse = {
  eventId: number;
  message: string;
};

export default function Page(): React.JSX.Element {
  const { tt } = useTranslation();

  React.useEffect(() => {
    document.title = tt("Thêm sự kiện mới | ETIK - Vé điện tử & Quản lý sự kiện", "Create New Event | ETIK - E-tickets & Event Management");
  }, [tt]);

  const notificationCtx = React.useContext(NotificationContext);
  const [formData, setFormData] = useState({
    name: '',
    organizer: '',
    organizerEmail: '',
    organizerPhoneNumber: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const router = useRouter(); // Use useRouter from next/navigation

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Using httpOnly cookie auth; no token check client-side

    try {
      setIsLoading(true);
      const response: AxiosResponse<EventCreatedResponse> = await baseHttpServiceInstance.post(
        '/event-studio/events',
        formData
      );
      if (response.data) {
        notificationCtx.success(tt('Tạo sự kiện thành công.', 'Event created successfully.'));
        router.push('/event-studio/events/'); // Navigate to a different page on success
      } else {
        notificationCtx.error(tt('Lỗi:', 'Error:'), response.statusText);
      }
    } catch (error) {
      notificationCtx.error(tt('Lỗi:', 'Error:'), error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Backdrop
        open={isLoading}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          marginLeft: '0px !important',
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">{tt('Tạo sự kiện', 'Create Event')}</Typography>
        </Stack>
      </Stack>
      <Grid container spacing={3}>
        <Grid lg={12} sm={12} xs={12}>
          <form onSubmit={handleSubmit}>
            <Card>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>{tt('Tên sự kiện', 'Event Name')}</InputLabel>
                      <OutlinedInput label={tt('Tên sự kiện', 'Event Name')} name="name" value={formData.name} onChange={handleChange} />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>{tt('Đơn vị tổ chức', 'Organizer')}</InputLabel>
                      <OutlinedInput
                        label={tt('Đơn vị tổ chức', 'Organizer')}
                        name="organizer"
                        value={formData.organizer}
                        onChange={handleChange}
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>{tt('Địa chỉ email', 'Email Address')}</InputLabel>
                      <OutlinedInput
                        label={tt('Địa chỉ email', 'Email Address')}
                        name="organizerEmail"
                        value={formData.organizerEmail}
                        onChange={handleChange}
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>{tt('Số điện thoại liên hệ', 'Contact Phone Number')}</InputLabel>
                      <OutlinedInput
                        label={tt('Số điện thoại liên hệ', 'Contact Phone Number')}
                        name="organizerPhoneNumber"
                        type="tel"
                        value={formData.organizerPhoneNumber}
                        onChange={handleChange}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button type="submit" variant="contained">
                {tt('Tạo', 'Create')}
              </Button>
            </Grid>
          </form>
        </Grid>
      </Grid>
    </Stack>
  );
}
