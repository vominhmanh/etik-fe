'use client';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Avatar, Box, CardMedia, Checkbox, Container, FormControlLabel, FormGroup, FormHelperText, IconButton, InputAdornment, MenuItem, Modal, Radio, Select, Stack, TableBody, Table, TextField, TableHead, TableCell, TableRow } from '@mui/material';
import { PencilSimple, Trash } from '@phosphor-icons/react/dist/ssr';
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

export interface EmailTemplateConfig {
  type: "template_default" | "template_english" | "template_other";
  templateOtherNameTransaction?: string;
  templateOtherNameTicket?: string;
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

import PrinterModal, { TicketTagPrinter } from './printer-modal';

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt } = useTranslation();
  
  React.useEffect(() => {
    document.title = tt("Cài đặt nâng cao | ETIK - Vé điện tử & Quản lý sự kiện", "Advanced Settings | ETIK - Electronic Tickets & Event Management");
  }, [tt]);
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [formValues, setFormValues] = useState<EventResponse | null>(null);
  const event_id = params.event_id;
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [previewBannerUrl, setPreviewBannerUrl] = React.useState<string>(event?.bannerUrl || '');
  const [isImageSelected, setIsImageSelected] = React.useState(false);
  const [description, setDescription] = useState<string>('');
  const reactQuillRef = React.useRef<ReactQuill>(null);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSmtpLoading, setIsSmtpLoading] = useState<boolean>(false);
  const [isEmailTemplateLoading, setIsEmailTemplateLoading] = useState<boolean>(false);
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

  const [emailTemplateFormValues, setEmailTemplateFormValues] = useState<EmailTemplateConfig>({
    type: "template_default",
    templateOtherNameTransaction: "",
    templateOtherNameTicket: "",
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

  const [printers, setPrinters] = useState<TicketTagPrinter[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState<number | null>(null);
  const [isPrinterLoading, setIsPrinterLoading] = useState<boolean>(false);
  const [openPrinterModal, setOpenPrinterModal] = useState<boolean>(false);
  const [editingPrinter, setEditingPrinter] = useState<TicketTagPrinter | null>(null);


  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [smtpRes, emailTplRes, sendMethodsRes, faceCfgRes, eventRes] = await Promise.allSettled([
          getSMTPSettings(params.event_id),
          getEmailTemplateSettings(params.event_id),
          getSendTicketMethods(params.event_id),
          getCheckInFaceConfig(params.event_id),
          baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}`),
        ]);

        if (smtpRes.status === 'fulfilled' && smtpRes.value) {
          setSmtpFormValues(smtpRes.value);
        } else if (smtpRes.status === 'rejected') {
          notificationCtx.warning(tt('Không tải được cài đặt SMTP', 'Failed to load SMTP settings'));
        }

        if (emailTplRes.status === 'fulfilled' && emailTplRes.value) {
          setEmailTemplateFormValues(emailTplRes.value);
        } else if (emailTplRes.status === 'rejected') {
          notificationCtx.warning(tt('Không tải được cài đặt template email', 'Failed to load email template settings'));
        }

        if (sendMethodsRes.status === 'fulfilled' && sendMethodsRes.value) {
          setSendTicketMethods(sendMethodsRes.value);
        } else if (sendMethodsRes.status === 'rejected') {
          notificationCtx.warning(tt('Không tải được phương thức gửi vé', 'Failed to load ticket sending methods'));
        }

        if (faceCfgRes.status === 'fulfilled' && faceCfgRes.value) {
          setCheckInFaceConfig(faceCfgRes.value);
        } else if (faceCfgRes.status === 'rejected') {
          notificationCtx.warning(tt('Không tải được cài đặt Check-in bằng khuôn mặt', 'Failed to load face check-in settings'));
        }

        if (eventRes.status === 'fulfilled' && eventRes.value) {
          const eventData = eventRes.value.data;
          setSelectedPrinterId(eventData.ticketTagPrinterId || null);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
    fetchPrinters();
  }, [params.event_id]);

  const fetchPrinters = async () => {
    if (!params.event_id) return;
    try {
      const response: AxiosResponse<TicketTagPrinter[]> = await baseHttpServiceInstance.get(
        `/event-studio/events/${params.event_id}/ticket-tag-printers`
      );
      setPrinters(response.data);
    } catch (error: any) {
      notificationCtx.error(error.response?.data?.detail || tt('Không tải được danh sách máy in', 'Failed to load printer list'));
    }
  };

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

  const handleSendRequestEventApproval = async () => {
    try {
      setIsLoading(true);

      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/approval-requests/event-approval-request`
      );

      // Handle success response
      if (response.status === 200) {
        notificationCtx.success(tt("Yêu cầu nâng cấp thành Sự kiện Được xác thực đã được gửi thành công!", "Request to upgrade to Verified Event has been sent successfully!"));
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
      notificationCtx.success(tt("Cấu hình SMTP đã được lưu thành công!", "SMTP configuration has been saved successfully!"));
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
      notificationCtx.success(tt('Cập nhật thành công', 'Updated successfully'));
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
      notificationCtx.success(tt('Cập nhật thành công', 'Updated successfully'));
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsCheckInFaceLoading(false);
    }
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
          notificationCtx.error(tt('Lỗi:', 'Error:'), error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEventDetails();
    }
  }, [event_id]);

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
          notificationCtx.error(tt('Lỗi:', 'Error:'), error);
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

  async function getEmailTemplateSettings(eventId: number): Promise<EmailTemplateConfig | null> {
    try {
      const response: AxiosResponse<EmailTemplateConfig> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/email-template/settings`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }


  async function saveEmailTemplateSettings(eventId: number, emailTemplateConfig: EmailTemplateConfig): Promise<void> {
    try {
      await baseHttpServiceInstance.post(`/event-studio/events/${eventId}/email-template/settings`, emailTemplateConfig);
    } catch (error) {
      throw error;
    }
  }

  const handleEmailTemplateInputChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    setEmailTemplateFormValues((prevValues) => ({
      ...prevValues,
      [event.target.name as string]: event.target.value,
    }));
  };

  const handleSaveEmailTemplateConfig = async () => {
    try {
      if (emailTemplateFormValues.type === 'template_other') {
        const nameTxn = emailTemplateFormValues.templateOtherNameTransaction?.trim();
        const nameTicket = emailTemplateFormValues.templateOtherNameTicket?.trim();
        if (!nameTxn || !nameTicket) {
          notificationCtx.warning(tt('Vui lòng nhập tên template tùy chỉnh cho cả giao dịch và vé.', 'Please enter custom template names for both transaction and ticket.'));
          return;
        }
      }
      setIsEmailTemplateLoading(true);
      await saveEmailTemplateSettings(event_id, emailTemplateFormValues);
      notificationCtx.success(tt('Cấu hình template email đã được lưu thành công!', 'Email template configuration has been saved successfully!'));
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsEmailTemplateLoading(false);
    }
  };

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

  const handlePrinterChange = (printerId: number | null) => {
    setSelectedPrinterId(printerId);
  };

  const handleSavePrinterSettings = async () => {
    try {
      setIsPrinterLoading(true);
      await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/ticket-tag-printers/select`,
        { ticketTagPrinterId: selectedPrinterId }
      );
      notificationCtx.success(tt('Cài đặt máy in đã được lưu thành công!', 'Printer settings have been saved successfully!'));
    } catch (error: any) {
      notificationCtx.error(error.response?.data?.detail || tt('Có lỗi xảy ra khi lưu cài đặt', 'An error occurred while saving settings'));
    } finally {
      setIsPrinterLoading(false);
    }
  };

  const handleAddPrinter = () => {
    setEditingPrinter(null);
    setOpenPrinterModal(true);
  };

  const handleEditPrinter = (printer: TicketTagPrinter) => {
    setEditingPrinter(printer);
    setOpenPrinterModal(true);
  };

  const handleDeletePrinter = async (printerId: number) => {
    if (!confirm(tt('Bạn có chắc chắn muốn xóa máy in này?', 'Are you sure you want to delete this printer?'))) {
      return;
    }

    try {
      await baseHttpServiceInstance.delete(
        `/event-studio/events/${event_id}/ticket-tag-printers/${printerId}`
      );
      notificationCtx.success(tt('Xóa máy in thành công!', 'Printer deleted successfully!'));
      fetchPrinters();
      // If deleted printer was selected, reset to system printer
      if (selectedPrinterId === printerId) {
        setSelectedPrinterId(null);
      }
    } catch (error: any) {
      notificationCtx.error(error.response?.data?.detail || tt('Có lỗi xảy ra khi xóa máy in', 'An error occurred while deleting printer'));
    }
  };

  const handlePrinterSaved = () => {
    fetchPrinters();
  };



  if (!event || !formValues) {
    return <Typography>{tt('Loading...', 'Loading...')}</Typography>;
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
          <Typography variant="h4">{tt('Cài đặt nâng cao', 'Advanced Settings')}</Typography>
        </div>
        <Grid container spacing={3}>
          <Grid lg={4} md={6} xs={12}>
            <Stack spacing={3}>
              <Card>
                <CardHeader title={tt("Phương thức gửi vé điện tử", "Electronic Ticket Sending Methods")} />
                <Divider />
                <CardContent>
                  <Grid container spacing={6} wrap="wrap">
                    <Grid md={12} sm={12} xs={12}>
                      <Stack spacing={1}>
                        <Typography variant="h6">{tt("Email", "Email")}</Typography>
                        <FormGroup>
                          <FormControlLabel
                            control={<Checkbox checked={sendTicketMethods.useEmailMethod}
                              onChange={(_e, checked) => handleSendTicketMethodsChange('useEmailMethod', checked)} />}
                            label={tt("Sử dụng phương thức này", "Use this method")}
                          />
                          <FormControlLabel
                            control={<Checkbox checked={sendTicketMethods.useEmailMethodAsDefault}
                              onChange={(_e, checked) => handleSendTicketMethodsChange('useEmailMethodAsDefault', checked)}
                              disabled={!sendTicketMethods.useEmailMethod}
                            />}
                            label={tt("Tự động sử dụng khi tạo đơn hàng", "Automatically use when creating orders")}
                          />
                        </FormGroup>
                      </Stack>
                    </Grid>
                    <Grid md={12} sm={12} xs={12}>
                      <Stack spacing={1}>
                        <Typography variant="h6">{tt("Zalo", "Zalo")}</Typography>
                        <FormGroup>
                          <FormControlLabel
                            control={<Checkbox checked={sendTicketMethods.useZaloMethod}
                              onChange={(_e, checked) => handleSendTicketMethodsChange('useZaloMethod', checked)} />}
                            label={tt("Sử dụng phương thức này", "Use this method")}
                          />
                          <FormControlLabel
                            control={<Checkbox checked={sendTicketMethods.useZaloMethodAsDefault}
                              onChange={(_e, checked) => handleSendTicketMethodsChange('useZaloMethodAsDefault', checked)}
                              disabled={!sendTicketMethods.useZaloMethod}
                            />}
                            label={tt("Tự động sử dụng khi tạo đơn hàng", "Automatically use when creating orders")}
                          />
                          <FormHelperText>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {tt("Phương thức này chỉ khả dụng với một số sự kiện. Vui lòng liên hệ ETIK để biết thêm chi tiết.", "This method is only available for some events. Please contact ETIK for more details.")}
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
                    {isSendTicketMethodsLoading ? <CircularProgress size={24} /> : tt("Lưu cài đặt", "Save Settings")}
                  </Button>
                </CardActions>
              </Card>
              <Card>
                <CardHeader title={tt("Check-in bằng khuôn mặt", "Face Check-in")} />
                <Divider />
                <CardContent>
                  <Grid container spacing={6} wrap="wrap">
                    <Grid md={12} sm={12} xs={12}>
                      <Stack spacing={1}>
                        <FormGroup>
                          <FormControlLabel
                            control={<Checkbox checked={checkInFaceConfig.useCheckInFace}
                              onChange={handleCheckInFaceChange} />}
                            label={tt("Sử dụng Check-in bằng khuôn mặt", "Use Face Check-in")}
                          />
                          <FormHelperText>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {tt("Khách hàng sẽ nhận được lời mời đăng ký khuôn mặt khi mua vé thành công", "Customers will receive a face registration invitation when they successfully purchase tickets")}
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
                    {isCheckInFaceLoading ? <CircularProgress size={24} /> : tt("Lưu cài đặt", "Save Settings")}
                  </Button>
                </CardActions>
              </Card>
            </Stack>
          </Grid>
          <Grid lg={8} md={6} xs={12}>
            <Stack spacing={3}>

              <Card>
                <CardHeader title={tt("Cấu hình gửi Email SMTP", "Email SMTP Configuration")} />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    {/* SMTP Provider Selection */}
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>{tt("Dịch vụ mail", "Mail Service")}</InputLabel>
                        <Select
                          label={tt("Dịch vụ mail", "Mail Service")}
                          name="smtpProvider"
                          value={smtpFormValues.smtpProvider}
                          onChange={(event: any) => handleSmtpInputChange(event)}
                        >
                          <MenuItem value={'use_etik_smtp'}>{tt("Sử dụng ETIK SMTP", "Use ETIK SMTP")}</MenuItem>
                          <MenuItem value={'use_custom_smtp'}>{tt("Tùy chỉnh SMTP server", "Custom SMTP Server")}</MenuItem>
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
                            <InputLabel>{tt("Email gửi", "Sender Email")}</InputLabel>
                            <OutlinedInput
                              label={tt('Email gửi', 'Sender Email')}

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
                    {isSmtpLoading ? <CircularProgress size={24} /> : tt("Lưu cài đặt", "Save Settings")}
                  </Button>
                </CardActions>
              </Card>
              <Card>
                <CardHeader title={tt("Cấu hình template Email vé", "Email Ticket Template Configuration")} />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    {/* Template selection */}
                    <Grid md={12} xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>{tt("Template", "Template")}</InputLabel>
                        <Select
                          label={tt("Template", "Template")}
                          name="type"
                          value={emailTemplateFormValues.type}
                          onChange={(event: any) => handleEmailTemplateInputChange(event)}
                        >
                          <MenuItem value={'template_default'}>{tt("Template mặc định", "Default Template")}</MenuItem>
                          <MenuItem value={'template_english'}>{tt("Template English", "English Template")}</MenuItem>
                          <MenuItem value={'template_other'}>{tt("Template tùy chỉnh", "Custom Template")}</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {emailTemplateFormValues.type === 'template_other' && (
                      <>
                        <Grid md={6} xs={12}>
                          <FormControl fullWidth required>
                            <InputLabel>{tt("Tên template (Email giao dịch)", "Template Name (Transaction Email)")}</InputLabel>
                            <OutlinedInput
                              label={tt("Tên template (Email giao dịch)", "Template Name (Transaction Email)")}
                              name="templateOtherNameTransaction"
                              value={emailTemplateFormValues.templateOtherNameTransaction || ''}
                              onChange={handleEmailTemplateInputChange}
                            />
                          </FormControl>
                        </Grid>
                        <Grid md={6} xs={12}>
                          <FormControl fullWidth required>
                            <InputLabel>{tt("Tên template (Email vé)", "Template Name (Ticket Email)")}</InputLabel>
                            <OutlinedInput
                              label={tt("Tên template (Email vé)", "Template Name (Ticket Email)")}
                              name="templateOtherNameTicket"
                              value={emailTemplateFormValues.templateOtherNameTicket || ''}
                              onChange={handleEmailTemplateInputChange}
                            />
                          </FormControl>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </CardContent>
                <Divider />
                <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" color="primary" onClick={handleSaveEmailTemplateConfig} disabled={isEmailTemplateLoading}>
                    {isEmailTemplateLoading ? <CircularProgress size={24} /> : tt("Lưu cài đặt", "Save Settings")}
                  </Button>
                </CardActions>
              </Card>
              <Card>
                <CardHeader
                  title={tt("Cài đặt máy in vé", "Ticket Printer Settings")}
                  action={
                    <Button variant="contained" color="primary" onClick={handleAddPrinter}>
                      {tt("Thêm máy in", "Add Printer")}
                    </Button>
                  }
                />
                <Divider />
                <CardContent sx={{ overflow: 'auto', padding: 0, maxHeight: 600 }}>
                  <Table size="small" sx={{ width: '100%' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ padding: '8px 16px' }}>{tt("Radio", "Radio")}</TableCell>
                        <TableCell sx={{ padding: '8px 16px' }}>{tt("Tên máy in", "Printer Name")}</TableCell>
                        <TableCell sx={{ minWidth: '200px', padding: '8px 16px' }}>{tt("IP máy in", "Printer IP")}</TableCell>
                        <TableCell sx={{ padding: '8px 16px' }}>{tt("Thao tác", "Actions")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* System printer row */}
                      <TableRow key="system">
                        <TableCell sx={{ padding: '8px 16px' }}>
                          <Radio
                            checked={selectedPrinterId === null}
                            onChange={() => handlePrinterChange(null)}
                            value="system"
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ padding: '8px 16px' }}>{tt("Sử dụng máy in hệ thống", "Use System Printer")}</TableCell>
                        <TableCell sx={{ minWidth: '200px', padding: '8px 16px' }}>{tt("không có", "N/A")}</TableCell>
                        <TableCell sx={{ padding: '8px 16px' }}>
                          {/* No actions for system printer */}
                        </TableCell>
                      </TableRow>
                      {/* Printer rows */}
                      {printers.map((printer) => (
                        <TableRow key={printer.id}>
                          <TableCell sx={{ padding: '8px 16px' }}>
                            <Radio
                              checked={selectedPrinterId === printer.id}
                              onChange={() => handlePrinterChange(printer.id)}
                              value={printer.id}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ padding: '8px 16px' }}>{printer.name}</TableCell>
                          <TableCell sx={{ minWidth: '200px', padding: '8px 16px' }}>{printer.ipAddress}</TableCell>
                          <TableCell sx={{ padding: '8px 16px' }}>
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditPrinter(printer)}
                              >
                                <PencilSimple size={20} />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeletePrinter(printer.id)}
                              >
                                <Trash size={20} />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <Divider />
                <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" color="primary" onClick={handleSavePrinterSettings} disabled={isPrinterLoading}>
                    {isPrinterLoading ? <CircularProgress size={24} /> : tt("Lưu lựa chọn", "Save Selection")}
                  </Button>
                </CardActions>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
      <SendRequestEventAgencyAndEventApproval open={openEventAgencyRegistrationModal} onClose={handleOnCloseEventAgencyRegistrationModal} eventId={event_id} />
      <PrinterModal
        eventId={event_id}
        printer={editingPrinter}
        open={openPrinterModal}
        onClose={() => {
          setOpenPrinterModal(false);
          setEditingPrinter(null);
        }}
        onPrinterSaved={handlePrinterSaved}
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
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { sm: "500px", xs: "90%" },
              bgcolor: "background.paper",
              boxShadow: 24,
            }}
          >
            <CardHeader title={tt('Quy định chung', 'General Regulations')} />
            <Divider />
            <CardContent>
              <Stack spacing={1} textAlign={'justify'}>
                <Typography variant="body2">
                  <b>{tt('Để sự kiện được nâng cấp thành Sự kiện Được xác thực, Nhà tổ chức sự kiện vui lòng tuân thủ các quy định dưới đây trước khi gửi yêu cầu:', 'To upgrade the event to a Verified Event, event organizers must comply with the following regulations before submitting the request:')}</b>
                </Typography>
                <Typography variant="body2">
                  - {tt('Sự kiện có đầy đủ thông tin về tên, mô tả, đơn vị tổ chức, ảnh bìa, ảnh đại diện.', 'The event has complete information about name, description, organizer, banner image, and avatar image.')}
                </Typography>
                <Typography variant="body2">
                  - {tt('Thời gian và địa điểm rõ ràng, chính xác. Hạn chế thay đổi thông tin về thời gian, địa điểm và phải thông báo cho ETIK trước khi thay đổi.', 'Clear and accurate time and location. Limit changes to time and location information and must notify ETIK before making changes.')}
                </Typography>
                <Typography variant="body2">
                  - {tt('Chính sách Giá vé, chính sách hoàn trả, hủy vé rõ ràng, minh bạch.', 'Clear and transparent Ticket Price policy, Refund policy, and Cancellation policy.')}
                </Typography>
                <Typography variant="body2">
                  - {tt('Sự kiện tuân thủ quy định của pháp luật Việt Nam, phù hợp chuẩn mực đạo đức, thuần phong mỹ tục.', 'The event complies with Vietnamese law and conforms to ethical standards and traditional customs.')}
                </Typography>
                <Typography variant="body2">
                  - {tt('Cung cấp cho ETIK các thông tin, giấy tờ để xác minh khi được yêu cầu.', 'Provide ETIK with information and documents for verification when requested.')}
                </Typography>
                <Typography variant="body2">
                  {tt('Nếu cần hỗ trợ, Quý khách vui lòng liên hệ Hotline CSKH', 'If you need support, please contact Customer Service Hotline')} <b>0333.247.242</b> {tt('hoặc email', 'or email')} <b>tienphongsmart@gmail.com</b>
                </Typography>
              </Stack>
              <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="contained" color="primary" onClick={handleSendRequestEventApproval} disabled={isLoading}>
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
