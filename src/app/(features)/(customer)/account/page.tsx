'use client';
import { Notifications } from '@/components/dashboard/settings/notifications';
import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { useUser } from '@/hooks/use-user';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { User } from '@/types/auth';
import { Avatar } from '@mui/material';
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
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { AxiosResponse } from 'axios';
import * as React from 'react';
import { useContext, useEffect, useState } from 'react';

export interface UserInformationResponse {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  hasPassword: boolean;
  googleConnected: boolean;
}

export interface UserInformationUpdate {
  fullName: string;
  phoneNumber: string;
  address: string;
}

export default function Page(): React.JSX.Element {
  const { tt } = useTranslation();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [formValues, setFormValues] = useState<UserInformationUpdate>({
    fullName: '',
    phoneNumber: '',
    address: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const notificationCtx = useContext(NotificationContext);
  const [userInfo, setUserInfo] = useState<UserInformationResponse | null>(null);
  const { user } = useUser();


  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  async function fetchData() {
    try {
      setIsLoading(true);
      const data = await getUserInformation();
      if (data) {
        setFormValues({
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          address: data.address,
        });
        setUserInfo(data)
      }
    } catch (error) {
      notificationCtx.error(tt('Không thể tải thông tin cá nhân.', 'Unable to load personal information.'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {

    fetchData();
  }, []);

  const handleInfoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (userInfo?.hasPassword) {
      if (!formData.currentPassword) {
        notificationCtx.warning(tt('Mật khẩu hiện tại là bắt buộc.', 'Current password is required.'));
        return;
      }
      if (!formData.newPassword) {
        notificationCtx.warning(tt('Mật khẩu mới là bắt buộc.', 'New password is required.'));
        return;
      }
      if (!formData.confirmPassword) {
        notificationCtx.warning(tt('Nhập lại mật khẩu mới là bắt buộc.', 'Confirm password is required.'));
        return;
      }
    }

    if (formData.newPassword !== formData.confirmPassword) {
      notificationCtx.warning(tt('Mật khẩu mới và mật khẩu xác nhận không khớp.', 'New password and confirm password do not match.'));
      return;
    }

    if (formData.newPassword.length < 8) {
      notificationCtx.warning(tt('Mật khẩu mới phải có ít nhất 8 ký tự.', 'New password must be at least 8 characters.'));
      return;
    }

    try {
      setIsLoading(true);
      const response: AxiosResponse = await baseHttpServiceInstance.post('/auth/update-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        email: userInfo?.email, // Include the user's email in the request body
      });

      notificationCtx.success(tt('Mật khẩu đã được cập nhật thành công.', 'Password updated successfully.'));
      fetchData();
    } catch (error: any) {
      notificationCtx.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await updateUserInformation(formValues);
      notificationCtx.success(tt('Cập nhật thông tin thành công.', 'Information updated successfully.'));
      setUserInfo({ email: userInfo?.email || '', fullName: formValues.fullName, phoneNumber: formValues.phoneNumber, address: formValues.address, hasPassword: userInfo?.hasPassword || false, googleConnected: userInfo?.googleConnected || false })
    } catch (error) {
      notificationCtx.error(tt('Không thể cập nhật thông tin.', 'Unable to update information.'));
    } finally {
      setIsLoading(false);
    }
  };
  // Fetch user information
  const getUserInformation = async (): Promise<UserInformationResponse | null> => {
    try {
      const response: AxiosResponse<UserInformationResponse> = await baseHttpServiceInstance.get('/account/information');
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Update user information
  const updateUserInformation = async (data: UserInformationUpdate): Promise<UserInformationResponse | null> => {
    try {
      const response: AxiosResponse<UserInformationResponse> = await baseHttpServiceInstance.post('/account/information', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">{tt('Cài đặt Tài khoản', 'Account Settings')}</Typography>
      </div>
      <Grid container spacing={3}>
        <Grid lg={4} md={6} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Stack spacing={2} sx={{ alignItems: 'center' }}>
                  <div>
                    <Avatar sx={{ height: '80px', width: '80px', fontSize: '2rem' }}>{(userInfo?.email[0] || '').toUpperCase()}</Avatar>
                  </div>
                </Stack>
              </CardContent>
              <Divider />
              <CardActions>
                <Button fullWidth variant="text">
                  {tt('Thay đổi ảnh đại diện', 'Change Avatar')}
                </Button>
              </CardActions>
            </Card>
            <Card>
              <CardHeader title={tt('Tùy chọn liên kết đăng nhập', 'Login Connection Options')} />
              <Divider />
              <CardContent>
                <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1">{tt('Tài khoản Google', 'Google Account')}</Typography>
                  </Stack>
                  <Typography variant="body1">
                    {userInfo?.googleConnected ? tt('Đã liên kết', 'Connected') : tt('Chưa liên kết', 'Not Connected')}
                  </Typography>
                </Grid>

              </CardContent>
            </Card>
            <Card>
              <CardHeader title={tt('Ví', 'Wallet')} />
              <Divider />
              <CardContent>

                <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1">{tt('Tài khoản cá nhân', 'Personal Account')}</Typography>
                  </Stack>
                  <Typography variant="body1">
                    {tt('Chưa liên kết', 'Not Connected')}
                  </Typography>
                </Grid>

                <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1">{tt('Ví ETIK', 'ETIK Wallet')}</Typography>
                  </Stack>
                  <Typography variant="body1">
                    0 VNĐ
                  </Typography>
                </Grid>

                <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body1">{tt('Nợ', 'Debt')}</Typography>
                  </Stack>
                  <Typography variant="body1">
                    0 VNĐ
                  </Typography>
                </Grid>

              </CardContent>
            </Card>
          </Stack>

        </Grid>
        <Grid lg={8} md={6} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title={tt('Thông tin cá nhân', 'Personal Information')} />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel shrink>{tt('Họ tên', 'Full Name')}</InputLabel>
                      <OutlinedInput notched value={formValues.fullName} onChange={handleInfoChange} label={tt('Họ tên', 'Full Name')} name="fullName" />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required disabled>
                      <InputLabel shrink>{tt('Địa chỉ Email', 'Email Address')}</InputLabel>
                      <OutlinedInput notched value={userInfo?.email || ''} label={tt('Địa chỉ Email', 'Email Address')} name="email" />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel shrink>{tt('Số điện thoại', 'Phone Number')}</InputLabel>
                      <OutlinedInput notched value={formValues.phoneNumber} onChange={handleInfoChange} label={tt('Số điện thoại', 'Phone Number')} name="phoneNumber" type="tel" />
                    </FormControl>
                  </Grid>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>{tt('Địa chỉ', 'Address')}</InputLabel>
                      <OutlinedInput value={formValues.address} onChange={handleInfoChange} label={tt('Địa chỉ', 'Address')} name="address" />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
              <Divider />
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={handleSave} disabled={isLoading}>
                  {isLoading ? tt('Đang lưu...', 'Saving...') : tt('Lưu', 'Save')}
                </Button>
              </CardActions>
            </Card>

            <Card>
              {userInfo?.hasPassword ? (
                <CardHeader subheader={tt('Thay đổi mật khẩu', 'Change password')} title={tt('Mật khẩu', 'Password')} />
              ) : (
                <CardHeader subheader={tt('Tạo mật khẩu để đăng nhập ETIK bằng email và mật khẩu', 'Create a password to login to ETIK with email and password')} title={tt('Thiết lập mật khẩu', 'Set Up Password')} />
              )}
              <Divider />
              <CardContent>
                <Stack spacing={3} sx={{ maxWidth: 'sm' }}>
                  {userInfo?.hasPassword && (
                    <FormControl fullWidth>
                      <InputLabel>{tt('Mật khẩu hiện tại', 'Current Password')}</InputLabel>
                      <OutlinedInput
                        label={tt('Mật khẩu hiện tại', 'Current Password')}
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                      />
                    </FormControl>
                  )}
                  <FormControl fullWidth>
                    <InputLabel>{tt('Mật khẩu mới', 'New Password')}</InputLabel>
                    <OutlinedInput
                      label={tt('Mật khẩu mới', 'New Password')}
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                    />
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>{tt('Nhập lại mật khẩu mới', 'Confirm New Password')}</InputLabel>
                    <OutlinedInput
                      label={tt('Nhập lại mật khẩu mới', 'Confirm New Password')}
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
                  {isLoading ? tt('Đang cập nhật...', 'Updating...') : tt('Cập nhật', 'Update')}
                </Button>
              </CardActions>
            </Card>
            <Notifications />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
