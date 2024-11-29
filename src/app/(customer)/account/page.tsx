'use client';
import * as React from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import { useState, useEffect, useContext } from 'react';
import { AxiosResponse } from 'axios';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import NotificationContext from '@/contexts/notification-context';
import { User } from '@/types/auth';
import { useUser } from '@/hooks/use-user';
import { Avatar } from '@mui/material';

export default function Page(): React.JSX.Element {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const notificationCtx = useContext(NotificationContext);
  const [user, setUser] = useState<User | null>(null);
  const { getUser } = useUser();

  useEffect(() => {
    const fetchUser = async () => {
      const fetchedUser = getUser();
      setUser(fetchedUser);
    };

    fetchUser();
  }, [getUser]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      notificationCtx.warning('Tất cả các trường là bắt buộc.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      notificationCtx.warning('Mật khẩu mới và mật khẩu xác nhận không khớp.');
      return;
    }

    if (formData.newPassword.length < 8) {
      notificationCtx.warning('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    try {
      setIsLoading(true);
      const response: AxiosResponse = await baseHttpServiceInstance.post('/auth/update-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        email: user?.email, // Include the user's email in the request body
      });

      notificationCtx.success('Mật khẩu đã được cập nhật thành công.');
    } catch (error: any) {
      notificationCtx.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Tài khoản</Typography>
      </div>
      <Grid container spacing={3}>
        <Grid lg={4} md={6} xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2} sx={{ alignItems: 'center' }}>
                <div>
                  <Avatar sx={{ height: '80px', width: '80px', fontSize: '2rem' }}>{user?.email[0].toUpperCase()}</Avatar>
                </div>
                <Stack spacing={1} sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{user?.fullName}</Typography>
                  {/* <Typography color="text.secondary" variant="body2">
              {user.city} {user.country}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {user.timezone}
            </Typography> */}
                </Stack>
              </Stack>
            </CardContent>
            <Divider />
            <CardActions>
              <Button fullWidth variant="text">
                Upload picture
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid lg={8} md={6} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardHeader subheader="The information can be edited" title="Profile" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel shrink >Họ tên</InputLabel>
                      <OutlinedInput notched value={user?.fullName} label="Họ tên" name="fullName" inputProps={{ shrink: true }} />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required disabled>
                      <InputLabel shrink>Địa chỉ Email</InputLabel>
                      <OutlinedInput notched defaultValue={user?.email} label="Địa chỉ Email" name="email" />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel shrink>Số điện thoại</InputLabel>
                      <OutlinedInput notched defaultValue={user?.phoneNumber} label="Số điện thoại" name="phoneNumber" type="tel" />
                    </FormControl>
                  </Grid>

                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Địa chỉ</InputLabel>
                      <OutlinedInput label="Địa chỉ" />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
              <Divider />
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button variant="contained">Save details</Button>
              </CardActions>
            </Card>
            <Card>
              <CardHeader subheader="Thay đổi mật khẩu" title="Mật khẩu" />
              <Divider />
              <CardContent>
                <Stack spacing={3} sx={{ maxWidth: 'sm' }}>
                  <FormControl fullWidth>
                    <InputLabel>Mật khẩu hiện tại</InputLabel>
                    <OutlinedInput
                      label="Mật khẩu hiện tại"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleChange}
                    />
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Mật khẩu mới</InputLabel>
                    <OutlinedInput
                      label="Mật khẩu mới"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                    />
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Nhập lại mật khẩu mới</InputLabel>
                    <OutlinedInput
                      label="Nhập lại mật khẩu mới"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </FormControl>
                </Stack>
              </CardContent>
              <Divider />
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button onClick={handleSubmit} variant="contained" type="submit" disabled={isLoading}>
                  {isLoading ? 'Đang cập nhật...' : 'Cập nhật'}
                </Button>
              </CardActions>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
