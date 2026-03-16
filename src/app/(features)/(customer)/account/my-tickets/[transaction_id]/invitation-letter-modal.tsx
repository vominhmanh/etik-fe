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
  transaction: any;
}

interface InvitationLetterModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const PX_PER_MM = 96 / 25.4;

const standardSizes: Record<string, { width: number; height: number }> = {
  'A4': { width: 210, height: 297 },
  'A5': { width: 148, height: 210 },
  'Letter': { width: 215.9, height: 279.4 },
  '4x6in': { width: 101.6, height: 152.4 },
};

const resolveSize = (size: string, customSize?: { width: number; height: number } | null): { width: number; height: number } => {
  if (size === 'custom' && customSize) return customSize;
  if (standardSizes[size]) return standardSizes[size];
  
  const match = size?.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*mm/i);
  if (match) return { width: Number(match[1]), height: Number(match[2]) };
  
  return standardSizes['A4'];
};

const InvitationLetterModal: React.FC<InvitationLetterModalProps> = ({ open, onClose, transaction }) => {
  const { tt } = useTranslation();
  const notificationCtx = React.useContext(NotificationContext);

  const [settings, setSettings] = React.useState<InvitationLetterSettings | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [selectedTicketId, setSelectedTicketId] = React.useState<number | null>(null);

  const ticketRows = React.useMemo<TicketRow[]>(() => {
    if (!transaction) return [];
    const buyerName = [transaction.title, transaction.name].filter(Boolean).join(' ').trim();
    return transaction.transactionTicketCategories.flatMap(category =>
      category.tickets.map((ticket: any) => {
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
          eCode: ticket.eCode ?? (transaction as any).eCode,
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
        const response = await baseHttpServiceInstance.get(
          `/account/transactions/${transaction.id}/invitation-letter`
        );
        setSettings(response.data);
      } catch (error: any) {
        notificationCtx.error(tt('Không thể tải cấu hình thư mời.', 'Unable to load invitation letter settings.'));
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [open, transaction, notificationCtx, tt]);

  const selectedSizeMm = React.useMemo(() => {
    if (!settings) return standardSizes['A4'];
    return resolveSize(settings.size, settings.customSize);
  }, [settings]);

  const resolveValue = (comp: ComponentData, ticket: TicketRow): string => {
    if (!transaction) return '';
    const buyerName = [transaction.title, transaction.name].filter(Boolean).join(' ').trim();

    const transData = settings?.transaction || transaction;

    if (comp.fieldId && transData.formAnswers) {
      const answerItem = Array.isArray(transData.formAnswers)
        ? transData.formAnswers.find((item: any) => item.id === comp.fieldId)
        : null;
      if (answerItem) {
        const value = answerItem.value;
        if (Array.isArray(value)) return value.join(', ');
        return String(value ?? '');
      }
    }

    switch (comp.key) {
      case 'eventName':
        return transData.event?.name || '';
      case 'organizer':
        return transData.event?.organizer || '';
      case 'customerName':
      case 'name':
        return comp.includeTitle === false ? (transData.name || '') : buyerName;
      case 'ticketHolderName':
        return comp.includeTitle === false ? (ticket.holderNameRaw || '') : ticket.holderDisplayName;
      case 'showName':
        return ticket.showName;
      case 'ticketCategory':
        return ticket.categoryName;
      case 'address':
      case 'customerAddress':
        return transData.address || '';
      case 'phone':
      case 'customerPhone':
        return transData.phoneNumber || '';
      case 'email':
      case 'customerEmail':
        return transData.email || '';
      case 'transactionId':
        return String(transData.id ?? '');
      case 'eCode':
      case 'eCodeQr':
        return ticket.eCode || transData.eCode || '';
      case 'startDateTime':
        return transData.event?.startDateTime
          ? dayjs(transData.event.startDateTime).format('HH:mm DD/MM/YYYY')
          : '';
      case 'endDateTime':
        return transData.event?.endDateTime
          ? dayjs(transData.event.endDateTime).format('HH:mm DD/MM/YYYY')
          : '';
      case 'place':
        return transData.event?.place || '';
      case 'locationInstruction':
        return transData.event?.locationInstruction || '';
      case 'timeInstruction':
        return transData.event?.timeInstruction || '';
      case 'locationUrl':
        return transData.event?.locationUrl || '';
      case 'rowLabel':
        return ticket.rowLabel || '';
      case 'seatNumber':
        return ticket.seatNumber || '';
      case 'rowSeat':
        if (ticket.rowLabel && ticket.seatNumber) return `${ticket.rowLabel} - ${ticket.seatNumber}`;
        return ticket.seatNumber || ticket.rowLabel || '';
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

    return (
      <div key={comp.id} style={style}>
        <span style={textStyle}>{value}</span>
      </div>
    );
  };

  const handleOpenFull = () => {
    if (!transaction || !selectedTicketId) return;
    const url = `/account/my-tickets/${transaction.id}/invitation-letter?ticket_id=${selectedTicketId}`;
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
