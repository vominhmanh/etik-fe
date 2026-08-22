'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { FormHelperText, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import { Box, Checkbox, FormControlLabel, IconButton, Avatar } from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Pencil as PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useEffect, useState } from 'react';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';

export default function UpdateShowPage({ params }: { params: { event_id: number; show_id: number } }): React.JSX.Element {
  const { tt, locale } = useTranslation();
  React.useEffect(() => {
    document.title = tt("Chỉnh sửa suất diễn | ETIK - Vé điện tử & Quản lý sự kiện", "Edit Show | ETIK - E-tickets & Event Management");
  }, [tt]);

  const eventId = params.event_id;
  const showId = params.show_id;
  const [formData, setFormData] = useState({
    name: '',
    type: 'public',
    status: 'on_sale',
    endDateTime: '',
    startDateTime: '',
    limitPerTransaction: null as number | null,
    minPerTransaction: null as number | null,
    limitPerCustomer: null as number | null,
    avatar: '',
  });
  const [isTransactionLimitUnlimited, setIsTransactionLimitUnlimited] = useState(false);
  const [isMinTransactionLimitUnlimited, setIsMinTransactionLimitUnlimited] = useState(false);
  const [isCustomerLimitUnlimited, setIsCustomerLimitUnlimited] = useState(false);
  const router = useRouter();
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [eventData, setEventData] = useState<any>(null);

  // Fetch existing show details and event details
  useEffect(() => {
    const fetchShowDetails = async () => {
      try {
        setIsLoading(true);
        const [eventRes, showRes] = await Promise.all([
          baseHttpServiceInstance.get(`/event-studio/events/${eventId}`),
          baseHttpServiceInstance.get(`/event-studio/events/${eventId}/shows/${showId}`)
        ]);
        setEventData(eventRes.data);
        const response = showRes;
        setFormData({
          name: response.data.name,
          type: response.data.type,
          status: response.data.status,
          startDateTime: response.data.startDateTime,
          endDateTime: response.data.endDateTime,
          limitPerTransaction: response.data.limitPerTransaction,
          minPerTransaction: response.data.minPerTransaction,
          limitPerCustomer: response.data.limitPerCustomer,
          avatar: response.data.avatar || '',
        });
        setIsTransactionLimitUnlimited(response.data.limitPerTransaction === null);
        setIsMinTransactionLimitUnlimited(response.data.minPerTransaction === null);
        setIsCustomerLimitUnlimited(response.data.limitPerCustomer === null);
      } catch (error) {
        notificationCtx.error(tt('Không thể tải thông tin suất diễn.', 'Unable to load show information.'), error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShowDetails();
  }, [eventId, showId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
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

  const handleMinTransactionLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      minPerTransaction: e.target.value ? parseFloat(e.target.value.replace(/\./g, '')) : 0
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

  const handleMinTransactionLimitCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsMinTransactionLimitUnlimited(e.target.checked);
    if (e.target.checked) {
      setFormData((prev) => ({ ...prev, minPerTransaction: null }));
    } else {
      setFormData((prev) => ({ ...prev, minPerTransaction: 1 })); // Reset to default value
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

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsLoading(true);
        const presignedResponse = await baseHttpServiceInstance.post('/common/s3/generate_presigned_url', {
          filename: file.name,
          content_type: file.type,
        });
        const { presignedUrl, fileUrl } = presignedResponse.data;

        await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        setFormData((prev) => ({ ...prev, avatar: fileUrl }));
      } catch (error) {
        notificationCtx.error(tt('Lỗi tải ảnh:', 'Image upload error:'), error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name) {
        notificationCtx.warning(tt('Tên suất diễn không được để trống.', 'Show name cannot be empty.'));
        return;
      }
      if (!formData.type) {
        notificationCtx.warning(tt('Chế độ suất diễn không được để trống', 'Show mode cannot be empty'));
        return;
      }
      if (!formData.startDateTime || !formData.endDateTime) {
        notificationCtx.warning(tt('Thời gian suất diễn không được để trống.', 'Show time cannot be empty.'));
        return;
      }
      if (new Date(formData.startDateTime) > new Date(formData.endDateTime)) {
        notificationCtx.warning(tt('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc', 'Start time must be less than end time'));
        return;
      }
      if (eventData) {
        if (eventData.startDateTime && new Date(formData.startDateTime) < new Date(eventData.startDateTime)) {
          notificationCtx.warning(tt('Thời gian bắt đầu của suất diễn không được sớm hơn thời gian bắt đầu sự kiện', 'Show start time cannot be earlier than event start time'));
          return;
        }
        if (eventData.endDateTime && new Date(formData.endDateTime) > new Date(eventData.endDateTime)) {
          notificationCtx.warning(tt('Thời gian kết thúc của suất diễn không được trễ hơn thời gian kết thúc sự kiện', 'Show end time cannot be later than event end time'));
          return;
        }
      }
      setIsLoading(true);
      const response = await baseHttpServiceInstance.put(
        `/event-studio/events/${eventId}/shows/${showId}`,
        {
          name: formData.name,
          type: formData.type,
          status: formData.status,
          startDateTime: formData.startDateTime,
          endDateTime: formData.endDateTime,
          limitPerTransaction: formData.limitPerTransaction,
          minPerTransaction: formData.minPerTransaction,
          limitPerCustomer: formData.limitPerCustomer,
          avatar: formData.avatar || null,
        }
      );
      notificationCtx.success(tt('Đã cập nhật suất diễn thành công.', 'Show updated successfully.'));
      const path = `/event-studio/events/${eventId}/shows`;
      router.push(locale === 'en' ? `/en${path}` : path);
    } catch (error) {
      notificationCtx.error(tt('Lỗi khi cập nhật suất diễn.', 'Error updating show.'), error);
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
          <Typography variant="h4">{tt("Chỉnh sửa suất diễn", "Edit Show")}</Typography>
        </Stack>
      </Stack>
      <Grid container spacing={3}>
        <Grid lg={12} md={12} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardHeader subheader={tt("Vui lòng điền các trường thông tin phía dưới.", "Please fill in the information fields below.")} title={tt("Thông tin suất diễn", "Show Information")} />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={1} xs={3} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        {formData.avatar ? (
                          <Box
                            component="img"
                            src={formData.avatar}
                            sx={{
                              height: '80px',
                              width: '80px',
                              borderRadius: 2,
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <Avatar variant="rounded" sx={{ height: '80px', width: '80px', borderRadius: 2, fontSize: '2rem' }}>
                            {formData.name ? formData.name[0].toUpperCase() : 'S'}
                          </Avatar>
                        )}
                        <IconButton
                          component="label"
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            width: 28,
                            height: 28,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 1)',
                            },
                          }}
                        >
                          <PencilIcon fontSize="var(--icon-fontSize-xs)" />
                          <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                        </IconButton>
                      </div>
                    </Stack>
                  </Grid>
                  <Grid md={5} xs={9}>
                    <FormControl fullWidth required>
                      <InputLabel>{tt("Tên suất diễn", "Show Name")}</InputLabel>
                      <OutlinedInput label={tt("Tên suất diễn", "Show Name")} name="name" value={formData.name} onChange={handleChange} />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
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
                      <FormHelperText>{tt("Chế độ công khai: Cho phép Người mua nhìn thấy.", "Public mode: Allows buyers to see.")}</FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <TextField
                        label={tt("Thời gian bắt đầu", "Start Time")}
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
                        label={tt("Thời gian kết thúc", "End Time")}
                        type="datetime-local"
                        name="endDateTime"
                        value={formData.endDateTime || ''}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                      />
                    </FormControl>
                  </Grid>


                  <Grid md={6} xs={12}>
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
                          value={formData.limitPerTransaction !== null ? (formData.limitPerTransaction as number).toLocaleString('vi-VN') : ''}
                          onChange={handleTransactionLimitChange}
                          disabled={isTransactionLimitUnlimited}
                        />
                      }
                      sx={{ p: 0 }}
                    />
                  </Grid>
                  <Grid md={6} xs={12}>
                    <CardHeader
                      title={tt("Số vé tối thiểu mỗi đơn hàng", "Minimum Tickets Per Order")}
                      subheader={
                        <Box display="flex" alignItems="center">
                          <FormControlLabel
                            control={<Checkbox checked={isMinTransactionLimitUnlimited} onChange={handleMinTransactionLimitCheckboxChange} />}
                            label={<Typography variant="body2">{tt("Không giới hạn", "Unlimited")}</Typography>}
                          />
                        </Box>
                      }
                      action={
                        <OutlinedInput
                          sx={{ maxWidth: { xs: 70, sm: 180 } }}
                          type="number"
                          value={formData.minPerTransaction !== null ? (formData.minPerTransaction as number).toLocaleString('vi-VN') : ''}
                          onChange={handleMinTransactionLimitChange}
                          disabled={isMinTransactionLimitUnlimited}
                        />
                      }
                      sx={{ p: 0 }}
                    />
                  </Grid>
                  <Grid md={6} xs={12}>
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
                          value={formData.limitPerCustomer !== null ? (formData.limitPerCustomer as number).toLocaleString('vi-VN') : ''}
                          onChange={handleCustomerLimitChange}
                          disabled={isCustomerLimitUnlimited}
                        />
                      }
                      sx={{ p: 0 }}
                    />
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
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: '3' }}>
              <Button variant="contained" onClick={handleSubmit}>
                {tt("Lưu", "Save")}
              </Button>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Stack >
  );
}
