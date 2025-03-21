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
import { Avatar, Box, Chip, Dialog, DialogContent, DialogTitle, FormHelperText, Input, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material';
import { SealCheck } from '@phosphor-icons/react/dist/ssr';
import dayjs from 'dayjs';

interface EventAgencyRegistration {
  businessType: "individual" | "company";
  contactFullName: string;
  contactEmail: string;
  contactPhoneNumber: string;
  contactAddress: string;

  // Individual fields
  fullName?: string;
  placeOfResidence?: string;

  // Shared field
  taxCode: string;

  // Company fields
  companyName?: string;
  businessAddress?: string;
  gcnIssueDate?: string;
  gcnIssuePlace?: string;

  // Now supports multiple images
  registrationImages: string[];
}

interface SendRequestProps {
  open: boolean;
  onClose: () => void;
  eventId: number;
}

export default function SendRequestEventAgencyAndEventApproval({ open, onClose, eventId }: SendRequestProps): React.JSX.Element {
  const [formData, setFormData] = useState<EventAgencyRegistration>({
    businessType: "individual",
    contactFullName: "",
    contactEmail: "",
    contactPhoneNumber: "",
    contactAddress: "",
    fullName: "",
    placeOfResidence: "",
    taxCode: "",
    companyName: "",
    businessAddress: "",
    gcnIssueDate: "",
    gcnIssuePlace: "",
    registrationImages: [], // Store multiple image URLs
  });
  const [isLoading, setIsLoading] = useState(false);
  const notificationCtx = useContext(NotificationContext);
  const [user, setUser] = useState<User | null>(null);
  const [onEditingEventAgency, setOnEditingEventAgency] = useState<boolean>(false);
  const { getUser } = useUser();

  useEffect(() => {
    const fetchUser = async () => {
      const fetchedUser = getUser();
      setUser(fetchedUser);
      setFormData((prev) => ({
        ...prev,
        contactFullName: fetchedUser?.fullName || '',
        contactPhoneNumber: fetchedUser?.phoneNumber || '',
        contactEmail: fetchedUser?.email || '',
      }))
    };

    fetchUser();
  }, [getUser]);

  useEffect(() => {
    async function fetchAgencyInfo() {
      try {
        setIsLoading(true);

      } catch (error: any) {
        if (error.status === 403) {
          setOnEditingEventAgency(true)
        } else {
          notificationCtx.error("Không thể lấy thông tin đại lý sự kiện.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgencyInfo();
  }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await baseHttpServiceInstance.post("/common/s3/upload_image_temp", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Accept": "application/json",
        },
      });

      return response.data.imageUrl; // Return the image URL
    } catch (error) {
      notificationCtx.error("Lỗi tải ảnh:", error);
      return null;
    }
  };

  // Handle multiple image uploads
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024); // Max 5MB

      setIsLoading(true);
      const uploadedImageUrls = await Promise.all(validFiles.map(uploadImage));

      // Filter out null values and update state
      setFormData((prev) => ({
        ...prev,
        registrationImages: [...prev.registrationImages, ...uploadedImageUrls.filter(Boolean) as string[]],
      }));

      setIsLoading(false);
    }
  };

  // Remove an image from preview
  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      registrationImages: prev.registrationImages.filter((_, i) => i !== index),
    }));
  };


  // Function to handle form data changes
  const handleChangeFormData = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = event.target;

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const submitRegistration = async () => {
    setIsLoading(true);

    try {
      const response = await baseHttpServiceInstance.post(`/event-studio/events/${eventId}/approval-requests/event-agency-registration-and-event-approval-request`, formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      notificationCtx.success(`Gửi đơn đăng ký thành công.`,);
      onClose()
    } catch (error) {
      notificationCtx.error("Lỗi", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Yêu cầu Phê duyệt sự kiện</DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Typography variant='body2' textAlign={'justify'}>Nhà tổ chức sự kiện cần cung cấp đầy đủ và chính xác các thông tin dưới đây để có thể tạo sự kiện có bán vé theo nghị định 52/2013/NĐ-CP. Khi nhận được yêu cầu, ETIK sẽ liên hệ để xác thực thông tin. Nếu cần hỗ trợ, Quý khách vui lòng liên hệ Hotline CSKH <b>0333.247.242</b> hoặc email <b>tienphongsmart@gmail.com</b></Typography>
          <Typography variant='h6'>Thông tin Nhà tổ chức sự kiện</Typography>
          <Grid container spacing={3}>
            <Grid md={12} xs={12}>
              <FormControl fullWidth required>
                <InputLabel shrink>Loại hình kinh doanh</InputLabel>
                <Select
                  label="Loại hình kinh doanh"
                  value={formData.businessType || ""} // Default to an empty string
                  onChange={handleChangeFormData}
                  displayEmpty // Ensures the placeholder is shown for the empty state
                  name="businessType"
                >
                  <MenuItem value="" disabled>
                    -- Chọn loại hình kinh doanh --
                  </MenuItem>
                  <MenuItem value="individual">Cá nhân</MenuItem>
                  <MenuItem value="company">Công ty/ Hộ kinh doanh</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Show Tax Code if Cá nhân is selected */}
            {formData.businessType === "individual" ? (
              <>
                <Grid md={12} xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel shrink>Họ và tên theo Thẻ căn cước</InputLabel>
                    <OutlinedInput
                      notched
                      value={formData.fullName}
                      onChange={handleChangeFormData}
                      label="Họ và tên theo Thẻ căn cước"
                      name="fullName"
                    />
                  </FormControl>
                </Grid>
                <Grid md={12} xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel shrink>Mã số thuế</InputLabel>
                    <OutlinedInput
                      notched
                      value={formData.taxCode}
                      onChange={handleChangeFormData}
                      label="Mã số thuế"
                      name="taxCode"
                    />
                  </FormControl>
                </Grid>
                <Grid md={12} xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel shrink>Địa chỉ thường trú</InputLabel>
                    <OutlinedInput
                      notched
                      value={formData.placeOfResidence}
                      onChange={handleChangeFormData}
                      label="Địa chỉ thường trú"
                      name="placeOfResidence"
                    />
                  </FormControl>
                </Grid>
              </>

            ) : (<>
              <Grid md={12} xs={12}>
                <FormControl fullWidth required>
                  <InputLabel shrink>Tên công ty/ Hộ kinh doanh</InputLabel>
                  <OutlinedInput
                    notched
                    value={formData.companyName}
                    onChange={handleChangeFormData}
                    label="Tên công ty/ Hộ kinh doanh"
                    name="companyName"
                  />
                </FormControl>
              </Grid>
              <Grid md={12} xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Địa chỉ đăng ký kinh doanh</InputLabel>
                  <OutlinedInput
                    value={formData.businessAddress}
                    onChange={handleChangeFormData}
                    label="Địa chỉ đăng ký kinh doanh"
                    name="businessAddress"
                  />
                </FormControl>
              </Grid>
              <Grid md={4} xs={12}>
                <FormControl fullWidth required>
                  <InputLabel shrink>Số GCN ĐKKD / MST</InputLabel>
                  <OutlinedInput
                    notched
                    value={formData.taxCode}
                    onChange={handleChangeFormData}
                    label="Số GCN ĐKKD / MST"
                    name="taxCode"
                  />
                </FormControl>
              </Grid>

              <Grid md={4} xs={12}>
                <FormControl fullWidth required>
                  <InputLabel shrink>Ngày cấp GCN ĐKKD / MST</InputLabel>
                  <OutlinedInput
                    notched
                    value={formData.gcnIssueDate}
                    onChange={handleChangeFormData}
                    label="Ngày cấp GCN ĐKKD / MST"
                    name="gcnIssueDate"
                    type="date"
                  />
                </FormControl>
              </Grid>

              <Grid md={4} xs={12}>
                <FormControl fullWidth required>
                  <InputLabel shrink>Nơi cấp GCN ĐKKD / MST</InputLabel>
                  <OutlinedInput
                    notched
                    value={formData.gcnIssuePlace}
                    onChange={handleChangeFormData}
                    label="Nơi cấp GCN ĐKKD / MST"
                    name="gcnIssuePlace"
                  />
                </FormControl>
              </Grid>
              <Grid md={12} xs={12}>
                <Typography color="text.secondary" variant="body2">
                  Tải lên ảnh giấy chứng nhận đăng ký kinh doanh bản gốc
                </Typography>

                <FormControl fullWidth>
                  <TextField
                    variant="standard"
                    inputProps={{ type: "file", multiple: true, accept: ".jpg,.jpeg,.png,.pdf" }}
                    onChange={handleImageChange}
                    helperText="Định dạng .JPG, .JPEG, .PNG, .PDF, tối đa 5MB"
                  />
                </FormControl>

                {/* Show image previews */}
                <Box sx={{ display: "flex", flexWrap: "wrap", mt: 2, gap: 1 }}>
                  {formData.registrationImages.map((imageUrl, index) => (
                    <Box key={index} sx={{ position: "relative", width: 80, height: 80 }}>
                      <img
                        src={imageUrl}
                        alt={`uploaded-${index}`}
                        style={{ width: "100%", height: "100%", borderRadius: 4, objectFit: "cover", cursor: "pointer" }}
                        onClick={() => window.open(imageUrl, "_blank")}
                      />
                      <Button
                        size="small"
                        sx={{ position: "absolute", top: 0, right: 0, background: "rgba(0,0,0,0.5)", color: "white" }}
                        onClick={() => handleRemoveImage(index)}
                      >
                        X
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </>)}
          </Grid>
          <Stack spacing={1}>
            <Typography variant='h6'>Thông tin liên lạc</Typography>
          </Stack>
          <Grid container spacing={3}>
            <Grid md={12} xs={12}>
              <FormControl fullWidth required>
                <InputLabel shrink >Họ tên</InputLabel>
                <OutlinedInput notched value={formData?.contactFullName} onChange={handleChangeFormData} inputProps={{ shrink: true }} label="Họ tên" name="contactFullName" />
              </FormControl>
            </Grid>
            <Grid md={6} xs={12}>
              <FormControl fullWidth required disabled>
                <InputLabel shrink>Địa chỉ Email</InputLabel>
                <OutlinedInput notched value={formData?.contactEmail} label="Địa chỉ Email" name="contactEmail" onChange={handleChangeFormData} inputProps={{ shrink: true }} />
              </FormControl>
            </Grid>
            <Grid md={6} xs={12}>
              <FormControl fullWidth>
                <InputLabel shrink>Số điện thoại</InputLabel>
                <OutlinedInput notched value={formData?.contactPhoneNumber} label="Số điện thoại" name="contactPhoneNumber" type="tel" onChange={handleChangeFormData} inputProps={{ shrink: true }} />
              </FormControl>
            </Grid>

            <Grid md={12} xs={12}>
              <FormControl fullWidth>
                <InputLabel>Địa chỉ liên lạc</InputLabel>
                <OutlinedInput label="Địa chỉ liên lạc" notched value={formData?.contactAddress} name="contactAddress" type="text" onChange={handleChangeFormData} inputProps={{ shrink: true }} />
              </FormControl>
            </Grid>
          </Grid>
          <Typography variant='h6'>Quy định chung</Typography>
          <Stack spacing={1} textAlign={'justify'}>
            <Typography variant="body2">
              <b>Để sự kiện được phê duyệt, Nhà tổ chức sự kiện vui lòng tuân thủ các quy định sau:</b>
            </Typography>
            <Typography variant="body2">
              - Sự kiện có đầy đủ thông tin về tên, mô tả, đơn vị tổ chức, ảnh bìa, ảnh đại diện.
            </Typography>
            <Typography variant="body2">
              - Thời gian và địa điểm rõ ràng, chính xác. Hạn chế thay đổi thông tin về thời gian, địa điểm và phải thông báo cho ETIK trước khi thay đổi.
            </Typography>
            
            <Typography variant="body2">
              - Chính sách Giá vé, chính sách hoàn trả, hủy vé rõ ràng, minh bạch.
            </Typography>
            <Typography variant="body2">
              - Sự kiện tuân thủ quy định của pháp luật Việt Nam, phù hợp chuẩn mực đạo đức, thuần phong mỹ tục. 
            </Typography>
            <Typography variant="body2">
              - Cung cấp cho ETIK các thông tin, giấy tờ để xác minh khi được yêu cầu.
            </Typography>
          </Stack>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={submitRegistration} disabled={isLoading} >
              {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </div>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
