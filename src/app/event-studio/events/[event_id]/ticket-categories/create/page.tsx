"use client";
import Grid from '@mui/material/Unstable_Grid2';
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { InputAdornment } from '@mui/material';
import axios, { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance

export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  const eventId = params.event_id;
  const [formData, setFormData] = useState({
    name: '',
    type: 'public',
    price: 0,
    quantity: 1,
    description: '',
  });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const response: AxiosResponse = await baseHttpServiceInstance.post(`/event-studio/events/${eventId}/ticket_categories/`, {
        name: formData.name,
        type: formData.type,
        price: formData.price,
        quantity: formData.quantity,
        description: formData.description,
      });
      console.log('Ticket category created:', response.data);
      router.push(`/event-studio/events/${eventId}/ticket-categories`);
    } catch (error) {
      console.error('Error creating ticket category:', error);
    }
  };

  return (
    <Stack spacing={3}>
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
                      <OutlinedInput
                        label="Tên loại vé"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Phân loại</InputLabel>
                      <Select
                        label="Phân loại"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                      >
                        <MenuItem value="private">Nội bộ</MenuItem>
                        <MenuItem value="public">Công khai</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Mô tả</InputLabel>
                      <OutlinedInput
                        label="Mô tả"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        multiline
                        minRows={2}
                        maxRows={10}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Card>
              <CardHeader
                title="Số lượng vé"
                action={
                  <OutlinedInput
                    sx={{ maxWidth: 180 }}
                    type='text'
                    value={formData.quantity.toLocaleString('vi-VN')}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: parseFloat(e.target.value.replace(/\./g, '')) || 0  }))}
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
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value.replace(/\./g, '')) || 0 }))}
                    endAdornment={<InputAdornment position="end">đ</InputAdornment>}
                  />
                }
              />
            </Card>
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: '3' }}>
              <Button variant="contained" onClick={handleSubmit}>Tạo</Button>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
