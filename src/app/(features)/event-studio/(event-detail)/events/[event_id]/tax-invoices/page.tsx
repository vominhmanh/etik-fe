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
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
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
import { ArrowSquareIn, CheckCircle, Clipboard, Eye, Info, Storefront } from '@phosphor-icons/react/dist/ssr';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import ReactQuill from 'react-quill';

import { useTranslation } from '@/contexts/locale-context';
import NotificationContext from '@/contexts/notification-context';
import { LocalizedLink } from '@/components/homepage/localized-link';

import 'react-quill/dist/quill.snow.css';

import SendRequestEventAgencyAndEventApproval from '@/components/events/event/send-request-event-agency-and-event-approval';
import ConfirmSubmitEventApprovalModal from '@/components/events/event/confirm-submit-event-approval-modal';
import Link from 'next/link';

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
      'Hóa đơn thuế | ETIK - Vé điện tử & Quản lý sự kiện',
      'Marketplace Settings | ETIK - E-tickets & Event Management'
    );
  }, [tt]);
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [formValues, setFormValues] = useState<EventResponse | null>(null);
  const { event_id } = params;

  const [description, setDescription] = useState<string>('');

  // Mock state for Tax Invoice Config
  const [taxInvoiceUsage, setTaxInvoiceUsage] = useState<number>(1);
  const [invoiceTrigger, setInvoiceTrigger] = useState<number>(1);

  const reactQuillRef = React.useRef<ReactQuill>(null);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  const handleSuccessSendRequestEventApproval = () => {
    setEventAgencyRegistrationAndEventApprovalRequest(
      eventAgencyRegistrationAndEventApprovalRequest
        ? {
          ...eventAgencyRegistrationAndEventApprovalRequest,
          eventApprovalRequest: 'waiting_for_acceptance',
        }
        : eventAgencyRegistrationAndEventApprovalRequest
    );
  }

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


  // Handle image selection


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
                  src={event?.bannerUrl || ''}
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
                        {event?.avatarUrl ? (
                          <Box
                            component="img"
                            src={event?.avatarUrl}
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
                        <Box component={Link} href={`#generalSettings`} sx={{ textDecoration: 'none' }}>
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
                          <Box component={Link} href={`#generalSettings`} sx={{ textDecoration: 'none' }}>
                            {' '}
                            {tt('Thay đổi', 'Change')}
                          </Box>
                        </Typography>
                      ) : (
                        <Typography display="inline" variant="body2" color="text.secondary">
                          {tt('Đang hiển thị công khai', 'Publicly visible')}
                          <Box component={Link} href={`#generalSettings`} sx={{ textDecoration: 'none' }}>
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
          <Typography variant="h4">{tt('Hóa đơn thuế', 'Tax Invoice')}</Typography>
        </div>
        <Grid container spacing={3}>
          <Grid lg={8} md={6} xs={12}>
            <Stack spacing={3}>
              <Card id="taxSettings">
                <CardHeader title={tt('Cấu hình Hóa đơn', 'Tax Invoice Configuration')} />
                <Divider />
                <CardContent>
                  <Stack spacing={4}>
                    {/* Question 1 */}
                    <FormControl>
                      <FormLabel id="tax-usage-label" sx={{ color: 'text.primary', fontWeight: 600, mb: 1 }}>
                        {tt('Cách sử dụng hóa đơn thuế', 'How to use tax invoices')}
                      </FormLabel>
                      <RadioGroup
                        aria-labelledby="tax-usage-label"
                        name="tax-usage-group"
                        value={taxInvoiceUsage}
                        onChange={(e) => setTaxInvoiceUsage(Number(e.target.value))}
                      >
                        {/* Option 1 */}
                        <FormControlLabel
                          value={1}
                          control={<Radio sx={{ alignSelf: 'flex-start', mt: -0.5 }} />}
                          label={
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body1" fontWeight="500">
                                {tt('Không sử dụng hóa đơn thuế trên ETIK', 'Do not use tax invoices on ETIK')}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {tt('Tôi sẽ tự xử lý khi khách hàng có yêu cầu xuất hóa đơn', 'I will handle it manually when customers request an invoice')}
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: 'flex-start', ml: 0 }}
                        />

                        {/* Option 2 */}
                        <FormControlLabel
                          value={2}
                          control={<Radio sx={{ alignSelf: 'flex-start', mt: -0.5 }} />}
                          label={
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body1" fontWeight="500">
                                {tt('Tôi sử dụng ETIK để chuyển hóa đơn lên phần mềm HDDT', 'I use ETIK to transfer invoices to E-invoice software')}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {tt(
                                  'ETIK giúp tôi tạo hóa đơn điện tử nháp trên Viettel Sinvoice, MISA eInvoice,... Sau đó tôi sẽ tự thao tác xuất hóa đơn ở trên đó.',
                                  'ETIK helps me create draft e-invoices on Viettel Sinvoice, MISA eInvoice... Then I will manually issue invoices there.'
                                )}
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: 'flex-start', ml: 0 }}
                        />

                        {/* Option 3 */}
                        <FormControlLabel
                          value={3}
                          control={<Radio sx={{ alignSelf: 'flex-start', mt: -0.5 }} />}
                          label={
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body1" fontWeight="500">
                                {tt('Tôi sử dụng ETIK như là kênh xuất hóa đơn điện tử thông thường', 'I use ETIK as a regular e-invoice issuance channel')}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {tt(
                                  'ETIK tự động kết nối vào phần mềm HDDT và xuất HDDT dạng thông thường khi tôi thao tác trên ETIK',
                                  'ETIK automatically connects to E-invoice software and issues regular e-invoices when I take action on ETIK'
                                )}
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: 'flex-start', ml: 0 }}
                        />

                        {/* Option 4 */}
                        <FormControlLabel
                          value={4}
                          control={<Radio sx={{ alignSelf: 'flex-start', mt: -0.5 }} />}
                          label={
                            <Box>
                              <Typography variant="body1" fontWeight="500">
                                {tt(
                                  'Tôi sử dụng ETIK như là kênh xuất hóa đơn, và sử dụng ETIK như là máy tính tiền tại quầy',
                                  'I use ETIK as an invoice issuance channel, and use ETIK as a POS'
                                )}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {tt(
                                  'ETIK tự động kết nối vào phần mềm HDDT và xuất hóa đơn định dạng khởi tạo từ máy tính tiền khi tôi thao tác trên ETIK',
                                  'ETIK automatically connects to E-invoice software and issues invoices created from POS when I take action on ETIK'
                                )}
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: 'flex-start', ml: 0 }}
                        />
                      </RadioGroup>
                    </FormControl>

                    {/* Question 2 - Conditional */}
                    {(taxInvoiceUsage === 3 || taxInvoiceUsage === 4) && (
                      <FormControl>
                        <FormLabel id="invoice-trigger-label" sx={{ color: 'text.primary', fontWeight: 600, mb: 1 }}>
                          {tt('Khi nào xuất hóa đơn?', 'When to issue invoice?')}
                        </FormLabel>
                        <RadioGroup
                          aria-labelledby="invoice-trigger-label"
                          name="invoice-trigger-group"
                          value={invoiceTrigger}
                          onChange={(e) => setInvoiceTrigger(Number(e.target.value))}
                        >
                          <FormControlLabel
                            value={1}
                            control={<Radio />}
                            label={tt('Ngay khi đơn hàng xuất vé thành công', 'As soon as the order successfully issues tickets')}
                          />
                          <FormControlLabel
                            value={2}
                            control={<Radio />}
                            label={tt('Tôi nhấn nút xuất hóa đơn', 'I click the issue invoice button')}
                          />
                        </RadioGroup>
                      </FormControl>
                    )}
                  </Stack>
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
      <ConfirmSubmitEventApprovalModal
        open={openConfirmSubmitEventApprovalModal}
        onClose={() => setOpenConfirmSubmitEventApprovalModal(false)}
        eventId={event_id}
        onSuccess={handleSuccessSendRequestEventApproval}
      />
    </>
  );
}
