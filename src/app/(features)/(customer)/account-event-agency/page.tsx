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
import { Avatar, FormHelperText, Input, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material';
import { SealCheck } from '@phosphor-icons/react/dist/ssr';

interface SellerInfo {
  businessType: string;
  companyName: string;
  businessAddress: string;
  taxCode: string;
  registrationImage: File | null; // File input for the uploaded image
  gcnNumber: string;
  gcnIssueDate: Date;
  gcnIssuePlace: string;

}

export default function Page(): React.JSX.Element {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [sellerInfo, setSellerInfo] = useState({
    businessType: "",
    taxCode: "",
    companyName: "",
    businessAddress: "",
    registrationImage: null,
    gcnNumber: "",
    gcnIssueDate: "",
    gcnIssuePlace: "",
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

  const handleChangeSellerInfo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = event.target;

    if (files && files[0]) {
      // Handle file input
      setSellerInfo((prevState) => ({
        ...prevState,
        [name]: files[0],
      }));
    } else {
      // Handle text input
      setSellerInfo((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleSaveSellerInfo = async (): Promise<void> => {
    if (!sellerInfo.businessType || !sellerInfo.companyName || !sellerInfo.businessAddress || !sellerInfo.taxCode || !sellerInfo.registrationImage) {
      notificationCtx.warning('Tất cả các trường là bắt buộc.');
      return;
    }

    try {
      setIsLoading(true);

      // Create a FormData object to handle file upload
      const payload = new FormData();
      payload.append('businessType', sellerInfo.businessType);
      payload.append('companyName', sellerInfo.companyName);
      payload.append('businessAddress', sellerInfo.businessAddress);
      payload.append('taxCode', sellerInfo.taxCode);
      payload.append('registrationImage', sellerInfo.registrationImage);

      const response: AxiosResponse = await baseHttpServiceInstance.post('/seller-info', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      notificationCtx.success('Thông tin nhà tổ chức đã được lưu thành công.');
    } catch (error: any) {
      notificationCtx.error(error.message || 'Có lỗi xảy ra khi lưu thông tin.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Tài khoản Event Agency</Typography>
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
                  <Typography color="var(--mui-palette-success-400)" variant="body2">
                    {/* {user.city} {user.country} */}
                    <SealCheck /> Tài khoản nhà tổ chức sự kiện
                  </Typography>

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
              <CardHeader
                title="Thông tin Nhà tổ chức sự kiện"
                subheader="Nhà tổ chức sự kiện cần cung cấp các thông tin dưới đây để có thể tạo sự kiện theo nghị định 52/2013/NĐ-CP"
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel shrink>Loại hình kinh doanh</InputLabel>
                      <Select
                        label="Loại hình kinh doanh"
                        value={sellerInfo.businessType || ""} // Default to an empty string
                        onChange={(event: SelectChangeEvent) =>
                          setSellerInfo((prevState) => ({
                            ...prevState,
                            businessType: event.target.value,
                          }))
                        }
                        displayEmpty // Ensures the placeholder is shown for the empty state
                        name="businessType"
                      >
                        <MenuItem value="" disabled>
                          -- Chọn loại hình kinh doanh --
                        </MenuItem>
                        <MenuItem value="Cá nhân">Cá nhân</MenuItem>
                        <MenuItem value="Công ty/ Hộ kinh doanh">Công ty/ Hộ kinh doanh</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {/* Show Tax Code if Cá nhân is selected */}
                  {sellerInfo.businessType === "Cá nhân" ? (
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel shrink>Mã số thuế</InputLabel>
                        <OutlinedInput
                          notched
                          value={sellerInfo.taxCode}
                          onChange={handleChangeSellerInfo}
                          label="Mã số thuế"
                          name="taxCode"
                        />
                      </FormControl>
                    </Grid>
                  ) : (<>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel shrink>Tên công ty/ Hộ kinh doanh</InputLabel>
                        <OutlinedInput
                          notched
                          value={sellerInfo.companyName}
                          onChange={handleChangeSellerInfo}
                          label="Tên công ty/ Hộ kinh doanh"
                          name="companyName"
                        />
                      </FormControl>
                    </Grid>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Địa chỉ đăng ký kinh doanh</InputLabel>
                        <OutlinedInput
                          value={sellerInfo.businessAddress}
                          onChange={handleChangeSellerInfo}
                          label="Địa chỉ đăng ký kinh doanh"
                          name="businessAddress"
                        />
                      </FormControl>
                    </Grid>
                    <Grid md={4} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel shrink>Số GCN ĐKKD</InputLabel>
                        <OutlinedInput
                          notched
                          value={sellerInfo.gcnNumber}
                          onChange={handleChangeSellerInfo}
                          label="Số GCN ĐKKD"
                          name="gcnNumber"
                        />
                      </FormControl>
                    </Grid>

                    <Grid md={4} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel shrink>Ngày cấp GCN ĐKKD</InputLabel>
                        <OutlinedInput
                          notched
                          value={sellerInfo.gcnIssueDate}
                          onChange={handleChangeSellerInfo}
                          label="Ngày cấp GCN ĐKKD"
                          name="gcnIssueDate"
                          type="date"
                        />
                      </FormControl>
                    </Grid>

                    <Grid md={4} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel shrink>Nơi cấp GCN ĐKKD</InputLabel>
                        <OutlinedInput
                          notched
                          value={sellerInfo.gcnIssuePlace}
                          onChange={handleChangeSellerInfo}
                          label="Nơi cấp GCN ĐKKD"
                          name="gcnIssuePlace"
                        />
                      </FormControl>
                    </Grid>
                    <Grid md={12} xs={12}>
                      <Typography color="text.secondary" variant="body2">
                        Tải lên ảnh giấy chứng nhận đăng ký kinh doanh bản gốc
                      </Typography>

                      <FormControl fullWidth required>
                        <TextField
                          variant="standard"
                          inputProps={{ type: 'file' }}
                          onChange={handleChangeSellerInfo}
                          name="registrationImage"
                          helperText="Định dạng .JPG, .JPEG, .PNG, .PDF, tối đa 5MB"
                        />
                      </FormControl>
                    </Grid>
                  </>)}
                </Grid>
              </CardContent>
              <Divider />
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Typography color="text.secondary" variant="body2">
                  Thông tin đang chờ duyệt
                </Typography>
                <Button variant="contained" onClick={handleSaveSellerInfo} disabled={isLoading}>
                  {isLoading ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </CardActions>
            </Card>
            <Card>
              <CardHeader title="Thông tin Ngân hàng" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel shrink >Tên người thụ hưởng</InputLabel>
                      <OutlinedInput
                        notched
                        value={user?.fullName}
                        label="Tên người thụ hưởng"
                        name="fullName"
                        inputProps={{ shrink: true }}
                      />
                      <FormHelperText>
                        Người thụ hưởng phải có thông tin trùng với nhà tổ chức sự kiện
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel shrink >Ngân hàng</InputLabel>
                      <OutlinedInput notched value={user?.fullName} label="Họ tên" name="fullName" inputProps={{ shrink: true }} />
                    </FormControl>
                  </Grid>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel shrink >Số tài khoản</InputLabel>
                      <OutlinedInput notched value={user?.fullName} label="Họ tên" name="fullName" inputProps={{ shrink: true }} />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
              <Divider />
              <CardActions sx={{ justifyContent: 'flex-end' }}>

                <Button variant="contained">Lưu</Button>
              </CardActions>
            </Card>
            
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
