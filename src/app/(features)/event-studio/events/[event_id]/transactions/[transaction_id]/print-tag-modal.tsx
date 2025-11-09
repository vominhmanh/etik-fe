'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Radio,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { useReactToPrint } from 'react-to-print';
import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { LocalizedLink } from '@/components/localized-link';

import type { Transaction } from './page';

interface TicketRow {
  ticketId: number;
  holderDisplayName: string;
  holderEmail?: string | null;
  holderPhone?: string | null;
  showName: string;
  categoryName: string;
  eCode?: string;
}

interface TicketTagSelectedComponent {
  key: string;
  label: string;
}

interface TicketTagComponentSetting {
  width: number;
  height: number;
  top: number;
  left: number;
  fontSize: number;
  color?: string | null;
}

interface TicketTagSettings {
  size: string;
  selectedComponents: TicketTagSelectedComponent[];
  componentSettings: Record<string, TicketTagComponentSetting>;
}

interface TicketTagSettingsResponse {
  size: string;
  selectedComponents?: TicketTagSelectedComponent[];
  componentSettings?: Record<string, any>;
}

interface PrintTagModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  eventId: number;
}

const normalizeComponentSettings = (
  componentSettings: Record<string, any>
): Record<string, TicketTagComponentSetting> => {
  const normalized: Record<string, TicketTagComponentSetting> = {};
  Object.entries(componentSettings || {}).forEach(([key, value]) => {
    if (!value) return;
    normalized[key] = {
      width: Number(value.width ?? 0),
      height: Number(value.height ?? 0),
      top: Number(value.top ?? 0),
      left: Number(value.left ?? 0),
      fontSize: Number(value.fontSize ?? value.font_size ?? 10),
      color: typeof value.color === 'string' ? value.color : '000000',
    };
  });
  return normalized;
};

const LABEL_SIZE_MAP: Record<string, { width: number; height: number }> = {
  '40x30mm': { width: 40, height: 30 },
  '50x30mm': { width: 50, height: 30 },
  '50x40mm': { width: 50, height: 40 },
  '50x50mm': { width: 50, height: 50 },
};

const DEFAULT_TEMPLATE_SIZE = '50x50mm';
const DEFAULT_LABEL_SIZE = LABEL_SIZE_MAP[DEFAULT_TEMPLATE_SIZE];

const DEFAULT_COMPONENT_LABELS: Record<string, string> = {
  eventName: 'Tên sự kiện',
  customerName: 'Tên khách mời',
  customerAddress: 'Địa chỉ khách mời',
  customerPhone: 'Điện thoại khách mời',
  customerEmail: 'Email Khách mời',
  ticketsList: 'Danh sách vé',
  eCode: 'Mã Check-in',
  eCodeQr: 'Ảnh QR',
  startDateTime: 'Thời gian bắt đầu',
  endDateTime: 'Thời gian kết thúc',
  place: 'Địa điểm',
};

const DEFAULT_TEMPLATES: Record<
  string,
  {
    selectedComponents: string[];
    componentSettings: Record<string, TicketTagComponentSetting>;
  }
> = {
  '40x30mm': {
    selectedComponents: ['customerName', 'eCodeQr', 'eCode', 'eventName'],
    componentSettings: {
      eventName: { width: 100, height: 12, top: 1, left: 0, fontSize: 8, color: '000000' },
      customerName: { width: 100, height: 15, top: 18, left: 0, fontSize: 11, color: '000000' },
      startDateTime: { width: 60, height: 8, top: 29, left: 5, fontSize: 7, color: '000000' },
      place: { width: 60, height: 8, top: 38, left: 5, fontSize: 7, color: '000000' },
      eCodeQr: { width: 30, height: 30, top: 50, left: 60, fontSize: 10, color: '000000' },
      eCode: { width: 30, height: 8, top: 80, left: 60, fontSize: 7, color: '000000' },
    },
  },
  '50x40mm': {
    selectedComponents: ['customerName', 'eCodeQr', 'eCode', 'eventName'],
    componentSettings: {
      eventName: { width: 100, height: 12, top: 1, left: 0, fontSize: 8, color: '000000' },
      customerName: { width: 100, height: 15, top: 18, left: 0, fontSize: 11, color: '000000' },
      startDateTime: { width: 60, height: 8, top: 29, left: 5, fontSize: 7, color: '000000' },
      place: { width: 60, height: 8, top: 38, left: 5, fontSize: 7, color: '000000' },
      eCodeQr: { width: 30, height: 30, top: 50, left: 60, fontSize: 10, color: '000000' },
      eCode: { width: 30, height: 8, top: 80, left: 60, fontSize: 7, color: '000000' },
    },
  },
  '50x50mm': {
    selectedComponents: ['customerName', 'eCodeQr', 'eCode', 'eventName'],
    componentSettings: {
      eventName: { width: 100, height: 12, top: 1, left: 0, fontSize: 8, color: '000000' },
      customerName: { width: 100, height: 15, top: 18, left: 0, fontSize: 11, color: '000000' },
      startDateTime: { width: 60, height: 8, top: 29, left: 5, fontSize: 7, color: '000000' },
      place: { width: 60, height: 8, top: 38, left: 5, fontSize: 7, color: '000000' },
      eCodeQr: { width: 30, height: 30, top: 50, left: 60, fontSize: 10, color: '000000' },
      eCode: { width: 30, height: 8, top: 80, left: 60, fontSize: 7, color: '000000' },
    },
  },
  '50x30mm': {
    selectedComponents: ['customerName', 'eCodeQr', 'eCode', 'eventName'],
    componentSettings: {
      eventName: { width: 100, height: 12, top: 1, left: 0, fontSize: 8, color: '000000' },
      customerName: { width: 100, height: 15, top: 18, left: 0, fontSize: 11, color: '000000' },
      startDateTime: { width: 60, height: 8, top: 29, left: 5, fontSize: 7, color: '000000' },
      place: { width: 60, height: 8, top: 38, left: 5, fontSize: 7, color: '000000' },
      eCodeQr: { width: 30, height: 30, top: 50, left: 60, fontSize: 10, color: '000000' },
      eCode: { width: 30, height: 8, top: 80, left: 60, fontSize: 7, color: '000000' },
    },
  },
};

const LABEL_OPTIONS = [
  { value: '40x30mm', label: '40 x 30 mm' },
  { value: '50x30mm', label: '50 x 30 mm' },
  { value: '50x40mm', label: '50 x 40 mm' },
  { value: '50x50mm', label: '50 x 50 mm' },
];

const parseLabelSize = (size?: string | null) => {
  if (!size) return DEFAULT_LABEL_SIZE;
  const normalized = size.trim();
  if (LABEL_SIZE_MAP[normalized]) {
    return LABEL_SIZE_MAP[normalized];
  }
  const match = normalized.match(/(\d+)\s*x\s*(\d+)\s*mm/i);
  if (match) {
    return { width: Number(match[1]), height: Number(match[2]) };
  }
  return DEFAULT_LABEL_SIZE;
};

const createDefaultSettings = (size: string): TicketTagSettings => {
  const template = DEFAULT_TEMPLATES[size] || DEFAULT_TEMPLATES[DEFAULT_TEMPLATE_SIZE];
  return {
    size,
    selectedComponents: template.selectedComponents.map(key => ({
      key,
      label: DEFAULT_COMPONENT_LABELS[key] || key,
    })),
    componentSettings: Object.fromEntries(
      Object.entries(template.componentSettings).map(([key, value]) => [key, { ...value }])
    ),
  };
};

const PrintTagModal: React.FC<PrintTagModalProps> = ({ open, onClose, transaction, eventId }) => {
  const notificationCtx = React.useContext(NotificationContext);

  const ticketRows = React.useMemo<TicketRow[]>(() => {
    if (!transaction) return [];
    const buyerName = [transaction.title, transaction.name].filter(Boolean).join(' ').trim();
    const useSharedCode = transaction.qrOption !== 'separate';
    const sharedCode = useSharedCode ? transaction.eCode : undefined;
    return transaction.transactionTicketCategories.flatMap(category =>
      category.tickets.map(ticket => {
        const holderName = [ticket.holderTitle, ticket.holderName].filter(Boolean).join(' ').trim();
        return {
          ticketId: ticket.id,
          holderDisplayName: holderName || buyerName || transaction.name,
          holderEmail: ticket.holderEmail ?? transaction.email,
          holderPhone: ticket.holderPhone ?? transaction.phoneNumber,
          showName: category.ticketCategory.show.name,
          categoryName: category.ticketCategory.name,
          eCode: sharedCode ?? ticket.eCode ?? transaction.eCode,
        };
      })
    );
  }, [transaction]);

  const [selectedTicketId, setSelectedTicketId] = React.useState<number | null>(null);
  const [settings, setSettings] = React.useState<TicketTagSettings | null>(null);
  const [selectedSize, setSelectedSize] = React.useState<string>(DEFAULT_TEMPLATE_SIZE);
  const [loadingSettings, setLoadingSettings] = React.useState<boolean>(false);
  const [isPreparingPrint, setIsPreparingPrint] = React.useState<boolean>(false);
  const printAreaRef = React.useRef<HTMLDivElement>(null);
  const labelSize = React.useMemo(
    () => parseLabelSize(settings?.size || selectedSize),
    [selectedSize, settings?.size]
  );

  const selectedTicket = React.useMemo(
    () => ticketRows.find(row => row.ticketId === selectedTicketId) || null,
    [ticketRows, selectedTicketId]
  );

  const handleReactPrint = useReactToPrint({
    content: () => printAreaRef.current,
    documentTitle: selectedTicket ? `etik-tag-${selectedTicket.ticketId}` : 'etik-tag',
    onAfterPrint: () => setIsPreparingPrint(false),
  });

  React.useEffect(() => {
    if (!open) return;
    setSelectedTicketId(prev => {
      if (prev && ticketRows.some(row => row.ticketId === prev)) return prev;
      return ticketRows.length > 0 ? ticketRows[0].ticketId : null;
    });
  }, [open, ticketRows]);

  React.useEffect(() => {
    if (!open) return;
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true);
        const response = await baseHttpServiceInstance.get(
          `/event-studio/events/${eventId}/ticket-tag-settings`
        );
        if (!isMounted) return;
        const payload = response.data as TicketTagSettingsResponse;
        const size = payload.size || DEFAULT_TEMPLATE_SIZE;
        const incomingComponents = payload.selectedComponents ?? [];
        const incomingSettings = payload.componentSettings ?? {};
        if (incomingComponents.length === 0 || Object.keys(incomingSettings).length === 0) {
          const defaults = createDefaultSettings(size);
          setSettings(defaults);
          setSelectedSize(size);
          return;
        }
        setSettings({
          size,
          selectedComponents: incomingComponents.map(component => ({
            key: component.key,
            label: component.label || DEFAULT_COMPONENT_LABELS[component.key] || component.key,
          })),
          componentSettings: normalizeComponentSettings(incomingSettings),
        });
        setSelectedSize(size);
      } catch (error) {
        if (isMounted) {
          const defaults = createDefaultSettings(DEFAULT_TEMPLATE_SIZE);
          setSettings(defaults);
          setSelectedSize(DEFAULT_TEMPLATE_SIZE);
          notificationCtx.warning('Chưa có cấu hình tem nhãn, sử dụng thiết kế mặc định.');
        }
      } finally {
        if (isMounted) {
          setLoadingSettings(false);
        }
      }
    };

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, [open, eventId, notificationCtx]);

  React.useEffect(() => {
    if (!open) {
      setIsPreparingPrint(false);
    }
  }, [open]);

  const resolveComponentValue = React.useCallback(
    (key: string, ticket: TicketRow): string => {
      if (!transaction) return '';
      const buyerName = [transaction.title, transaction.name].filter(Boolean).join(' ').trim();
      switch (key) {
        case 'eventName':
          return transaction.event?.name || '';
        case 'organizer':
          return transaction.event?.organizer || '';
        case 'customerName':
          return ticket.holderDisplayName || buyerName;
        case 'customerAddress':
          return transaction.address || '';
        case 'customerPhone':
          return ticket.holderPhone || transaction.phoneNumber || '';
        case 'customerEmail':
          return ticket.holderEmail || transaction.email || '';
        case 'ticketsList':
          return `${ticket.showName} - ${ticket.categoryName}`;
        case 'showName':
          return ticket.showName;
        case 'ticketCategory':
          return ticket.categoryName;
        case 'eCode':
          return ticket.eCode || transaction.eCode || '';
        case 'eCodeQr':
          return ticket.eCode || transaction.eCode || '';
        case 'startDateTime':
          return transaction.event?.startDateTime
            ? dayjs(transaction.event.startDateTime).format('HH:mm DD/MM/YYYY')
            : '';
        case 'endDateTime':
          return transaction.event?.endDateTime
            ? dayjs(transaction.event.endDateTime).format('HH:mm DD/MM/YYYY')
            : '';
        case 'place':
          return transaction.event?.place || '';
        case 'locationInstruction':
          return transaction.event?.locationInstruction || '';
        case 'timeInstruction':
          return transaction.event?.timeInstruction || '';
        case 'locationUrl':
          return transaction.event?.locationUrl || '';
        default:
          return '';
      }
    },
    [transaction]
  );

  const renderComponent = React.useCallback(
    (component: TicketTagSelectedComponent, ticket: TicketRow) => {
      if (!settings) return null;
      const setting = settings.componentSettings[component.key];
      if (!setting) return null;
      const value = resolveComponentValue(component.key, ticket);
      if (!value) return null;

      const { width, height } = labelSize;
      const topMm = (setting.top / 100) * height;
      const leftMm = (setting.left / 100) * width;
      const widthMm = (setting.width / 100) * width;
      const heightMm = (setting.height / 100) * height;
      const fontSizeMm = (setting.fontSize || 10) / 3;

      const baseStyles: React.CSSProperties = {
        position: 'absolute',
        top: `${topMm}mm`,
        left: `${leftMm}mm`,
        width: `${widthMm}mm`,
        height: `${heightMm}mm`,
        color: `#${setting.color || '000000'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: `${fontSizeMm}mm`,
        boxSizing: 'border-box',
        padding: '1mm',
        wordBreak: 'break-word',
        whiteSpace: 'pre-line',
      };

      if (component.key === 'eCodeQr') {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?margin=16&size=280x280&data=${encodeURIComponent(
          value
        )}`;
        return (
          <Box key={`${ticket.ticketId}-${component.key}`} sx={baseStyles}>
            <Box component="img" src={qrUrl} alt="QR" sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </Box>
        );
      }

      return (
        <Box key={`${ticket.ticketId}-${component.key}`} sx={baseStyles}>
          {value}
        </Box>
      );
    },
    [labelSize, resolveComponentValue, settings]
  );

  const handlePrint = () => {
    if (!transaction) {
      notificationCtx.warning('Không tìm thấy thông tin đơn hàng.');
      return;
    }
    if (!settings || settings.selectedComponents.length === 0) {
      notificationCtx.warning('Chưa có cấu hình tem nhãn. Vui lòng thiết kế trước khi in.');
      return;
    }

    if (!selectedTicket || !printAreaRef.current) {
      notificationCtx.warning('Vui lòng chọn vé để in.');
      return;
    }

    setIsPreparingPrint(true);
    if (handleReactPrint) {
      handleReactPrint(undefined as any);
    } else {
      setIsPreparingPrint(false);
      notificationCtx.error('Không thể khởi tạo chức năng in.');
    }
  };

  const hasTicketRows = ticketRows.length > 0;
  const handleSizeChange = (value: string) => {
    setSelectedSize(value);
    setSettings(prev => {
      if (prev && prev.size === value) {
        return prev;
      }
      return createDefaultSettings(value);
    });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>In tag vé</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                Chọn vé để in ({selectedTicket ? 1 : 0}/{ticketRows.length})
              </Typography>
              {loadingSettings && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="caption">Đang tải cấu hình tem nhãn...</Typography>
                </Stack>
              )}
            </Stack>
            <Divider />
            {ticketRows.length === 0 ? (
              <Typography variant="body2">Không có vé trong đơn hàng này.</Typography>
            ) : (
              <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>TID</TableCell>
                      <TableCell>Họ tên</TableCell>
                      <TableCell>Suất diễn</TableCell>
                      <TableCell>Loại vé</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ticketRows.map(row => (
                      <TableRow key={row.ticketId} hover>
                        <TableCell padding="checkbox">
                          <Radio
                            checked={selectedTicketId === row.ticketId}
                            onChange={() => setSelectedTicketId(row.ticketId)}
                            value={row.ticketId}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{`TID-${row.ticketId}`}</TableCell>
                        <TableCell>{row.holderDisplayName || 'Chưa có tên'}</TableCell>
                        <TableCell>{row.showName}</TableCell>
                        <TableCell>{row.categoryName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            <Divider />
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent="space-between"
            >
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Kích thước tem</InputLabel>
                <Select
                  label="Kích thước tem"
                  value={selectedSize}
                  onChange={event => handleSizeChange(event.target.value)}
                >
                  {LABEL_OPTIONS.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                component={LocalizedLink}
                href={`/event-studio/events/${eventId}/ticket-tag-design`}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
              >
                Thay đổi thiết kế tem tại đây
              </Button>
            </Stack>
            <Typography variant="subtitle2">Xem trước tem</Typography>
            {settings && selectedTicket ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  ref={printAreaRef}
                  sx={{
                    width: `${labelSize.width}mm`,
                    height: `${labelSize.height}mm`,
                    position: 'relative',
                    backgroundColor: '#fff',
                    border: theme => `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  {settings.selectedComponents.map(component =>
                    renderComponent(component, selectedTicket)
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Tem được căn theo kích thước {labelSize.width} x {labelSize.height} mm.
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Vui lòng chọn vé để xem trước.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Đóng</Button>
          <Button
            variant="contained"
            onClick={handlePrint}
            disabled={
              !hasTicketRows ||
              !selectedTicket ||
              !settings ||
              loadingSettings ||
              isPreparingPrint
            }
          >
            {isPreparingPrint ? 'Đang chuẩn bị...' : 'In'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PrintTagModal;


