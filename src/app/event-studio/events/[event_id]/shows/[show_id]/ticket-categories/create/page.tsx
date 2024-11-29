'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Box, Checkbox, Container, FormControlLabel, InputAdornment, Modal } from '@mui/material';
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

type TicketcategoryFormData = {
  name: string;
  type: string;
  price: number;
  quantity: number;
  limitPerTransaction: number | null;
  limitPerCustomer: number | null;
  description: string;
}


export default function Page({ params }: { params: { event_id: number; show_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Thêm mới loại vé | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const eventId = params.event_id;
  const showId = params.show_id;
  const [formData, setFormData] = useState<TicketcategoryFormData>({
    name: '',
    type: 'public',
    price: 0,
    quantity: 100,
    limitPerTransaction: 2,
    limitPerCustomer: 4,
    description: '', // Ensure this is part of the state
  });
  const router = useRouter();
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTransactionLimitUnlimited, setIsTransactionLimitUnlimited] = useState(false);
  const [isCustomerLimitUnlimited, setIsCustomerLimitUnlimited] = useState(false);
  const [openNotifModal, setOpenNotifModal] = useState<boolean>(false);

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

  const handleTransactionLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      limitPerTransaction: e.target.value ? parseFloat(e.target.value.replace(/\./g, '')) : 0
    }));
  };

  const handleCustomerLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      limitPerCustomer: e.target.value ? parseFloat(e.target.value.replace(/\./g, '')) : 0
    }));
  };

  const handleTransactionLimitCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTransactionLimitUnlimited(e.target.checked);
    if (e.target.checked) {
      setFormData((prev) => ({ ...prev, limitPerTransaction: null }));
    } else {
      setFormData((prev) => ({ ...prev, limitPerTransaction: 2 })); // Reset to default value
    }
  };

  const handleCustomerLimitCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCustomerLimitUnlimited(e.target.checked);
    if (e.target.checked) {
      setFormData((prev) => ({ ...prev, limitPerCustomer: null }));
    } else {
      setFormData((prev) => ({ ...prev, limitPerCustomer: 4 })); // Reset to default value
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      notificationCtx.warning('Tên loại vé không được để trống.');
      return
    }
    if (formData.limitPerTransaction && formData.limitPerCustomer) {
      if (formData.limitPerTransaction > formData.quantity) {
        notificationCtx.warning('Số vé tối đa mỗi giao dịch phải nhỏ hơn hoặc bằng Tổng số vé.');
        return
      }
      if (formData.limitPerTransaction && formData.limitPerCustomer && formData.limitPerCustomer > formData.quantity) {
        notificationCtx.warning('Số vé tối đa mỗi khách hàng phải nhỏ hơn hoặc bằng Tổng số vé.');
        return
      }
      if (formData.limitPerTransaction > formData.limitPerCustomer) {
        notificationCtx.warning('Số vé tối đa mỗi giao dịch phải nhỏ hơn hoặc bằng số vé tối đa mỗi khách hàng.');
        return
      }
    }
    if (!formData.limitPerTransaction && formData.limitPerCustomer) {
      notificationCtx.warning('Số vé tối đa mỗi giao dịch phải nhỏ hơn hoặc bằng số vé tối đa mỗi khách hàng.');
      return
    }

    try {
      setIsLoading(true);
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${eventId}/shows/${showId}/ticket-categories`,
        {
          name: formData.name,
          type: formData.type,
          price: formData.price,
          quantity: formData.quantity,
          limitPerTransaction: formData.limitPerTransaction,
          limitPerCustomer: formData.limitPerCustomer,
          description: formData.description,
        }
      );
      notificationCtx.success(response.data.message);
      if (formData.price > 0) {
        setOpenNotifModal(true)
      } else {
        router.push(`/event-studio/events/${eventId}/shows`);
      }
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseNotifModal = () => {
    setOpenNotifModal(false)
    router.push(`/event-studio/events/${eventId}/shows`);
  }

  return (
    <>
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
                  title="Số lượng vé"
                  action={
                    <OutlinedInput
                      sx={{ maxWidth: { xs: 70, sm: 180 } }}
                      type="number"
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
                      type="number"
                      sx={{ maxWidth: { xs: 130, sm: 180 } }}
                      value={formData.price.toLocaleString('vi-VN')}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, price: parseFloat(e.target.value.replace(/\./g, '')) || 0 }))
                      }
                      endAdornment={<InputAdornment position="end">đ</InputAdornment>}
                    />
                  }
                />
                <CardHeader
                  title="Số vé tối đa mỗi đơn hàng"
                  subheader={
                    <Box display="flex" alignItems="center">
                      <FormControlLabel
                        control={<Checkbox checked={isTransactionLimitUnlimited} onChange={handleTransactionLimitCheckboxChange} />}
                        label={<Typography variant="body2">Không giới hạn</Typography>}
                      />
                    </Box>
                  }
                  action={
                    <OutlinedInput
                      sx={{ maxWidth: { xs: 70, sm: 180 } }}
                      type="number"
                      value={formData.limitPerTransaction !== null ? formData.limitPerTransaction.toLocaleString('vi-VN') : ''}
                      onChange={handleTransactionLimitChange}
                      disabled={isTransactionLimitUnlimited} // Disable if the checkbox is checked
                    />
                  }
                />
                <CardHeader
                  title="Số vé tối đa mỗi khách hàng"
                  subheader={
                    <Box display="flex" alignItems="center">
                      <FormControlLabel
                        control={<Checkbox checked={isCustomerLimitUnlimited} onChange={handleCustomerLimitCheckboxChange} />}
                        label={<Typography variant="body2">Không giới hạn</Typography>}
                      />
                    </Box>
                  }
                  action={
                    <OutlinedInput
                      sx={{ maxWidth: { xs: 70, sm: 180 } }}
                      type="number"
                      value={formData.limitPerCustomer !== null ? formData.limitPerCustomer.toLocaleString('vi-VN') : ''}
                      onChange={handleCustomerLimitChange}
                      disabled={isCustomerLimitUnlimited} // Disable if the checkbox is checked
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
      <Modal
        open={openNotifModal}
        onClose={handleCloseNotifModal}
        aria-labelledby="ticket-category-description-modal-title"
        aria-describedby="ticket-category-description-modal-description"
      >
        <Container maxWidth="xl">
          <Card
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { sm: "500px", xs: "90%" },
              bgcolor: "background.paper",
              boxShadow: 24,
            }}
          >
            <CardHeader title="Thông báo" />
            <Divider />
            <CardContent>
              <Stack spacing={3}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Loại vé này <b>đang tạm khóa</b> do sự kiện này chưa thể tạo loại vé với <b>giá tiền {'>'} 0đ</b>.
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Quý khách vui lòng gửi email với tiêu đề <b>"Yêu cầu tạo loại vé có giá tiền {'>'} 0đ"</b> đến địa chỉ <b>tienphongsmart@gmail.com</b>. Chúng tôi sẽ hỗ trợ trong thời gian 24h kể từ khi nhận được yêu cầu. Xin cảm ơn!
                </Typography>
                <div style={{ marginTop: '20px', justifyContent: 'center' }}>
                  <Button fullWidth variant='contained' size="small" onClick={handleCloseNotifModal} >
                    Đã hiểu
                  </Button>
                </div>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>
    </>
  );
}
