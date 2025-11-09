'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import { useSearchParams } from 'next/navigation';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';

type TicketTagSelectedComponent = {
  key: string;
  label: string;
};

type TicketTagComponentSetting = {
  width: number;
  height: number;
  top: number;
  left: number;
  fontSize: number;
  color?: string | null;
};

type TicketTagSettings = {
  size: string;
  selectedComponents: TicketTagSelectedComponent[];
  componentSettings: Record<string, TicketTagComponentSetting>;
};

type TicketResponse = {
  id: number;
  holderTitle: string;
  holderName: string;
  holderEmail?: string | null;
  holderPhone?: string | null;
  eCode?: string;
};

type TicketCategoryResponse = {
  ticketCategory: {
    name: string;
    show: {
      name: string;
    };
  };
  tickets: TicketResponse[];
};

type TransactionResponse = {
  id: number;
  title?: string | null;
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  eCode?: string;
  transactionTicketCategories: TicketCategoryResponse[];
  event: {
    name: string;
    organizer?: string | null;
    place?: string | null;
    startDateTime?: string | null;
    endDateTime?: string | null;
    locationInstruction?: string | null;
    timeInstruction?: string | null;
    locationUrl?: string | null;
  };
};

type PrintTicketData = {
  ticketId: number;
  holderName: string;
  holderEmail?: string | null;
  holderPhone?: string | null;
  showName: string;
  categoryName: string;
  eCode?: string;
};

const DEFAULT_LABEL_SIZE = { width: 50, height: 30 };
const LABEL_SIZE_MAP: Record<string, { width: number; height: number }> = {
  '40x30mm': { width: 40, height: 30 },
  '50x30mm': { width: 50, height: 30 },
  '50x40mm': { width: 50, height: 40 },
  '50x50mm': { width: 50, height: 50 },
};

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

const resolveComponentValue = (
  key: string,
  ticket: PrintTicketData,
  transaction: TransactionResponse
): string => {
  const buyerName = [transaction.title, transaction.name].filter(Boolean).join(' ').trim();

  switch (key) {
    case 'eventName':
      return transaction.event?.name || '';
    case 'organizer':
      return transaction.event?.organizer || '';
    case 'customerName':
      return ticket.holderName || buyerName;
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
};

const PrintTagPage = ({ params }: { params: { event_id: number; transaction_id: number } }) => {
  const searchParams = useSearchParams();
  const ticketIdsParam = searchParams.get('ticketIds');
  const ticketIdSet = React.useMemo(() => {
    if (!ticketIdsParam) return null;
    return new Set(
      ticketIdsParam
        .split(',')
        .map(id => Number(id.trim()))
        .filter(id => !Number.isNaN(id))
    );
  }, [ticketIdsParam]);

  const [settings, setSettings] = React.useState<TicketTagSettings | null>(null);
  const [transaction, setTransaction] = React.useState<TransactionResponse | null>(null);
  const [tickets, setTickets] = React.useState<PrintTicketData[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const labelSize = React.useMemo(() => parseLabelSize(settings?.size), [settings?.size]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [settingsResponse, transactionResponse] = await Promise.all([
          baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}/ticket-tag-settings`),
          baseHttpServiceInstance.get(
            `/event-studio/events/${params.event_id}/transactions/${params.transaction_id}`
          ),
        ]);

        const normalizedSettings: TicketTagSettings = {
          size: (settingsResponse.data as TicketTagSettings).size,
          selectedComponents:
            (settingsResponse.data as TicketTagSettings).selectedComponents || [],
          componentSettings: normalizeComponentSettings(
            (settingsResponse.data as TicketTagSettings).componentSettings || {}
          ),
        };

        const trxRaw = transactionResponse.data as any;
        const augmentedTransaction: TransactionResponse = {
          ...trxRaw,
          eCode: trxRaw.eCode || undefined,
        };

        const flattenedTickets: PrintTicketData[] = augmentedTransaction.transactionTicketCategories.flatMap(cat =>
          cat.tickets.map(ticket => {
            const ticketRaw = ticket as any;
            const ticketECode: string | undefined =
              ticket.eCode ?? ticketRaw.eCode ?? augmentedTransaction.eCode;
            const holderName = [ticket.holderTitle, ticket.holderName].filter(Boolean).join(' ').trim();
            const fallbackName = [augmentedTransaction.title, augmentedTransaction.name]
              .filter(Boolean)
              .join(' ')
              .trim();
            return {
              ticketId: ticket.id,
              holderName: holderName || fallbackName,
              holderEmail: ticket.holderEmail ?? augmentedTransaction.email,
              holderPhone: ticket.holderPhone ?? augmentedTransaction.phoneNumber,
              showName: cat.ticketCategory.show.name,
              categoryName: cat.ticketCategory.name,
              eCode: ticketECode,
            };
          })
        );

        const filtered = ticketIdSet
          ? flattenedTickets.filter(ticket => ticketIdSet.has(ticket.ticketId))
          : flattenedTickets;

        setSettings(normalizedSettings);
        setTransaction(augmentedTransaction);
        setTickets(filtered);
        setError(null);
      } catch (err: any) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.event_id, params.transaction_id, ticketIdSet]);

  React.useEffect(() => {
    if (loading || error || !settings || tickets.length === 0 || !transaction) {
      return;
    }

    const printTimeout = window.setTimeout(() => {
      window.print();
    }, 200);

    const handleAfterPrint = () => {
      // window.close();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.clearTimeout(printTimeout);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [loading, error, settings, tickets, transaction]);

  if (loading) {
    return (
      <Stack
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ height: '100vh', color: '#fff', backgroundColor: '#000' }}
      >
        <CircularProgress color="inherit" />
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
        sx={{ height: '100vh', color: '#fff', backgroundColor: '#000', textAlign: 'center', px: 2 }}
      >
        <Typography variant="body1">Có lỗi xảy ra khi tải dữ liệu in.</Typography>
        <Typography variant="caption">{error}</Typography>
      </Stack>
    );
  }

  if (!settings || !transaction) {
    return (
      <Stack
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ height: '100vh', color: '#fff', backgroundColor: '#000' }}
      >
        <Typography variant="body1">Không tìm thấy cấu hình in hoặc đơn hàng.</Typography>
      </Stack>
    );
  }

  if (tickets.length === 0) {
    return (
      <Stack
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ height: '100vh', color: '#fff', backgroundColor: '#000', textAlign: 'center', px: 2 }}
      >
        <Typography variant="body1">Không có vé nào phù hợp để in.</Typography>
        <Typography variant="caption">Vui lòng đóng tab này và thử lại.</Typography>
      </Stack>
    );
  }

  const { width, height } = labelSize;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        m: 0,
        p: 0,
        backgroundColor: '#fff',
        width: `${width}mm`,
      }}
      className="ticket-tag-print-container"
    >
      <style>{`
        @page {
          size: ${width}mm ${height}mm;
          margin: 0mm;
        }
        @media print {
          html, body {
            width: ${width}mm;
            margin: 0;
            padding: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .ticket-tag-print-page {
            page-break-after: always;
            margin: 0 0 5mm 0 !important;
          }
        }
      `}</style>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          gap: '5mm',
          padding: 0,
          margin: 0,
          width: `${width}mm`,
        }}
      >
        {tickets.map((ticket, index) => (
          <Box
            key={ticket.ticketId}
            className="ticket-tag-print-page"
            sx={{
              width: `${width}mm`,
              height: `${height}mm`,
              position: 'relative',
              backgroundColor: '#fff',
              marginTop: index === 0 ? '0mm' : '5mm',
              marginRight: 0,
            }}
          >
            {settings.selectedComponents.map(component => {
              const compSetting = settings.componentSettings[component.key];
              if (!compSetting) return null;
              const value = resolveComponentValue(component.key, ticket, transaction);
              if (!value) return null;

              const topMm = (compSetting.top / 100) * height;
              const leftMm = (compSetting.left / 100) * width;
              const widthMm = (compSetting.width / 100) * width;
              const heightMm = (compSetting.height / 100) * height;
              const fontSizeMm = (compSetting.fontSize || 10) / 3;

              const baseStyles: React.CSSProperties = {
                position: 'absolute',
                top: `${topMm}mm`,
                left: `${leftMm}mm`,
                width: `${widthMm}mm`,
                height: `${heightMm}mm`,
                color: `#${compSetting.color || '000000'}`,
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
                    <Box
                      component="img"
                      src={qrUrl}
                      alt="QR"
                      sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </Box>
                );
              }

              return (
                <Box key={`${ticket.ticketId}-${component.key}`} sx={baseStyles}>
                  {value}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default PrintTagPage;


