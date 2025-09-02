'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { AxiosResponse } from 'axios';
import * as React from 'react';

import NotificationContext from '@/contexts/notification-context';
import { FormControl, Grid, IconButton, InputLabel, MenuItem, Select } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { ArrowCounterClockwise, Empty, X } from '@phosphor-icons/react/dist/ssr';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { debounce } from 'lodash';
import RouterLink from 'next/link';
import { TicketsTable } from './tickets-table';


interface FilterTicketCategory {
  id: number;
  name: string;
}

interface FilterShow {
  id: number;
  eventId: number;
  name: string;
  startDateTime?: string | null; // ISO string format for datetime
  endDateTime?: string | null;   // ISO string format for datetime
  ticketCategories: FilterTicketCategory[];
}

interface Show {
  id: number;
  eventId: number;
  name: string;
}

interface TicketCategory {
  id: number;
  name: string;
  show: Show;
}

interface Transaction {
  id: number;
  email: string;
  name: string;
  phoneNumber: string;
  status: string;
  paymentStatus: string;
  exportedTicketAt?: string | null; // ISO date string or null
  cancelRequestStatus: string | null;
}

interface TransactionTicketCategory {
  netPricePerOne: number;
  ticketCategory: TicketCategory;
  transaction: Transaction;
}

export interface Ticket {
  id: number;
  transactionId: number;
  createdAt: string; // ISO date string
  ticketCategoryId: number;
  holderName: string;
  checkInAt?: string | null; // ISO date string or null
  transactionTicketCategory: TransactionTicketCategory;
}

interface Filter {
  show: number | null;
  ticketCategory: number | null;
  status: string;
  paymentStatus: string;
  sentTicketEmailStatus: string;
  checkInStatus: string;
  cancelRequestStatus: string;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Danh sách khách hàng & vé | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const notificationCtx = React.useContext(NotificationContext);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [filters, setFilters] = React.useState<Filter>({
    show: null,
    ticketCategory: null,
    status: '',
    paymentStatus: '',
    sentTicketEmailStatus: '',
    checkInStatus: '',
    cancelRequestStatus: '',
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleClearFilters = () => {
    setFilters({
      show: null,
      ticketCategory: null,
      status: '',
      paymentStatus: '',
      sentTicketEmailStatus: '',
      checkInStatus: '',
      cancelRequestStatus: '',
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
      notificationCtx.error('Lỗi:', error);
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
          `/event-studio/events/${params.event_id}/tickets/get-shows-and-ticket-categories`
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


  const ticketIds = React.useMemo(() => {
    return tickets.map((ticket) => ticket.id);
  }, [tickets]);

  React.useEffect(() => {
    setSelected(new Set());
  }, []);

  const handleSelectMultiple = React.useCallback((rowIds: number[]) => {
    setSelected((prev) => {
      return new Set([...Array.from(prev), ...rowIds]);
    });
  }, []);

  const handleDeselectMultiple = React.useCallback((rowIds: number[]) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      for (let rowId of rowIds) {
        copy.delete(rowId);
      }
      return copy;
    });
  }, []);

  const handleSelectAll = React.useCallback(() => {
    setSelected(new Set(ticketIds));
  }, [ticketIds]);

  const handleDeselectAll = React.useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleDeselectOne = React.useCallback((key: number) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      copy.delete(key);
      return copy;
    });
  }, []);

  const handleSelectOne = React.useCallback((key: number) => {
    setSelected((prev) => {
      const copy = new Set(prev);
      copy.add(key);
      return copy;
    });
  }, []);

  const debounceQuerySearch = React.useCallback(debounce((value) => setQuerySearch(value), 500), [])

  const handleSearchTickets = (event: React.ChangeEvent<HTMLInputElement>) => {
    debounceQuerySearch(event.target.value);
  }

  const filteredTickets = React.useMemo(() => {
    return tickets.filter((ticket) => {
      // Search filter
      if (querySearch && !(
        (ticket.id.toString().includes(querySearch.toLocaleLowerCase())) ||
        (ticket.holderName.toLowerCase().includes(querySearch.toLowerCase())) ||
        (ticket.transactionTicketCategory.transaction.id.toString().includes(querySearch.toLocaleLowerCase())) ||
        (ticket.transactionTicketCategory.transaction.email.toLowerCase().includes(querySearch.toLowerCase())) ||
        (ticket.transactionTicketCategory.transaction.name.toLowerCase().includes(querySearch.toLowerCase())) ||
        (ticket.transactionTicketCategory.transaction.phoneNumber.toLowerCase().includes(querySearch.toLowerCase()))
      )) {
        return false;
      }

      // Show filter
      if (filters.show && ticket.transactionTicketCategory.ticketCategory.show.id !== filters.show) {
        return false;
      }

      // Ticket Category filter
      if (filters.ticketCategory && ticket.ticketCategoryId !== filters.ticketCategory) {
        return false;
      }

      // Transaction Status filter
      if (filters.status && ticket.transactionTicketCategory.transaction.status !== filters.status) {
        return false;
      }

      // Payment Status filter
      if (filters.paymentStatus && ticket.transactionTicketCategory.transaction.paymentStatus !== filters.paymentStatus) {
        return false;
      }

      // Sent Ticket Email Status filter
      if (filters.sentTicketEmailStatus && filters.sentTicketEmailStatus === 'sent' && !ticket.transactionTicketCategory.transaction.exportedTicketAt) {
        return false;
      }
      if (filters.sentTicketEmailStatus && filters.sentTicketEmailStatus === 'not_sent' && ticket.transactionTicketCategory.transaction.exportedTicketAt) {
        return false;
      }

      // Check-in Status filter
      if (filters.checkInStatus && filters.checkInStatus === 'checked' && !ticket.checkInAt) {
        return false;
      }
      if (filters.checkInStatus && filters.checkInStatus === 'not_checked' && ticket.checkInAt) {
        return false;
      }

      // Cancel request status filter
      if (filters.cancelRequestStatus && filters.cancelRequestStatus === 'pending' && ticket.transactionTicketCategory.transaction.cancelRequestStatus != 'pending') {
        return false;
      }

      // Cancel request status filter
      if (filters.cancelRequestStatus && filters.cancelRequestStatus === 'no_request' && ticket.transactionTicketCategory.transaction.cancelRequestStatus != null) {
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
            component={RouterLink}
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
              defaultValue={querySearch}
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
                  name="show"
                  onChange={(e) => handleFilterChange('show', Number(e.target.value))}
                >
                  <MenuItem value={''}><Empty /></MenuItem>
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
                  name="ticketCategory"
                  onChange={(e) => handleFilterChange('ticketCategory', Number(e.target.value))}
                >
                  <MenuItem value={''}><Empty /></MenuItem>
                  {
                    filterShows.find(show => show.id === filters.show)?.ticketCategories.map(tc => (
                      <MenuItem key={tc.id} value={tc.id}>{tc.name}</MenuItem>
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
                  <MenuItem value={''}><Empty /></MenuItem>
                  <MenuItem value="normal">Bình thường</MenuItem>
                  <MenuItem value="wait_for_response">Đang chờ</MenuItem>
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
                  <MenuItem value={''}><Empty /></MenuItem>
                  <MenuItem value="waiting_for_payment">Chờ thanh toán</MenuItem>
                  <MenuItem value="paid">Đã thanh toán</MenuItem>
                  <MenuItem value="refund">Đã hoàn tiền</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>Trạng thái xuất vé</InputLabel>
                <Select
                  value={filters.sentTicketEmailStatus}
                  label="Trạng thái xuất vé"
                  name="sentTicketEmailStatus"
                  onChange={(e) => handleFilterChange('sentTicketEmailStatus', e.target.value)}
                >
                  <MenuItem value={''}><Empty /></MenuItem>
                  <MenuItem value="not_sent">Chưa xuất vé</MenuItem>
                  <MenuItem value="sent">Đã xuất vé</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>Trạng thái check-in</InputLabel>
                <Select
                  value={filters.checkInStatus}
                  label="Trạng thái check-in"
                  name="checkInStatus"
                  onChange={(e) => handleFilterChange('checkInStatus', e.target.value)}
                >
                  <MenuItem value={''}><Empty /></MenuItem>
                  <MenuItem value="not_checked">Chưa check-in</MenuItem>
                  <MenuItem value="checked">Đã check-in</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>Trạng thái yêu cầu hủy</InputLabel>
                <Select
                  value={filters.cancelRequestStatus}
                  label="Trạng thái yêu cầu hủy"
                  name="cancelRequestStatus"
                  onChange={(e) => handleFilterChange('cancelRequestStatus', e.target.value)}
                >
                  <MenuItem value={''}><Empty /></MenuItem>
                  <MenuItem value="pending">Đang yêu cầu hủy</MenuItem>
                  <MenuItem value="no_request">Không có yêu cầu hủy</MenuItem>
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
        selected={selected}
        onSelectMultiple={handleSelectMultiple}
        onDeselectMultiple={handleDeselectMultiple}
        onSelectOne={handleSelectOne}
        onDeselectOne={handleDeselectOne}
      />
    </Stack>
  );
}

function applyPagination(rows: Ticket[], page: number, rowsPerPage: number): Ticket[] {
  return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
}
