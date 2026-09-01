'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { LocalizedLink } from '@/components/homepage/localized-link';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import * as React from 'react';

import {
  Box,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import { ArrowLeft, X, Plus, Pencil } from '@phosphor-icons/react/dist/ssr';
import NotificationContext from '@/contexts/notification-context';
import { useSearchParams } from 'next/navigation';

type FieldType = 'text' | 'number' | 'radio' | 'checkbox' | 'date' | 'time' | 'datetime';

// 'hidden': ẩn hoàn toàn, không dùng trường này ở đâu cả
// 'staffOnly': BTC vẫn thấy/điền được (tạo đơn thủ công), khách tự mua vé không thấy và không phải nhập
// 'public': hiển thị cho khách như bình thường, có thể bắt buộc
type VisibilityScope = 'hidden' | 'staffOnly' | 'public';

const getVisibilityScope = (visible: boolean, hiddenFromCustomer: boolean): VisibilityScope => {
  if (!visible) return 'hidden';
  if (hiddenFromCustomer) return 'staffOnly';
  return 'public';
};

interface FieldDefinition {
  id: number;
  internalName: string;
  label: string;
  type: FieldType;
  visible: boolean;
  required: boolean;
  hiddenFromCustomer: boolean;
  note: string;
  showInTransactionHistory: boolean;
  showInTicketEmail: boolean;
  locked: boolean; // không cho chỉnh sửa (4 trường đầu)
  nonDeletable: boolean; // không cho xoá (6 trường đầu)
  options?: string[]; // cho radio / checkbox
  isNew?: boolean; // Temporary flag
}

interface NewFieldState {
  internalName: string;
  label: string;
  type: FieldType;
  visible: boolean;
  required: boolean;
  hiddenFromCustomer: boolean;
  note: string;
  showInTransactionHistory: boolean;
  showInTicketEmail: boolean;
  options: string[];
}

const INITIAL_FIELDS: FieldDefinition[] = [
  {
    id: 1,
    internalName: 'title',
    label: 'Danh xưng',
    type: 'text',
    visible: true,
    required: true,
    hiddenFromCustomer: false,
    note: '',
    showInTransactionHistory: true, // luôn true, không cho edit (core field)
    showInTicketEmail: true, // luôn true, không cho edit (core field)
    locked: true,
    nonDeletable: true,
  },
  {
    id: 2,
    internalName: 'name',
    label: 'Họ tên',
    type: 'text',
    visible: true,
    required: true,
    hiddenFromCustomer: false,
    note: '',
    showInTransactionHistory: true, // luôn true, không cho edit (core field)
    showInTicketEmail: true, // luôn true, không cho edit (core field)
    locked: true,
    nonDeletable: true,
  },
  {
    id: 3,
    internalName: 'email',
    label: 'Email',
    type: 'text',
    visible: true,
    required: true,
    hiddenFromCustomer: false,
    note: '',
    showInTransactionHistory: true, // luôn true, không cho edit (core field)
    showInTicketEmail: true, // luôn true, không cho edit (core field)
    locked: true,
    nonDeletable: true,
  },
  {
    id: 4,
    internalName: 'phone_number',
    label: 'Số điện thoại',
    type: 'text',
    visible: true,
    required: true,
    hiddenFromCustomer: false,
    note: '',
    showInTransactionHistory: true, // luôn true, không cho edit (core field)
    showInTicketEmail: true, // luôn true, không cho edit (core field)
    locked: true,
    nonDeletable: true,
  },
  {
    id: 5,
    internalName: 'address',
    label: 'Địa chỉ',
    type: 'text',
    visible: false,
    required: false,
    hiddenFromCustomer: false,
    note: '',
    showInTransactionHistory: false, // mặc định false, có thể edit
    showInTicketEmail: false, // mặc định false, có thể edit
    locked: false,
    nonDeletable: true,
  },
  {
    id: 6,
    internalName: 'dob',
    label: 'Ngày sinh',
    type: 'date',
    visible: false,
    required: false,
    hiddenFromCustomer: false,
    note: '',
    showInTransactionHistory: false, // mặc định false, có thể edit
    showInTicketEmail: false, // mặc định false, có thể edit
    locked: false,
    nonDeletable: true,
  },
  {
    id: 7,
    internalName: 'idcard_number',
    label: 'Căn cước công dân',
    type: 'text',
    visible: false,
    required: false,
    hiddenFromCustomer: false,
    note: '',
    showInTransactionHistory: false, // mặc định false, có thể edit
    showInTicketEmail: false, // mặc định false, có thể edit
    locked: false,
    nonDeletable: true,
  },
];

const slugify = (text: string): string => {
  if (!text) return '';
  return text.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s]/g, '') // remove special chars except spaces
    .replace(/\s+/g, '_') // whitespaces to underscores
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = 'ETIK Forms - Form thông tin vé | ETIK - Vé điện tử & Quản lý sự kiện';
  }, []);

  const [fields, setFields] = React.useState<FieldDefinition[]>(INITIAL_FIELDS);
  const [isFieldModalOpen, setFieldModalOpen] = React.useState<boolean>(false);
  const [editingFieldId, setEditingFieldId] = React.useState<number | null>(null);
  const [newField, setNewField] = React.useState<NewFieldState>({
    internalName: '',
    label: '',
    type: 'text',
    visible: true,
    required: false,
    hiddenFromCustomer: false,
    note: '',
    showInTransactionHistory: false, // mặc định false, có thể edit
    showInTicketEmail: false, // mặc định false, có thể edit
    options: [''],
  });

  const notificationCtx = React.useContext(NotificationContext);
  const searchParams = useSearchParams();
  const backTo = searchParams.get('back_to');

  const editingField = React.useMemo(
    () => (editingFieldId != null ? fields.find((f) => f.id === editingFieldId) || null : null),
    [fields, editingFieldId]
  );

  // Load form config from backend
  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const resp = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/forms/ticket/config`
        );
        const apiFields = (resp.data.fields as any[]) || [];
        if (apiFields.length === 0) return;

        // Bắt đầu với bản sao của INITIAL_FIELDS để đảm bảo thứ tự
        const mappedBuiltin = INITIAL_FIELDS.map(builtin => {
          const apiField = apiFields.find(f => f.internalName === builtin.internalName);
          if (apiField) {
            return {
              ...builtin,
              id: apiField.id,
              label: apiField.label,
              type: apiField.fieldType,
              visible: apiField.visible,
              required: apiField.required,
              hiddenFromCustomer: apiField.hiddenFromCustomer || false,
              note: apiField.note || '',
              showInTransactionHistory: ['title', 'name', 'email', 'phone_number'].includes(builtin.internalName) ? true : (apiField.showInTransactionHistory || false),
              showInTicketEmail: ['title', 'name', 'email', 'phone_number'].includes(builtin.internalName) ? true : (apiField.showInTicketEmail || false),
              options: apiField.options && apiField.options.length > 0
                ? (apiField.options as any[]).map(opt => opt.label as string)
                : undefined,
            };
          }
          return builtin;
        });

        // Lấy các custom fields từ API
        const builtinNames = ['title', 'name', 'email', 'phone_number', 'address', 'dob', 'idcard_number'];
        const mappedCustom: FieldDefinition[] = apiFields
          .filter(f => !builtinNames.includes(f.internalName))
          .map(f => ({
            id: f.id,
            internalName: f.internalName,
            label: f.label,
            type: f.fieldType,
            visible: f.visible,
            required: f.required,
            hiddenFromCustomer: f.hiddenFromCustomer || false,
            note: f.note || '',
            showInTransactionHistory: f.showInTransactionHistory || false,
            showInTicketEmail: f.showInTicketEmail || false,
            locked: false,
            nonDeletable: false,
            options: f.options && f.options.length > 0
              ? (f.options as any[]).map(opt => opt.label as string)
              : undefined,
          }));

        setFields([...mappedBuiltin, ...mappedCustom]);
      } catch (error) {
        // nếu chưa có form trong DB thì giữ cấu hình mặc định
        console.error('Failed to load ticket form config', error);
      }
    };
    fetchConfig();
  }, [params.event_id]);

  const handleOpenAddFieldModal = () => {
    setEditingFieldId(null);
    setNewField({
      internalName: '',
      label: '',
      type: 'text',
      visible: true,
      required: false,
      hiddenFromCustomer: false,
      note: '',
      showInTransactionHistory: false, // mặc định false, có thể edit
      showInTicketEmail: false, // mặc định false, có thể edit
      options: [''],
    });
    setFieldModalOpen(true);
  };

  const handleOpenEditFieldModal = (field: FieldDefinition) => {
    setEditingFieldId(field.id);
    setNewField({
      internalName: field.internalName,
      label: field.label,
      type: field.type,
      visible: field.visible,
      required: field.required,
      hiddenFromCustomer: field.hiddenFromCustomer,
      note: field.note,
      showInTransactionHistory: field.showInTransactionHistory,
      showInTicketEmail: field.showInTicketEmail,
      options: field.options && field.options.length > 0 ? field.options : [''],
    });
    setFieldModalOpen(true);
  };

  const handleAddOption = () => {
    setNewField((prev) => ({
      ...prev,
      options: [...prev.options, ''],
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setNewField((prev) => {
      const next = [...prev.options];
      next[index] = value;
      return { ...prev, options: next };
    });
  };

  const handleRemoveOption = (index: number) => {
    setNewField((prev) => {
      if (prev.options.length <= 1) return prev; // tối thiểu 1 option
      const next = prev.options.filter((_, i) => i !== index);
      return { ...prev, options: next };
    });
  };

  const handleSaveField = () => {
    if (!newField.label.trim()) {
      // mock: không dùng notification, chỉ không làm gì nếu thiếu tên
      return;
    }

    const cleanedOptions =
      newField.type === 'radio' || newField.type === 'checkbox'
        ? newField.options.filter((opt) => opt.trim() !== '')
        : undefined;

    // Chế độ tạo mới
    if (editingFieldId == null) {
      const nextId = fields.length ? Math.max(...fields.map((f) => f.id)) + 1 : 1;
      const created: FieldDefinition = {
        id: nextId,
        internalName: '', // Backend sẽ sinh,
        label: newField.label.trim(),
        type: newField.type,
        visible: newField.visible,
        required: newField.hiddenFromCustomer ? false : newField.required,
        hiddenFromCustomer: newField.hiddenFromCustomer,
        note: newField.note,
        showInTransactionHistory: newField.showInTransactionHistory,
        showInTicketEmail: newField.visible ? newField.showInTicketEmail : false,
        locked: false,
        nonDeletable: false,
        options: cleanedOptions && cleanedOptions.length > 0 ? cleanedOptions : undefined,
        isNew: true,
      };
      setFields((prev) => [...prev, created]);
    } else {
      // Chế độ chỉnh sửa
      setFields((prev) =>
        prev.map((field) => {
          if (field.id !== editingFieldId) return field;
          const canEditLabel = !(field.locked || field.nonDeletable);
          const canEditType = !(field.locked || field.nonDeletable);
          const canEditVisibilityAndRequired = !field.locked;

          const isCoreField =
            field.internalName === 'title' ||
            field.internalName === 'name' ||
            field.internalName === 'email' ||
            field.internalName === 'phone_number';

          return {
            ...field,
            // Giữ nguyên internalName cũ, nếu là mới thì vẫn là ''
            label: canEditLabel ? newField.label.trim() : field.label,
            type: canEditType ? newField.type : field.type,
            visible: canEditVisibilityAndRequired ? newField.visible : field.visible,
            required: canEditVisibilityAndRequired
              ? (newField.hiddenFromCustomer ? false : newField.required)
              : field.required,
            hiddenFromCustomer: canEditVisibilityAndRequired ? newField.hiddenFromCustomer : field.hiddenFromCustomer,
            note: newField.note,
            showInTransactionHistory: isCoreField ? true : newField.showInTransactionHistory,
            showInTicketEmail: isCoreField ? true : (newField.visible ? newField.showInTicketEmail : false),
            options:
              (newField.type === 'radio' || newField.type === 'checkbox') &&
                cleanedOptions &&
                cleanedOptions.length > 0
                ? cleanedOptions
                : undefined,
          };
        })
      );
    }

    setFieldModalOpen(false);
  };

  const renderTypeLabel = (type: FieldType): string => {
    switch (type) {
      case 'text':
        return 'Text';
      case 'number':
        return 'Số';
      case 'radio':
        return 'Chọn một';
      case 'checkbox':
        return 'Chọn nhiều';
      case 'date':
        return 'Ngày tháng năm';
      case 'time':
        return 'Giờ';
      case 'datetime':
        return 'Ngày giờ';
      default:
        return type;
    }
  };

  const handleSaveConfigToServer = async () => {
    try {
      const payloadFields = fields.map((field, index) => {
        const internalName = field.internalName;

        const sortOrder = (index + 1) * 10;

        const options =
          (field.type === 'radio' || field.type === 'checkbox') && field.options
            ? field.options
              .filter((opt) => opt.trim() !== '')
              .map((label, optIndex) => ({
                // id bỏ trống để backend tự tạo / sync
                value: label,
                label,
                sortOrder: (optIndex + 1) * 10,
                isActive: true,
              }))
            : undefined;

        return {
          id: field.isNew ? null : field.id,
          internalName: field.isNew ? null : field.internalName,
          label: field.label,
          fieldType: field.type,
          visible: field.visible,
          required: field.hiddenFromCustomer ? false : field.required,
          hiddenFromCustomer: field.hiddenFromCustomer,
          note: field.note || null,
          showInTransactionHistory: field.showInTransactionHistory,
          showInTicketEmail: field.visible ? field.showInTicketEmail : false,
          sortOrder,
          options,
        };
      });

      await baseHttpServiceInstance.put(
        `/event-studio/events/${params.event_id}/forms/ticket/config`,
        {
          name: 'Form thông tin vé',
          description: 'Form dùng khi khách điền thông tin vé',
          fields: payloadFields,
        }
      );
      notificationCtx.success('Đã lưu cấu hình form thông tin vé');
    } catch (error: any) {
      notificationCtx.error(error);
    }
  };

  return (
    <>
      <Stack spacing={3}>
        <Stack direction="row" spacing={3} alignItems="center">
          <IconButton
            component={LocalizedLink}
            href={backTo || `/event-studio/events/${params.event_id}/etik-forms`}
            sx={{ mr: 1 }}
          >
            <ArrowLeft fontSize="var(--icon-fontSize-md)" />
          </IconButton>
          <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
            <Typography variant="h4">Form thông tin vé</Typography>
            <Typography variant="body2" color="text.secondary">
              Bảng câu hỏi khách hàng phải trả lời khi mua vé
            </Typography>
          </Stack>
        </Stack>

        <Card>
          <CardHeader title="Người mua sẽ cần nhập thông tin gì khi mua vé?" />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <Table
                sx={{
                  minWidth: 650,
                  width: '100%',
                  '& td, & th': {
                    py: 0.5,
                  },
                }}
                size="small"
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Trường thông tin/ câu hỏi</TableCell>
                    <TableCell>Định dạng</TableCell>
                    <TableCell>Phạm vi hiển thị</TableCell>
                    <TableCell>Bắt buộc</TableCell>
                    <TableCell>Ghi chú cho khách</TableCell>
                    <TableCell>Cho phép Khách xem lại</TableCell>
                    <TableCell>Hiển thị trong email vé</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {field.label}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Stack spacing={0.5}>
                          <Typography variant="body2">
                            {renderTypeLabel(field.type)}
                          </Typography>
                          {field.options && field.options.length > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              {field.options.join(', ')}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ minWidth: 160 }}>
                        {(() => {
                          const scope = getVisibilityScope(field.visible, field.hiddenFromCustomer);
                          if (scope === 'hidden') {
                            return <Chip size="small" label="Ẩn hoàn toàn" />;
                          }
                          if (scope === 'staffOnly') {
                            return <Chip size="small" color="warning" label="Chỉ BTC tự điền" />;
                          }
                          return <Chip size="small" color="success" label="Hiển thị cho khách" />;
                        })()}
                      </TableCell>
                      <TableCell sx={{ minWidth: 80 }}>
                        <Checkbox
                          checked={field.required}
                          // chỉ hiển thị, không chỉnh trong bảng
                          disabled
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                          {field.note || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 80 }}>
                        <Checkbox
                          checked={field.showInTransactionHistory}
                          disabled
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 80 }}>
                        <Checkbox
                          checked={field.showInTicketEmail}
                          disabled
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          {!field.locked && (
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenEditFieldModal(field)}
                            >
                              <Pencil />
                            </IconButton>
                          )}

                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableRow>
                    <TableCell colSpan={8}>
                      <Button
                        startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
                        onClick={handleOpenAddFieldModal}
                      >
                        Thêm trường
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </CardContent>
        </Card>
        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="contained"
            onClick={handleSaveConfigToServer}
          >
            Lưu cấu hình
          </Button>
        </Stack>
      </Stack>

      <Modal
        open={isFieldModalOpen}
        onClose={() => setFieldModalOpen(false)}
        aria-labelledby="add-field-modal-title"
        aria-describedby="add-field-modal-description"
      >
        <Container maxWidth="xl">
          <Card
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { sm: 500, xs: '90%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
            }}
          >
            <CardHeader title={editingField ? 'Chỉnh sửa trường' : 'Thêm trường mới'} />
            <Divider />
            <CardContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Tên trường"
                  multiline
                  minRows={2}
                  value={newField.label}
                  onChange={(e) =>
                    setNewField((prev) => ({ ...prev, label: e.target.value }))
                  }
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Mã định danh (internalName)"
                  value={newField.internalName || (editingFieldId ? '' : 'Sẽ được tạo tự động')}
                  disabled
                  helperText="Mã này do hệ thống tự sinh để đảm bảo tính duy nhất."
                />

                <FormControl fullWidth size="small">
                  <InputLabel id="new-field-type-label">Định dạng</InputLabel>
                  <Select
                    labelId="new-field-type-label"
                    value={newField.type}
                    label="Định dạng"
                    onChange={(e) =>
                      setNewField((prev) => ({ ...prev, type: e.target.value as FieldType }))
                    }
                    disabled={!!editingField && (editingField.locked || editingField.nonDeletable)}
                  >
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="number">Số</MenuItem>
                    <MenuItem value="radio">Chọn một</MenuItem>
                    <MenuItem value="checkbox">Chọn nhiều</MenuItem>
                    <MenuItem value="date">Ngày tháng năm</MenuItem>
                    <MenuItem value="time">Giờ</MenuItem>
                    <MenuItem value="datetime">Ngày giờ</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel id="visibility-scope-label">Phạm vi hiển thị</InputLabel>
                  <Select
                    labelId="visibility-scope-label"
                    label="Phạm vi hiển thị"
                    value={getVisibilityScope(newField.visible, newField.hiddenFromCustomer)}
                    onChange={(e) => {
                      const scope = e.target.value as VisibilityScope;
                      setNewField((prev) => {
                        if (scope === 'hidden') {
                          return {
                            ...prev,
                            visible: false,
                            hiddenFromCustomer: false,
                            required: false,
                            showInTicketEmail: false,
                          };
                        }
                        if (scope === 'staffOnly') {
                          return { ...prev, visible: true, hiddenFromCustomer: true, required: false };
                        }
                        return { ...prev, visible: true, hiddenFromCustomer: false };
                      });
                    }}
                    disabled={!!editingField && editingField.locked}
                  >
                    <MenuItem value="hidden">Ẩn hoàn toàn (không dùng trường này)</MenuItem>
                    <MenuItem value="staffOnly">Chỉ BTC tự điền (ẩn với khách khi tự mua vé)</MenuItem>
                    <MenuItem value="public">Hiển thị cho khách</MenuItem>
                  </Select>
                  {getVisibilityScope(newField.visible, newField.hiddenFromCustomer) === 'staffOnly' && (
                    <FormHelperText>
                      Trường vẫn xuất hiện khi bạn tạo/sửa đơn thủ công, nhưng sẽ không hiển thị và
                      không bắt buộc trên trang khách tự thanh toán. Bạn có thể điền thông tin này sau.
                    </FormHelperText>
                  )}
                </FormControl>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newField.required}
                      onChange={(e) =>
                        setNewField((prev) => ({ ...prev, required: e.target.checked }))
                      }
                      disabled={
                        (!!editingField && editingField.locked) ||
                        getVisibilityScope(newField.visible, newField.hiddenFromCustomer) !== 'public'
                      }
                    />
                  }
                  label="Bắt buộc"
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Ghi chú cho khách"
                  multiline
                  minRows={2}
                  value={newField.note}
                  onChange={(e) =>
                    setNewField((prev) => ({ ...prev, note: e.target.value }))
                  }
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newField.showInTransactionHistory}
                      onChange={(e) =>
                        setNewField((prev) => ({ ...prev, showInTransactionHistory: e.target.checked }))
                      }
                      disabled={!!editingField && (editingField.internalName === 'title' || editingField.internalName === 'name' || editingField.internalName === 'email' || editingField.internalName === 'phone_number')}
                    />
                  }
                  label={
                    <Stack spacing={0}>
                      <Typography variant="body2">Cho phép khách hàng xem lại trong lịch sử giao dịch</Typography>
                      <Typography variant="caption" color="text.secondary">
                        khách hàng sẽ nhìn thấy trường thông tin này ở lịch sử giao dịch
                      </Typography>
                    </Stack>
                  }
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newField.showInTicketEmail}
                      onChange={(e) =>
                        setNewField((prev) => ({ ...prev, showInTicketEmail: e.target.checked }))
                      }
                      disabled={
                        (!!editingField && (editingField.internalName === 'title' || editingField.internalName === 'name' || editingField.internalName === 'email' || editingField.internalName === 'phone_number')) ||
                        !newField.visible
                      }
                    />
                  }
                  label={
                    <Stack spacing={0}>
                      <Typography variant="body2">Hiển thị trong email vé</Typography>
                      {!newField.visible && (
                        <Typography variant="caption" color="text.secondary">
                          Trường đang ở chế độ &quot;Ẩn hoàn toàn&quot; nên không thể hiển thị trong email vé
                        </Typography>
                      )}
                    </Stack>
                  }
                />

                {(newField.type === 'radio' || newField.type === 'checkbox') && (
                  <Stack spacing={2}>
                    <Typography variant="subtitle2">
                      Tuỳ chọn ({renderTypeLabel(newField.type)})
                    </Typography>
                    {newField.options.map((opt, index) => (
                      <Stack
                        key={index}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <TextField
                          size="small"
                          fullWidth
                          placeholder={`Tuỳ chọn ${index + 1}`}
                          multiline
                          minRows={1}
                          value={opt}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                        />
                        {newField.options.length > 1 && (
                          <IconButton
                            color="primary"
                            onClick={() => handleRemoveOption(index)}
                          >
                            <X />
                          </IconButton>
                        )}
                      </Stack>
                    ))}
                    <Button
                      startIcon={<Plus fontSize="var(--icon-fontSize-sm)" />}
                      onClick={handleAddOption}
                      size="small"
                    >
                      Thêm tuỳ chọn
                    </Button>
                  </Stack>
                )}
              </Stack>
            </CardContent>
            <Divider />
            <Stack direction="row" spacing={2} justifyContent="space-between" p={2}>
              <Stack direction="row" spacing={1}>
                {editingField && !editingField.nonDeletable && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<X />}
                    onClick={() => {
                      setFields((prev) => prev.filter((f) => f.id !== editingField.id));
                      setFieldModalOpen(false);
                    }}
                  >
                    Xóa câu hỏi
                  </Button>
                )}
              </Stack>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setFieldModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSaveField}
                >
                  Lưu
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Container>
      </Modal>
    </>
  );
}
