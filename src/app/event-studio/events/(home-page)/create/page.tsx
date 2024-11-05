'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { AxiosResponse } from 'axios';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

import NotificationContext from '@/contexts/notification-context';

type EventCreatedResponse = {
  eventId: number;
  message: string;
};

export default function Page(): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Thêm sự kiện mới | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);

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

    const token = localStorage.getItem('accessToken'); // Assuming the token is stored under 'authToken'

    if (!token) {
      notificationCtx.error('No authentication token found');
      return;
    }

    try {
      setIsLoading(true);
      const response: AxiosResponse<EventCreatedResponse> = await baseHttpServiceInstance.post(
        '/event-studio/events',
        formData
      );
      if (response.data) {
        notificationCtx.success('Event created successfully:', response.data);
        router.push('/event-studio/events/'); // Navigate to a different page on success
      } else {
        notificationCtx.error('Error creating event:', response.statusText);
      }
    } catch (error) {
      notificationCtx.error('Error:', error);
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
          <Typography variant="h4">Tạo sự kiện</Typography>
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
                      <InputLabel>Tên sự kiện</InputLabel>
                      <OutlinedInput label="Tên sự kiện" name="name" value={formData.name} onChange={handleChange} />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Đơn vị tổ chức</InputLabel>
                      <OutlinedInput
                        label="Đơn vị tổ chức"
                        name="organizer"
                        value={formData.organizer}
                        onChange={handleChange}
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Địa chỉ email</InputLabel>
                      <OutlinedInput
                        label="Địa chỉ email"
                        name="organizerEmail"
                        value={formData.organizerEmail}
                        onChange={handleChange}
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Số điện thoại liên hệ</InputLabel>
                      <OutlinedInput
                        label="Số điện thoại liên hệ"
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
                Tạo
              </Button>
            </Grid>
          </form>
        </Grid>
      </Grid>
    </Stack>
  );
}
