'use client';

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
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill'; // Import ReactQuill

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

type TicketcategoryFormData = {
  name: string;
  type: string;
  price: number;
  quantity: number;
  limitPerTransaction: number | null;
  limitPerCustomer: number | null;
  status: string;
  description: string;
  approvalMethod: string;
}
export default function Page({
  params,
}: {
  params: { event_id: number; show_id: number; ticket_category_id: number };
}): React.JSX.Element {
  const { tt, locale } = useTranslation();
  React.useEffect(() => {
    document.title = tt("Chi tiết loại vé | ETIK - Vé điện tử & Quản lý sự kiện", "Ticket Category Details | ETIK - E-tickets & Event Management");
  }, [tt]);
  const eventId = params.event_id;
  const showId = params.show_id;
  const ticketCategoryId = params.ticket_category_id;
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showName, setShowName] = useState<string>('');
  const [isTransactionLimitUnlimited, setIsTransactionLimitUnlimited] = useState(false);
  const [isCustomerLimitUnlimited, setIsCustomerLimitUnlimited] = useState(false);
  const [openNotifModal, setOpenNotifModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<TicketcategoryFormData>({
    name: '',
    type: 'public',
    price: 0,
    quantity: 100,
    limitPerTransaction: 2,
    limitPerCustomer: 4,
    description: '', // Ensure this is part of the state
    status: 'on_sale',
    approvalMethod: 'auto',
  });
  const router = useRouter();

  // Fetch ticket category details
  useEffect(() => {
    const fetchTicketCategory = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse = await baseHttpServiceInstance.get(
          `/event-studio/events/${eventId}/shows/${showId}/ticket-categories/${ticketCategoryId}`
        );
        const ticketCategory = response.data;
        setFormData({
          name: ticketCategory.name,
          type: ticketCategory.type,
          price: ticketCategory.price,
          description: ticketCategory.description || '',
          status: ticketCategory.status,
          quantity: ticketCategory.quantity,
          limitPerTransaction: ticketCategory.limitPerTransaction || null,
          limitPerCustomer: ticketCategory.limitPerCustomer || null,
          approvalMethod: ticketCategory.approvalMethod,
        });
        setShowName(ticketCategory.show.name)
        // Set the checkbox states based on the fetched values
        setIsTransactionLimitUnlimited(ticketCategory.limitPerTransaction === undefined || ticketCategory.limitPerTransaction === null);
        setIsCustomerLimitUnlimited(ticketCategory.limitPerCustomer === undefined || ticketCategory.limitPerCustomer === null);
      } catch (error) {
        notificationCtx.error('Lỗi:', error);
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

  // Save the edited ticket category
  const handleSave = async () => {
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
      const response: AxiosResponse = await baseHttpServiceInstance.put(
        `/event-studio/events/${eventId}/shows/${showId}/ticket-categories/${ticketCategoryId}`,
        {
          name: formData.name,
          type: formData.type,
          price: formData.price,
          quantity: formData.quantity,
          description: formData.description,
          limitPerTransaction: formData.limitPerTransaction,
          limitPerCustomer: formData.limitPerCustomer,
          status: formData.status,
          approvalMethod: formData.approvalMethod,
          // Note: creationMethod, issuingMethod, etc. are currently mocked and not saved to backend
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
            <Typography variant="h4">{tt('Xem chi tiết loại vé', 'View Ticket Category Details')} "{formData.name}"</Typography>
            <Typography variant="body2">{tt('Suất diễn', 'Show')} "{showName}"</Typography>
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
                        <Select
                          label={tt("Phân loại", "Category")}
                          name="type"
                          value={formData.type}
                          onChange={(event: any) => handleChange(event)}
                        >
                          <MenuItem value="private">{tt("Nội bộ", "Private")}</MenuItem>
                          <MenuItem value="public">{tt("Công khai", "Public")}</MenuItem>
                        </Select>
                        <FormHelperText>{tt("Chế độ công khai: Cho phép Người mua nhìn thấy và mua vé này", "Public mode: Allows buyers to see and purchase this ticket")}</FormHelperText>
                      </FormControl>
                    </Grid>
                    {formData.type === 'public' && (
                      <Grid md={4} xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel>{tt("Cách phê duyệt đơn hàng", "Order Approval Method")}</InputLabel>
                          <Select label={tt("Cách phê duyệt yêu cầu mua vé của khách hàng", "How to approve customer ticket purchase requests")} name="approvalMethod" value={formData.approvalMethod} onChange={(event: any) => handleChange(event)}>
                            <MenuItem value="auto">{tt("Theo mặc định sự kiện", "Auto Approve")}</MenuItem>
                            <MenuItem value="manual">{tt("Phê duyệt thủ công", "Manual Approval")}</MenuItem>
                          </Select>
                          <FormHelperText>{tt("Phê duyệt thủ công: nếu đơn hàng có vé này, bạn phải kiểm tra và xuất vé cho khách hàng", "Manual approval: you must check and issue tickets to customers")}</FormHelperText>
                        </FormControl>
                      </Grid>
                    )}
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth>
                        <ReactQuill
                          value={formData.description}
                          onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
                          placeholder={tt("Nhập mô tả sự kiện...", "Enter event description...")}
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
                        <InputLabel>{tt("Trạng thái", "Status")}</InputLabel>
                        <Select
                          label={tt("Trạng thái", "Status")}
                          name="status"
                          value={formData.status}
                          onChange={handleChange as (event: SelectChangeEvent<string>, child: React.ReactNode) => void}
                        >
                          <MenuItem value="on_sale">{tt("Đang mở bán", "On Sale")}</MenuItem>
                          <MenuItem value="not_opened_for_sale">{tt("Chưa mở bán", "Not Open for Sale")}</MenuItem>
                          <MenuItem value="temporarily_locked">{tt("Đang tạm khoá", "Temporarily Locked")}</MenuItem>
                        </Select>
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
                <Button variant="contained" onClick={handleSave}>
                  {tt("Lưu", "Save")}
                </Button>
              </Grid>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </>
  );
}
