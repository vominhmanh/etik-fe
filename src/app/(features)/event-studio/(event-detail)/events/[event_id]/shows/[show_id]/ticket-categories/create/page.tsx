'use client';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Box, Checkbox, FormControlLabel, FormHelperText, InputAdornment } from '@mui/material';
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
import { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useState } from 'react';
import ReactQuill from 'react-quill'; // Import ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import styles for ReactQuill

type TicketcategoryFormData = {
  name: string;
  type: string;
  price: number;
  quantity: number;
  limitPerTransaction: number | null;
  limitPerCustomer: number | null;
  description: string;
  approvalMethod: string;
}


export default function Page({ params }: { params: { event_id: number; show_id: number } }): React.JSX.Element {
  const { tt, locale } = useTranslation();
  React.useEffect(() => {
    document.title = tt("Thêm mới loại vé | ETIK - Vé điện tử & Quản lý sự kiện", "Add New Ticket Category | ETIK - E-tickets & Event Management");
  }, [tt]);
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
    approvalMethod: 'auto'
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
      notificationCtx.warning(tt('Tên loại vé không được để trống.', 'Ticket category name cannot be empty.'));
      return
    }
    if (formData.limitPerTransaction && formData.limitPerCustomer) {
      if (formData.limitPerTransaction > formData.quantity) {
        notificationCtx.warning(tt('Số vé tối đa mỗi giao dịch phải nhỏ hơn hoặc bằng Tổng số vé.', 'Maximum tickets per transaction must be less than or equal to total tickets.'));
        return
      }
      if (formData.limitPerTransaction && formData.limitPerCustomer && formData.limitPerCustomer > formData.quantity) {
        notificationCtx.warning(tt('Số vé tối đa mỗi khách hàng phải nhỏ hơn hoặc bằng Tổng số vé.', 'Maximum tickets per customer must be less than or equal to total tickets.'));
        return
      }
      if (formData.limitPerTransaction > formData.limitPerCustomer) {
        notificationCtx.warning(tt('Số vé tối đa mỗi giao dịch phải nhỏ hơn hoặc bằng số vé tối đa mỗi khách hàng.', 'Maximum tickets per transaction must be less than or equal to maximum tickets per customer.'));
        return
      }
    }
    if (!formData.limitPerTransaction && formData.limitPerCustomer) {
      notificationCtx.warning(tt('Số vé tối đa mỗi giao dịch phải nhỏ hơn hoặc bằng số vé tối đa mỗi khách hàng.', 'Maximum tickets per transaction must be less than or equal to maximum tickets per customer.'));
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
          approvalMethod: formData.approvalMethod
        }
      );
      notificationCtx.success(response.data.message);
      if (formData.price > 0) {
        setOpenNotifModal(true)
      } else {
        const path = `/event-studio/events/${eventId}/shows`;
        router.push(locale === 'en' ? `/en${path}` : path);
      }
    } catch (error) {
      notificationCtx.error(tt('Lỗi:', 'Error:'), error);
    } finally {
      setIsLoading(false);
    }
  };


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
            <Typography variant="h4">{tt("Loại vé mới", "New Ticket Category")}</Typography>
          </Stack>
        </Stack>
        <Grid container spacing={3}>
          <Grid lg={12} md={12} xs={12}>
            <Stack spacing={3}>
              <Card>
                <CardHeader subheader={tt("Vui lòng điền các trường thông tin phía dưới.", "Please fill in the information fields below.")} title={tt("Thông tin vé", "Ticket Information")} />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid md={4} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>{tt("Tên loại vé", "Ticket Category Name")}</InputLabel>
                        <OutlinedInput label={tt("Tên loại vé", "Ticket Category Name")} name="name" value={formData.name} onChange={handleChange} />
                      </FormControl>
                    </Grid>
                    <Grid md={4} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>{tt("Phân loại", "Category")}</InputLabel>
                        <Select label={tt("Phân loại", "Category")} name="type" value={formData.type} onChange={(event: any) => handleChange(event)}>
                          <MenuItem value="private">{tt("Nội bộ", "Private")}</MenuItem>
                          <MenuItem value="public">{tt("Công khai", "Public")}</MenuItem>
                        </Select>
                        <FormHelperText>{tt("Vé công khai: Cho phép Người mua tự truy cập và mua vé này", "Public ticket: Allows buyers to access and purchase this ticket")}</FormHelperText>
                      </FormControl>
                    </Grid>
                    {formData.type === 'public' && (
                      <Grid md={4} xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel>{tt("Cách phê duyệt đơn hàng", "Order Approval Method")}</InputLabel>
                          <Select label={tt("Cách phê duyệt yêu cầu mua vé của khách hàng", "How to approve customer ticket purchase requests")} name="approvalMethod" value={formData.approvalMethod} onChange={(event: any) => handleChange(event)}>
                            <MenuItem value="auto">{tt("Tự động phê duyệt", "Auto Approve")}</MenuItem>
                            <MenuItem value="manual">{tt("Phê duyệt thủ công", "Manual Approval")}</MenuItem>
                          </Select>
                          <FormHelperText>{tt("Phê duyệt thủ công: bạn phải kiểm tra và xuất vé cho khách hàng", "Manual approval: you must check and issue tickets to customers")}</FormHelperText>
                        </FormControl>
                      </Grid>
                    )}
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth>
                        <ReactQuill value={formData.description} onChange={handleDescriptionChange} placeholder={tt("Mô tả", "Description")} />
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Card>
                <CardHeader
                  title={tt("Số lượng vé", "Ticket Quantity")}
                  action={
                    <OutlinedInput
                      sx={{ maxWidth: { xs: 70, sm: 180 } }}
                      type="text" // Change type to text to allow flexible input handling
                      value={formData.quantity.toLocaleString('vi-VN')}
                      onChange={(e) => {
                        let rawValue = e.target.value.replace(/\./g, ''); // Remove formatting
                        if (!/^\d*$/.test(rawValue)) return; // Allow only numeric input

                        const numericValue = parseFloat(rawValue) || 0; // Convert to number
                        setFormData((prev) => ({ ...prev, quantity: numericValue }));
                      }}
                    />
                  }
                />
                <CardHeader
                  title={tt("Giá vé", "Ticket Price")}
                  action={
                    <OutlinedInput
                      sx={{ maxWidth: { xs: 70, sm: 180 } }}
                      type="text" // Change type to text to allow flexible input handling
                      value={formData.price.toLocaleString('vi-VN')}
                      onChange={(e) => {
                        let rawValue = e.target.value.replace(/\./g, ''); // Remove formatting
                        if (!/^\d*$/.test(rawValue)) return; // Allow only numeric input

                        const numericValue = parseFloat(rawValue) || 0; // Convert to number
                        setFormData((prev) => ({ ...prev, price: numericValue }));
                      }}
                      name="price"
                      endAdornment={<InputAdornment position="end">đ</InputAdornment>}
                    />
                  }
                />
                <CardHeader
                  title={tt("Số vé tối đa mỗi đơn hàng", "Maximum Tickets Per Order")}
                  subheader={
                    <Box display="flex" alignItems="center">
                      <FormControlLabel
                        control={<Checkbox checked={isTransactionLimitUnlimited} onChange={handleTransactionLimitCheckboxChange} />}
                        label={<Typography variant="body2">{tt("Không giới hạn", "Unlimited")}</Typography>}
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
                  title={tt("Số vé tối đa mỗi khách hàng", "Maximum Tickets Per Customer")}
                  subheader={
                    <Box display="flex" alignItems="center">
                      <FormControlLabel
                        control={<Checkbox checked={isCustomerLimitUnlimited} onChange={handleCustomerLimitCheckboxChange} />}
                        label={<Typography variant="body2">{tt("Không giới hạn", "Unlimited")}</Typography>}
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
                  {tt("Tạo", "Create")}
                </Button>
              </Grid>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
      {/* <Modal
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
      </Modal> */}
    </>
  );
}
