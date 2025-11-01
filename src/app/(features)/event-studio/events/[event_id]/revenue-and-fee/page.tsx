'use client';

import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Avatar, Box, CardMedia, Container, FormHelperText, IconButton, InputAdornment, MenuItem, Modal, Select, Stack, TextField } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import { orange } from '@mui/material/colors';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { ArrowSquareIn, Clipboard, CurrencyDollar, Eye, Storefront } from '@phosphor-icons/react/dist/ssr';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import { LocalizedLink } from '@/components/localized-link';

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
export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Doanh thu & Phí dịch vụ | ETIK - Vé điện tử & Quản lý sự kiện";
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
      setIsLoading(true);
      await saveSMTPSettings(event_id, smtpFormValues);
      notificationCtx.success("Cấu hình SMTP đã được lưu thành công!");
    } catch (error) {
      notificationCtx.error(error);
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

        <div>
          <Typography variant="h4">Doanh thu & Phí dịch vụ</Typography>
        </div>
        <Grid container spacing={3}>
          <Grid lg={4} md={6} xs={12}>
            <Stack spacing={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Stack spacing={3}>
                    <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
                      <Stack spacing={1}>
                        <Typography color="text.secondary" variant="overline">
                          Tài khoản Doanh thu Sự kiện
                        </Typography>
                        <Typography variant="h4">
                          0 đ
                        </Typography>
                      </Stack>
                      <Avatar sx={{ backgroundColor: 'var(--mui-palette-primary-main)', height: '56px', width: '56px' }}>
                        <CurrencyDollar fontSize="var(--icon-fontSize-lg)" />
                      </Avatar>
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                        <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                          <Typography color='var(--mui-palette-primary-main)' variant="body2">
                            Rút tiền
                          </Typography>
                        </Stack>
                      </Stack>
                      <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                        <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                          <Typography color='var(--mui-palette-primary-main)' variant="body2">
                            Lịch sử giao dịch
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Stack>

                </CardContent>
              </Card>
              <Card>
                <CardHeader title="Thống kê" />
                <Divider />
                <CardContent>
                  <Stack spacing={0}>
                    {/* createdAt */}
                    <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">Tổng doanh thu thuần</Typography>
                      </Stack>
                      <Typography variant="body1">
                        0 đ
                      </Typography>
                    </Grid>
                    <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">Phí dịch vụ</Typography>
                      </Stack>
                      <Typography variant="body1">
                        0 đ
                      </Typography>
                    </Grid>
                    <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1">Phí khác</Typography>
                      </Stack>
                      <Typography variant="body1">
                        0 đ
                      </Typography>
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
          <Grid lg={8} md={6} xs={12}>
            <Stack spacing={3}>
              <Grid container spacing={3}>
                <Grid lg={6} md={6} xs={12}>
                  <Card>
                    <CardHeader title="Phí dịch vụ" />
                    <Divider />
                    <CardContent>
                      <Stack spacing={0}>
                        {/* createdAt */}
                        <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">Cách tính phí</Typography>
                          </Stack>
                          <Typography variant="body1">
                            Tính theo giao dịch
                          </Typography>
                        </Grid>
                        {/* Created source */}
                        <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">Phí cố định</Typography>
                          </Stack>
                          <Typography variant="body1">Thỏa thuận</Typography>
                        </Grid>
                        {/* Created source */}
                        <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">Phí chia sẻ doanh thu</Typography>
                          </Stack>
                          <Typography variant="body1">Thỏa thuận</Typography>
                        </Grid>
                        <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">Phí SMS/Zalo</Typography>
                          </Stack>
                          <Typography variant="body1">Thỏa thuận</Typography>
                        </Grid>
                        <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">Phí email</Typography>
                          </Stack>
                          <Typography variant="body1">Thỏa thuận</Typography>
                        </Grid>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid lg={6} md={6} xs={12}>
                  <Card>
                    <CardHeader title="Cách nhận và thanh toán tiền" />
                    <Divider />
                    <CardContent>
                      <Stack spacing={0}>
                        {/* createdAt */}
                        <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">Nhận tiền vé</Typography>
                          </Stack>
                          <Typography variant="body1">
                            Tài khoản cá nhân
                          </Typography>
                        </Grid>
                        {/* Created source */}
                        <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">Cách thanh toán phí</Typography>
                          </Stack>
                          <Typography variant="body1">
                            Đối soát
                          </Typography>
                        </Grid>
                        {/* Created source */}
                        <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1">Phí phát sinh</Typography>
                          </Stack>
                          <Typography variant="body1">Đối soát</Typography>
                        </Grid>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </>
  );
}
