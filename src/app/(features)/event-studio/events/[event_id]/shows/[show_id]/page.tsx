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

export default function UpdateShowPage({ params }: { params: { event_id: number; show_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Chỉnh sửa suất diễn | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);

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
        notificationCtx.error('Không thể tải thông tin suất diễn.', error);
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
        notificationCtx.warning('Tên suất diễn không được để trống.');
        return;
      }
      if (!formData.type) {
        notificationCtx.warning('Chế độ suất diễn không được để trống');
        return;
      }
      if (!formData.startDateTime || !formData.endDateTime) {
        notificationCtx.warning('Thời gian suất diễn không được để trống.');
        return;
      }
      if (new Date(formData.startDateTime) > new Date(formData.endDateTime)) {
        notificationCtx.warning('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc');
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
      notificationCtx.success('Đã cập nhật suất diễn thành công.');
      router.push(`/event-studio/events/${eventId}/schedules`);
    } catch (error) {
      notificationCtx.error('Lỗi khi cập nhật suất diễn.', error);
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
          <Typography variant="h4">Chỉnh sửa suất diễn</Typography>
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
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Tên suất diễn</InputLabel>
                      <OutlinedInput label="Tên suất diễn" name="name" value={formData.name} onChange={handleChange} />
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
                      <FormHelperText>Chế độ công khai: Cho phép Người mua nhìn thấy.</FormHelperText>
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
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: '3' }}>
              <Button variant="contained" onClick={handleSubmit}>
                Lưu
              </Button>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
