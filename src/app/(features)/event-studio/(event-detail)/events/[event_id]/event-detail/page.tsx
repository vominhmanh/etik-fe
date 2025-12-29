'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import {
  Avatar,
  Box,
  CardMedia,
  Container,
  FormHelperText,
  IconButton,
  InputAdornment,
  MenuItem,
  Modal,
  Select,
  Stack,
  TextField,
} from '@mui/material';
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
import { ArrowSquareIn, CheckCircle, Clipboard, Eye, Storefront } from '@phosphor-icons/react/dist/ssr';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { Pencil as PencilIcon } from '@phosphor-icons/react/dist/ssr/Pencil';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import ReactQuill from 'react-quill';

import { useTranslation } from '@/contexts/locale-context';
import NotificationContext from '@/contexts/notification-context';
import { LocalizedLink } from '@/components/homepage/localized-link';

import 'react-quill/dist/quill.snow.css';

import SendRequestEventAgencyAndEventApproval from '@/components/events/event/send-request-event-agency-and-event-approval';

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
  externalLink: string;
};

export interface CheckEventAgencyRegistrationAndEventApprovalRequestResponse {
  eventApprovalRequest: string;
  eventAgencyRegistration: boolean;
}

export interface SMTPConfig {
  smtpProvider: 'use_etik_smtp' | 'use_custom_smtp';
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpUseTls?: boolean;
  smtpUseSsl?: boolean;
  smtpSenderEmail?: string;
}
export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt } = useTranslation();
  React.useEffect(() => {
    document.title = tt(
      'Thông tin & Hiển thị | ETIK - Vé điện tử & Quản lý sự kiện',
      'Information & Display | ETIK - E-tickets & Event Management'
    );
  }, [tt]);
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
  const [eventAgencyRegistrationAndEventApprovalRequest, setEventAgencyRegistrationAndEventApprovalRequest] =
    useState<CheckEventAgencyRegistrationAndEventApprovalRequestResponse | null>(null);
  const [openEventAgencyRegistrationModal, setOpenEventAgencyRegistrationModal] = useState(false);
  const [openConfirmSubmitEventApprovalModal, setOpenConfirmSubmitEventApprovalModal] = useState(false);

  const [smtpFormValues, setSmtpFormValues] = useState<SMTPConfig>({
    smtpProvider: 'use_etik_smtp',
    smtpHost: '',
    smtpPort: undefined,
    smtpUsername: '',
    smtpPassword: '',
    smtpUseTls: true,
    smtpUseSsl: false,
    smtpSenderEmail: '',
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
      setOpenConfirmSubmitEventApprovalModal(true);
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
        notificationCtx.success(
          tt(
            'Yêu cầu nâng cấp thành Sự kiện Được xác thực đã được gửi thành công!',
            'The request to upgrade to a Verified Event has been sent successfully!'
          )
        );
        setEventAgencyRegistrationAndEventApprovalRequest(
          eventAgencyRegistrationAndEventApprovalRequest
            ? {
              ...eventAgencyRegistrationAndEventApprovalRequest,
              eventApprovalRequest: 'waiting_for_acceptance',
            }
            : eventAgencyRegistrationAndEventApprovalRequest
        );
        setOpenConfirmSubmitEventApprovalModal(false);
      }
    } catch (error: any) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnCloseEventAgencyRegistrationModal = () => {
    setOpenEventAgencyRegistrationModal(false);
    setEventAgencyRegistrationAndEventApprovalRequest(
      eventAgencyRegistrationAndEventApprovalRequest
        ? {
          ...eventAgencyRegistrationAndEventApprovalRequest,
          eventApprovalRequest: 'waiting_for_acceptance',
        }
        : eventAgencyRegistrationAndEventApprovalRequest
    );
  };

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
      notificationCtx.success('Cấu hình SMTP đã được lưu thành công!');
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
      await baseHttpServiceInstance.post(
        `/event-studio/events/${event?.id}/upload-avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
        true
      );

      // On successful upload, reload the page or update the avatar state
      window.location.reload(); // Optionally, you could call a function to update the state instead of reloading
    } catch (error: any) {
      const message =
        // 1) If it’s a JS Error instance
        error instanceof Error
          ? error.message
          : // 2) If it’s an AxiosError with a response body
          error.response?.data?.message
            ? error.response.data.message
            : // 3) If it’s a plain string
            typeof error === 'string'
              ? error
              : // 4) Fallback to JSON‐dump of the object
              JSON.stringify(error);
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
      await baseHttpServiceInstance.post(
        `/event-studio/events/${event?.id}/upload_banner`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
        true
      );

      // On successful upload, reload the page or handle success
      window.location.reload(); // You can also call a function to update the state instead of reloading
    } catch (error: any) {
      const message =
        // 1) If it’s a JS Error instance
        error instanceof Error
          ? error.message
          : // 2) If it’s an AxiosError with a response body
          error.response?.data?.message
            ? error.response.data.message
            : // 3) If it’s a plain string
            typeof error === 'string'
              ? error
              : // 4) Fallback to JSON‐dump of the object
              JSON.stringify(error);
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
    navigator.clipboard
      .writeText(data)
      .then(() => {
        notificationCtx.success('Đã sao chép vào bộ nhớ tạm'); // Show success message
      })
      .catch(() => {
        notificationCtx.warning('Không thể sao chép, vui lòng thử lại'); // Handle errors
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

  // Paste image handler (Ctrl+V)
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;

      const imageItems = Array.from(items).filter((item) => item.type && item.type.startsWith('image/'));
      if (imageItems.length === 0) return;

      // Prevent default paste when we detect images
      e.preventDefault();

      const quill = reactQuillRef.current?.getEditor();
      if (!quill) return;

      const selection = quill.getSelection(true);
      let insertIndex = selection ? selection.index : quill.getLength();

      try {
        setIsLoading(true);
        for (const item of imageItems) {
          const file = item.getAsFile();
          if (!file) continue;
          const formData = new FormData();
          formData.append('file', file);

          const response = await baseHttpServiceInstance.post(
            `/event-studio/events/${event_id}/upload_image`,
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          );

          const imageUrl = response.data.imageUrl;
          quill.insertEmbed(insertIndex, 'image', imageUrl);
          insertIndex += 1;
        }
      } catch (error) {
        notificationCtx.error('Lỗi:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [event_id]
  );

  // Attach paste listener to Quill root
  useEffect(() => {
    const quill = reactQuillRef.current?.getEditor();
    if (!quill) return;
    const root = quill.root as HTMLElement;
    const listener = (evt: Event) => handlePaste(evt as ClipboardEvent);
    root.addEventListener('paste', listener);
    return () => {
      root.removeEventListener('paste', listener);
    };
  }, [handlePaste]);

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
            color: 'common.white',
            zIndex: (theme) => theme.zIndex.drawer + 1,
            marginLeft: '0px !important',
          }}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <Grid container spacing={3}>
          <Grid lg={8} md={6} xs={12}>
            <Stack spacing={3}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: 16 / 6,
                  overflow: 'hidden',
                  border: 'grey 1px',
                  borderRadius: '20px',
                  backgroundColor: 'gray',
                }}
              >
                <Box
                  component="img"
                  src={previewBannerUrl || event?.bannerUrl || ''}
                  alt="Sự kiện"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover',
                  }}
                />
                <IconButton
                  component="label"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                    },
                  }}
                >
                  <PencilIcon fontSize="var(--icon-fontSize-sm)" />
                  <input type="file" hidden accept="image/*" onChange={handleBannerImageChange} />
                </IconButton>
                {isImageSelected && (
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                    }}
                  >
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSaveBannerImage}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: 'text.primary',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 1)',
                        },
                      }}
                    >
                      {tt('Lưu', 'Save')}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleSelectBannerOther}
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 1)',
                        },
                      }}
                    >
                      {tt('Hủy', 'Cancel')}
                    </Button>
                  </Stack>
                )}
              </Box>
            </Stack>
          </Grid>
          <Grid lg={4} md={6} xs={12}>
            <Stack spacing={3}>
              <Card sx={{ height: '100%' }}>
                <CardContent
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <Stack direction="column" spacing={2}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        {previewAvatarUrl || event?.avatarUrl ? (
                          <Box
                            component="img"
                            src={previewAvatarUrl || event?.avatarUrl}
                            sx={{
                              height: '80px',
                              width: '80px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <Avatar sx={{ height: '80px', width: '80px', fontSize: '2rem' }}>
                            {(event?.name[0] ?? 'a').toUpperCase()}
                          </Avatar>
                        )}
                        <IconButton
                          component="label"
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            width: 28,
                            height: 28,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 1)',
                            },
                          }}
                        >
                          <PencilIcon fontSize="var(--icon-fontSize-xs)" />
                          <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                        </IconButton>
                        {isAvatarSelected && (
                          <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                              position: 'absolute',
                              top: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              mt: 1,
                            }}
                          >
                            <Button
                              variant="contained"
                              size="small"
                              onClick={handleSaveAvatar}
                              sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                color: 'text.primary',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 255, 255, 1)',
                                },
                              }}
                            >
                              {tt('Lưu', 'Save')}
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={handleSelectOtherAvatar}
                              sx={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 255, 255, 1)',
                                },
                              }}
                            >
                              {tt('Hủy', 'Cancel')}
                            </Button>
                          </Stack>
                        )}
                      </div>
                      <Typography variant="h5" sx={{ width: '100%', textAlign: 'center' }}>
                        {event?.name}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <HouseLineIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {tt('Đơn vị tổ chức:', 'Organizer:')} {event?.organizer}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {event?.startDateTime && event?.endDateTime
                          ? `${dayjs(event.startDateTime || 0).format('HH:mm DD/MM/YYYY')} - ${dayjs(event.endDateTime || 0).format('HH:mm DD/MM/YYYY')}`
                          : tt('Chưa xác định', 'Not specified')}{' '}
                        {event.timeInstruction ? `(${event.timeInstruction})` : ''}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {event?.place ? event?.place : tt('Chưa xác định', 'Not specified')}{' '}
                        {event.locationInstruction ? `(${event.locationInstruction})` : ''}
                      </Typography>
                    </Stack>
                    <Stack sx={{ alignItems: 'left' }} direction="row" spacing={1}>
                      <Storefront fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {event?.displayOnMarketplace
                          ? tt('Có thể truy cập từ Marketplace', 'Accessible from Marketplace')
                          : tt('Chỉ có thể truy cập bằng link', 'Only accessible via link')}
                        <Box component="a" href="#otherSettings" sx={{ textDecoration: 'none' }}>
                          {' '}
                          {tt('Thay đổi', 'Change')}
                        </Box>
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <Eye fontSize="var(--icon-fontSize-sm)" />
                      {event?.displayOption !== 'display_with_everyone' ? (
                        <Typography display="inline" variant="body2" sx={{ color: 'warning.main' }}>
                          {tt('Sự kiện không hiển thị công khai', 'Event not publicly visible')}
                          <Box component="a" href="#otherSettings" sx={{ textDecoration: 'none' }}>
                            {' '}
                            {tt('Thay đổi', 'Change')}
                          </Box>
                        </Typography>
                      ) : (
                        <Typography display="inline" variant="body2" color="text.secondary">
                          {tt('Đang hiển thị công khai', 'Publicly visible')}
                          <Box component="a" href="#otherSettings" sx={{ textDecoration: 'none' }}>
                            {' '}
                            {tt('Thay đổi', 'Change')}
                          </Box>
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                  <Box sx={{ mt: 2.5 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      target="_blank"
                      component={LocalizedLink}
                      href={`/events/${event?.slug}`}
                      size="small"
                      endIcon={<ArrowSquareIn />}
                    >
                      {tt('Đến trang khách hàng tự đăng ký vé', 'Go to Customer Registration Page')}
                    </Button>
                  </Box>
                  <Box sx={{ mt: 2.5 }}>
                    {eventAgencyRegistrationAndEventApprovalRequest && (
                      <>
                        {eventAgencyRegistrationAndEventApprovalRequest.eventApprovalRequest == 'accepted' && (
                          <Button fullWidth variant="outlined" size="small" color="success">
                            <Stack spacing={0} sx={{ alignItems: 'center' }}>
                              <Box
                                component="span"
                                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, lineHeight: 1 }}
                              >
                                <CheckCircle size={16} weight="fill" />
                                {tt('Sự kiện Được xác thực', 'Verified Event')}
                              </Box>
                              <small>
                                {tt(
                                  'bán vé có thanh toán online, gửi email marketing,...',
                                  'sell tickets with online payment, send marketing emails,...'
                                )}
                              </small>
                            </Stack>
                          </Button>
                        )}
                        {eventAgencyRegistrationAndEventApprovalRequest.eventApprovalRequest ==
                          'waiting_for_acceptance' && (
                            <Button fullWidth variant="outlined" size="small" disabled>
                              <Stack spacing={0} sx={{ alignItems: 'center' }}>
                                <span>{tt('Sự kiện đang chờ duyệt', 'Event Pending Approval')}</span>
                              </Stack>
                            </Button>
                          )}
                        {eventAgencyRegistrationAndEventApprovalRequest.eventApprovalRequest == 'rejected' && (
                          <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={handleRequestEventApprovalClick}
                          >
                            <Stack spacing={0} sx={{ alignItems: 'center' }}>
                              <small color="error">
                                {tt('Yêu cầu nâng cấp bị từ chối', 'Upgrade Request Rejected')}
                              </small>
                              <span>{tt('Nhấn để yêu cầu lại', 'Click to Request Again')}</span>
                            </Stack>
                          </Button>
                        )}
                        {eventAgencyRegistrationAndEventApprovalRequest.eventApprovalRequest ==
                          'no_request_from_user' && (
                            <Button fullWidth variant="contained" size="small" onClick={handleRequestEventApprovalClick}>
                              <Stack spacing={0} sx={{ alignItems: 'center' }}>
                                <span>{tt('nâng cấp thành Sự kiện Được xác thực', 'Upgrade to Verified Event')}</span>
                                <small>
                                  {tt(
                                    'Để bật thanh toán online, gửi email marketing,...',
                                    'To enable online payment, send marketing emails,...'
                                  )}
                                </small>
                              </Stack>
                            </Button>
                          )}
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
        <div>
          <Typography variant="h4">{tt('Thông tin & Hiển thị', 'Information & Display')}</Typography>
        </div>
        <Grid container spacing={3}>
          <Grid lg={4} md={6} xs={12}>
            <Stack spacing={3}>
              <Card>
                <CardHeader title={tt('Thông tin liên hệ', 'Contact Information')} />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>{tt('Email đơn vị tổ chức', 'Organizer Email')}</InputLabel>
                        <OutlinedInput
                          value={formValues.organizerEmail}
                          onChange={handleInputChange}
                          label={tt('Email đơn vị tổ chức', 'Organizer Email')}
                          name="organizerEmail"
                        />
                      </FormControl>
                    </Grid>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>{tt('Số điện thoại đơn vị tổ chức', 'Organizer Phone Number')}</InputLabel>
                        <OutlinedInput
                          value={formValues.organizerPhoneNumber}
                          onChange={handleInputChange}
                          label={tt('Số điện thoại đơn vị tổ chức', 'Organizer Phone Number')}
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
                <CardHeader title={tt('Thông tin sự kiện', 'Event Information')} />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>{tt('Tên sự kiện', 'Event Name')}</InputLabel>
                        <OutlinedInput
                          value={formValues.name}
                          onChange={handleInputChange}
                          label={tt('Tên sự kiện', 'Event Name')}
                          name="name"
                        />
                      </FormControl>
                    </Grid>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>{tt('Đơn vị tổ chức', 'Organizer')}</InputLabel>
                        <OutlinedInput
                          value={formValues.organizer}
                          onChange={handleInputChange}
                          label={tt('Đơn vị tổ chức', 'Organizer')}
                          name="organizer"
                        />
                      </FormControl>
                    </Grid>
                    <Grid md={12} xs={12}>
                      <ReactQuill
                        ref={reactQuillRef}
                        value={description}
                        onChange={handleDescriptionChange}
                        modules={modules}
                        placeholder={tt('Mô tả', 'Description')}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title={tt('Địa điểm & Thời gian', 'Location & Time')} />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>{tt('Địa điểm', 'Location')}</InputLabel>
                        <OutlinedInput
                          value={formValues.place || ''}
                          onChange={handleInputChange}
                          label={tt('Địa điểm', 'Location')}
                          name="place"
                        />
                      </FormControl>
                    </Grid>

                    <Grid md={6} xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>{tt('URL Địa điểm', 'Location URL')}</InputLabel>
                        <OutlinedInput
                          value={formValues.locationUrl || ''}
                          onChange={handleInputChange}
                          label={tt('URL Địa điểm', 'Location URL')}
                          name="locationUrl"
                        />
                      </FormControl>
                    </Grid>
                    <Grid md={6} xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>{tt('Hướng dẫn thêm về địa điểm', 'Additional Location Instructions')}</InputLabel>
                        <OutlinedInput
                          value={formValues.locationInstruction || ''}
                          onChange={handleInputChange}
                          label={tt('Hướng dẫn thêm về địa điểm', 'Additional Location Instructions')}
                          name="locationInstruction"
                        />
                      </FormControl>
                    </Grid>

                    <Grid md={4} xs={12}>
                      <FormControl fullWidth required>
                        <TextField
                          label={tt('Thời gian bắt đầu', 'Start Time')}
                          type="datetime-local"
                          value={formValues.startDateTime || ''}
                          onChange={handleInputChange}
                          name="startDateTime"
                          InputLabelProps={{ shrink: true }}
                        />
                      </FormControl>
                    </Grid>

                    <Grid md={4} xs={12}>
                      <FormControl fullWidth required>
                        <TextField
                          label={tt('Thời gian kết thúc', 'End Time')}
                          type="datetime-local"
                          onChange={handleInputChange}
                          name="endDateTime"
                          value={formValues.endDateTime || ''}
                          InputLabelProps={{ shrink: true }}
                        />
                      </FormControl>
                    </Grid>
                    <Grid md={4} xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>{tt('Hướng dẫn thêm về thời gian', 'Additional Time Instructions')}</InputLabel>
                        <OutlinedInput
                          value={formValues.timeInstruction || ''}
                          onChange={handleInputChange}
                          label={tt('Hướng dẫn thêm về thời gian', 'Additional Time Instructions')}
                          name="timeInstruction"
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card id="otherSettings">
                <CardHeader title={tt('Thông tin khác', 'Other Information')} />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>{tt('Trang khách hàng tự đăng ký', 'Customer Registration Page')}</InputLabel>
                        <OutlinedInput
                          value={formValues.slug}
                          label={tt('Trang khách hàng tự đăng ký', 'Customer Registration Page')}
                          name="slug"
                          onChange={handleInputChange}
                          startAdornment={<InputAdornment position="start">etik.vn/</InputAdornment>}
                          endAdornment={
                            <IconButton size="small" onClick={() => handleCopyToClipboard(`etik.vn/${event?.slug}`)}>
                              <Clipboard />
                            </IconButton>
                          }
                        />
                      </FormControl>
                    </Grid>

                    <Grid md={12} xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>
                          {tt('Liên kết ngoài (trang thông tin sự kiện)', 'External Link (Event Information Page)')}
                        </InputLabel>
                        <OutlinedInput
                          value={formValues.externalLink}
                          label={tt(
                            'Liên kết ngoài (trang thông tin sự kiện)',
                            'External Link (Event Information Page)'
                          )}
                          name="externalLink"
                          onChange={handleInputChange}
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
                          endAdornment={
                            <IconButton size="small" onClick={() => handleCopyToClipboard(event.secureApiKey)}>
                              <Clipboard />
                            </IconButton>
                          }
                        />
                      </FormControl>
                    </Grid>

                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>{tt('Chế độ hiển thị sự kiện', 'Event Display Mode')}</InputLabel>
                        <Select
                          disabled={!(event.adminReviewStatus === 'accepted')}
                          label={tt('Chế độ hiển thị sự kiện', 'Event Display Mode')}
                          name="displayOption"
                          value={formValues.displayOption}
                          onChange={(e: any) => handleInputChange(e)}
                        >
                          {/* <MenuItem value={'do_not_display'}>{tt("Không hiển thị", "Do Not Display")}</MenuItem> */}
                          <MenuItem value={'display_with_members'}>
                            {tt('Chỉ hiển thị với người quản lý sự kiện', 'Only visible to event managers')}
                          </MenuItem>
                          <MenuItem value={'display_with_everyone'}>
                            {tt('Hiển thị với mọi người', 'Visible to everyone')}
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>
                          {tt('Cho phép tìm kiếm trên Marketplace', 'Allow Search on Marketplace')}
                        </InputLabel>
                        <Select
                          disabled={!(event.adminReviewStatus === 'accepted')}
                          label={tt('Cho phép tìm kiếm trên Marketplace', 'Allow Search on Marketplace')}
                          name="displayOnMarketplace"
                          value={formValues.displayOnMarketplace}
                          onChange={(e: any) => handleInputChange(e)}
                        >
                          <MenuItem value={'true'}>{tt('Cho phép', 'Allow')}</MenuItem>
                          <MenuItem value={'false'}>{tt('Không cho phép', 'Do Not Allow')}</MenuItem>
                        </Select>
                        {!(event.adminReviewStatus === 'accepted') && (
                          <FormHelperText>
                            {tt(
                              'Vui lòng nâng cấp thành Sự kiện Được xác thực để thay đổi chế độ hiển thị sự kiện',
                              'Please upgrade to a Verified Event to change the event display mode'
                            )}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="contained" onClick={handleFormSubmit}>
                  {tt('Lưu', 'Save')}
                </Button>
              </Grid>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
      <SendRequestEventAgencyAndEventApproval
        open={openEventAgencyRegistrationModal}
        onClose={handleOnCloseEventAgencyRegistrationModal}
        eventId={event_id}
      />
      <Modal
        open={openConfirmSubmitEventApprovalModal}
        onClose={() => setOpenConfirmSubmitEventApprovalModal(false)}
        aria-labelledby="ticket-category-description-modal-title"
        aria-describedby="ticket-category-description-modal-description"
      >
        <Container maxWidth="xl">
          <Card
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { sm: '500px', xs: '90%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
            }}
          >
            <CardHeader title={tt('Quy định chung', 'General Regulations')} />
            <Divider />
            <CardContent>
              <Stack spacing={1} textAlign={'justify'}>
                <Typography variant="body2">
                  <b>
                    {tt(
                      'Để sự kiện được nâng cấp thành Sự kiện Được xác thực, Nhà tổ chức sự kiện vui lòng tuân thủ các quy định dưới đây trước khi gửi yêu cầu:',
                      'To upgrade your event to a Verified Event, the event organizer must comply with the following regulations before submitting the request:'
                    )}
                  </b>
                </Typography>
                <Typography variant="body2">
                  {tt(
                    '- Sự kiện có đầy đủ thông tin về tên, mô tả, đơn vị tổ chức, ảnh bìa, ảnh đại diện.',
                    '- The event must have complete information including name, description, organizer, banner image, and avatar.'
                  )}
                </Typography>
                <Typography variant="body2">
                  {tt(
                    '- Thời gian và địa điểm rõ ràng, chính xác. Hạn chế thay đổi thông tin về thời gian, địa điểm và phải thông báo cho ETIK trước khi thay đổi.',
                    '- Clear and accurate time and location. Minimize changes to time and location information and must notify ETIK before making changes.'
                  )}
                </Typography>

                <Typography variant="body2">
                  {tt(
                    '- Chính sách Giá vé, chính sách hoàn trả, hủy vé rõ ràng, minh bạch.',
                    '- Clear and transparent ticket pricing, refund policy, and cancellation policy.'
                  )}
                </Typography>
                <Typography variant="body2">
                  {tt(
                    '- Sự kiện tuân thủ quy định của pháp luật Việt Nam, phù hợp chuẩn mực đạo đức, thuần phong mỹ tục.',
                    '- The event must comply with Vietnamese law and be consistent with ethical standards and good customs.'
                  )}
                </Typography>
                <Typography variant="body2">
                  {tt(
                    '- Cung cấp cho ETIK các thông tin, giấy tờ để xác minh khi được yêu cầu.',
                    '- Provide ETIK with information and documents for verification when requested.'
                  )}
                </Typography>
                <Typography variant="body2">
                  {tt(
                    'Nếu cần hỗ trợ, Quý khách vui lòng liên hệ Hotline CSKH 0333.247.242 hoặc email tienphongsmart@gmail.com',
                    'If you need support, please contact Customer Service Hotline 0333.247.242 or email tienphongsmart@gmail.com'
                  )}
                </Typography>
              </Stack>
              <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendRequestEventApproval}
                  disabled={isLoading}
                >
                  {tt('Gửi yêu cầu', 'Submit Request')}
                </Button>
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </Modal>
    </>
  );
}
