"use client";

import React, { useEffect, useState, useMemo } from "react";
import { AxiosResponse } from "axios";
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import dayjs from "dayjs";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";

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

const standardSizes: Record<string, { width: number; height: number }> = {
  'A4': { width: 210, height: 297 },
  'A5': { width: 148, height: 210 },
  'Letter': { width: 215.9, height: 279.4 },
  '4x6in': { width: 101.6, height: 152.4 },
};

const resolveSize = (size: string, customSize?: { width: number; height: number } | null): { width: number; height: number } => {
  if (size === 'custom' && customSize) return customSize;
  if (standardSizes[size]) return standardSizes[size];

  // Try to parse "210 x 297 mm" style
  const match = size?.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*mm/i);
  if (match) return { width: Number(match[1]), height: Number(match[2]) };

  return standardSizes['A4']; // Default
};

export default function Page({ params }: { params: { event_id: number; transaction_id: number } }): React.JSX.Element {
  const { event_id, transaction_id } = params;
  const searchParams = useSearchParams();
  const ticket_id = searchParams.get('ticket_id');

  const [settings, setSettings] = useState<InvitationLetterSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<InvitationLetterSettings> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/transactions/${transaction_id}/invitation-letter`
        );

        if (response.status === 200) {
          setSettings(response.data);
        }
      } catch (error: any) {
        setError(error.response?.data?.detail || `${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [event_id, transaction_id]);

  const ticketData = useMemo<TicketRow | null>(() => {
    if (!settings?.transaction || !ticket_id) return null;
    const transaction = settings.transaction;

    // Find the specific ticket
    for (const category of transaction.transactionTicketCategories) {
      for (const ticket of category.tickets) {
        if (String(ticket.id) === String(ticket_id)) {
          const buyerName = [transaction.title, transaction.name].filter(Boolean).join(' ').trim();
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
        }
      }
    }
    return null;
  }, [settings, ticket_id]);

  const selectedSizeMm = useMemo(() => {
    if (!settings) return standardSizes['A4'];
    return resolveSize(settings.size, settings.customSize);
  }, [settings]);

  const resolveComponentValue = (comp: ComponentData, transaction: any, ticket: TicketRow | null): string => {
    if (!transaction) return '';
    const buyerName = [transaction.title, transaction.name].filter(Boolean).join(' ').trim();

    // Check for custom field first if fieldId is present
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
        if (ticket) {
          return comp.includeTitle === false ? (ticket.holderNameRaw || '') : ticket.holderDisplayName;
        }
        return comp.includeTitle === false ? (transaction.name || '') : buyerName;
      case 'showName':
        return ticket?.showName || '';
      case 'ticketCategory':
        return ticket?.categoryName || '';
      case 'customerAddress':
      case 'address':
        return transaction.address || '';
      case 'customerPhone':
      case 'phone_number':
        return transaction.phoneNumber || '';
      case 'customerEmail':
      case 'email':
        return transaction.email || '';
      case 'transactionId':
        return String(transaction.id ?? '');
      case 'eCode':
      case 'eCodeQr':
        return ticket?.eCode || transaction.eCode || '';
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
        return ticket?.rowLabel || '';
      case 'seatNumber':
        return ticket?.seatNumber || '';
      case 'rowSeat':
        if (ticket?.rowLabel && ticket?.seatNumber) return `${ticket.rowLabel} - ${ticket.seatNumber}`;
        return ticket?.seatNumber || ticket?.rowLabel || '';
      case 'ticketsList':
        // For invitation letter, we might want a summary of tickets
        return transaction.transactionTicketCategories?.map((ttc: any) =>
          `${ttc.ticketCategory.show.name} - ${ttc.ticketCategory.name} (x${ttc.quantity})`
        ).join('<br />') || '';
      case 'title':
        return transaction.title || '';
      case 'ticketHolderTitle':
        return ticket?.holderTitle || '';
      case 'idcard_number':
        return transaction.idcard_number || transaction.idcardNumber || '';
      case 'dob':
        return transaction.dob ? dayjs(transaction.dob).format('DD/MM/YYYY') : '';
      case 'customText':
        return comp.customText || '';
      default:
        return '';
    }
  };

  const renderComponent = (comp: ComponentData, transaction: any, ticket: TicketRow | null) => {
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

  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const scale = useMemo(() => {
    if (!containerWidth || !selectedSizeMm.width) return 1;
    const letterWidthPx = selectedSizeMm.width * PX_PER_MM;
    const availableWidth = containerWidth - 40; // Subtract padding
    if (availableWidth < letterWidthPx) {
      return availableWidth / letterWidthPx;
    }
    return 1;
  }, [containerWidth, selectedSizeMm.width]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !settings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" flexDirection="column">
        <Typography color="error" variant="h6">{error || 'Không tìm thấy thiết kế thư mời.'}</Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        '@media print': {
          padding: 0,
          backgroundColor: '#fff',
          display: 'block',
        }
      }}
    >
      <Box
        sx={{
          width: scale === 1 ? 'auto' : `${selectedSizeMm.width * scale}mm`,
          height: `${selectedSizeMm.height * scale}mm`,
          display: 'flex',
          justifyContent: 'center',
          '@media print': {
            width: 'auto',
            height: 'auto',
          }
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: `${selectedSizeMm.width}mm`,
            height: `${selectedSizeMm.height}mm`,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            backgroundColor: '#fff',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            transition: 'transform 0.2s',
            '@media print': {
              boxShadow: 'none',
              transform: 'none !important',
              margin: 0,
            }
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
            @page { size: ${selectedSizeMm.width}mm ${selectedSizeMm.height}mm; margin: 0; }
            @media print {
              body { margin: 0; padding: 0; }
            }
          `}} />
          {settings.components.map(comp => renderComponent(comp, settings.transaction, ticketData))}
        </Box>
      </Box>
    </Box>
  );
}
