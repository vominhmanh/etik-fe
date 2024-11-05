'use client';

import * as React from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { Upload as UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';
import axios, { AxiosResponse } from 'axios';

import NotificationContext from '@/contexts/notification-context';
import { CustomersFilters } from '@/components/dashboard/customer/customers-filters';

import { TicketsTable } from './tickets-table';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
interface Show {
  id: number;
  eventId: number;
  name: string;
}

interface TicketCategory {
  id: number;
  eventId: number;
  name: string;
}

interface ShowTicketCategory {
  ticketCategoryId: number;
  showId: number;
  show: Show;
  ticketCategory: TicketCategory;
}

interface Transaction {
  id: number;
  status: string;
  paymentStatus: string;
}

interface TransactionShowTicketCategory {
  transactionId: number;
  netPricePerOne: number;
  showId: number;
  ticketCategoryId: number;
  showTicketCategory: ShowTicketCategory;
  transaction: Transaction;
}

export interface Ticket {
  id: number;
  transactionId: number;
  showId: number;
  createdAt: string; // ISO date string
  ticketCategoryId: number;
  holder: string;
  checkInAt?: string | null; // ISO date string or null
  transactionShowTicketCategory: TransactionShowTicketCategory;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Danh sách khách hàng & vé | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const notificationCtx = React.useContext(NotificationContext);
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to the first page whenever rows per page change
  };

  // Fetch tickets for the event
  React.useEffect(() => {
    async function fetchTickets() {
      try {
        setIsLoading(true);
        const response: AxiosResponse<Ticket[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/tickets`
        );
        setTickets(response.data);
      } catch (error) {
        notificationCtx.error('Error fetching tickets:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTickets();
  }, [params.event_id]);

  const paginatedCustomers = applyPagination(tickets, page, rowsPerPage);

  return (
    <Stack spacing={3}>
      <Backdrop
        open={isLoading}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          marginLeft: '0px !important',
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>{' '}
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Danh sách khách hàng & vé</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            {/* <Button color="inherit" startIcon={<UploadIcon fontSize="var(--icon-fontSize-md)" />}>
              Import
            </Button> */}
            <Button color="inherit" startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)" />}>
              Xuất file excel
            </Button>
          </Stack>
        </Stack>
        <div>
          <Button
            startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
            href="transactions/create"
            variant="contained"
          >
            Thêm
          </Button>
        </div>
      </Stack>
      <CustomersFilters />
      <TicketsTable
        count={tickets.length}
        page={page}
        rows={paginatedCustomers}
        rowsPerPage={rowsPerPage}
        eventId={params.event_id}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Stack>
  );
}

function applyPagination(rows: Ticket[], page: number, rowsPerPage: number): Ticket[] {
  return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
}
