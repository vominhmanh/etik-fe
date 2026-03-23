'use client';

import * as React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  FormControlLabel,
} from '@mui/material';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';

import type { Transaction } from './page';
import dayjs from 'dayjs';

interface TicketRow {
  ticketId: number;
  holderDisplayName: string;
  holderNameRaw?: string;
  holderTitle?: string;
  holderEmail?: string | null;
  holderPhone?: string | null;
  showName: string;
  categoryName: string;
  eCode?: string;
  rowLabel?: string | null;
  seatNumber?: string | null;
}

interface ComponentData {
  id: string;
  key: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  color: string;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  customText?: string | null;
  imageUrl?: string | null;
  zIndex?: number | null;
  includeTitle?: boolean | null;
  verticalAlign?: 'top' | 'middle' | 'bottom' | null;
  fieldId?: number | null;
  rotation?: number | null;
}

interface InvitationLetterSettings {
  id: number;
  name: string;
  size: string;
  customSize?: { width: number; height: number } | null;
  components: ComponentData[];
}

interface InvitationLetterModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  eventId: number;
}

const PX_PER_MM = 96 / 25.4;
const MAX_PREVIEW_WIDTH = 210 * 3.77; // roughly A4 width in px at 96dpi

const parseSizeString = (size: string): { width: number; height: number } | null => {
  const match = size?.match(/(\d+)\s*x\s*(\d+)\s*mm/i);
  if (match) return { width: Number(match[1]), height: Number(match[2]) };
  return null;
};

const InvitationLetterModal: React.FC<InvitationLetterModalProps> = ({ open, onClose, transaction, eventId }) => {
  const { tt } = useTranslation();
  const notificationCtx = React.useContext(NotificationContext);

  const [settings, setSettings] = React.useState<InvitationLetterSettings | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [selectedTicketId, setSelectedTicketId] = React.useState<number | null>(null);

  const ticketRows = React.useMemo<TicketRow[]>(() => {
    if (!transaction) return [];
    const buyerName = [transaction.title, transaction.name].filter(Boolean).join(' ').trim();
    return transaction.transactionTicketCategories.flatMap(category =>
      category.tickets.map(ticket => {
        const holderNameRaw = (ticket.holderName || '').trim();
        const holderName = [ticket.holderTitle, holderNameRaw].filter(Boolean).join(' ').trim();
        return {
          ticketId: ticket.id,
          holderDisplayName: holderName || buyerName || transaction.name,
          holderNameRaw: holderNameRaw || undefined,
          holderTitle: ticket.holderTitle || undefined,
          holderEmail: ticket.holderEmail ?? transaction.email,
          holderPhone: ticket.holderPhone ?? transaction.phoneNumber,
          showName: category.ticketCategory.show.name,
          categoryName: category.ticketCategory.name,
          eCode: ticket.eCode ?? transaction.eCode,
          rowLabel: ticket.showSeat?.rowLabel,
          seatNumber: ticket.showSeat?.seatNumber,
        };
      })
    );
  }, [transaction]);

  const selectedTicket = React.useMemo(
    () => ticketRows.find(row => row.ticketId === selectedTicketId) || null,
    [ticketRows, selectedTicketId]
  );

  React.useEffect(() => {
    if (!open) return;
    if (ticketRows.length > 0 && !selectedTicketId) {
      setSelectedTicketId(ticketRows[0].ticketId);
    }
  }, [open, ticketRows, selectedTicketId]);

  React.useEffect(() => {
    if (!open || !transaction) return;
    const fetchSettings = async () => {
      try {
        setLoading(true);
        // We use the first ticket just to get settings, settings are per-event
        const response = await baseHttpServiceInstance.get(
          `/event-studio/events/${eventId}/transactions/${transaction.id}/invitation-letter`
        );
        setSettings(response.data);
      } catch (error: any) {
        notificationCtx.error(tt('Không thể tải cấu hình thư mời.', 'Unable to load invitation letter settings.'));
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [open, eventId, transaction, notificationCtx, tt]);

  const selectedSizeMm = React.useMemo(() => {
    if (!settings) return { width: 210, height: 297 };
    if (settings.size === 'custom' && settings.customSize) return settings.customSize;
    return parseSizeString(settings.size) || { width: 210, height: 297 };
  }, [settings]);

  const resolveValue = (comp: ComponentData, ticket: TicketRow): string => {
    if (!transaction) return '';
    const buyerName = [transaction.title, transaction.name].filter(Boolean).join(' ').trim();

    if (comp.fieldId && transaction.formAnswers) {
      const answerItem = Array.isArray(transaction.formAnswers)
        ? transaction.formAnswers.find((item: any) => item.id === comp.fieldId)
        : null;
      if (answerItem) {
        const value = answerItem.value;
        if (Array.isArray(value)) return value.join(', ');
        return String(value ?? '');
      }
    }

    switch (comp.key) {
      case 'eventName':
        return transaction.event?.name || '';
      case 'organizer':
        return transaction.event?.organizer || '';
      case 'customerName':
      case 'name':
        return comp.includeTitle === false ? (transaction.name || '') : buyerName;
      case 'ticketHolderName':
        return comp.includeTitle === false ? (ticket.holderNameRaw || '') : ticket.holderDisplayName;
      case 'showName':
        return ticket.showName;
      case 'ticketCategory':
        return ticket.categoryName;
      case 'address':
      case 'customerAddress':
        return transaction.address || '';
      case 'phone':
      case 'customerPhone':
      case 'phone_number':
        return transaction.phoneNumber || '';
      case 'email':
      case 'customerEmail':
        return transaction.email || '';
      case 'transactionId':
        return String(transaction.id ?? '');
      case 'eCode':
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
      case 'rowLabel':
        return ticket.rowLabel || '';
      case 'seatNumber':
        return ticket.seatNumber || '';
      case 'rowSeat':
        if (ticket.rowLabel && ticket.seatNumber) return `${ticket.rowLabel} - ${ticket.seatNumber}`;
        return ticket.seatNumber || ticket.rowLabel || '';
      case 'ticketsList':
        return transaction.transactionTicketCategories?.map((ttc: any) =>
          `${ttc.ticketCategory.show.name} - ${ttc.ticketCategory.name} (x${ttc.quantity})`
        ).join('<br />') || '';
      case 'title':
        return transaction.title || '';
      case 'ticketHolderTitle':
        return ticket.holderTitle || '';
      case 'idcard_number':
        return transaction.idcardNumber || '';
      case 'dob':
        return transaction.dob ? dayjs(transaction.dob).format('DD/MM/YYYY') : '';
      case 'customText':
        return comp.customText || '';
      default:
        return '';
    }
  };

  const renderComponent = (comp: ComponentData, ticket: TicketRow, scale: number) => {
    const value = resolveValue(comp, ticket);
    const rotation = comp.rotation ?? 0;
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const isVertical = normalizedRotation === 90 || normalizedRotation === 270;
    const isUpsideDown = normalizedRotation === 180 || normalizedRotation === 270;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${(comp.x / PX_PER_MM) * scale}mm`,
      top: `${(comp.y / PX_PER_MM) * scale}mm`,
      width: `${(comp.width / PX_PER_MM) * scale}mm`,
      height: `${(comp.height / PX_PER_MM) * scale}mm`,
      backgroundColor: comp.backgroundColor ? `#${comp.backgroundColor}` : 'transparent',
      display: 'flex',
      alignItems: comp.verticalAlign === 'top' ? 'flex-start' : comp.verticalAlign === 'bottom' ? 'flex-end' : 'center',
      justifyContent: comp.textAlign === 'center' ? 'center' : comp.textAlign === 'right' ? 'flex-end' : 'flex-start',
      padding: `${1 * scale}mm`,
      boxSizing: 'border-box',
      zIndex: comp.zIndex ?? 1,
      overflow: 'hidden',
    };

    const textStyle: React.CSSProperties = {
      fontSize: `${(comp.fontSize / PX_PER_MM) * scale}mm`,
      fontFamily: comp.fontFamily || 'Arial',
      fontWeight: comp.fontWeight,
      fontStyle: comp.fontStyle as any,
      textDecoration: comp.textDecoration as any,
      color: `#${comp.color}`,
      textAlign: comp.textAlign as any,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      width: '100%',
      writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
      transform: isUpsideDown ? 'rotate(180deg)' : 'none',
      transformOrigin: 'center center',
    };

    if (comp.key === 'eCodeQr') {
      return (
        <div key={comp.id} style={style}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?margin=16&size=200x200&data=${encodeURIComponent(value)}`}
            alt="QR Code"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      );
    }

    if (comp.key === 'image' && (comp.imageUrl || comp.customText)) {
      return (
        <div key={comp.id} style={style}>
          <img
            src={comp.imageUrl || comp.customText!}
            alt="Design Element"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      );
    }

    if (comp.key === 'ticketsList') {
      return (
        <div key={comp.id} style={style}>
          <span style={textStyle} dangerouslySetInnerHTML={{ __html: value }} />
        </div>
      );
    }

    return (
      <div key={comp.id} style={style}>
        <span style={textStyle}>{value}</span>
      </div>
    );
  };

  const handleOpenFull = () => {
    if (!transaction || !selectedTicketId) return;
    const url = `/event-studio/events/${eventId}/transactions/${transaction.id}/invitation-letter?ticket_id=${selectedTicketId}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>{tt("Xem thư mời", "View Invitation Letter")}</DialogTitle>
      <DialogContent sx={{ overflow: 'hidden' }}>
        <Stack direction="row" spacing={3} sx={{ height: '70vh' }}>
          {/* Left Side: Ticket List */}
          <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {tt("Chọn vé để xem trước", "Select ticket to preview")}
            </Typography>
            <Box sx={{ flex: 1, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox"></TableCell>
                    <TableCell>TID</TableCell>
                    <TableCell>{tt("Họ tên", "Full Name")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ticketRows.map(row => (
                    <TableRow key={row.ticketId} hover selected={selectedTicketId === row.ticketId} onClick={() => setSelectedTicketId(row.ticketId)} sx={{ cursor: 'pointer' }}>
                      <TableCell padding="checkbox">
                        <Radio
                          checked={selectedTicketId === row.ticketId}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{`TID-${row.ticketId}`}</TableCell>
                      <TableCell>{row.holderDisplayName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Right Side: Preview */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: '#f5f5f5', borderRadius: 1, p: 2, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <CircularProgress size={32} />
              </Box>
            ) : !settings || !selectedTicket ? (
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <Typography color="text.secondary">
                  {tt("Không tìm thấy cấu hình hoặc vé.", "Settings or ticket not found.")}
                </Typography>
              </Box>
            ) : (
              <Box
                onClick={handleOpenFull}
                sx={{
                  width: `${selectedSizeMm.width}mm`,
                  height: `${selectedSizeMm.height}mm`,
                  bgcolor: '#fff',
                  boxShadow: 3,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': {
                    '& .hover-overlay': { opacity: 1 }
                  }
                }}
              >
                <Box
                  className="hover-overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    zIndex: 10,
                  }}
                >
                  <Button variant="contained" size="small">{tt("Xem chi tiết", "View Detail")}</Button>
                </Box>
                {settings.components.map(comp => renderComponent(comp, selectedTicket, 1))}
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tt("Đóng", "Close")}</Button>
        <Button variant="contained" onClick={handleOpenFull} disabled={!selectedTicketId}>
          {tt("Mở tab mới", "Open in new tab")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvitationLetterModal;
