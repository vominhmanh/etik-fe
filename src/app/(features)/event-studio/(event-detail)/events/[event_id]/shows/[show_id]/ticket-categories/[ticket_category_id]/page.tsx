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
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Unstable_Grid2';
import { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill'; // Import ReactQuill
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import IconButton from '@mui/material/IconButton';
import { CaretLeft } from '@phosphor-icons/react/dist/ssr';

type Show = {
  id: number;
  name: string;
  seatmapMode: 'no_seatmap' | 'seatings_selection' | 'ticket_categories_selection';
}

type TicketcategoryFormData = {
  name: string;
  type: string;
  price: number;
  quantity: number;
  limitPerTransaction: number | null;
  limitPerCustomer: number | null;
  status: string;
  description: string;
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

  /* State */
  const [show, setShow] = useState<Show | null>(null);
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
    description: '',
    status: 'on_sale',
  });

  const [audiences, setAudiences] = useState<any[]>([]);
  const [audiencePrices, setAudiencePrices] = useState<Record<number, number>>({});
  const [selectedAudiences, setSelectedAudiences] = useState<number[]>([]);

  const router = useRouter();

  // Fetch ticket category details
  useEffect(() => {
    const fetchTicketCategory = async () => {
      try {
        setIsLoading(true);
        // Fetch show details separately to get seatmapMode
        const [showResponse, audResponse, tcResponse] = await Promise.all([
          baseHttpServiceInstance.get(`/event-studio/events/${eventId}/shows/${showId}`),
          baseHttpServiceInstance.get(`/event-studio/events/${eventId}/audiences`),
          baseHttpServiceInstance.get(`/event-studio/events/${eventId}/shows/${showId}/ticket-categories/${ticketCategoryId}`)
        ]);

        setShow(showResponse.data);
        setAudiences(audResponse.data || []);

        const ticketCategory = tcResponse.data;
        setFormData({
          name: ticketCategory.name,
          type: ticketCategory.type,
          price: ticketCategory.price,
          description: ticketCategory.description || '',
          status: ticketCategory.status,
          quantity: ticketCategory.quantity,
          limitPerTransaction: ticketCategory.limitPerTransaction || null,
          limitPerCustomer: ticketCategory.limitPerCustomer || null,
        });

        // Populate audience prices
        const prices: Record<number, number> = {};
        const selected: number[] = [];

        if (ticketCategory.categoryAudiences && Array.isArray(ticketCategory.categoryAudiences)) {
          ticketCategory.categoryAudiences.forEach((ca: any) => {
            prices[ca.audienceId] = ca.price;
            selected.push(ca.audienceId);
          });
        }

        // Ensure default 'Adult' audience is handled if not present (legacy data)
        const allAudiences = audResponse.data || [];
        const defaultAudience = allAudiences.find((a: any) => a.isDefault) ||
          allAudiences.find((a: any) => a.code === 'adult') ||
          allAudiences[0];

        if (defaultAudience && !selected.includes(defaultAudience.id)) {
          // If adult not linked, maybe use base price?
          // User requirement: "display audience that has is_default = True"
          // For legacy, display base price as adult price?
          prices[defaultAudience.id] = ticketCategory.price;
          selected.push(defaultAudience.id);
        }

        setAudiencePrices(prices);
        setSelectedAudiences(selected);

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
  }, [eventId, ticketCategoryId, showId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleAudiencePriceChange = (audienceId: number, value: string) => {
    let rawValue = value.replace(/\./g, '');
    if (!/^\d*$/.test(rawValue)) return;
    const numValue = parseFloat(rawValue) || 0;

    setAudiencePrices(prev => ({ ...prev, [audienceId]: numValue }));

    const defaultAudience = audiences.find((a: any) => a.isDefault) ||
      audiences.find((a: any) => a.code === 'adult') ||
      audiences[0];
    if (defaultAudience && defaultAudience.id === audienceId) {
      setFormData(prev => ({ ...prev, price: numValue }));
    }
  }

  const handleToggleAudience = (audienceId: number) => {
    if (selectedAudiences.includes(audienceId)) {
      if (selectedAudiences.length > 1) {
        setSelectedAudiences(prev => prev.filter(id => id !== audienceId));
      }
    } else {
      setSelectedAudiences(prev => [...prev, audienceId]);
    }
  }

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

    // Validate Audience Prices (same as Create)
    const defaultAudience = audiences.find((a: any) => a.isDefault) ||
      audiences.find((a: any) => a.code === 'adult') ||
      audiences[0];
    if (defaultAudience && selectedAudiences.includes(defaultAudience.id)) {
      // Validation logic if needed
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
      const response: AxiosResponse<TicketcategoryFormData> = await baseHttpServiceInstance.put(
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
          audiences: selectedAudiences.map(id => ({
            audienceId: id,
            price: audiencePrices[id] !== undefined ? audiencePrices[id] : 0
          }))
        }
      );
      notificationCtx.success(response.data);
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
        <Stack direction="row" spacing={3} alignItems="center">
          <IconButton onClick={() => {
            const path = `/event-studio/events/${eventId}/shows`;
            router.push(locale === 'en' ? `/en${path}` : path);
          }}>
            <CaretLeft />
          </IconButton>
          <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
            <Typography variant="h4">{tt('Xem chi tiết loại vé', 'View Ticket Category Details')} "{formData.name}"</Typography>
            {show && <Typography variant="body2">{tt('Suất diễn', 'Show')} "{show.name}"</Typography>}
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
                        <OutlinedInput label={tt("Tên loại vé", "Ticket Category Name")} name="name" value={formData.name} onChange={handleChange as any} />
                      </FormControl>
                    </Grid>
                    <Grid md={4} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>{tt("Phân loại", "Category")}</InputLabel>
                        <Select
                          label={tt("Phân loại", "Category")}
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                        >
                          <MenuItem value="private">{tt("Nội bộ", "Private")}</MenuItem>
                          <MenuItem value="public">{tt("Công khai", "Public")}</MenuItem>
                        </Select>
                        <FormHelperText>{tt("Chế độ công khai: Cho phép Người mua nhìn thấy và mua vé này", "Public mode: Allows buyers to see and purchase this ticket")}</FormHelperText>
                      </FormControl>
                    </Grid>
                    <Grid md={4} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>{tt("Trạng thái", "Status")}</InputLabel>
                        <Select
                          label={tt("Trạng thái", "Status")}
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                        >
                          <MenuItem value="on_sale">{tt("Đang mở bán", "On Sale")}</MenuItem>
                          <MenuItem value="not_opened_for_sale">{tt("Chưa mở bán", "Not Open for Sale")}</MenuItem>
                          <MenuItem value="temporarily_locked">{tt("Đang tạm khoá", "Temporarily Locked")}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
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
                <CardHeader
                  title={tt("Giá vé theo đối tượng", "Price by Audience")}
                  subheader={tt("Cấu hình giá cho từng đối tượng khán giả.", "Configure prices for each audience type.")}
                  action={
                    <Box>
                      <FormControl sx={{ minWidth: 130 }} size="small">
                        <InputLabel>{tt("Thêm đối tượng", "Add Audience")}</InputLabel>
                        <Select
                          label={tt("Thêm đối tượng", "Add Audience")}
                          value=""
                          onChange={(e) => handleToggleAudience(Number(e.target.value))}
                        >
                          {audiences.filter(a => !selectedAudiences.includes(a.id)).map((audience) => (
                            <MenuItem key={audience.id} value={audience.id}>
                              {audience.name}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>{tt("*thay đổi đối tượng tại trang chính", "*change audience at the main page.")}</FormHelperText>
                      </FormControl>
                    </Box>
                  }
                />
                <CardContent>
                  <TableContainer component={Paper} elevation={0}>
                    <Table sx={{ minWidth: 400, '& td, & th': { border: 0 } }} aria-label="audience price table">
                      <TableBody>
                        {selectedAudiences.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              <Typography color="text.secondary" variant="body2">
                                {tt("Chưa chọn đối tượng nào.", "No audience selected.")}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                        {selectedAudiences.map(audienceId => {
                          const audience = audiences.find(a => a.id === audienceId);
                          if (!audience) return null;
                          return (
                            <TableRow key={audienceId}>
                              <TableCell width="40%">
                                <Typography sx={{ fontWeight: (audience.isDefault || audience.code === 'adult') ? 'bold' : 'normal' }}>
                                  {audience.name} {(audience.isDefault || audience.code === 'adult') && `(${tt("Mặc định", "Default")})`}
                                </Typography>
                              </TableCell>
                              <TableCell width="40%">
                                <OutlinedInput
                                  size="small"
                                  fullWidth
                                  value={audiencePrices[audienceId]?.toLocaleString('vi-VN') || ''}
                                  onChange={(e) => handleAudiencePriceChange(audienceId, e.target.value)}
                                  endAdornment={<InputAdornment position="end">đ</InputAdornment>}
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell width="20%">
                                {!(audience.isDefault || audience.code === 'adult') && (
                                  <Button size="small" color="error" onClick={() => handleToggleAudience(audienceId)}>
                                    {tt("Xoá", "Remove")}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  title={tt("Số lượng vé", "Ticket Quantity")}
                  subheader={show?.seatmapMode !== 'no_seatmap' ?
                    <Typography variant="caption" color="text.secondary">
                      {tt("Suất diễn này sử dụng sơ đồ ghế, số lượng được đếm tự động theo sơ đồ.", "This show uses a seat map, quantity is counted automatically based on the map.")}
                    </Typography> : null
                  }
                  action={
                    <OutlinedInput
                      sx={{ maxWidth: { xs: 70, sm: 180 } }}
                      type="text"
                      value={formData.quantity.toLocaleString('vi-VN')}
                      onChange={(e) => {
                        let rawValue = e.target.value.replace(/\./g, '');
                        if (!/^\d*$/.test(rawValue)) return;

                        const numericValue = parseFloat(rawValue) || 0;
                        setFormData((prev) => ({ ...prev, quantity: numericValue }));
                      }}
                      disabled={show?.seatmapMode !== 'no_seatmap'}
                    />
                  }
                />

                {/* Legacy Price input replaced */}

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
