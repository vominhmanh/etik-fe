'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Avatar, Box, CardMedia, Container, IconButton, InputAdornment, MenuItem, Modal, Select, Stack, TextField } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { ArrowSquareIn, Clipboard } from '@phosphor-icons/react/dist/ssr';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { AxiosResponse } from 'axios';
import ReactQuill, { Quill } from 'react-quill';
import NotificationContext from '@/contexts/notification-context';
import 'react-quill/dist/quill.snow.css';
import dayjs from 'dayjs';
import RouterLink from 'next/link';
import SendRequestEventAgencyAndEventApproval from './send-request-event-agency-and-event-approval';

// Define the event response type
type EventResponse = {
  id: number;
  name: string;
  organizer: string;
  organizerEmail: string;
  organizerPhoneNumber: string;
  description: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  place: string | null;
  locationUrl: string | null;
  bannerUrl: string;
  avatarUrl: string;
  slug: string;
  secureApiKey: string;
  locationInstruction: string | null;
  displayOnMarketplace: boolean;
};

export interface CheckEventAgencyRegistrationAndEventApprovalRequestResponse {
  eventApprovalRequest: string;
  eventAgencyRegistration: boolean;
}

export interface SMTPConfig {
  smtpProvider: "use_etik_smtp" | "use_custom_smtp";
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpUseTls?: boolean;
  smtpUseSsl?: boolean;
  smtpSenderEmail?: string;
}
export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Chỉnh sửa chi tiết sự kiện| ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [formValues, setFormValues] = useState<EventResponse | null>(null);
  const { event_id } = params;
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [previewBannerUrl, setPreviewBannerUrl] = React.useState<string>(event?.bannerUrl || '');
  const [isImageSelected, setIsImageSelected] = React.useState(false);
  const [description, setDescription] = useState<string>('');
  const reactQuillRef = React.useRef<ReactQuill>(null);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string>(event?.avatarUrl || '');
  const [isAvatarSelected, setIsAvatarSelected] = useState(false);
  const [eventAgencyRegistrationAndEventApprovalRequest, setEventAgencyRegistrationAndEventApprovalRequest] = useState<CheckEventAgencyRegistrationAndEventApprovalRequestResponse | null>(null);
  const [openEventAgencyRegistrationModal, setOpenEventAgencyRegistrationModal] = useState(false);
  const [openConfirmSubmitEventApprovalModal, setOpenConfirmSubmitEventApprovalModal] = useState(false);

  const [smtpFormValues, setSmtpFormValues] = useState<SMTPConfig>({
    smtpProvider: 'use_etik_smtp',
    smtpHost: "",
    smtpPort: undefined,
    smtpUsername: "",
    smtpPassword: "",
    smtpUseTls: true,
    smtpUseSsl: false,
    smtpSenderEmail: "",
  });


  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const data = await getSMTPSettings(params.event_id);
        if (data) setSmtpFormValues(data);
      } catch (error) {
        notificationCtx.error("Không thể tải cấu hình SMTP.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [params.event_id]);

  useEffect(() => {
    if (!params.event_id) return;

    const fetchEventApprovalStatus = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<CheckEventAgencyRegistrationAndEventApprovalRequestResponse> =
          await baseHttpServiceInstance.get(
            `/event-studio/events/${params.event_id}/approval-requests/check-event-agency-registration-and-event-approval-request`
          );
        setEventAgencyRegistrationAndEventApprovalRequest(response.data);
      } catch (error: any) {
        notificationCtx.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventApprovalStatus();
  }, [params.event_id]);

  const handleRequestEventApprovalClick = () => {
    if (!eventAgencyRegistrationAndEventApprovalRequest?.eventAgencyRegistration) {
      setOpenEventAgencyRegistrationModal(true); // Show modal if eventAgencyRegistration is false
    } else {
      setOpenConfirmSubmitEventApprovalModal(true)
    }
  };

  const handleSendRequestEventApproval = async () => {
    try {
      setIsLoading(true);

      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/approval-requests/event-approval-request`
      );

      // Handle success response
      if (response.status === 200) {
        notificationCtx.success("Yêu cầu phê duyệt sự kiện đã được gửi thành công!");
        setEventAgencyRegistrationAndEventApprovalRequest(eventAgencyRegistrationAndEventApprovalRequest ? ({
          ...eventAgencyRegistrationAndEventApprovalRequest,
          eventApprovalRequest: 'waiting_for_acceptance'
        }) : eventAgencyRegistrationAndEventApprovalRequest)
        setOpenConfirmSubmitEventApprovalModal(false)

      }
    } catch (error: any) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnCloseEventAgencyRegistrationModal = () => {
    setOpenEventAgencyRegistrationModal(false)
    setEventAgencyRegistrationAndEventApprovalRequest(eventAgencyRegistrationAndEventApprovalRequest ? ({
      ...eventAgencyRegistrationAndEventApprovalRequest,
      eventApprovalRequest: 'waiting_for_acceptance'
    }) : eventAgencyRegistrationAndEventApprovalRequest)
  }

  const handleSmtpInputChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    setSmtpFormValues((prevValues) => ({
      ...prevValues,
      [event.target.name as string]: event.target.value,
    }));
  };

  const handleSaveSmtpSettings = async () => {
    try {
      setIsLoading(true);
      await saveSMTPSettings(event_id, smtpFormValues);
      notificationCtx.success("Cấu hình SMTP đã được lưu thành công!");
    } catch (error) {
      notificationCtx.error("Không thể lưu cấu hình SMTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle avatar selection
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedAvatar(file);
      setPreviewAvatarUrl(URL.createObjectURL(file)); // Generate preview URL
      setIsAvatarSelected(true); // Toggle button state
    }
  };

  // Handle saving the avatar
  const handleSaveAvatar = async () => {
    if (!selectedAvatar) return;

    const formData = new FormData();
    formData.append('file', selectedAvatar);

    try {
      // Call API to upload the avatar
      setIsLoading(true);
      await baseHttpServiceInstance.post(`/event-studio/events/${event?.id}/upload-avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // On successful upload, reload the page or update the avatar state
      window.location.reload(); // Optionally, you could call a function to update the state instead of reloading
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting another avatar
  const handleSelectOtherAvatar = () => {
    setSelectedAvatar(null);
    setPreviewAvatarUrl(event?.avatarUrl || '');
    setIsAvatarSelected(false); // Reset state
  };

  // Handle image selection
  const handleBannerImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewBannerUrl(URL.createObjectURL(file)); // Generate preview URL
      setIsImageSelected(true); // Toggle button state
    }
  };

  // Handle saving the image
  const handleSaveBannerImage = async () => {
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append('file', selectedImage);

    try {
      // Call API to upload the image
      setIsLoading(true);
      await baseHttpServiceInstance.post(`/event-studio/events/${event?.id}/upload_banner`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // On successful upload, reload the page or handle success
      window.location.reload(); // You can also call a function to update the state instead of reloading
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting another image
  const handleSelectBannerOther = () => {
    setSelectedImage(null);
    setPreviewBannerUrl(event?.bannerUrl || '');
    setIsImageSelected(false); // Reset state
  };

  useEffect(() => {
    if (event_id) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
            `/event-studio/events/${event_id}`
          );
          setEvent(response.data);
          setFormValues(response.data);
          setDescription(response.data.description || '');
        } catch (error) {
          notificationCtx.error('Lỗi:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEventDetails();
    }
  }, [event_id]);

  // Handle form value changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => (prevValues ? { ...prevValues, [name]: value } : null));
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setFormValues((prevValues) => (prevValues ? { ...prevValues, description: value } : null));
  };

  const handleFormSubmit = async () => {
    if (formValues && event_id) {
      try {
        setIsLoading(true);
        await baseHttpServiceInstance.put(`/event-studio/events/${event_id}`, { ...formValues, description });
        notificationCtx.success('Sửa thành công. Sẽ cập nhật lên trang chủ sau 1 phút.');
      } catch (error) {
        notificationCtx.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopyToClipboard = (data: string) => {
    navigator.clipboard.writeText(data).then(() => {
      notificationCtx.success("Đã sao chép vào bộ nhớ tạm"); // Show success message
    }).catch(() => {
      notificationCtx.warning("Không thể sao chép, vui lòng thử lại"); // Handle errors
    });
  };

  // Image Upload Handler
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
          // Upload the image to the server
          setIsLoading(true);
          const response = await baseHttpServiceInstance.post(
            `/event-studio/events/${event_id}/upload_image`,
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          );

          const imageUrl = response.data.imageUrl; // Adjust based on response
          const quill = reactQuillRef.current;
          if (quill) {
            const range = quill.getEditorSelection();
            range && quill.getEditor().insertEmbed(range.index, 'image', imageUrl);
          }
        } catch (error) {
          notificationCtx.error('Lỗi:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
  }, []);

  // Custom Toolbar Options
  const modules = {
    toolbar: {
      container: [
        [{ header: '1' }, { header: '2' }, { font: [] }],
        [{ size: [] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: handleImageUpload, // <-
      },
    },
    clipboard: {
      matchVisual: false,
    },
  };


  async function getSMTPSettings(eventId: number): Promise<SMTPConfig | null> {
    try {
      const response: AxiosResponse<SMTPConfig> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/smtp/settings`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async function saveSMTPSettings(eventId: number, smtpConfig: SMTPConfig): Promise<void> {
    try {
      await baseHttpServiceInstance.post(`/event-studio/events/${eventId}/smtp/settings`, smtpConfig);
    } catch (error) {
      throw error;
    }
  }


  if (!event || !formValues) {
    return <Typography>Loading...</Typography>;
  }

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
        <Grid container spacing={3}>
          <Grid lg={8} md={6} xs={12}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                aspectRatio: 16 / 6, // 16:9 aspect ratio (modify as needed)
                overflow: 'hidden',
                border: 'grey 1px',
                borderRadius: '20px',
                backgroundColor: 'gray',
              }}
            >
              <img
                src={event?.bannerUrl}
                alt="Car"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: 'auto',
                  objectFit: 'cover', // or 'contain' depending on your preference
                }}
              />
            </Box>
          </Grid>
          <Grid lg={4} md={6} xs={12}>
            <Card sx={{ height: '100%' }}>
              <CardContent
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <Stack direction="column" spacing={2}>
                  <Stack direction="row" spacing={2} style={{ alignItems: 'center' }}>
                    <div>
                      {event?.avatarUrl ?
                        <img src={event?.avatarUrl} style={{ height: '80px', width: '80px', borderRadius: '50%' }} />
                        :
                        <Avatar sx={{ height: '80px', width: '80px', fontSize: '2rem' }}>
                          {(event?.name[0] ?? 'a').toUpperCase()}
                        </Avatar>}
                    </div>
                    <Typography variant="h5" sx={{ width: '100%', textAlign: 'center' }}>
                      {event?.name}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <HouseLineIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      Đơn vị tổ chức: {event?.organizer}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {event?.startDateTime && event?.endDateTime
                        ? `${dayjs(event.startDateTime || 0).format('HH:mm:ss DD/MM/YYYY')} - ${dayjs(event.endDateTime || 0).format('HH:mm:ss DD/MM/YYYY')}`
                        : 'Chưa xác định'}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {event?.place ? event?.place : 'Chưa xác định'}
                    </Typography>
                  </Stack>
                </Stack>
                <div style={{ marginTop: '20px' }}>
                  <Button
                    fullWidth
                    variant="contained"
                    target="_blank"
                    component={RouterLink}
                    href={`/events/${event?.slug}`}
                    size="small"
                    endIcon={<ArrowSquareIn />}
                  >
                    Đến trang Khách hàng tự đăng ký vé
                  </Button>
                </div>
                <div style={{ marginTop: '20px' }}>
                  {eventAgencyRegistrationAndEventApprovalRequest &&
                    (
                      <>
                        {eventAgencyRegistrationAndEventApprovalRequest.eventApprovalRequest == 'accepted' && (
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            color='success'
                          >
                            <Stack spacing={0} sx={{ alignItems: 'center' }}>
                              <span>Sự kiện đã được phê duyệt</span>
                              <small>bán vé có thanh toán online, gửi email marketing,...</small>
                            </Stack>
                          </Button>
                        )}
                        {eventAgencyRegistrationAndEventApprovalRequest.eventApprovalRequest == 'waiting_for_acceptance' && (
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            disabled
                          >
                            <Stack spacing={0} sx={{ alignItems: 'center' }}>
                              <span>Sự kiện đang chờ duyệt</span>
                            </Stack>
                          </Button>
                        )}
                        {eventAgencyRegistrationAndEventApprovalRequest.eventApprovalRequest == 'rejected' && (
                          <Button
                            fullWidth
                            variant="outlined"
                            color='error'
                            size="small"
                            onClick={handleRequestEventApprovalClick}
                          >
                            <Stack spacing={0} sx={{ alignItems: 'center' }}>
                              <small color='error'>Yêu cầu phê duyệt bị từ chối</small>
                              <span>Nhấn để yêu cầu lại</span>
                            </Stack>
                          </Button>
                        )}
                        {eventAgencyRegistrationAndEventApprovalRequest.eventApprovalRequest == 'initial' && (
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            onClick={handleRequestEventApprovalClick}
                          >
                            <Stack spacing={0} sx={{ alignItems: 'center' }}>
                              <span>Yêu cầu Phê duyệt sự kiện</span>
                              <small>Để bán vé có thanh toán online, gửi email marketing,...</small>
                            </Stack>
                          </Button>
                        )}
                      </>
                    )
                  }
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <div>
          <Typography variant="h4">Chỉnh sửa chi tiết sự kiện</Typography>
        </div>
        <Grid container spacing={3}>
          <Grid lg={4} md={6} xs={12}>
            <Stack spacing={3}>
              <Card>
                {previewBannerUrl &&
                  <>
                    <CardMedia sx={{ height: 140 }} image={previewBannerUrl || ''} title={event.name} />
                    <Divider />
                  </>}
                <CardActions>
                  {isImageSelected ? (
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                      <Button fullWidth variant="contained" onClick={handleSaveBannerImage}>
                        Lưu ảnh bìa
                      </Button>
                      <Button fullWidth variant="outlined" onClick={handleSelectBannerOther}>
                        Chọn ảnh khác
                      </Button>
                    </Stack>
                  ) : (
                    <Button fullWidth variant="text" component="label">
                      Thay đổi ảnh bìa
                      <input type="file" hidden accept="image/*" onChange={handleBannerImageChange} />
                    </Button>
                  )}
                </CardActions>
              </Card>
              <Card>
                {previewAvatarUrl &&
                  <>
                    <CardMedia sx={{ height: 80, width: 80, justifyContent: 'center', display: 'flex' }} image={previewAvatarUrl || ''} title={event.name} />
                    <Divider />
                  </>}

                <CardActions>
                  {isAvatarSelected ? (
                    <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                      <Button fullWidth variant="contained" onClick={handleSaveAvatar}>
                        Lưu ảnh đại diện
                      </Button>
                      <Button fullWidth variant="outlined" onClick={handleSelectOtherAvatar}>
                        Chọn ảnh khác
                      </Button>
                    </Stack>
                  ) : (
                    <Button fullWidth variant="text" component="label">
                      Thay đổi ảnh đại diện
                      <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                    </Button>
                  )}
                </CardActions>
              </Card>
              <Card>
                <CardHeader title="Đơn vị tổ chức" />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Đơn vị tổ chức</InputLabel>
                        <OutlinedInput
                          value={formValues.organizer}
                          onChange={handleInputChange}
                          label="Đơn vị tổ chức"
                          name="organizer"
                        />
                      </FormControl>
                    </Grid>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Email đơn vị tổ chức</InputLabel>
                        <OutlinedInput
                          value={formValues.organizerEmail}
                          onChange={handleInputChange}
                          label="Email đơn vị tổ chức"
                          name="organizerEmail"
                        />
                      </FormControl>
                    </Grid>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Số điện thoại đơn vị tổ chức</InputLabel>
                        <OutlinedInput
                          value={formValues.organizerPhoneNumber}
                          onChange={handleInputChange}
                          label="Số điện thoại đơn vị tổ chức"
                          name="organizerPhoneNumber"
                          type="tel"
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
          <Grid lg={8} md={6} xs={12}>
            <Stack spacing={3}>
              <Card>
                <CardHeader title="Thông tin sự kiện" />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Tên sự kiện</InputLabel>
                        <OutlinedInput
                          value={formValues.name}
                          onChange={handleInputChange}
                          label="Tên sự kiện"
                          name="name"
                        />
                      </FormControl>
                    </Grid>
                    <Grid md={12} xs={12}>
                      <ReactQuill
                        ref={reactQuillRef}
                        value={description}
                        onChange={handleDescriptionChange}
                        modules={modules}
                        placeholder="Mô tả"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Địa điểm & Thời gian" />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Địa điểm</InputLabel>
                        <OutlinedInput
                          value={formValues.place || ''}
                          onChange={handleInputChange}
                          label="Địa điểm"
                          name="place"
                        />
                      </FormControl>
                    </Grid>

                    <Grid md={6} xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>URL Địa điểm</InputLabel>
                        <OutlinedInput
                          value={formValues.locationUrl || ''}
                          onChange={handleInputChange}
                          label="URL Địa điểm"
                          name="locationUrl"
                        />
                      </FormControl>
                    </Grid>
                    <Grid md={6} xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Hướng dẫn thêm về địa điểm</InputLabel>
                        <OutlinedInput
                          value={formValues.locationInstruction || ''}
                          onChange={handleInputChange}
                          label="Hướng dẫn thêm về địa điểm"
                          name="locationInstruction"
                        />
                      </FormControl>
                    </Grid>

                    <Grid md={6} xs={12}>
                      <FormControl fullWidth required>
                        <TextField
                          label="Thời gian bắt đầu"
                          type="datetime-local"
                          value={formValues.startDateTime || ''}
                          onChange={handleInputChange}
                          name="startDateTime"
                          InputLabelProps={{ shrink: true }}
                        />
                      </FormControl>
                    </Grid>
                    <Grid md={6} xs={12}>
                      <FormControl fullWidth required>
                        <TextField
                          label="Thời gian kết thúc"
                          type="datetime-local"
                          onChange={handleInputChange}
                          name="endDateTime"
                          value={formValues.endDateTime || ''}
                          InputLabelProps={{ shrink: true }}
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Thông tin khác" />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Trang khách hàng tự đăng ký</InputLabel>
                        <OutlinedInput
                          value={formValues.slug}
                          label="Trang khách hàng tự đăng ký"
                          name="slug"
                          onChange={handleInputChange}
                          startAdornment={<InputAdornment position="start">etik.io.vn/events/</InputAdornment>}
                          endAdornment={<IconButton size="small" onClick={() => handleCopyToClipboard(`https://etik.io.vn/events/${event?.slug}`)}><Clipboard /></IconButton>}
                        />
                      </FormControl>
                    </Grid>

                    <Grid md={12} xs={12}>
                      <FormControl fullWidth disabled>
                        <InputLabel>Secure API key</InputLabel>
                        <OutlinedInput
                          value={event.secureApiKey}
                          label="Secure API key"
                          name="secureApiKey"
                          endAdornment={<IconButton size="small" onClick={() => handleCopyToClipboard(event.secureApiKey)}><Clipboard /></IconButton>}
                        />
                      </FormControl>
                    </Grid>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Cho phép hiển thị trên Marketplace</InputLabel>
                        <Select
                          label="Cho phép hiển thị trên Marketplace"
                          name="displayOnMarketplace"
                          value={formValues.displayOnMarketplace}
                          onChange={(e: any) => handleInputChange(e)}
                        >
                          <MenuItem value={'true'}>Hiển thị</MenuItem>
                          <MenuItem value={'false'}>Không hiển thị</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="contained" onClick={handleFormSubmit}>
                  Lưu
                </Button>
              </Grid>

              <Card>
                <CardHeader title="Cấu hình gửi Email SMTP" />
                <Divider />
                <CardContent>
                  {isLoading ? (
                    <CircularProgress />
                  ) : (
                    <Grid container spacing={3}>
                      {/* SMTP Provider Selection */}
                      <Grid md={12} xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel>Dịch vụ mail</InputLabel>
                          <Select
                            label="Dịch vụ mail"
                            name="smtpProvider"
                            value={smtpFormValues.smtpProvider}
                            onChange={(event: any) => handleSmtpInputChange(event)}
                          >
                            <MenuItem value={'use_etik_smtp'}>Sử dụng ETIK SMTP</MenuItem>
                            <MenuItem value={'use_custom_smtp'}>Tùy chỉnh SMTP server</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* SMTP Fields (Only for Custom SMTP) */}
                      {smtpFormValues.smtpProvider === 'use_custom_smtp' && (
                        <>
                          <Grid md={6} xs={12}>
                            <FormControl fullWidth>
                              <InputLabel>SMTP Host</InputLabel>
                              <OutlinedInput
                                label="SMTP Host"
                                name="smtpHost"
                                value={smtpFormValues.smtpHost}
                                onChange={handleSmtpInputChange}
                              />
                            </FormControl>
                          </Grid>

                          <Grid md={6} xs={12}>
                            <FormControl fullWidth>
                              <InputLabel>SMTP Port</InputLabel>
                              <OutlinedInput
                                label="SMTP Port"
                                type="number"
                                name="smtpPort"
                                value={smtpFormValues.smtpPort || ""}
                                onChange={handleSmtpInputChange}
                              />
                            </FormControl>
                          </Grid>

                          <Grid md={6} xs={12}>
                            <FormControl fullWidth>
                              <InputLabel>SMTP Username</InputLabel>
                              <OutlinedInput
                                label="SMTP Username"
                                name="smtpUsername"
                                value={smtpFormValues.smtpUsername}
                                onChange={handleSmtpInputChange}
                              />
                            </FormControl>
                          </Grid>

                          <Grid md={6} xs={12}>
                            <FormControl fullWidth>
                              <InputLabel>SMTP Password</InputLabel>
                              <OutlinedInput
                                label='SMTP Password'
                                type="password"
                                name="smtpPassword"
                                value={smtpFormValues.smtpPassword}
                                onChange={handleSmtpInputChange}
                              />
                            </FormControl>
                          </Grid>

                          <Grid md={6} xs={12}>
                            <FormControl fullWidth>
                              <InputLabel>Email gửi</InputLabel>
                              <OutlinedInput
                                label='Email gửi'

                                name="smtpSenderEmail"
                                value={smtpFormValues.smtpSenderEmail}
                                onChange={handleSmtpInputChange}
                              />
                            </FormControl>
                          </Grid>
                        </>
                      )}


                    </Grid>
                  )}
                </CardContent>
                <CardActions sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  {/* Save Button */}
                  <Button variant="contained" color="primary" onClick={handleSaveSmtpSettings} disabled={isLoading}>
                    {isLoading ? <CircularProgress size={24} /> : "Lưu cài đặt"}
                  </Button>
                </CardActions>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
      <SendRequestEventAgencyAndEventApproval open={openEventAgencyRegistrationModal} onClose={handleOnCloseEventAgencyRegistrationModal} eventId={event_id} />
      <Modal
        open={openConfirmSubmitEventApprovalModal}
        onClose={() => setOpenConfirmSubmitEventApprovalModal(false)}
        aria-labelledby="ticket-category-description-modal-title"
        aria-describedby="ticket-category-description-modal-description"
      >
        <Container maxWidth="xl">
          <Card
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { sm: "500px", xs: "90%" },
              bgcolor: "background.paper",
              boxShadow: 24,
            }}
          >
            <CardHeader title='Quy định chung' />
            <Divider />
            <CardContent>
              <Stack spacing={1} textAlign={'justify'}>
                <Typography variant="body2">
                  <b>Để sự kiện được phê duyệt, Nhà tổ chức sự kiện vui lòng tuân thủ các quy định sau:</b>
                </Typography>
                <Typography variant="body2">
                  - Tài khoản dùng để tạo sự kiện đã được xác thực <b style={{ color: 'text.success'}}>tài khoản Event Agency</b>. Xem tình trạng xác thực tại mục <b>Tài khoản của tôi</b>
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
              <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="contained" color="primary" onClick={handleSendRequestEventApproval} disabled={isLoading}>
                  Gửi yêu cầu
                </Button>
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </Modal>
    </>
  );
}
