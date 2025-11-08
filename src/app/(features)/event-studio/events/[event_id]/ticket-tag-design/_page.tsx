'use client';

import { forwardRef, useMemo, useRef } from 'react';
import ReactToPrint from 'react-to-print';
import QRCode from 'react-qr-code';
import {
  Box,
  Button,
  Divider,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';

type TicketTemplateData = {
  fullName: string;
  email: string;
  ticketType: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  seat: string;
  qrValue: string;
};

const pageStyle = `
  @page {
    size: 90mm 140mm;
  }

  @media print {
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background-color: #f5f5f5;
    }
  }
`;

type TicketTemplateProps = {
  ticket: TicketTemplateData;
};

const TicketTemplate = forwardRef<HTMLDivElement, TicketTemplateProps>(
  ({ ticket }, ref) => {
    const theme = useTheme();

    return (
      <Box
        ref={ref}
        sx={{
          width: 320,
          minHeight: 460,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: theme.palette.background.paper,
          boxShadow:
            '0 24px 48px rgba(27, 31, 35, 0.12), 0 8px 16px rgba(27, 31, 35, 0.08)',
        }}
      >
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: theme.palette.common.white,
          }}
        >
          <Typography variant="overline" sx={{ letterSpacing: 1.8 }}>
            {ticket.ticketType}
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {ticket.eventName}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {ticket.eventDate}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {ticket.eventLocation}
          </Typography>
        </Box>

        <Stack spacing={2} sx={{ p: 3 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Guest
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              {ticket.fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {ticket.email}
            </Typography>
          </Box>

          <Divider />

          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Seat
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {ticket.seat}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'grey.100',
                border: '1px dashed',
                borderColor: 'grey.300',
              }}
            >
              <QRCode
                value={ticket.qrValue}
                size={88}
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              />
            </Box>
          </Stack>

          <Divider />

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              QR Code Reference
            </Typography>
            <Typography variant="body1" fontFamily="monospace">
              {ticket.qrValue}
            </Typography>
          </Box>
        </Stack>
      </Box>
    );
  },
);

TicketTemplate.displayName = 'TicketTemplate';

const TicketTagDesignPage = () => {
  const printRef = useRef<HTMLDivElement>(null);

  const mockTicket = useMemo<TicketTemplateData>(
    () => ({
      fullName: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      ticketType: 'VIP Guest',
      eventName: 'Etik Live 2025',
      eventDate: 'Saturday • Nov 15, 2025 • 6:00 PM',
      eventLocation: 'Ho Chi Minh City Convention Center',
      seat: 'Section B • Row 3 • Seat 12',
      qrValue: 'ETIK-2025-000123',
    }),
    [],
  );

  return (
    <Stack
      spacing={4}
      sx={{
        py: 6,
        px: { xs: 2, md: 6 },
        minHeight: '100%',
        bgcolor: 'background.default',
      }}
    >
      <Stack spacing={1}>
        <Typography variant="h4" fontWeight={700}>
          Ticket Tag Template Preview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Preview a mock ticket with attendee details and print-ready QR code.
          Use the button below to print or save it as PDF.
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="center">
        <TicketTemplate ref={printRef} ticket={mockTicket} />

        <Stack spacing={2} maxWidth={360}>
          <Typography variant="subtitle1" fontWeight={600}>
            What&apos;s included in this mock template?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The sample ticket highlights essential guest information such as full
            name, email, seat assignment, and a scannable QR code reference. Adjust
            the data via API integration to render real attendee records.
          </Typography>

          <ReactToPrint
            pageStyle={pageStyle}
            content={() => printRef.current}
            trigger={() => (
              <Button variant="contained" color="primary" size="large">
                Print Ticket Template
              </Button>
            )}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};

export default TicketTagDesignPage;


