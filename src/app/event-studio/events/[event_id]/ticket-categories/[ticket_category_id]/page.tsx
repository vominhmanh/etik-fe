'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
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
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import axios, { AxiosResponse } from 'axios';
import ReactQuill from 'react-quill'; // Import ReactQuill

import NotificationContext from '@/contexts/notification-context';

import 'react-quill/dist/quill.snow.css'; // Import Quill styles

export default function Page({
  params,
}: {
  params: { event_id: number; ticket_category_id: number };
}): React.JSX.Element {
  const eventId = params.event_id;
  const ticketCategoryId = params.ticket_category_id;
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'public',
    price: 0,
    description: '',
    status: 'on_sale',
  });
  const router = useRouter();

  // Fetch ticket category details
  useEffect(() => {
    const fetchTicketCategory = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse = await baseHttpServiceInstance.get(
          `/event-studio/events/${eventId}/ticket-categories/${ticketCategoryId}`
        );
        const ticketCategory = response.data;
        setFormData({
          name: ticketCategory.name,
          type: ticketCategory.type,
          price: ticketCategory.price,
          description: ticketCategory.description || '',
          status: ticketCategory.status
        });
      } catch (error) {
        notificationCtx.error('Error fetching ticket category:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTicketCategory();
  }, [eventId, ticketCategoryId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  // Save the edited ticket category
  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response: AxiosResponse = await baseHttpServiceInstance.put(
        `/event-studio/events/${eventId}/ticket-categories/${ticketCategoryId}`,
        {
          name: formData.name,
          type: formData.type,
          price: formData.price,
          quantity: formData.quantity,
          description: formData.description,
          status: formData.status,
        }
      );
      notificationCtx.success('Ticket category updated:', response.data);
      router.push(`/event-studio/events/${eventId}/ticket-categories`);
    } catch (error) {
      notificationCtx.error('Error updating ticket category:', error);
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
          <Typography variant="h4">Xem chi tiết loại vé "{formData.name}"</Typography>
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
                      <Select
                        label="Phân loại"
                        name="type"
                        value={formData.type}
                        onChange={(event: any) => handleChange(event)}
                      >
                        <MenuItem value="private">Nội bộ</MenuItem>
                        <MenuItem value="public">Công khai</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth>
                      <ReactQuill
                        value={formData.description}
                        onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                        placeholder="Nhập mô tả sự kiện..."
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Trạng thái</InputLabel>
                      <Select
                        label="Trạng thái"
                        name="status"
                        value={formData.status}
                        onChange={handleChange as (event: SelectChangeEvent<string>, child: React.ReactNode) => void}
                      >
                        <MenuItem value="on_sale">Đang mở bán</MenuItem>
                        <MenuItem value="not_opened_for_sale">Chưa mở bán</MenuItem>
                        <MenuItem value="temporarily_locked">Đang tạm khoá</MenuItem>
                        <MenuItem value="out_of_stock">Đã hết</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Card>
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
              <Button variant="contained" onClick={handleSave}>
                Lưu
              </Button>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
