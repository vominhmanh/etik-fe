'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import { useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';

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

interface TicketTagDesign {
  id: number;
  name: string;
  size: string;
  customSize?: { width: number; height: number } | null;
  components: ComponentData[];
}

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

const PX_PER_MM = 96 / 25.4;

const parseSizeString = (size: string): { width: number; height: number } => {
  const match = size?.match(/(\d+)\s*x\s*(\d+)\s*mm/i);
  if (match) return { width: Number(match[1]), height: Number(match[2]) };
  return { width: 40, height: 30 }; // Default tag size
};

const resolveComponentValue = (comp: ComponentData, transaction: any, ticket: TicketRow): string => {
  if (!transaction) return '';
  const buyerName = [transaction.title, transaction.name].filter(Boolean).join(' ').trim();

  // Custom field lookup
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
      return transaction.idcard_number || transaction.idcardNumber || '';
    case 'dob':
      return transaction.dob ? dayjs(transaction.dob).format('DD/MM/YYYY') : '';
    case 'ticketTid':
      return ticket.ticketId ? `TID-${ticket.ticketId}` : '';
    case 'customText':
      return comp.customText || '';
    default:
      return '';
  }
};

const renderComponent = (comp: ComponentData, transaction: any, ticket: TicketRow) => {
  const value = resolveComponentValue(comp, transaction, ticket);
  const rotation = comp.rotation ?? 0;
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const isVertical = normalizedRotation === 90 || normalizedRotation === 270;
  const isUpsideDown = normalizedRotation === 180 || normalizedRotation === 270;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${comp.x / PX_PER_MM}mm`,
    top: `${comp.y / PX_PER_MM}mm`,
    width: `${comp.width / PX_PER_MM}mm`,
    height: `${comp.height / PX_PER_MM}mm`,
    backgroundColor: comp.backgroundColor ? `#${comp.backgroundColor}` : 'transparent',
    display: 'flex',
    alignItems: comp.verticalAlign === 'top' ? 'flex-start' : comp.verticalAlign === 'bottom' ? 'flex-end' : 'center',
    justifyContent: comp.textAlign === 'center' ? 'center' : comp.textAlign === 'right' ? 'flex-end' : 'flex-start',
    padding: '1mm',
    boxSizing: 'border-box',
    zIndex: comp.zIndex ?? 1,
    overflow: 'hidden',
  };

  const textStyle: React.CSSProperties = {
    fontSize: `${comp.fontSize / PX_PER_MM}mm`,
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

const PrintTagPage = ({ params }: { params: { event_id: number; transaction_id: number } }) => {
  const searchParams = useSearchParams();
  const ticketIdsParam = searchParams.get('ticketIds');
  const designIdParam = searchParams.get('design_id');

  const ticketIdSet = React.useMemo(() => {
    if (!ticketIdsParam) return null;
    return new Set(
      ticketIdsParam
        .split(',')
        .map(id => Number(id.trim()))
        .filter(id => !Number.isNaN(id))
    );
  }, [ticketIdsParam]);

  const [design, setDesign] = React.useState<TicketTagDesign | null>(null);
  const [transaction, setTransaction] = React.useState<any | null>(null);
  const [tickets, setTickets] = React.useState<TicketRow[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const labelSizeMm = React.useMemo(() => {
    if (!design) return { width: 40, height: 30 };
    if (design.size === 'custom' && design.customSize) return design.customSize;
    return parseSizeString(design.size);
  }, [design]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [designsResponse, transactionResponse] = await Promise.all([
          baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}/ticket-tag-designs`),
          baseHttpServiceInstance.get(
            `/event-studio/events/${params.event_id}/transactions/${params.transaction_id}`
          ),
        ]);

        const allDesigns = (designsResponse.data || []) as TicketTagDesign[];
        let selectedDesign = allDesigns.find(d => String(d.id) === designIdParam) || allDesigns[0] || null;

        if (!selectedDesign) {
          throw new Error('Không tìm thấy thiết kế tem.');
        }

        const trx = transactionResponse.data;
        const buyerName = [trx.title, trx.name].filter(Boolean).join(' ').trim();

        const flattenedTickets: TicketRow[] = trx.transactionTicketCategories.flatMap((cat: any) =>
          cat.tickets.map((ticket: any) => {
            const holderNameRaw = (ticket.holderName || '').trim();
            const holderName = [ticket.holderTitle, holderNameRaw].filter(Boolean).join(' ').trim();
            return {
              ticketId: ticket.id,
              holderDisplayName: holderName || buyerName || trx.name,
              holderNameRaw: holderNameRaw || undefined,
              holderTitle: ticket.holderTitle || undefined,
              holderEmail: ticket.holderEmail ?? trx.email,
              holderPhone: ticket.holderPhone ?? trx.phoneNumber,
              showName: cat.ticketCategory.show.name,
              categoryName: cat.ticketCategory.name,
              eCode: ticket.eCode ?? trx.eCode,
              rowLabel: ticket.showSeat?.rowLabel,
              seatNumber: ticket.showSeat?.seatNumber,
            };
          })
        );

        const filtered = ticketIdSet
          ? flattenedTickets.filter(ticket => ticketIdSet.has(ticket.ticketId))
          : flattenedTickets;

        setDesign(selectedDesign);
        setTransaction(trx);
        setTickets(filtered);
        setError(null);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.event_id, params.transaction_id, ticketIdSet, designIdParam]);

  React.useEffect(() => {
    if (loading || error || !design || tickets.length === 0 || !transaction) {
      return;
    }

    const printTimeout = window.setTimeout(() => {
      window.print();
    }, 500);

    return () => {
      window.clearTimeout(printTimeout);
    };
  }, [loading, error, design, tickets, transaction]);

  if (loading) {
    return (
      <Stack
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ height: '100vh', backgroundColor: '#fff' }}
      >
        <CircularProgress />
        <Typography variant="body2">Đang chuẩn bị nội dung in...</Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ height: '100vh', textAlign: 'center', px: 2 }}
      >
        <Typography variant="body1" color="error">Có lỗi xảy ra khi tải dữ liệu in.</Typography>
        <Typography variant="caption">{error}</Typography>
      </Stack>
    );
  }

  if (!design || !transaction) {
    return (
      <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ height: '100vh' }}>
        <Typography variant="body1">Không tìm thấy cấu hình in hoặc đơn hàng.</Typography>
      </Stack>
    );
  }

  const { width, height } = labelSizeMm;

  return (
    <Box sx={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <style>{`
        @page {
          size: ${width}mm ${height}mm;
          margin: 0mm;
        }
        @media print {
          html, body {
            width: ${width}mm;
            height: ${height}mm;
            margin: 0;
            padding: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .ticket-tag-page {
            page-break-after: always;
            box-shadow: none !important;
          }
        }
      `}</style>

      {tickets.map((ticket) => (
        <Box
          key={ticket.ticketId}
          className="ticket-tag-page"
          sx={{
            width: `${width}mm`,
            height: `${height}mm`,
            position: 'relative',
            backgroundColor: '#fff',
            overflow: 'hidden',
            boxShadow: '0 0 1px rgba(0,0,0,0.1)',
            mb: '10px',
            '@media print': {
              mb: 0,
            }
          }}
        >
          {design.components.map((comp) => renderComponent(comp, transaction, ticket))}
        </Box>
      ))}
    </Box>
  );
};

export default PrintTagPage;


