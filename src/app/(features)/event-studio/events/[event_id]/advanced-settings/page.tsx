'use client';

import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Avatar, Box, CardMedia, Checkbox, Container, FormControlLabel, FormGroup, FormHelperText, IconButton, InputAdornment, MenuItem, Modal, Select, Stack, TextField } from '@mui/material';
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
import { ArrowSquareIn, Clipboard, Eye, Storefront } from '@phosphor-icons/react/dist/ssr';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { ScanSmiley as ScanSmileyIcon } from '@phosphor-icons/react/dist/ssr/ScanSmiley';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import RouterLink from 'next/link';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import SendRequestEventAgencyAndEventApproval from '../../../../../../components/events/event/send-request-event-agency-and-event-approval';

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
  timeInstruction: string | null;
  displayOnMarketplace: boolean;
  displayOption: string;
  adminReviewStatus: 'no_request_from_user' | 'waiting_for_acceptance' | 'accepted' | 'rejected';
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

export interface SendTicketMethodsRequest {
  useEmailMethod: boolean;
  useEmailMethodAsDefault: boolean;
  useZaloMethod: boolean;
  useZaloMethodAsDefault: boolean;
}
export interface CheckInFaceConfig {
  useCheckInFace: boolean;
}
export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Cài đặt nâng cao | ETIK - Vé điện tử & Quản lý sự kiện";
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
  const [isSmtpLoading, setIsSmtpLoading] = useState<boolean>(false);
  const [isSendTicketMethodsLoading, setIsSendTicketMethodsLoading] = useState<boolean>(false);
  const [isCheckInFaceLoading, setIsCheckInFaceLoading] = useState<boolean>(false);
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

  const [sendTicketMethods, setSendTicketMethods] = useState<SendTicketMethodsRequest>({
    useEmailMethod: false,
    useEmailMethodAsDefault: false,
    useZaloMethod: false,
    useZaloMethodAsDefault: false,
  });
  const [checkInFaceConfig, setCheckInFaceConfig] = useState<CheckInFaceConfig>({
    useCheckInFace: false,
  });


  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const data = await getSMTPSettings(params.event_id);
        if (data) setSmtpFormValues(data);
        const sendMethods = await getSendTicketMethods(params.event_id);
        if (sendMethods) setSendTicketMethods(sendMethods);
        const faceCfg = await getCheckInFaceConfig(params.event_id);
        if (faceCfg) setCheckInFaceConfig(faceCfg);
      } catch (error) {
        notificationCtx.error(error);
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
        notificationCtx.success("Yêu cầu nâng cấp thành Sự kiện Được xác thực đã được gửi thành công!");
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
      setIsSmtpLoading(true);
      await saveSMTPSettings(event_id, smtpFormValues);
      notificationCtx.success("Cấu hình SMTP đã được lưu thành công!");
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsSmtpLoading(false);
    }
  };

  const handleSendTicketMethodsChange = (name: keyof SendTicketMethodsRequest, checked: boolean) => {
    setSendTicketMethods((prev) => {
      const next = { ...prev, [name]: checked } as SendTicketMethodsRequest;
      if (name === 'useEmailMethod' && !checked) {
        next.useEmailMethodAsDefault = false;
      }
      if (name === 'useZaloMethod' && !checked) {
        next.useZaloMethodAsDefault = false;
      }
      return next;
    });
  };

  const handleSaveSendTicketMethods = async () => {
    try {
      setIsSendTicketMethodsLoading(true);
      await saveSendTicketMethods(event_id, sendTicketMethods);
      notificationCtx.success('Cập nhật thành công');
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsSendTicketMethodsLoading(false);
    }
  };

  const handleCheckInFaceChange = (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setCheckInFaceConfig((prev) => ({ ...prev, useCheckInFace: checked }));
  };

  const handleSaveCheckInFaceConfig = async () => {
    try {
      setIsCheckInFaceLoading(true);
      await baseHttpServiceInstance.post(`/event-studio/events/${event_id}/check-in-face-settings`, checkInFaceConfig);
      notificationCtx.success('Cập nhật thành công');
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsCheckInFaceLoading(false);
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
      }, true);

      // On successful upload, reload the page or update the avatar state
      window.location.reload(); // Optionally, you could call a function to update the state instead of reloading
    } catch (error: any) {
      const message =
        // 1) If it’s a JS Error instance
        error instanceof Error ? error.message
          // 2) If it’s an AxiosError with a response body
          : error.response?.data?.message
            ? error.response.data.message
            // 3) If it’s a plain string
            : typeof error === 'string'
              ? error
              // 4) Fallback to JSON‐dump of the object
              : JSON.stringify(error);
      notificationCtx.error(`Lỗi tải ảnh:  ${message}`);
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
      }, true);

      // On successful upload, reload the page or handle success
      window.location.reload(); // You can also call a function to update the state instead of reloading
    } catch (error: any) {
      const message =
        // 1) If it’s a JS Error instance
        error instanceof Error ? error.message
          // 2) If it’s an AxiosError with a response body
          : error.response?.data?.message
            ? error.response.data.message
            // 3) If it’s a plain string
            : typeof error === 'string'
              ? error
              // 4) Fallback to JSON‐dump of the object
              : JSON.stringify(error);
      notificationCtx.error(`Lỗi tải ảnh:  ${message}`);
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

  async function getSendTicketMethods(eventId: number): Promise<SendTicketMethodsRequest | null> {
    try {
      const response: AxiosResponse<SendTicketMethodsRequest> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/send-ticket-methods`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async function saveSendTicketMethods(eventId: number, payload: SendTicketMethodsRequest): Promise<void> {
    try {
      await baseHttpServiceInstance.post(`/event-studio/events/${eventId}/send-ticket-methods`, payload);
    } catch (error) {
      throw error;
    }
  }

  async function getCheckInFaceConfig(eventId: number): Promise<CheckInFaceConfig | null> {
    try {
      const response: AxiosResponse<CheckInFaceConfig> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/check-in-face-settings`
      );
      return response.data;
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
            color: 'common.white',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            marginLeft: '0px !important',
          }}
        >
          <CircularProgress color="inherit" />
        </Backdrop>

        <div>
          <Typography variant="h4">Cài đặt nâng cao</Typography>
        </div>
        <Grid container spacing={3}>
          <Grid lg={4} md={6} xs={12}>
            <Stack spacing={3}>
              <Card>
                <CardHeader title="Phương thức gửi vé điện tử" />
                <Divider />
                <CardContent>
                  <Grid container spacing={6} wrap="wrap">
                    <Grid md={12} sm={12} xs={12}>
                      <Stack spacing={1}>
                        <Typography variant="h6">Email</Typography>
                        <FormGroup>
                          <FormControlLabel
                            control={<Checkbox checked={sendTicketMethods.useEmailMethod}
                              onChange={(_e, checked) => handleSendTicketMethodsChange('useEmailMethod', checked)} />}
                            label="Sử dụng phương thức này"
                          />
                          <FormControlLabel
                            control={<Checkbox checked={sendTicketMethods.useEmailMethodAsDefault}
                              onChange={(_e, checked) => handleSendTicketMethodsChange('useEmailMethodAsDefault', checked)}
                              disabled={!sendTicketMethods.useEmailMethod}
                            />}
                            label="Tự động sử dụng khi tạo đơn hàng"
                          />
                        </FormGroup>
                      </Stack>
                    </Grid>
                    <Grid md={12} sm={12} xs={12}>
                      <Stack spacing={1}>
                        <Typography variant="h6">Zalo</Typography>
                        <FormGroup>
                          <FormControlLabel
                            control={<Checkbox checked={sendTicketMethods.useZaloMethod}
                              onChange={(_e, checked) => handleSendTicketMethodsChange('useZaloMethod', checked)} />}
                            label="Sử dụng phương thức này"
                          />
                          <FormControlLabel
                            control={<Checkbox checked={sendTicketMethods.useZaloMethodAsDefault}
                              onChange={(_e, checked) => handleSendTicketMethodsChange('useZaloMethodAsDefault', checked)}
                              disabled={!sendTicketMethods.useZaloMethod}
                            />}
                            label="Tự động sử dụng khi tạo đơn hàng"
                          />
                          <FormHelperText>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Phương thức này chỉ khả dụng với một số sự kiện. Vui lòng liên hệ ETIK để biết thêm chi tiết.
                            </Typography>
                          </FormHelperText>
                        </FormGroup>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
                <Divider />
                <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" color="primary" onClick={handleSaveSendTicketMethods} disabled={isSendTicketMethodsLoading}>
                    {isSendTicketMethodsLoading ? <CircularProgress size={24} /> : "Lưu cài đặt"}
                  </Button>
                </CardActions>
              </Card>
              <Card>
                <CardHeader title="Check-in bằng khuôn mặt" />
                <Divider />
                <CardContent>
                  <Grid container spacing={6} wrap="wrap">
                    <Grid md={12} sm={12} xs={12}>
                      <Stack spacing={1}>
                        <FormGroup>
                          <FormControlLabel
                            control={<Checkbox checked={checkInFaceConfig.useCheckInFace}
                              onChange={handleCheckInFaceChange} />}
                            label="Sử dụng Check-in bằng khuôn mặt"
                          />
                          <FormHelperText>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Khách hàng sẽ nhận được lời mời đăng ký khuôn mặt khi mua vé thành công
                            </Typography>
                          </FormHelperText>
                        </FormGroup>
                      </Stack>
                    </Grid>
                    
                  </Grid>
                </CardContent>
                <Divider />
                <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" color="primary" onClick={handleSaveCheckInFaceConfig} startIcon={<ScanSmileyIcon />} disabled={isCheckInFaceLoading}>
                    {isCheckInFaceLoading ? <CircularProgress size={24} /> : "Lưu cài đặt"}
                  </Button>
                </CardActions>
              </Card>
            </Stack>
          </Grid>
          <Grid lg={8} md={6} xs={12}>
            <Stack spacing={3}>

              <Card>
                <CardHeader title="Cấu hình gửi Email SMTP" />
                <Divider />
                <CardContent>
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
                </CardContent>
                <Divider />
                <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" color="primary" onClick={handleSaveSmtpSettings} disabled={isLoading}>
                    {isSmtpLoading ? <CircularProgress size={24} /> : "Lưu cài đặt"}
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
                  <b>Để sự kiện được nâng cấp thành Sự kiện Được xác thực, Nhà tổ chức sự kiện vui lòng tuân thủ các quy định dưới đây trước khi gửi yêu cầu:</b>
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
                <Typography variant="body2">
                  Nếu cần hỗ trợ, Quý khách vui lòng liên hệ Hotline CSKH <b>0333.247.242</b> hoặc email <b>tienphongsmart@gmail.com</b>
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
