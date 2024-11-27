'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { InputAdornment, TextField } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import axios, { AxiosResponse } from 'axios';
import ReactQuill from 'react-quill'; // Import ReactQuill

import NotificationContext from '@/contexts/notification-context';

import 'react-quill/dist/quill.snow.css'; // Import styles for ReactQuill

export default function Page({ params }: { params: { event_id: number; show_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Thêm suất diễn mới | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const eventId = params.event_id;
  const showId = params.show_id;
  const [formData, setFormData] = useState({
    name: '',
    endDateTime: '',
    startDateTime: '',
  });
  const router = useRouter();
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      description: value, // Update description state
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name) {
        notificationCtx.warning('Tên suất diễn không được để trống.');
        return
      }
      if (!formData.startDateTime || !formData.endDateTime) {
        notificationCtx.warning('Thời gian suất diễn không được để trống.');
        return
      }
      if (new Date(formData.startDateTime) > new Date(formData.endDateTime)) {
        notificationCtx.warning('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc');
        return
      }
      setIsLoading(true);
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${eventId}/shows`,
        {
          name: formData.name,
          startDateTime: formData.startDateTime,
          endDateTime: formData.endDateTime,
        }
      );
      notificationCtx.success('Ticket category created:', response.data);
      router.push(`/event-studio/events/${eventId}/schedules`);
    } catch (error) {
      notificationCtx.error('Lỗi', error);
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
          <Typography variant="h4">Suất diễn mới</Typography>
        </Stack>
      </Stack>
      <Grid container spacing={3}>
        <Grid lg={12} md={12} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardHeader subheader="Vui lòng điền các trường thông tin phía dưới." title="Thông tin suất diễn" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Tên suất diễn</InputLabel>
                      <OutlinedInput label="Tên suất diễn" name="name" value={formData.name} onChange={handleChange} />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <TextField
                        label="Thời gian bắt đầu"
                        type="datetime-local"
                        name="startDateTime"
                        value={formData.startDateTime || ''}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <TextField
                        label="Thời gian kết thúc"
                        type="datetime-local"
                        name="endDateTime"
                        value={formData.endDateTime || ''}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: '3' }}>
              <Button variant="contained" onClick={handleSubmit}>
                Tạo
              </Button>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
