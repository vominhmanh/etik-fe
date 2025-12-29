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
  Container,
  Divider,
  FormControl,
  FormControlLabel,
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

interface FieldDefinition {
  id: number;
  kind: 'builtin_core' | 'builtin_optional' | 'custom';
  builtinKey: string | null;
  name: string;
  label: string;
  type: FieldType;
  visible: boolean;
  required: boolean;
  note: string;
  showInTransactionHistory: boolean;
  showInTicketEmail: boolean;
  locked: boolean; // không cho chỉnh sửa (4 trường đầu)
  nonDeletable: boolean; // không cho xoá (6 trường đầu)
  options?: string[]; // cho radio / checkbox
}

interface NewFieldState {
  label: string;
  type: FieldType;
  visible: boolean;
  required: boolean;
  note: string;
  showInTransactionHistory: boolean;
  showInTicketEmail: boolean;
  options: string[];
}

const INITIAL_FIELDS: FieldDefinition[] = [
  {
    id: 1,
    kind: 'builtin_core',
    builtinKey: 'title',
    name: 'title',
    label: 'Danh xưng',
    type: 'text',
    visible: true,
    required: true,
    note: '',
    showInTransactionHistory: true, // luôn true, không cho edit (core field)
    showInTicketEmail: true, // luôn true, không cho edit (core field)
    locked: true,
    nonDeletable: true,
  },
  {
    id: 2,
    kind: 'builtin_core',
    builtinKey: 'name',
    name: 'name',
    label: 'Họ tên',
    type: 'text',
    visible: true,
    required: true,
    note: '',
    showInTransactionHistory: true, // luôn true, không cho edit (core field)
    showInTicketEmail: true, // luôn true, không cho edit (core field)
    locked: true,
    nonDeletable: true,
  },
  {
    id: 3,
    kind: 'builtin_core',
    builtinKey: 'email',
    name: 'email',
    label: 'Email',
    type: 'text',
    visible: true,
    required: true,
    note: '',
    showInTransactionHistory: true, // luôn true, không cho edit (core field)
    showInTicketEmail: true, // luôn true, không cho edit (core field)
    locked: true,
    nonDeletable: true,
  },
  {
    id: 4,
    kind: 'builtin_core',
    builtinKey: 'phone_number',
    name: 'phone_number',
    label: 'Số điện thoại',
    type: 'text',
    visible: true,
    required: true,
    note: '',
    showInTransactionHistory: true, // luôn true, không cho edit (core field)
    showInTicketEmail: true, // luôn true, không cho edit (core field)
    locked: true,
    nonDeletable: true,
  },
  {
    id: 5,
    kind: 'builtin_optional',
    builtinKey: 'address',
    name: 'address',
    label: 'Địa chỉ',
    type: 'text',
    visible: false,
    required: false,
    note: '',
    showInTransactionHistory: false, // mặc định false, có thể edit
    showInTicketEmail: false, // mặc định false, có thể edit
    locked: false,
    nonDeletable: true,
  },
  {
    id: 6,
    kind: 'builtin_optional',
    builtinKey: 'dob',
    name: 'dob',
    label: 'Ngày sinh',
    type: 'date',
    visible: false,
    required: false,
    note: '',
    showInTransactionHistory: false, // mặc định false, có thể edit
    showInTicketEmail: false, // mặc định false, có thể edit
    locked: false,
    nonDeletable: true,
  },
  {
    id: 7,
    kind: 'builtin_optional',
    builtinKey: 'idcard_number',
    name: 'idcard_number',
    label: 'Căn cước công dân',
    type: 'text',
    visible: false,
    required: false,
    note: '',
    showInTransactionHistory: false, // mặc định false, có thể edit
    showInTicketEmail: false, // mặc định false, có thể edit
    locked: false,
    nonDeletable: true,
  },
];

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = 'ETIK Forms - Form mua vé | ETIK - Vé điện tử & Quản lý sự kiện';
  }, []);

  const [fields, setFields] = React.useState<FieldDefinition[]>(INITIAL_FIELDS);
  const [isFieldModalOpen, setFieldModalOpen] = React.useState<boolean>(false);
  const [editingFieldId, setEditingFieldId] = React.useState<number | null>(null);
  const [newField, setNewField] = React.useState<NewFieldState>({
    label: '',
    type: 'text',
    visible: true,
    required: false,
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
          `/event-studio/events/${params.event_id}/forms/checkout/config`
        );
        const apiFields = (resp.data.fields as any[]) || [];
        if (apiFields.length === 0) return;

        // Bắt đầu với bản sao của INITIAL_FIELDS để đảm bảo thứ tự
        const mappedBuiltin = INITIAL_FIELDS.map(builtin => {
          const apiField = apiFields.find(f => f.builtinKey === builtin.builtinKey);
          if (apiField) {
            return {
              ...builtin,
              id: apiField.id,
              label: apiField.label,
              type: apiField.fieldType,
              visible: apiField.visible,
              required: apiField.required,
              note: apiField.note || '',
              showInTransactionHistory: builtin.kind === 'builtin_core' ? true : (apiField.showInTransactionHistory || false),
              showInTicketEmail: builtin.kind === 'builtin_core' ? true : (apiField.showInTicketEmail || false),
              options: apiField.options && apiField.options.length > 0
                ? (apiField.options as any[]).map(opt => opt.label as string)
                : undefined,
            };
          }
          return builtin;
        });

        // Lấy các custom fields từ API
        const mappedCustom: FieldDefinition[] = apiFields
          .filter(f => f.kind === 'custom')
          .map(f => ({
            id: f.id,
            kind: 'custom',
            builtinKey: null,
            name: f.internalName,
            label: f.label,
            type: f.fieldType,
            visible: f.visible,
            required: f.required,
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
        console.error('Failed to load checkout form config', error);
      }
    };
    fetchConfig();
  }, [params.event_id]);

  const handleDeleteField = (id: number) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
  };

  const handleOpenAddFieldModal = () => {
    setEditingFieldId(null);
    setNewField({
      label: '',
      type: 'text',
      visible: true,
      required: false,
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
      label: field.label,
      type: field.type,
      visible: field.visible,
      required: field.required,
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
        kind: 'custom',
        builtinKey: null,
        name: newField.label.trim(),
        label: newField.label.trim(),
        type: newField.type,
        visible: newField.visible,
        required: newField.required,
        note: newField.note,
        showInTransactionHistory: newField.showInTransactionHistory,
        showInTicketEmail: newField.showInTicketEmail,
        locked: false,
        nonDeletable: false,
        options: cleanedOptions && cleanedOptions.length > 0 ? cleanedOptions : undefined,
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

          // Chỉ 4 trường core (title, name, email, phone_number) luôn true, các trường khác cho phép edit
          const isCoreField = field.name === 'title' || field.name === 'name' || field.name === 'email' || field.name === 'phone_number';

          return {
            ...field,
            label: canEditLabel ? newField.label.trim() : field.label,
            type: canEditType ? newField.type : field.type,
            visible: canEditVisibilityAndRequired ? newField.visible : field.visible,
            required: canEditVisibilityAndRequired ? newField.required : field.required,
            note: newField.note,
            showInTransactionHistory: isCoreField ? true : newField.showInTransactionHistory,
            showInTicketEmail: isCoreField ? true : newField.showInTicketEmail,
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
        const kind = field.kind;
        const builtinKey = field.builtinKey;

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
          // Không gửi id cho custom mới; backend sẽ map builtin theo sortOrder + builtinKey
          id: field.id,
          kind,
          builtinKey,
          internalName: field.name,
          label: field.label,
          fieldType: field.type,
          visible: field.visible,
          required: field.required,
          note: field.note || null,
          showInTransactionHistory: field.showInTransactionHistory,
          showInTicketEmail: field.showInTicketEmail,
          sortOrder,
          options,
        };
      });

      await baseHttpServiceInstance.put(
        `/event-studio/events/${params.event_id}/forms/checkout/config`,
        {
          name: 'Form mua vé',
          description: 'Form dùng khi khách mua vé',
          fields: payloadFields,
        }
      );
      notificationCtx.success('Đã lưu cấu hình form mua vé');
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
            <Typography variant="h4">Form mua vé</Typography>
            <Typography variant="body2" color="text.secondary">
              Bảng câu hỏi khách hàng phải trả lời khi mua vé
            </Typography>
          </Stack>
        </Stack>

        <Card>
          <CardHeader title="Khách hàng sẽ cần nhập thông tin gì khi mua vé?" />
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
                    <TableCell>Hiển thị</TableCell>
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
                      <TableCell sx={{ minWidth: 80 }}>
                        <Checkbox
                          checked={field.visible}
                          // chỉ hiển thị, không chỉnh trong bảng
                          disabled
                        />
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
                  disabled={!!editingField && (editingField.locked || editingField.nonDeletable)}
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

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newField.visible}
                      onChange={(e) =>
                        setNewField((prev) => ({ ...prev, visible: e.target.checked }))
                      }
                      disabled={!!editingField && editingField.locked}
                    />
                  }
                  label="Hiển thị"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newField.required}
                      onChange={(e) =>
                        setNewField((prev) => ({ ...prev, required: e.target.checked }))
                      }
                      disabled={!!editingField && editingField.locked}
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
                      disabled={!!editingField && (editingField.name === 'title' || editingField.name === 'name' || editingField.name === 'email' || editingField.name === 'phone_number')}
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
                      disabled={!!editingField && (editingField.name === 'title' || editingField.name === 'name' || editingField.name === 'email' || editingField.name === 'phone_number')}
                    />
                  }
                  label="Hiển thị trong email vé"
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
