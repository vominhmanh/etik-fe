'use client';
import NotificationContext from '@/contexts/notification-context';
import { useUser } from '@/hooks/use-user';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { User } from '@/types/auth';
import { useTranslation } from '@/contexts/locale-context';
import { Avatar, Box, Chip, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material';
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
import { SealCheck } from '@phosphor-icons/react/dist/ssr';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import { RegistrationHistoryTable } from './registration-history-table';

export interface EventAgencyInfoResponse {
  id: number;
  isEventAgencyAccount: boolean;
  eventAgencyBusinessType?: "individual" | "company";

  // Individual fields
  eventAgencyFullName?: string;
  eventAgencyPlaceOfResidence?: string;
  eventAgencyTaxCode?: string;

  // Company fields
  eventAgencyCompanyName?: string;
  eventAgencyBusinessAddress?: string;
  eventAgencyGcnIssueDate?: string;
  eventAgencyGcnIssuePlace?: string;

  // Contact Information
  eventAgencyContactFullName?: string;
  eventAgencyContactEmail?: string;
  eventAgencyContactPhoneNumber?: string;
  eventAgencyContactAddress?: string;
}

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

export default function Page(): React.JSX.Element {
  const { tt } = useTranslation();
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
  const [agencyInfo, setAgencyInfo] = useState<EventAgencyInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const notificationCtx = useContext(NotificationContext);
  const [onEditingEventAgency, setOnEditingEventAgency] = useState<boolean>(false);
  const { user } = useUser();

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      contactFullName: user?.fullName || '',
      contactPhoneNumber: user?.phoneNumber || '',
      contactEmail: user?.email || '',
    }))
  }, [user]);

  useEffect(() => {
    async function fetchAgencyInfo() {
      try {
        setIsLoading(true);
        const response: AxiosResponse<EventAgencyInfoResponse> = await baseHttpServiceInstance.get("/account/event_agency/info", {}, true);
        setAgencyInfo(response.data);
      } catch (error: any) {
        if (error.status === 403) {
          setOnEditingEventAgency(true)
        } else {
          notificationCtx.error(tt("Không thể lấy thông tin đại lý sự kiện.", "Unable to fetch event agency information."));
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgencyInfo();
  }, [tt, notificationCtx]);

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
      notificationCtx.error(tt("Lỗi tải ảnh:", "Image upload error:"), error);
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
      const response = await baseHttpServiceInstance.post("/account/event_agency/registrations", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      notificationCtx.success(tt(`Gửi đơn đăng ký thành công.`, "Registration submitted successfully."));
      console.log("Registration Success:", response.data);
    } catch (error) {
      notificationCtx.error(tt("Lỗi", "Error"), error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWantToEditEventAgency = () => {
    setFormData((prev) => ({
      ...prev,
      businessType: agencyInfo?.eventAgencyBusinessType || 'individual',
      contactFullName: agencyInfo?.eventAgencyContactFullName || "",
      contactEmail: agencyInfo?.eventAgencyContactEmail || "",
      contactPhoneNumber: agencyInfo?.eventAgencyContactPhoneNumber || "",
      contactAddress: agencyInfo?.eventAgencyContactAddress || "",
      fullName: agencyInfo?.eventAgencyFullName || "",
      placeOfResidence: agencyInfo?.eventAgencyPlaceOfResidence || "",
      taxCode: agencyInfo?.eventAgencyTaxCode || "",
      companyName: agencyInfo?.eventAgencyCompanyName || "",
      businessAddress: agencyInfo?.eventAgencyBusinessAddress || "",
      gcnIssueDate: agencyInfo?.eventAgencyGcnIssueDate || "",
      gcnIssuePlace: agencyInfo?.eventAgencyGcnIssuePlace || "",
    }))
    setOnEditingEventAgency(true)

  }

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">{tt('Tài khoản Event Agency', 'Event Agency Account')}</Typography>
      </div>
      <Grid container spacing={3}>
        <Grid lg={4} md={6} xs={12}>
          <Card>
            <CardContent>
              <Stack spacing={2} sx={{ alignItems: 'center' }}>
                <div>
                  <Avatar sx={{ height: '80px', width: '80px', fontSize: '2rem' }}>{(user?.email[0] || "").toUpperCase()}</Avatar>
                </div>
                <Stack spacing={1} sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{user?.fullName}</Typography>
                  <Typography color="var(--mui-palette-success-400)" variant="body2">
                    {agencyInfo?.isEventAgencyAccount &&
                      <Chip
                        label={<Typography variant='body2'><SealCheck /> {tt('Tài khoản nhà tổ chức sự kiện', 'Event Organizer Account')}</Typography>}
                        color='success'
                      >
                      </Chip>
                    }
                  </Typography>

                </Stack>
              </Stack>
            </CardContent>
            <Divider />
            <CardActions>
              <Button fullWidth variant="text">
                {tt('Upload picture', 'Upload picture')}
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid lg={8} md={6} xs={12}>
          <Stack spacing={3}>
            {agencyInfo && !onEditingEventAgency &&
              <>
                <Card>
                  <CardHeader
                    title={tt("Thông tin Nhà tổ chức sự kiện", "Event Organizer Information")}
                    subheader={tt("Thông tin đã được duyệt", "Information has been approved")}
                  />
                  <Divider />
                  <CardContent>
                    {isLoading ? (
                      <Typography>{tt('Đang tải...', 'Loading...')}</Typography>
                    ) : (
                      <Grid container spacing={3}>
                        <Grid md={12} xs={12}>
                          <FormControl fullWidth required>
                            <InputLabel shrink>{tt('Loại hình kinh doanh', 'Business Type')}</InputLabel>
                            <Select
                              value={agencyInfo?.eventAgencyBusinessType || ""}
                              displayEmpty
                              disabled
                            >
                              <MenuItem value="" disabled>
                                -- {tt('Chọn loại hình kinh doanh', 'Select business type')} --
                              </MenuItem>
                              <MenuItem value="individual">{tt('Cá nhân', 'Individual')}</MenuItem>
                              <MenuItem value="company">{tt('Công ty/ Hộ kinh doanh', 'Company / Business')}</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        {/* Individual Fields */}
                        {agencyInfo?.eventAgencyBusinessType === "individual" && (
                          <>
                            <Grid md={12} xs={12}>
                              <FormControl fullWidth>
                                <InputLabel shrink>{tt('Họ và tên', 'Full Name')}</InputLabel>
                                <OutlinedInput
                                  notched
                                  value={agencyInfo?.eventAgencyFullName || ""}
                                  readOnly
                                />
                              </FormControl>
                            </Grid>

                            <Grid md={12} xs={12}>
                              <FormControl fullWidth>
                                <InputLabel shrink>{tt('Mã số thuế', 'Tax Code')}</InputLabel>
                                <OutlinedInput
                                  notched
                                  value={agencyInfo?.eventAgencyTaxCode || ""}
                                  readOnly
                                />
                              </FormControl>
                            </Grid>

                            <Grid md={12} xs={12}>
                              <FormControl fullWidth>
                                <InputLabel shrink>{tt('Địa chỉ thường trú', 'Permanent Address')}</InputLabel>
                                <OutlinedInput
                                  notched
                                  value={agencyInfo?.eventAgencyPlaceOfResidence || ""}
                                  readOnly
                                />
                              </FormControl>
                            </Grid>
                          </>
                        )}

                        {/* Company Fields */}
                        {agencyInfo?.eventAgencyBusinessType === "company" && (
                          <>
                            <Grid md={12} xs={12}>
                              <FormControl fullWidth>
                                <InputLabel shrink>{tt('Tên công ty/ Hộ kinh doanh', 'Company / Business Name')}</InputLabel>
                                <OutlinedInput
                                  notched
                                  value={agencyInfo?.eventAgencyCompanyName || ""}
                                  readOnly
                                />
                              </FormControl>
                            </Grid>

                            <Grid md={12} xs={12}>
                              <FormControl fullWidth>
                                <InputLabel shrink>{tt('Địa chỉ đăng ký kinh doanh', 'Business Registration Address')}</InputLabel>
                                <OutlinedInput
                                  notched
                                  value={agencyInfo?.eventAgencyBusinessAddress || ""}
                                  readOnly
                                />
                              </FormControl>
                            </Grid>

                            <Grid md={4} xs={12}>
                              <FormControl fullWidth>
                                <InputLabel shrink>{tt('Số GCN ĐKKD / MST', 'Business License / Tax Code')}</InputLabel>
                                <OutlinedInput
                                  notched
                                  value={agencyInfo?.eventAgencyTaxCode || ""}
                                  readOnly
                                />
                              </FormControl>
                            </Grid>

                            <Grid md={4} xs={12}>
                              <FormControl fullWidth>
                                <InputLabel shrink>{tt('Ngày cấp GCN ĐKKD / MST', 'Issue Date')}</InputLabel>
                                <OutlinedInput
                                  notched
                                  value={dayjs(agencyInfo?.eventAgencyGcnIssueDate || 0).format('DD/MM/YYYY')}
                                  readOnly
                                />
                              </FormControl>
                            </Grid>

                            <Grid md={4} xs={12}>
                              <FormControl fullWidth>
                                <InputLabel shrink>{tt('Nơi cấp GCN ĐKKD / MST', 'Issue Place')}</InputLabel>
                                <OutlinedInput
                                  notched
                                  value={agencyInfo?.eventAgencyGcnIssuePlace || ""}
                                  readOnly
                                />
                              </FormControl>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title={tt('Thông tin liên lạc', 'Contact Information')} />
                  <Divider />
                  <CardContent>
                    {isLoading ? (
                      <Typography>{tt('Đang tải...', 'Loading...')}</Typography>
                    ) : (
                      <Grid container spacing={3}>
                        <Grid md={12} xs={12}>
                          <FormControl fullWidth>
                            <InputLabel shrink>{tt('Họ tên', 'Full Name')}</InputLabel>
                            <OutlinedInput
                              notched
                              value={agencyInfo?.eventAgencyContactFullName || ""}
                              readOnly
                            />
                          </FormControl>
                        </Grid>

                        <Grid md={6} xs={12}>
                          <FormControl fullWidth>
                            <InputLabel shrink>{tt('Địa chỉ Email', 'Email Address')}</InputLabel>
                            <OutlinedInput
                              notched
                              value={agencyInfo?.eventAgencyContactEmail || ""}
                              readOnly
                            />
                          </FormControl>
                        </Grid>

                        <Grid md={6} xs={12}>
                          <FormControl fullWidth>
                            <InputLabel shrink>{tt('Số điện thoại', 'Phone Number')}</InputLabel>
                            <OutlinedInput
                              notched
                              value={agencyInfo?.eventAgencyContactPhoneNumber || ""}
                              readOnly
                            />
                          </FormControl>
                        </Grid>

                        <Grid md={12} xs={12}>
                          <FormControl fullWidth>
                            <InputLabel shrink>{tt('Địa chỉ liên lạc', 'Contact Address')}</InputLabel>
                            <OutlinedInput
                              notched
                              value={agencyInfo?.eventAgencyContactAddress || ""}
                              readOnly
                            />
                          </FormControl>
                        </Grid>
                      </Grid>
                    )}
                  </CardContent>
                </Card>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Button variant="contained" onClick={handleWantToEditEventAgency}>
                    {tt('Chỉnh sửa các thông tin trên', 'Edit Information')}
                  </Button>
                </CardActions>

              </>
            }
            {onEditingEventAgency &&
              <>
                <Card>
                  <CardHeader
                    title={tt("Thông tin Nhà tổ chức sự kiện", "Event Organizer Information")}
                    subheader={tt("Nhà tổ chức sự kiện cần cung cấp các thông tin dưới đây để có thể tạo sự kiện theo nghị định 52/2013/NĐ-CP", "Event organizers must provide the following information to create events according to Decree 52/2013/NĐ-CP")}
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid md={12} xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel shrink>{tt('Loại hình kinh doanh', 'Business Type')}</InputLabel>
                          <Select
                            label={tt('Loại hình kinh doanh', 'Business Type')}
                            value={formData.businessType || ""} // Default to an empty string
                            onChange={handleChangeFormData}
                            displayEmpty // Ensures the placeholder is shown for the empty state
                            name="businessType"
                          >
                            <MenuItem value="" disabled>
                              -- {tt('Chọn loại hình kinh doanh', 'Select business type')} --
                            </MenuItem>
                            <MenuItem value="individual">{tt('Cá nhân', 'Individual')}</MenuItem>
                            <MenuItem value="company">{tt('Công ty/ Hộ kinh doanh', 'Company / Business')}</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      {/* Show Tax Code if Cá nhân is selected */}
                      {formData.businessType === "individual" ? (
                        <>
                          <Grid md={12} xs={12}>
                            <FormControl fullWidth required>
                              <InputLabel shrink>{tt('Họ và tên theo Thẻ căn cước', 'Full Name as on ID Card')}</InputLabel>
                              <OutlinedInput
                                notched
                                value={formData.fullName}
                                onChange={handleChangeFormData}
                                label={tt('Họ và tên theo Thẻ căn cước', 'Full Name as on ID Card')}
                                name="fullName"
                              />
                            </FormControl>
                          </Grid>
                          <Grid md={12} xs={12}>
                            <FormControl fullWidth required>
                              <InputLabel shrink>{tt('Mã số thuế', 'Tax Code')}</InputLabel>
                              <OutlinedInput
                                notched
                                value={formData.taxCode}
                                onChange={handleChangeFormData}
                                label={tt('Mã số thuế', 'Tax Code')}
                                name="taxCode"
                              />
                            </FormControl>
                          </Grid>
                          <Grid md={12} xs={12}>
                            <FormControl fullWidth required>
                              <InputLabel shrink>{tt('Địa chỉ thường trú', 'Permanent Address')}</InputLabel>
                              <OutlinedInput
                                notched
                                value={formData.placeOfResidence}
                                onChange={handleChangeFormData}
                                label={tt('Địa chỉ thường trú', 'Permanent Address')}
                                name="placeOfResidence"
                              />
                            </FormControl>
                          </Grid>
                        </>

                      ) : (<>
                        <Grid md={12} xs={12}>
                          <FormControl fullWidth required>
                            <InputLabel shrink>{tt('Tên công ty/ Hộ kinh doanh', 'Company / Business Name')}</InputLabel>
                            <OutlinedInput
                              notched
                              value={formData.companyName}
                              onChange={handleChangeFormData}
                              label={tt('Tên công ty/ Hộ kinh doanh', 'Company / Business Name')}
                              name="companyName"
                            />
                          </FormControl>
                        </Grid>
                        <Grid md={12} xs={12}>
                          <FormControl fullWidth required>
                            <InputLabel>{tt('Địa chỉ đăng ký kinh doanh', 'Business Registration Address')}</InputLabel>
                            <OutlinedInput
                              value={formData.businessAddress}
                              onChange={handleChangeFormData}
                              label={tt('Địa chỉ đăng ký kinh doanh', 'Business Registration Address')}
                              name="businessAddress"
                            />
                          </FormControl>
                        </Grid>
                        <Grid md={4} xs={12}>
                          <FormControl fullWidth required>
                            <InputLabel shrink>{tt('Số GCN ĐKKD / MST', 'Business License / Tax Code')}</InputLabel>
                            <OutlinedInput
                              notched
                              value={formData.taxCode}
                              onChange={handleChangeFormData}
                              label={tt('Số GCN ĐKKD / MST', 'Business License / Tax Code')}
                              name="taxCode"
                            />
                          </FormControl>
                        </Grid>

                        <Grid md={4} xs={12}>
                          <FormControl fullWidth required>
                            <InputLabel shrink>{tt('Ngày cấp GCN ĐKKD / MST', 'Issue Date')}</InputLabel>
                            <OutlinedInput
                              notched
                              value={formData.gcnIssueDate}
                              onChange={handleChangeFormData}
                              label={tt('Ngày cấp GCN ĐKKD / MST', 'Issue Date')}
                              name="gcnIssueDate"
                              type="date"
                            />
                          </FormControl>
                        </Grid>

                        <Grid md={4} xs={12}>
                          <FormControl fullWidth required>
                            <InputLabel shrink>{tt('Nơi cấp GCN ĐKKD / MST', 'Issue Place')}</InputLabel>
                            <OutlinedInput
                              notched
                              value={formData.gcnIssuePlace}
                              onChange={handleChangeFormData}
                              label={tt('Nơi cấp GCN ĐKKD / MST', 'Issue Place')}
                              name="gcnIssuePlace"
                            />
                          </FormControl>
                        </Grid>
                        <Grid md={12} xs={12}>
                          <Typography color="text.secondary" variant="body2">
                            {tt('Tải lên ảnh giấy chứng nhận đăng ký kinh doanh bản gốc', 'Upload original business registration certificate image')}
                          </Typography>

                          <FormControl fullWidth>
                            <TextField
                              variant="standard"
                              inputProps={{ type: "file", multiple: true, accept: ".jpg,.jpeg,.png,.pdf" }}
                              onChange={handleImageChange}
                              helperText={tt('Định dạng .JPG, .JPEG, .PNG, .PDF, tối đa 5MB', 'Format .JPG, .JPEG, .PNG, .PDF, max 5MB')}
                            />
                          </FormControl>

                          {/* Show image previews */}
                          <Box sx={{ display: "flex", flexWrap: "wrap", mt: 2, gap: 1 }}>
                            {formData.registrationImages.map((imageUrl, index) => (
                              <Box key={index} sx={{ position: "relative", width: 80, height: 80 }}>
                                <Box component="img"
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
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader title={tt('Thông tin liên lạc', 'Contact Information')} />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid md={12} xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel shrink >{tt('Họ tên', 'Full Name')}</InputLabel>
                          <OutlinedInput notched value={formData?.contactFullName} onChange={handleChangeFormData} inputProps={{ shrink: true }} label={tt('Họ tên', 'Full Name')} name="contactFullName"  />
                        </FormControl>
                      </Grid>
                      <Grid md={6} xs={12}>
                        <FormControl fullWidth required disabled>
                          <InputLabel shrink>{tt('Địa chỉ Email', 'Email Address')}</InputLabel>
                          <OutlinedInput notched value={formData?.contactEmail} label={tt('Địa chỉ Email', 'Email Address')} name="contactEmail" onChange={handleChangeFormData} inputProps={{ shrink: true }} />
                        </FormControl>
                      </Grid>
                      <Grid md={6} xs={12}>
                        <FormControl fullWidth>
                          <InputLabel shrink>{tt('Số điện thoại', 'Phone Number')}</InputLabel>
                          <OutlinedInput notched value={formData?.contactPhoneNumber} label={tt('Số điện thoại', 'Phone Number')} name="contactPhoneNumber" type="tel" onChange={handleChangeFormData} inputProps={{ shrink: true }}  />
                        </FormControl>
                      </Grid>

                      <Grid md={12} xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>{tt('Địa chỉ liên lạc', 'Contact Address')}</InputLabel>
                          <OutlinedInput label={tt('Địa chỉ liên lạc', 'Contact Address')} notched value={formData?.contactAddress} name="contactAddress" type="text" onChange={handleChangeFormData} inputProps={{ shrink: true }} />
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Button variant="contained" onClick={submitRegistration} disabled={isLoading} >
                    {isLoading ? tt('Đang lưu...', 'Saving...') : tt('Lưu', 'Save')}
                  </Button>
                </CardActions>
              </>
            }
            <RegistrationHistoryTable />
            {/* <Card>
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
            </Card> */}
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
