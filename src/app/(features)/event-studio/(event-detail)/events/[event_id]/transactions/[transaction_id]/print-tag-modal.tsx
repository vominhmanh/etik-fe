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

import { useReactToPrint } from 'react-to-print';
import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { LocalizedLink } from '@/components/homepage/localized-link';

import type { Transaction } from './page';

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

// New Ticket Tag design schema (multi-design per event)
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
  fieldId?: number | null; // For custom form fields: stable ID for mapping with formAnswers
  /** Rotation in degrees (0, 90, 180, 270). Optional, default is 0 (no rotation). */
  rotation?: number | null;
}

interface TicketTagDesign {
  id: number;
  name: string;
  size: string; // '40x30mm' | 'custom' ...
  customSize?: { width: number; height: number } | null;
  components: ComponentData[];
  createdAt?: string;
  updatedAt?: string;
}

interface PrintTagModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  eventId: number;
}

const PX_PER_MM = 96 / 25.4;
const CANVAS_SCALE = 2;
const MAX_CANVAS_WIDTH = 600;
const MAX_CANVAS_HEIGHT = 500;

const parseSizeString = (size: string): { width: number; height: number } | null => {
  const match = size?.match(/(\d+)\s*x\s*(\d+)\s*mm/i);
  if (match) return { width: Number(match[1]), height: Number(match[2]) };
  return null;
};

const PrintTagModal: React.FC<PrintTagModalProps> = ({ open, onClose, transaction, eventId }) => {
  const { tt } = useTranslation();
  const notificationCtx = React.useContext(NotificationContext);

  const ticketRows = React.useMemo<TicketRow[]>(() => {
    if (!transaction) return [];
    const buyerName = [transaction.title, transaction.name].filter(Boolean).join(' ').trim();
    const useSharedCode = transaction.qrOption !== 'separate';
    const sharedCode = useSharedCode ? transaction.eCode : undefined;
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
          eCode: sharedCode ?? ticket.eCode ?? transaction.eCode,
          rowLabel: ticket.showSeat?.rowLabel,
          seatNumber: ticket.showSeat?.seatNumber,
        };
      })
    );
  }, [transaction]);

  const [selectedTicketId, setSelectedTicketId] = React.useState<number | null>(null);
  const [designs, setDesigns] = React.useState<TicketTagDesign[]>([]);
  const [selectedDesignId, setSelectedDesignId] = React.useState<number | null>(null);
  const [loadingDesigns, setLoadingDesigns] = React.useState<boolean>(false);
  const [isPreparingPrint, setIsPreparingPrint] = React.useState<boolean>(false);
  const printAreaRef = React.useRef<HTMLDivElement>(null);

  const selectedTicket = React.useMemo(
    () => ticketRows.find(row => row.ticketId === selectedTicketId) || null,
    [ticketRows, selectedTicketId]
  );
  const selectedDesign = React.useMemo(
    () => designs.find(d => d.id === selectedDesignId) || null,
    [designs, selectedDesignId]
  );
  const selectedSizeMm = React.useMemo(() => {
    if (!selectedDesign) return { width: 50, height: 50 };
    if (selectedDesign.size === 'custom' && selectedDesign.customSize) return selectedDesign.customSize;
    return parseSizeString(selectedDesign.size) || { width: 50, height: 50 };
  }, [selectedDesign]);
  const printCss = React.useMemo(() => {
    const w = selectedSizeMm.width;
    const h = selectedSizeMm.height;
    return `
      @page { size: ${w}mm ${h}mm; margin: 0; }
      @media print {
        html, body {
          width: ${w}mm;
          height: ${h}mm;
          margin: 0; padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body * { visibility: hidden !important; }
        .print-area, .print-area * { visibility: visible !important; }
        .print-area {
          position: fixed !important;
          top: 0 !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: ${w}mm !important;
          height: ${h}mm !important;
          margin: 0 !important;
          padding: 0 !important;
          display: block !important;
          overflow: visible !important;
          box-sizing: border-box !important;
        }
        .print-area * {
          padding: 0 !important;
          margin: 0 !important;
          box-sizing: border-box !important;
        }
      }
    `;
  }, [selectedSizeMm]);

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
    const fetchDesigns = async () => {
      try {
        setLoadingDesigns(true);
        const response = await baseHttpServiceInstance.get(`/event-studio/events/${eventId}/ticket-tag-designs`);
        if (!isMounted) return;
        const list = (response.data || []) as TicketTagDesign[];
        setDesigns(list);
        setSelectedDesignId(list.length > 0 ? list[0].id : null);
      } catch (error: any) {
        if (isMounted) {
          setDesigns([]);
          setSelectedDesignId(null);
          notificationCtx.error(tt('Không thể tải thiết kế tem.', 'Unable to load tag designs.') + ` ${error?.message || error}`);
        }
      } finally {
        if (isMounted) {
          setLoadingDesigns(false);
        }
      }
    };

    fetchDesigns();
    return () => {
      isMounted = false;
    };
  }, [open, eventId, notificationCtx, tt]);

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
        // Ticket holder (per-ticket) fields
        case 'ticketHolderName':
          return ticket.holderDisplayName;
        case 'titleTicketHolder':
          return ticket.holderTitle || '';
        case 'ticketHolderEmail':
          return ticket.holderEmail || '';
        case 'ticketHolderPhone':
          return ticket.holderPhone || '';
        case 'eventName':
          return transaction.event?.name || '';
        case 'organizer':
          return transaction.event?.organizer || '';
        case 'customerName':
          return buyerName;
        case 'customerAddress':
          return transaction.address || '';
        case 'customerPhone':
          return transaction.phoneNumber || '';
        case 'customerEmail':
          return transaction.email || '';
        case 'ticketsList':
          return `${ticket.showName} - ${ticket.categoryName}`;
        case 'transactionId':
          return String(transaction.id ?? '');
        case 'ticketTid':
          return ticket.ticketId ? `TID-${ticket.ticketId}` : '';
        // New dynamic builtin keys
        case 'name':
          return buyerName;
        case 'titleTrxn':
          return transaction.title || '';
        case 'email':
          return transaction.email || '';
        case 'phone':
          return transaction.phoneNumber || '';
        case 'address':
          return transaction.address || '';
        case 'dob':
          return transaction.dob || '';
        case 'idcard_number':
          return ((transaction as any).idcardNumber || (transaction as any).idcard_number || '');
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
        case 'rowLabel':
          return ticket.rowLabel || '';
        case 'seatNumber':
          return ticket.seatNumber || '';
        case 'rowSeat':
          if (ticket.rowLabel && ticket.seatNumber) {
            return `${ticket.rowLabel} - ${ticket.seatNumber}`;
          }
          return ticket.seatNumber || ticket.rowLabel || '';
        default:
          // Unknown key - return empty
          return '';
      }
    },
    [transaction]
  );

  // Resolve custom field value using fieldId (stable, required for custom fields)
  const resolveCustomFieldValue = React.useCallback(
    (comp: ComponentData): string => {
      if (!transaction?.formAnswers || !Array.isArray(transaction.formAnswers)) return '';

      // fieldId is required for custom fields - direct lookup
      if (!comp.fieldId) {
        console.warn('[resolveCustomFieldValue] Missing fieldId for component:', comp.key, comp.label);
        return '';
      }

      const answerItem = transaction.formAnswers.find((item: any) => item.id === comp.fieldId);
      if (!answerItem) {
        console.warn('[resolveCustomFieldValue] No answer found for fieldId:', comp.fieldId);
        return '';
      }

      const value = answerItem.value;
      if (Array.isArray(value)) return value.join(', ');
      return String(value ?? '');
    },
    [transaction]
  );

  const renderComponentBox = (
    comp: ComponentData,
    ticket: TicketRow,
    canvasScale: number
  ) => {
    // Normalize legacy keys to unified naming
    const normalizedKey = comp.key === 'customerName' ? 'name' : comp.key;
    // Convert px to mm based on canvasScale
    const xMm = comp.x / (PX_PER_MM * CANVAS_SCALE * canvasScale);
    const yMm = comp.y / (PX_PER_MM * CANVAS_SCALE * canvasScale);
    const widthMm = comp.width / (PX_PER_MM * CANVAS_SCALE * canvasScale);
    const heightMm = comp.height / (PX_PER_MM * CANVAS_SCALE * canvasScale);
    const fontSizeMm = comp.fontSize / (PX_PER_MM * CANVAS_SCALE * canvasScale);
    const rotation = comp.rotation ?? 0;
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const isVertical = normalizedRotation === 90 || normalizedRotation === 270;
    const isUpsideDown = normalizedRotation === 180 || normalizedRotation === 270;

    let value: string;
    if (normalizedKey === 'customText' && comp.customText) {
      value = comp.customText;
    } else if (normalizedKey === 'eCodeQr') {
      value = resolveComponentValue('eCodeQr', ticket);
    } else if (normalizedKey === 'name') {
      // Always source "name" from transaction info, never ticket holder
      if (comp.includeTitle === false) {
        value = (transaction?.name || '').trim();
      } else {
        value = resolveComponentValue('name', ticket);
      }
    } else if (normalizedKey === 'ticketHolderName') {
      if (comp.includeTitle === false) {
        value = (ticket.holderNameRaw || '').trim();
      } else {
        value = ticket.holderDisplayName;
      }
    } else if (comp.fieldId) {
      // Custom form field - identified by presence of fieldId (stable mapping)
      value = resolveCustomFieldValue(comp);
    } else {
      value = resolveComponentValue(normalizedKey, ticket);
    }

    return (
      <div
        key={comp.id}
        style={{
          position: 'absolute',
          left: `${xMm}mm`,
          top: `${yMm}mm`,
          width: `${widthMm}mm`,
          height: `${heightMm}mm`,
          minWidth: `${widthMm}mm`,
          minHeight: `${heightMm}mm`,
          backgroundColor: comp.backgroundColor ? `#${comp.backgroundColor}` : 'transparent',
          backgroundImage: 'none',
          display: 'flex',
          alignItems: (comp.verticalAlign === 'top' ? 'flex-start' : comp.verticalAlign === 'bottom' ? 'flex-end' : 'center'),
          justifyContent: comp.textAlign === 'center' ? 'center' : comp.textAlign === 'right' ? 'flex-end' : 'flex-start',
          padding: '1mm',
          boxSizing: 'border-box',
          border: '0.01mm solid rgba(0,0,0,0.001)',
          zIndex: comp.zIndex ?? 1,
          overflow: 'hidden',
        }}
      >
        {normalizedKey === 'eCodeQr' && value ? (
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?margin=16&size=140x140&data=${encodeURIComponent(
              value
            )}`}
            alt="QR Code"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : normalizedKey === 'image' && ((comp as any).imageUrl || (comp as any).image_url || (comp as any).customText) ? (
          <img
            src={(comp as any).imageUrl || (comp as any).image_url || (comp as any).customText}
            alt="Component"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <span
            style={{
              fontSize: `${fontSizeMm}mm`,
              fontFamily: comp.fontFamily || 'Arial',
              fontWeight: String(comp.fontWeight),
              fontStyle: comp.fontStyle as any,
              textDecoration: comp.textDecoration as any,
              color: `#${comp.color}`,
              textAlign: comp.textAlign as any,
              wordBreak: 'normal',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              width: '100%',
              display: 'block',
              writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
              transform: isUpsideDown ? 'rotate(180deg)' : 'none',
              transformOrigin: 'center center',
            }}
          >
            {value}
          </span>
        )}
      </div>
    );
  };

  const handlePrint = () => {
    if (!transaction) {
      notificationCtx.warning(tt('Không tìm thấy thông tin đơn hàng.', 'Order information not found.'));
      return;
    }
    const selectedDesign = designs.find(d => d.id === selectedDesignId) || null;
    if (!selectedDesign) {
      notificationCtx.warning(tt('Chưa có thiết kế tem nhãn. Vui lòng tạo thiết kế trước khi in.', 'No tag design found. Please create a design before printing.'));
      return;
    }

    if (!selectedTicket || !printAreaRef.current) {
      notificationCtx.warning(tt('Vui lòng chọn vé để in.', 'Please select a ticket to print.'));
      return;
    }

    setIsPreparingPrint(true);
    if (handleReactPrint) {
      handleReactPrint(undefined as any);
    } else {
      setIsPreparingPrint(false);
      notificationCtx.error(tt('Không thể khởi tạo chức năng in.', 'Unable to initialize print function.'));
    }
  };

  const hasTicketRows = ticketRows.length > 0;


  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printCss }} />
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>{tt("In tag vé", "Print Ticket Tag")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                {tt("Chọn vé để in", "Select ticket to print")} ({selectedTicket ? 1 : 0}/{ticketRows.length})
              </Typography>
              {loadingDesigns && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="caption">{tt("Đang tải thiết kế...", "Loading designs...")}</Typography>
                </Stack>
              )}
            </Stack>
            <Divider />
            {ticketRows.length === 0 ? (
              <Typography variant="body2">{tt("Không có vé trong đơn hàng này.", "No tickets in this order.")}</Typography>
            ) : (
              <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>TID</TableCell>
                      <TableCell>{tt("Họ tên", "Full Name")}</TableCell>
                      <TableCell>{tt("Suất diễn", "Show")}</TableCell>
                      <TableCell>{tt("Loại vé", "Ticket Category")}</TableCell>
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
                        <TableCell>{row.holderDisplayName || tt('Chưa có tên', 'No name')}</TableCell>
                        <TableCell>{row.showName}</TableCell>
                        <TableCell>{row.categoryName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}

            <Divider />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">{tt("Chọn thiết kế tem để in", "Select a tag design to print")}</Typography>
              <Button
                component={LocalizedLink}
                href={`/event-studio/events/${eventId}/ticket-tag-designs`}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
              >
                {tt("Quản lý thiết kế tem", "Manage tag designs")}
              </Button>
            </Stack>

            {loadingDesigns ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} />
                <Typography variant="caption">{tt("Đang tải thiết kế...", "Loading designs...")}</Typography>
              </Stack>
            ) : designs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {tt("Vui lòng tạo thiết kế tem trước.", "Please create a tag design first.")}
              </Typography>
            ) : !selectedTicket ? (
              <Typography variant="body2" color="text.secondary">
                {tt("Vui lòng chọn vé để xem trước.", "Please select a ticket to preview.")}
              </Typography>
            ) : (
              <Stack
                direction="row"
                flexWrap="nowrap"
                gap={2}
                sx={{ overflowX: 'auto', overflowY: 'hidden' }}
              >
                {designs.map((design) => {
                  const sizeMm =
                    design.size === 'custom' && design.customSize
                      ? design.customSize
                      : parseSizeString(design.size) || { width: 50, height: 50 };
                  const rawCanvasWidthPx = sizeMm.width * PX_PER_MM * CANVAS_SCALE;
                  const rawCanvasHeightPx = sizeMm.height * PX_PER_MM * CANVAS_SCALE;
                  const canvasScale = Math.min(1, MAX_CANVAS_WIDTH / rawCanvasWidthPx, MAX_CANVAS_HEIGHT / rawCanvasHeightPx);
                  const isSelected = selectedDesignId === design.id;

                  return (
                    <Box
                      key={design.id}
                      sx={{
                        border: theme => `1px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                        borderRadius: 2,
                        p: 1.5,
                        // Prevent flex item from shrinking so the preview keeps its real mm size
                        flex: '0 0 auto',
                        // Ensure the container is at least as wide as the preview (plus padding)
                        minWidth: Math.max(220, sizeMm.width * PX_PER_MM + 24),
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Radio
                            checked={isSelected}
                            onChange={() => setSelectedDesignId(design.id)}
                            size="small"
                          />
                        }
                        label={design.name || `#${design.id}`}
                        sx={{ mb: 1 }}
                      />

                      <Box
                        sx={{
                          width: `${sizeMm.width}mm`,
                          height: `${sizeMm.height}mm`,
                          minWidth: `${sizeMm.width}mm`,
                          minHeight: `${sizeMm.height}mm`,
                          position: 'relative',
                          backgroundColor: '#fff',
                          border: theme => `1px dashed ${theme.palette.divider}`,
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}
                      >
                        {design.components.map((comp) => renderComponentBox(comp, selectedTicket, canvasScale))}
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>{tt("Đóng", "Close")}</Button>
          <Button
            variant="contained"
            onClick={handlePrint}
            disabled={
              !hasTicketRows ||
              !selectedTicket ||
              !selectedDesignId ||
              loadingDesigns ||
              isPreparingPrint
            }
          >
            {isPreparingPrint ? tt('Đang chuẩn bị...', 'Preparing...') : tt('In', 'Print')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden print area for the selected design */}
      {open && selectedTicket && selectedDesignId && (
        <div
          ref={printAreaRef}
          className="print-area"
          style={{
            position: 'absolute',
            left: '-9999px',
          }}
        >
          {(() => {
            const design = designs.find(d => d.id === selectedDesignId)!;
            const sizeMm =
              design.size === 'custom' && design.customSize
                ? design.customSize
                : parseSizeString(design.size) || { width: 50, height: 50 };
            const rawCanvasWidthPx = sizeMm.width * PX_PER_MM * CANVAS_SCALE;
            const rawCanvasHeightPx = sizeMm.height * PX_PER_MM * CANVAS_SCALE;
            const canvasScale = Math.min(1, MAX_CANVAS_WIDTH / rawCanvasWidthPx, MAX_CANVAS_HEIGHT / rawCanvasHeightPx);
            return (
              <div
                style={{
                  width: `${sizeMm.width}mm`,
                  height: `${sizeMm.height}mm`,
                  minWidth: `${sizeMm.width}mm`,
                  minHeight: `${sizeMm.height}mm`,
                  position: 'relative',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}
              >
                {design.components.map((comp) => renderComponentBox(comp, selectedTicket, canvasScale))}
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
};

export default PrintTagModal;


