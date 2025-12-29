'use client';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Avatar, Box, CardMedia, Checkbox, Container, FormControlLabel, FormGroup, FormHelperText, IconButton, InputAdornment, MenuItem, Modal, Radio, Select, Stack, TableBody, Table, TextField, TableHead, TableCell, TableRow, Switch } from '@mui/material';
import { Gift, PencilSimple, Trash } from '@phosphor-icons/react/dist/ssr';
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
import { LocalizedLink } from '@/components/homepage/localized-link';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
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


export interface CheckInFaceConfig {
  useCheckInFace: boolean;
}
export interface TicketTransferConfig {
  allowTicketTransfer: boolean;
}

export interface OrderFlowConfig {
  id: number;
  name: string;
  isDefault: boolean;
  conditionTicketCategoryIds: number[];
  approvalMethod: string;
  issuingMethod: string;
  sendPaymentInstruction: boolean;
  adminSendPaymentInstruction: boolean; // Note: schema says adminSendPaymentInstruction is in base, check consistency. Yes it is.
  emailMethod: string;
  zaloMethod: string;
  adminApprovalMethod: string;
  adminIssuingMethod: string;
  adminEmailMethod: string;
  adminZaloMethod: string;
}

export interface TransactionFlowsConfigResponse {
  useEmailMethod: boolean;
  useZaloMethod: boolean;
  flows: OrderFlowConfig[];
}

export interface TransactionFlowsConfigUpdate {
  useEmailMethod: boolean;
  useZaloMethod: boolean;
  flows: OrderFlowConfig[];
}

export interface TicketCategoryResponse {
  id: number;
  name: string;
  showName?: string;
}

export interface ShowWithTicketCategoryResponse {
  id: number;
  name: string;
  ticketCategories: TicketCategoryResponse[];
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
  const [isTicketTransferLoading, setIsTicketTransferLoading] = useState<boolean>(false);
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


  const [checkInFaceConfig, setCheckInFaceConfig] = useState<CheckInFaceConfig>({
    useCheckInFace: false,
  });
  const [ticketTransferConfig, setTicketTransferConfig] = useState<TicketTransferConfig>({
    allowTicketTransfer: true,
  });

  const [printers, setPrinters] = useState<TicketTagPrinter[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState<number | null>(null);
  const [isPrinterLoading, setIsPrinterLoading] = useState<boolean>(false);
  const [openPrinterModal, setOpenPrinterModal] = useState<boolean>(false);
  const [editingPrinter, setEditingPrinter] = useState<TicketTagPrinter | null>(null);

  const [orderFlows, setOrderFlows] = useState<OrderFlowConfig[]>([]);
  // sendTicketMethods state is still needed for UI toggles, but now it's part of the transaction flow config
  // We can keep it or merge it. Let's keep it but simplified.
  const [globalFlowConfig, setGlobalFlowConfig] = useState<{ useEmailMethod: boolean; useZaloMethod: boolean }>({
    useEmailMethod: false,
    useZaloMethod: false,
  });

  const [allTicketCategories, setAllTicketCategories] = useState<TicketCategoryResponse[]>([]);
  const [isOrderFlowLoading, setIsOrderFlowLoading] = useState<boolean>(false);
  const [isTicketCategoriesLoading, setIsTicketCategoriesLoading] = useState<boolean>(false);
  const [openTicketSelectModal, setOpenTicketSelectModal] = useState<boolean>(false);
  const [activeFlowId, setActiveFlowId] = useState<number | null>(null);


  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [smtpRes, emailTplRes, sendMethodsRes, faceCfgRes, transferCfgRes, eventRes] = await Promise.allSettled([
          getSMTPSettings(params.event_id),
          getEmailTemplateSettings(params.event_id),
          getTransactionFlowsConfig(params.event_id),
          getCheckInFaceConfig(params.event_id),
          getTicketTransferConfig(params.event_id),
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
          setGlobalFlowConfig({
            useEmailMethod: sendMethodsRes.value.useEmailMethod,
            useZaloMethod: sendMethodsRes.value.useZaloMethod,
          });
          setOrderFlows(sendMethodsRes.value.flows);
        } else if (sendMethodsRes.status === 'rejected') {
          notificationCtx.warning(tt('Không tải được cấu hình luồng đơn hàng', 'Failed to load transaction flow configuration'));
        }

        if (faceCfgRes.status === 'fulfilled' && faceCfgRes.value) {
          setCheckInFaceConfig(faceCfgRes.value);
        } else if (faceCfgRes.status === 'rejected') {
          notificationCtx.warning(tt('Không tải được cài đặt Check-in bằng khuôn mặt', 'Failed to load face check-in settings'));
        }

        if (transferCfgRes.status === 'fulfilled' && transferCfgRes.value) {
          setTicketTransferConfig(transferCfgRes.value);
        } else if (transferCfgRes.status === 'rejected') {
          notificationCtx.warning(tt('Không tải được cài đặt chuyển nhượng vé', 'Failed to load ticket transfer settings'));
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
    fetchTicketCategories();
  }, [params.event_id]);

  const fetchTicketCategories = async () => {
    try {
      setIsTicketCategoriesLoading(true);
      const response: AxiosResponse<ShowWithTicketCategoryResponse[]> = await baseHttpServiceInstance.get(
        `/event-studio/events/${params.event_id}/shows-ticket-categories/get-shows-with-ticket-categories`
      );
      const allCategories: TicketCategoryResponse[] = [];
      response.data.forEach(show => {
        show.ticketCategories.forEach(cat => {
          allCategories.push({ ...cat, showName: show.name });
        });
      });
      setAllTicketCategories(allCategories);
    } catch (error) {
      console.error('Failed to fetch ticket categories', error);
    } finally {
      setIsTicketCategoriesLoading(false);
    }
  };

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

  const handleSendTicketMethodsChange = (name: 'useEmailMethod' | 'useZaloMethod', checked: boolean) => {
    setGlobalFlowConfig((prev) => ({
      ...prev,
      [name]: checked,
    }));
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

  async function getTransactionFlowsConfig(eventId: number): Promise<TransactionFlowsConfigResponse | null> {
    try {
      const response: AxiosResponse<TransactionFlowsConfigResponse> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/transaction-flows-config`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async function saveTransactionFlowsConfig(eventId: number, payload: TransactionFlowsConfigUpdate): Promise<void> {
    try {
      await baseHttpServiceInstance.put(`/event-studio/events/${eventId}/transaction-flows-config`, payload);
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

  async function getTicketTransferConfig(eventId: number): Promise<TicketTransferConfig | null> {
    try {
      const response: AxiosResponse<TicketTransferConfig> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/ticket-transfer-settings`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async function saveTicketTransferConfig(eventId: number, config: TicketTransferConfig): Promise<void> {
    try {
      await baseHttpServiceInstance.post(`/event-studio/events/${eventId}/ticket-transfer-settings`, config);
    } catch (error) {
      throw error;
    }
  }

  const handleTicketTransferChange = (_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setTicketTransferConfig((prev) => ({ ...prev, allowTicketTransfer: checked }));
  };

  const handleSaveTicketTransferConfig = async () => {
    try {
      setIsTicketTransferLoading(true);
      await saveTicketTransferConfig(event_id, ticketTransferConfig);
      notificationCtx.success(tt('Cập nhật thành công', 'Updated successfully'));
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsTicketTransferLoading(false);
    }
  };

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



  const handleOrderFlowInputChange = (flowId: number, event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    setOrderFlows((prev) =>
      prev.map((flow) =>
        flow.id === flowId ? { ...flow, [event.target.name as string]: event.target.value } : flow
      )
    );
  };

  const handleOrderFlowCheckboxChange = (flowId: number, name: string, checked: boolean) => {
    setOrderFlows((prev) =>
      prev.map((flow) =>
        flow.id === flowId ? { ...flow, [name]: checked } : flow
      )
    );
  };

  const handleAddFlow = () => {
    const newFlow: OrderFlowConfig = {
      id: Date.now(), // Temporary ID using number type

      name: tt('Luồng mới', 'New Flow'),
      isDefault: false,
      conditionTicketCategoryIds: [],
      approvalMethod: 'auto',
      issuingMethod: 'auto',
      sendPaymentInstruction: true,
      adminSendPaymentInstruction: true,
      emailMethod: 'auto',
      zaloMethod: 'auto',
      adminApprovalMethod: 'auto',
      adminIssuingMethod: 'auto',
      adminEmailMethod: 'auto',
      adminZaloMethod: 'auto',
    };
    setOrderFlows((prev) => [...prev, newFlow]);
  };

  const handleRemoveFlow = (id: number) => {
    setOrderFlows((prev) => prev.filter((flow) => flow.id !== id));
  };

  const handleOpenTicketSelect = (flowId: number) => {
    setActiveFlowId(flowId);
    setOpenTicketSelectModal(true);
  };

  const handleToggleTicketInFlow = (categoryId: number) => {
    if (!activeFlowId) return;
    setOrderFlows((prev) =>
      prev.map((flow) => {
        if (flow.id === activeFlowId) {
          const isSelected = flow.conditionTicketCategoryIds.includes(categoryId);
          const newIds = isSelected
            ? flow.conditionTicketCategoryIds.filter((id) => id !== categoryId)
            : [...flow.conditionTicketCategoryIds, categoryId];
          return { ...flow, conditionTicketCategoryIds: newIds };
        }
        return flow;
      })
    );
  };

  const handleSaveOrderFlowSettings = async () => {
    try {
      setIsOrderFlowLoading(true);
      await saveTransactionFlowsConfig(event_id, {
        useEmailMethod: globalFlowConfig.useEmailMethod,
        useZaloMethod: globalFlowConfig.useZaloMethod,
        flows: orderFlows,
      });
      notificationCtx.success(tt("Cấu hình luồng đơn hàng đã được lưu thành công!", "Order flow configuration has been saved successfully!"));
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsOrderFlowLoading(false);
    }
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
              <Card>
                <CardHeader title={tt("Chuyển nhượng vé", "Ticket Transfer")} />
                <Divider />
                <CardContent>
                  <Grid container spacing={6} wrap="wrap">
                    <Grid md={12} sm={12} xs={12}>
                      <Stack spacing={1}>
                        <FormGroup>
                          <FormControlLabel
                            control={<Checkbox checked={ticketTransferConfig.allowTicketTransfer}
                              onChange={handleTicketTransferChange} />}
                            label={tt("Cho phép người mua tặng / sang nhượng vé", "Allow customers to gift / transfer tickets")}
                          />
                          <FormHelperText>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {tt("Khi bật, khách hàng có thể chuyển nhượng vé cho người khác", "When enabled, customers can transfer tickets to others")}
                            </Typography>
                          </FormHelperText>
                        </FormGroup>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
                <Divider />
                <CardActions sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" color="primary" onClick={handleSaveTicketTransferConfig} startIcon={<Gift />} disabled={isTicketTransferLoading}>
                    {isTicketTransferLoading ? <CircularProgress size={24} /> : tt("Lưu cài đặt", "Save Settings")}
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
          <Grid lg={12} md={12} xs={12}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">{tt("Luồng đơn hàng", "Order Flows")}</Typography>
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" color="primary" onClick={handleSaveOrderFlowSettings} disabled={isOrderFlowLoading}>
                    {isOrderFlowLoading ? <CircularProgress size={24} /> : tt("Lưu tất cả", "Save All")}
                  </Button>
                  <Button variant="outlined" onClick={handleAddFlow} startIcon={<PencilSimple />}>
                    {tt("Thêm luồng mới", "Add new flow")}
                  </Button>
                </Stack>
              </Box>

              {orderFlows.map((flow) => (
                <Card key={flow.id}>
                  <CardHeader
                    title={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1">
                          {flow.isDefault ? tt("Luồng mặc định", "Default Flow") : tt("Luồng tùy chỉnh", "Custom Flow")}
                        </Typography>
                        {!flow.isDefault && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1, fontWeight: 'normal' }}>
                            • {tt("Khi đơn hàng có các hạng mục vé:", "When order contains ticket categories:")} {flow.conditionTicketCategoryIds.length > 0
                              ? allTicketCategories
                                .filter(cat => flow.conditionTicketCategoryIds.includes(cat.id))
                                .map(cat => `${cat.showName} - ${cat.name}`)
                                .join(', ')
                              : tt("Chưa chọn hạng vé", "No ticket selected")}
                          </Typography>
                        )}
                      </Stack>
                    }
                    action={
                      <Stack direction="row" spacing={1}>
                        {!flow.isDefault && (
                          <IconButton size="small" onClick={() => handleOpenTicketSelect(flow.id)}>
                            <PencilSimple size={18} />
                          </IconButton>
                        )}
                        {!flow.isDefault && (
                          <IconButton size="small" color="error" onClick={() => handleRemoveFlow(flow.id)}>
                            <Trash size={18} />
                          </IconButton>
                        )}
                      </Stack>
                    }
                  />
                  <Divider />
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table size="small" sx={{ minWidth: 800 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ minWidth: 100 }}>{tt("Đối tượng", "Target")}</TableCell>
                            <TableCell sx={{ minWidth: 80 }}>{tt("1. Tạo đơn", "1. Create")}</TableCell>
                            <TableCell sx={{ minWidth: 120 }}>{tt("2. Duyệt đơn", "2. Approve")}</TableCell>
                            <TableCell sx={{ minWidth: 150 }}>{tt("3. Thanh toán", "3. Payment")}</TableCell>
                            <TableCell sx={{ minWidth: 120 }}>{tt("4. Xuất vé", "4. Issue")}</TableCell>
                            <TableCell sx={{ minWidth: 120 }}>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Switch
                                  size="small"
                                  checked={globalFlowConfig.useEmailMethod}
                                  onChange={(_e, checked) => handleSendTicketMethodsChange('useEmailMethod', checked)}
                                />
                                <span>{tt("5A. Email", "5A. Email")}</span>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ minWidth: 120 }}>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Switch
                                  size="small"
                                  checked={globalFlowConfig.useZaloMethod}
                                  onChange={(_e, checked) => handleSendTicketMethodsChange('useZaloMethod', checked)}
                                />
                                <span>{tt("5B. Zalo", "5B. Zalo")}</span>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{tt("Khách", "Customer")}</Typography>
                              <Typography variant="caption" color="text.secondary">{tt("Tự tạo", "Self")}</Typography>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                name="approvalMethod"
                                value={flow.approvalMethod}
                                onChange={(e: any) => handleOrderFlowInputChange(flow.id, e)}
                                sx={{ width: 'fit-content', minWidth: 110 }}
                              >
                                <MenuItem value="auto">{tt("Tự động", "Auto")}</MenuItem>
                                <MenuItem value="manual">{tt("Thủ công", "Manual")}</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <FormGroup>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={flow.sendPaymentInstruction}
                                      onChange={(e) => handleOrderFlowCheckboxChange(flow.id, 'sendPaymentInstruction', e.target.checked)}
                                    />
                                  }
                                  label={
                                    <Typography variant="caption" color="text.secondary">
                                      {tt("Gửi hướng dẫn qua email", "Send inst. via email")}
                                    </Typography>
                                  }
                                />
                              </FormGroup>
                            </TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                name="issuingMethod"
                                value={flow.issuingMethod}
                                onChange={(e: any) => handleOrderFlowInputChange(flow.id, e)}
                                sx={{ width: 'fit-content', minWidth: 110 }}
                              >
                                <MenuItem value="auto">{tt("Tự động", "Auto")}</MenuItem>
                                <MenuItem value="manual">{tt("Thủ công", "Manual")}</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                name="emailMethod"
                                value={flow.emailMethod}
                                onChange={(e: any) => handleOrderFlowInputChange(flow.id, e)}
                                sx={{ width: 'fit-content', minWidth: 110 }}
                                disabled={!globalFlowConfig.useEmailMethod}
                              >
                                <MenuItem value="auto">{tt("Tự động", "Auto")}</MenuItem>
                                <MenuItem value="manual">{tt("Thủ công", "Manual")}</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                name="zaloMethod"
                                value={flow.zaloMethod}
                                onChange={(e: any) => handleOrderFlowInputChange(flow.id, e)}
                                sx={{ width: 'fit-content', minWidth: 110 }}
                                disabled={!globalFlowConfig.useZaloMethod}
                              >
                                <MenuItem value="auto">{tt("Tự động", "Auto")}</MenuItem>
                                <MenuItem value="manual">{tt("Thủ công", "Manual")}</MenuItem>
                              </Select>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{tt("Quản trị viên", "Admin")}</Typography>
                              <Typography variant="caption" color="text.secondary">{tt("Tạo hộ", "For cust")}</Typography>
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                name="adminApprovalMethod"
                                value={flow.adminApprovalMethod}
                                onChange={(e: any) => handleOrderFlowInputChange(flow.id, e)}
                                sx={{ width: 'fit-content', minWidth: 110 }}
                              >
                                <MenuItem value="auto">{tt("Tự động", "Auto")}</MenuItem>
                                <MenuItem value="manual">{tt("Thủ công", "Manual")}</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <FormGroup>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={flow.adminSendPaymentInstruction}
                                      onChange={(e) => handleOrderFlowCheckboxChange(flow.id, 'adminSendPaymentInstruction', e.target.checked)}
                                    />
                                  }
                                  label={
                                    <Typography variant="caption" color="text.secondary">
                                      {tt("Gửi hướng dẫn qua email", "Send inst. via email")}                                    </Typography>
                                  }
                                />
                              </FormGroup>
                            </TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                name="adminIssuingMethod"
                                value={flow.adminIssuingMethod}
                                onChange={(e: any) => handleOrderFlowInputChange(flow.id, e)}
                                sx={{ width: 'fit-content', minWidth: 110 }}
                              >
                                <MenuItem value="auto">{tt("Tự động", "Auto")}</MenuItem>
                                <MenuItem value="manual">{tt("Thủ công", "Manual")}</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                name="adminEmailMethod"
                                value={flow.adminEmailMethod}
                                onChange={(e: any) => handleOrderFlowInputChange(flow.id, e)}
                                sx={{ width: 'fit-content', minWidth: 110 }}
                                disabled={!globalFlowConfig.useEmailMethod}
                              >
                                <MenuItem value="auto">{tt("Tự động", "Auto")}</MenuItem>
                                <MenuItem value="manual">{tt("Thủ công", "Manual")}</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                name="adminZaloMethod"
                                value={flow.adminZaloMethod}
                                onChange={(e: any) => handleOrderFlowInputChange(flow.id, e)}
                                sx={{ width: 'fit-content', minWidth: 110 }}
                                disabled={!globalFlowConfig.useZaloMethod}
                              >
                                <MenuItem value="auto">{tt("Tự động", "Auto")}</MenuItem>
                                <MenuItem value="manual">{tt("Thủ công", "Manual")}</MenuItem>
                              </Select>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button variant="contained" color="primary" size="large" onClick={handleSaveOrderFlowSettings} disabled={isOrderFlowLoading}>
                  {isOrderFlowLoading ? <CircularProgress size={24} /> : tt("Lưu tất cả cài đặt luồng", "Save All Flow Settings")}
                </Button>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
      <Modal
        open={openTicketSelectModal}
        onClose={() => setOpenTicketSelectModal(false)}
      >
        <Container maxWidth="sm">
          <Card sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: '100%',
            bgcolor: "background.paper",
            boxShadow: 24,
          }}>
            <CardHeader title={tt("Chọn hạng vé áp dụng", "Select Applicable Ticket Categories")} />
            <Divider />
            <CardContent>
              <FormGroup>
                {allTicketCategories.map((cat) => (
                  <FormControlLabel
                    key={cat.id}
                    control={
                      <Checkbox
                        checked={orderFlows.find(f => f.id === activeFlowId)?.conditionTicketCategoryIds.includes(cat.id) || false}
                        onChange={() => handleToggleTicketInFlow(cat.id)}
                      />
                    }
                    label={`${cat.showName} - ${cat.name}`}
                  />
                ))}
                {allTicketCategories.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {tt("Không tìm thấy hạng vé nào.", "No ticket categories found.")}
                  </Typography>
                )}
              </FormGroup>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={() => setOpenTicketSelectModal(false)}>
                  {tt("Xong", "Done")}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Modal>
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
