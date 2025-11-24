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
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
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
  });
  const router = useRouter();
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch existing show details
  useEffect(() => {
    const fetchShowDetails = async () => {
      try {
        setIsLoading(true);
        const response = await baseHttpServiceInstance.get(`/event-studio/events/${eventId}/shows/${showId}`);
        setFormData({
          name: response.data.name,
          type: response.data.type,
          status: response.data.status,
          startDateTime: response.data.startDateTime,
          endDateTime: response.data.endDateTime,
        });
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
      setIsLoading(true);
      const response = await baseHttpServiceInstance.put(
        `/event-studio/events/${eventId}/shows/${showId}`,
        {
          name: formData.name,
          type: formData.type,
          status: formData.status,
          startDateTime: formData.startDateTime,
          endDateTime: formData.endDateTime,
        }
      );
      notificationCtx.success(tt('Đã cập nhật suất diễn thành công.', 'Show updated successfully.'));
      const path = `/event-studio/events/${eventId}/schedules`;
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
                  <Grid md={6} xs={12}>
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
    </Stack>
  );
}
