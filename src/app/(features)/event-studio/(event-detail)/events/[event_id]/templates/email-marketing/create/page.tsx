'use client';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  IconButton,
  FormHelperText,
} from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import * as React from 'react';
import { useCallback, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false }) as any;
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type EventResponse = {
  id: number;
  name: string;
  organizer: string;
  bannerUrl: string;
};

interface VisibleField {
  id: number;
  label: string;
  internalName?: string;
  builtinKey?: string;
}

const formats = [
  'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent', 'link', 'image', 'align'
];

export default function Page(): React.JSX.Element {
  const { tt } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const event_id = params.event_id as string;
  const notificationCtx = React.useContext(NotificationContext);

  const [event, setEvent] = useState<EventResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [formValues, setFormValues] = useState<any>({
    title: '',
    senderName: '',
    sendType: 'by_ticket' as 'by_order' | 'by_ticket',
  });
  const [description, setDescription] = useState(
    `<p style="text-align: left;"><strong style="font-size: 24px;">Chào {{ name }}!</strong></p>
<p style="text-align: left;">Cảm ơn bạn đã mua vé. Chúng tôi rất vui mừng được gửi tới bạn Lời nhắc về sự kiện tối nay.</p>
<p style="text-align: left;">Hẹn gặp lại bạn tại sự kiện!</p>`
  );
  const [visibleFields, setVisibleFields] = useState<VisibleField[]>([]);

  const reactQuillRef = React.useRef<any>(null);

  useEffect(() => {
    document.title = tt("Tạo mới email marketing | ETIK", "Create New Email Marketing | ETIK");
  }, [tt]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [eventRes, fieldsRes] = await Promise.all([
          baseHttpServiceInstance.get(`/event-studio/events/${event_id}`),
          baseHttpServiceInstance.get(`/event-studio/events/${event_id}/email-marketings/visible-fields`)
        ]);

        setEvent(eventRes.data);
        setFormValues((prev: any) => ({ ...prev, senderName: eventRes.data.organizer }));
        setVisibleFields(fieldsRes.data?.fields || []);
      } catch (error) {
        notificationCtx.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (event_id) {
      fetchData();
    }
  }, [event_id]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setFormValues((prev: any) => ({ ...prev, description: value }));
  };

  const handleFormSubmit = async () => {
    if (!formValues.title || !formValues.senderName || !formValues.sendType) {
      notificationCtx.error(tt('Vui lòng điền đầy đủ thông tin tiêu đề, tên người gửi và loại gửi.', 'Please fill in all details: title, sender name, and send type.'));
      return;
    }

    if (!description || description === '<p><br></p>') {
      notificationCtx.error(tt('Vui lòng nhập nội dung email.', 'Please enter email content.'));
      return;
    }

    const { valid, error } = validateDescriptionPlaceholders(description);
    if (!valid) {
      notificationCtx.error(error);
      return;
    }

    try {
      setIsLoading(true);
      await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/email-marketings`,
        { ...formValues, description }
      );
      notificationCtx.success(tt('Tạo thành công.', 'Created successfully.'));
      router.push(`/event-studio/events/${event_id}/templates/email-marketing`);
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          setIsLoading(true);
          const presignedResponse = await baseHttpServiceInstance.post('/common/s3/generate_presigned_url', {
            filename: file.name,
            content_type: file.type,
          });
          const { presignedUrl, fileUrl } = presignedResponse.data;

          await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });

          const quill = reactQuillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection();
            if (range) {
              quill.insertEmbed(range.index, 'image', fileUrl);
            } else {
              quill.insertEmbed(quill.getLength(), 'image', fileUrl);
            }
          }
        } catch (error) {
          notificationCtx.error(error);
        } finally {
          setIsLoading(false);
        }
      }
    };
  }, []);

  const handlePaste = useCallback(async (event: any) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          try {
            setIsLoading(true);
            const presignedResponse = await baseHttpServiceInstance.post('/common/s3/generate_presigned_url', {
              filename: file.name || 'pasted_image.png',
              content_type: file.type,
            });
            const { presignedUrl, fileUrl } = presignedResponse.data;

            await fetch(presignedUrl, {
              method: 'PUT',
              body: file,
              headers: {
                'Content-Type': file.type,
              },
            });

            const quill = reactQuillRef.current?.getEditor();
            if (quill) {
              const range = quill.getSelection();
              if (range) {
                quill.insertEmbed(range.index, 'image', fileUrl);
              } else {
                quill.insertEmbed(quill.getLength(), 'image', fileUrl);
              }
            }
          } catch (error) {
            notificationCtx.error(error);
          } finally {
            setIsLoading(false);
          }
        }
      }
    }
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: { image: handleImageUpload }
    },
    clipboard: {
      matchVisual: false,
    },
  }), [handleImageUpload]);

  const validateDescriptionPlaceholders = (content: string) => {
    const placeholders = content.match(/\{\{\s*(.*?)\s*\}\}/g) || [];
    for (const p of placeholders) {
      const inner = p.replace(/\{\{\s*|\s*\}\}/g, '');
      if (inner.includes(' ')) {
        return { valid: false, error: tt(`Placeholder "${p}" không hợp lệ: Không được chứa khoảng trắng ở giữa.`, `Placeholder "${p}" is invalid: Cannot contain spaces.`) };
      }
      if (/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(inner)) {
        return { valid: false, error: tt(`Placeholder "${p}" không hợp lệ: Không được dùng tiếng Việt có dấu.`, `Placeholder "${p}" is invalid: Cannot use Vietnamese diacritics.`) };
      }
      if (!/^[a-zA-Z0-9_.]*$/.test(inner)) {
        return { valid: false, error: tt(`Placeholder "${p}" không hợp lệ: Chỉ được dùng chữ cái không dấu, số, gạch dưới và dấu chấm.`, `Placeholder "${p}" is invalid: Only alphanumeric characters, underscores, and dots are allowed.`) };
      }
    }
    return { valid: true, error: '' };
  };

  useEffect(() => {
    const quill = reactQuillRef.current?.getEditor();
    if (quill) {
      quill.root.addEventListener('paste', handlePaste);
    }
    return () => {
      quill?.root.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const layout = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial; background-color: #EDF0F2; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <div class="container">
          ${event?.bannerUrl ? `<img src="${event.bannerUrl}" />` : ''}
          <div style="margin-top: 20px;">${description}</div>
        </div>
      </body>
      </html>
    `;
  }, [description, event?.bannerUrl]);

  const orderPlaceholders = [
    { key: '{{ name }}', label: tt('Họ tên', 'Full Name') },
    { key: '{{ email }}', label: tt('Email', 'Email') },
    { key: '{{ phone_number }}', label: tt('Số điện thoại', 'Phone Number') },
    { key: '{{ title }}', label: tt('Danh xưng', 'Title') },
    { key: '{{ dob }}', label: tt('Ngày sinh', 'Date of Birth') },
    { key: '{{ address }}', label: tt('Địa chỉ', 'Address') },
    { key: '{{ idcard_number }}', label: tt('CMND/CCCD', 'ID Card Number') },
  ];

  const commonPlaceholders = [
    { key: '{{ event_id }}', label: tt('ID sự kiện', 'Event ID') },
    { key: '{{ transaction_id }}', label: tt('ID đơn hàng', 'Transaction ID') },
    { key: '{{ response_token }}', label: tt('Token xác thực', 'Auth Token') },
  ];

  const ticketPlaceholders = [
    { key: '{{ ticket_holder_name }}', label: tt('Họ tên người giữ vé', 'Ticket Holder Name') },
    { key: '{{ ticket_holder_title }}', label: tt('Danh xưng người giữ vé', 'Ticket Holder Title') },
    { key: '{{ ticket_holder_email }}', label: tt('Email người giữ vé', 'Ticket Holder Email') },
    { key: '{{ ticket_holder_phone }}', label: tt('SĐT người giữ vé', 'Ticket Holder Phone') },
    { key: '{{ ticket_category_name }}', label: tt('Tên hạng vé', 'Ticket Category Name') },
    { key: '{{ audience_name }}', label: tt('Tên nhóm khán giả', 'Audience Name') },
    { key: '{{ show_name }}', label: tt('Tên suất diễn', 'Show Name') },
    { key: '{{ row_label }}', label: tt('Hàng ghế', 'Row Label') },
    { key: '{{ seat_number }}', label: tt('Số ghế', 'Seat Number') },
    { key: '{{ ticket_e_code }}', label: tt('Mã vé (E-code)', 'Ticket E-code') },
  ];

  const customFieldsPlaceholders = useMemo(() => {
    return visibleFields
      .filter(f => {
        const internalName = f.internalName;
        return ![
          'name', 'email', 'phone_number', 'dob', 'address', 'idcard_number', 'title',
          'show_name', 'ticket_category_name', 'audience_name', 'ticket_e_code'
        ].includes(internalName || '');
      })
      .map(f => ({
        key: `{{ form_${f.internalName} }}`,
        label: f.label
      }));
  }, [visibleFields]);

  return (
    <Stack spacing={3}>
      <Backdrop open={isLoading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton component={Link} href={`/event-studio/events/${event_id}/templates/email-marketing`}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">{tt("Tạo mới Email Marketing", "Create New Email Marketing")}</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title={tt("Cấu hình", "Configuration")} />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>{tt("Tiêu đề email", "Email Title")}</InputLabel>
                      <OutlinedInput
                        name="title"
                        value={formValues.title}
                        onChange={handleInputChange}
                        label={tt("Tiêu đề email", "Email Title")}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>{tt("Tên người gửi", "Sender Name")}</InputLabel>
                      <OutlinedInput
                        name="senderName"
                        value={formValues.senderName}
                        onChange={handleInputChange}
                        label={tt("Tên người gửi", "Sender Name")}
                        disabled
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>{tt("Loại gửi", "Send Type")}</InputLabel>
                      <Select
                        name="sendType"
                        value={formValues.sendType}
                        onChange={handleInputChange}
                        label={tt("Loại gửi", "Send Type")}
                      >
                        <MenuItem value="by_order">{tt("Gửi theo đơn hàng", "Send by Order")}</MenuItem>
                        <MenuItem value="by_ticket">{tt("Gửi theo từng vé", "Send by Ticket")}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title={tt("Nội dung", "Content")} />
              <Divider />
              <CardContent>
                <ReactQuill
                  ref={reactQuillRef}
                  value={description}
                  onChange={handleDescriptionChange}
                  modules={modules}
                  formats={formats}
                  style={{ height: '400px', marginBottom: '20px' }}
                />
                <FormHelperText error sx={{ mt: 5 }}>
                  {tt(
                    '* Lưu ý: Các placeholder {{ ... }} không được chứa dấu tiếng Việt và không được có khoảng trắng ở giữa.',
                    '* Note: Placeholders {{ ... }} must not contain Vietnamese diacritics and must not have spaces.'
                  )}
                </FormHelperText>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title={tt("Xem trước", "Preview")} />
              <Divider />
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  {tt("Tiêu đề:", "Subject:")} {formValues.title}
                </Typography>
                <iframe
                  srcDoc={layout}
                  style={{ width: '100%', height: '400px', border: '1px solid #ddd' }}
                  title="Preview"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader title={tt("Placeholders có thể sử dụng", "Available Placeholders")} />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="primary">{tt("Thông tin người mua:", "Buyer Info:")}</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          {orderPlaceholders.map(p => (
                            <TableRow key={p.key}>
                              <TableCell><code>{p.key}</code></TableCell>
                              <TableCell>{p.label}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">{tt("Thông tin chung:", "Common Info:")}</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          {commonPlaceholders.map(p => (
                            <TableRow key={p.key}>
                              <TableCell><code>{p.key}</code></TableCell>
                              <TableCell>{p.label}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  {formValues.sendType === 'by_ticket' && (
                    <Box>
                      <Typography variant="subtitle2" color="secondary">{tt("Thông tin vé:", "Ticket Info:")}</Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableBody>
                            {ticketPlaceholders.map(p => (
                              <TableRow key={p.key}>
                                <TableCell><code>{p.key}</code></TableCell>
                                <TableCell>{p.label}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}

                  {customFieldsPlaceholders.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="success.main">{tt("Thông tin từ form:", "Form Fields:")}</Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableBody>
                            {customFieldsPlaceholders.map(p => (
                              <TableRow key={p.key}>
                                <TableCell><code>{p.key}</code></TableCell>
                                <TableCell>{p.label}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Button variant="contained" size="large" fullWidth onClick={handleFormSubmit}>
              {tt("Tạo", "Create")}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
