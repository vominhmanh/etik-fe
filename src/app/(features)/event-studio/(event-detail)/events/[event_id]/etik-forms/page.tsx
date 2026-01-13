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
import CardActionArea from '@mui/material/CardActionArea';
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
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr';
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

  type Survey = {
    id: number;
    title: string;
    description: string;
  };

  const surveys: Survey[] = [
    {
      id: 1,
      title: tt('Form mua vé', 'Ticket purchase form'),
      description: tt(
        'Bảng câu hỏi khách hàng phải trả lời khi mua vé',
        'Questionnaire customers must answer when buying tickets'
      ),
    },
  ];

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

        <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
          <Stack spacing={1}>
            <Typography variant="h4">{tt('ETIK Forms', 'ETIK Forms')}</Typography>
            <Typography variant="body1">
              {tt(
                'ETIK Forms là công cụ giúp bạn tạo các form dễ dàng và hiệu quả. Bạn có thể tạo các form cho các sự kiện của mình.',
                'ETIK Forms is a tool that helps you create forms easily and efficiently. You can create forms for your events.'
              )}
            </Typography>
          </Stack>
          <Button
            component={LocalizedLink}
            startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
            variant="contained"
            href="create"
          >
            {tt('Tạo mới', 'Create new')}
          </Button>
        </Stack>
        <Grid container spacing={3}>
          {surveys.map((survey) => (
            <Grid key={survey.id} lg={4} md={6} xs={12}>
              <Card>
                <CardActionArea
                  component={LocalizedLink}
                  href={`/event-studio/events/${event_id}/etik-forms/checkout-form`}
                >
                  <CardHeader title={survey.title} subheader={survey.description} />
                  <CardActions sx={{ justifyContent: 'flex-end', width: '100%', pt: 0, pb: 2, px: 3 }}>
                    <Button
                      size="small"
                      color="primary"
                      startIcon={<Eye fontSize="var(--icon-fontSize-sm)" />}
                    >
                      {tt('Xem chi tiết', 'View details')}
                    </Button>
                  </CardActions>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>

    </>
  );
}
