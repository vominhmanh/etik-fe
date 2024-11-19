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
import Card from '@mui/material/Card';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { TicketsTable } from './tickets-table';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { debounce } from 'lodash';
import { FormControl, InputLabel, Select, MenuItem, Grid, IconButton } from '@mui/material';
import { ArrowCounterClockwise, X } from '@phosphor-icons/react/dist/ssr';


interface FilterTicketCategory {
  id: number;
  eventId: number;
  name: string;
  type: string; // or enum if `TicketCategoryType` is defined as such
  price: number;
  avatar?: string | null;
  description?: string | null;
  status: string; // or enum if `TicketCategoryStatus` is defined as such
  createdAt: string; // ISO string format for datetime
  updatedAt: string; // ISO string format for datetime
}

interface FilterShowTicketCategory {
  quantity: number;
  sold: number;
  disabled: boolean;
  ticketCategory: FilterTicketCategory;
}

interface FilterShow {
  id: number;
  eventId: number;
  name: string;
  startDateTime?: string | null; // ISO string format for datetime
  endDateTime?: string | null;   // ISO string format for datetime
  showTicketCategories: FilterShowTicketCategory[];
}


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
  sentTicketEmailAt?: string | null; // ISO date string or null

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
  const [filters, setFilters] = React.useState({
    show: null,
    ticketCategory: null,
    status: null,
    paymentStatus: null,
    sentTicketEmailStatus: null,
    checkInStatus: null,
  });
  const [filterShows, setFilterShows] = React.useState<FilterShow[]>([]);
  const [querySearch, setQuerySearch] = React.useState<string>('');
  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to the first page whenever rows per page change
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prevFilters) => ({ ...prevFilters, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      show: null,
      ticketCategory: null,
      status: null,
      paymentStatus: null,
      sentTicketEmailStatus: null,
      checkInStatus: null,
    })
  }

  // Fetch tickets for the event 
  const fetchTickets = async () => {
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

  React.useEffect(() => {
    fetchTickets();
  }, [params.event_id]);


  React.useEffect(() => {
    const fetchShowsWithTicketCategories = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<FilterShow[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/transactions/get-shows-and-ticket-categories`
        );
        setFilterShows(response.data);
      } catch (error) {
        notificationCtx.error('Error fetching shows and ticket categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShowsWithTicketCategories();
  }, [params.event_id]);


  const debounceQuerySearch = React.useCallback(debounce((value) => setQuerySearch(value), 500), [])

  const handleSearchTickets = (event: React.ChangeEvent<HTMLInputElement>) => {
    debounceQuerySearch(event.target.value);
  }

  
const filteredTickets = React.useMemo(() => {
  return tickets.filter((ticket) => {
    // Search filter
    if (querySearch && !ticket.holder.toLowerCase().includes(querySearch.toLowerCase())) {
      return false;
    }

    // Show filter
    if (filters.show && ticket.showId !== filters.show) {
      return false;
    }

    // Ticket Category filter
    if (filters.ticketCategory && ticket.ticketCategoryId !== filters.ticketCategory) {
      return false;
    }

    // Transaction Status filter
    if (filters.status && ticket.transactionShowTicketCategory.transaction.status !== filters.status) {
      return false;
    }

    // Payment Status filter
    if (filters.paymentStatus && ticket.transactionShowTicketCategory.transaction.paymentStatus !== filters.paymentStatus) {
      return false;
    }

    // Sent Ticket Email Status filter
    if (filters.sentTicketEmailStatus === 'sent' && !ticket.transactionShowTicketCategory.transaction.sentTicketEmailAt) {
      return false;
    }
    if (filters.sentTicketEmailStatus === 'not_sent' && ticket.transactionShowTicketCategory.transaction.sentTicketEmailAt) {
      return false;
    }

    // Check-in Status filter
    if (filters.checkInStatus === 'checked' && !ticket.checkInAt) {
      return false;
    }
    if (filters.checkInStatus === 'not_checked' && ticket.checkInAt) {
      return false;
    }

    return true;
  });
}, [tickets, querySearch, filters]);

  const paginatedCustomers = applyPagination(filteredTickets, page, rowsPerPage);


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
            <Button color="inherit" startIcon={<ArrowCounterClockwise fontSize="var(--icon-fontSize-md)" />} onClick={fetchTickets}>
              Tải lại
            </Button>
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
      <Card sx={{ p: 2 }}>
        <Grid container spacing={3} direction={'row'} sx={{ alignItems: 'center' }}>
          <Grid item xs={12} md={3}>
            <OutlinedInput
              fullWidth
              defaultValue=""
              placeholder="Tìm kiếm khách hàng và vé..."
              onChange={handleSearchTickets}
              startAdornment={
                <InputAdornment position="start">
                  <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
                </InputAdornment>
              }
              sx={{ maxWidth: '500px' }}
            />
          </Grid>
          <Grid item xs={12} md={9}>
            <Stack spacing={1} direction={'row'} overflow={'auto'} sx={{
              flex: '1 1 auto',
              py: 1,
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                height: '3px', // Width of the scrollbar
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#888', // Color of the scrollbar thumb
                borderRadius: '8px', // Rounded corners
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#555', // Hover state for the scrollbar thumb
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'white', // Background color of the scrollbar track
              },
            }}>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>Suất diễn</InputLabel>
                <Select
                  value={filters.show}
                  label="Suất diễn"
                  name="type"
                  onChange={(e) => handleFilterChange('show', Number(e.target.value))}
                  >
                  <MenuItem value={undefined}></MenuItem>
                  {filterShows.map(show => (
                    <MenuItem key={show.id} value={show.id}>{show.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>Loại vé</InputLabel>
                <Select
                  value={filters.ticketCategory}
                  label="Loại vé"
                  name="type"
                  onChange={(e) => handleFilterChange('ticketCategory', Number(e.target.value))}
                >
                  <MenuItem value={undefined}></MenuItem>
                  {
                    filterShows.find(show => show.id === filters.show)?.showTicketCategories.map(stc => (
                      <MenuItem key={stc.ticketCategory.id} value={stc.ticketCategory.id}>{stc.ticketCategory.name}</MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>Trạng thái đơn hàng</InputLabel>
                <Select
                  value={filters.status}
                  label="Trạng thái đơn hàng"
                  name="status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value={undefined}></MenuItem>
                  <MenuItem value="normal">Bình thường</MenuItem>
                  <MenuItem value="staff_locked">Khoá bởi NV</MenuItem>
                  <MenuItem value="customer_cancelled">Huỷ bởi KH</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '230px' }}>
                <InputLabel>Trạng thái thanh toán</InputLabel>
                <Select
                  value={filters.paymentStatus}
                  label="Trạng thái thanh toán"
                  name="payment_status"
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                >
                  <MenuItem value={undefined}></MenuItem>
                  <MenuItem value="waiting_for_payment">Đang chờ thanh toán</MenuItem>
                  <MenuItem value="paid">Đã thanh toán</MenuItem>
                  <MenuItem value="refund">Đã hoàn tiền</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>Trạng thái xuất vé</InputLabel>
                <Select
                  value={filters.sentTicketEmailStatus}
                  label="Trạng thái xuất vé"
                  name="type"
                  onChange={(e) => handleFilterChange('sentTicketEmailStatus', e.target.value)}
                >
                  <MenuItem value={undefined}></MenuItem>
                  <MenuItem value="not_sent">Chưa xuất vé</MenuItem>
                  <MenuItem value="sent">Đã xuất vé</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>Trạng thái check-in</InputLabel>
                <Select
                  value={filters.checkInStatus}
                  label="Trạng thái check-in"
                  name="type"
                  onChange={(e) => handleFilterChange('checkInStatus', e.target.value)}
                >
                  <MenuItem value={undefined}></MenuItem>
                  <MenuItem value="not_checked">Chưa check-in</MenuItem>
                  <MenuItem value="checked">Đã check-in</MenuItem>
                </Select>
              </FormControl>
              <IconButton onClick={handleClearFilters}>
                <X />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
      </Card>
      <TicketsTable
        count={filteredTickets.length}
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
