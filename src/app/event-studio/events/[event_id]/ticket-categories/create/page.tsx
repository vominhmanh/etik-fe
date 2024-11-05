'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { InputAdornment } from '@mui/material';
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

export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Thêm mới loại vé | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const eventId = params.event_id;
  const [formData, setFormData] = useState({
    name: '',
    type: 'public',
    price: 0,
    quantity: 1,
    description: '', // Ensure this is part of the state
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
      setIsLoading(true);
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${eventId}/ticket-categories`,
        {
          name: formData.name,
          type: formData.type,
          price: formData.price,
          quantity: formData.quantity,
          description: formData.description,
        }
      );
      notificationCtx.success('Ticket category created:', response.data);
      router.push(`/event-studio/events/${eventId}/ticket-categories`);
    } catch (error) {
      notificationCtx.error('Error creating ticket category:', error);
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
          <Typography variant="h4">Loại vé mới</Typography>
        </Stack>
      </Stack>
      <Grid container spacing={3}>
        <Grid lg={12} md={12} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardHeader subheader="Vui lòng điền các trường thông tin phía dưới." title="Thông tin vé" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Tên loại vé</InputLabel>
                      <OutlinedInput label="Tên loại vé" name="name" value={formData.name} onChange={handleChange} />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Phân loại</InputLabel>
                      <Select label="Phân loại" name="type" value={formData.type} onChange={handleChange}>
                        <MenuItem value="private">Nội bộ</MenuItem>
                        <MenuItem value="public">Công khai</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth>
                      <ReactQuill value={formData.description} onChange={handleDescriptionChange} placeholder="Mô tả" />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Card>
              <CardHeader
                title="Số lượng vé mỗi suất diễn"
                action={
                  <OutlinedInput
                    sx={{ maxWidth: 180 }}
                    type="text"
                    value={formData.quantity.toLocaleString('vi-VN')}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, quantity: parseFloat(e.target.value.replace(/\./g, '')) || 0 }))
                    }
                  />
                }
              />
              <CardHeader
                title="Giá vé"
                action={
                  <OutlinedInput
                    name="price"
                    type="text"
                    sx={{ maxWidth: 180 }}
                    value={formData.price.toLocaleString('vi-VN')}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value.replace(/\./g, '')) || 0 }))
                    }
                    endAdornment={<InputAdornment position="end">đ</InputAdornment>}
                  />
                }
              />
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
