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
import { Transaction, TransactionsTable } from './transactions-table';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { debounce } from 'lodash';
import { ArrowCounterClockwise, X } from '@phosphor-icons/react/dist/ssr';
import { Grid, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import { Empty } from '@phosphor-icons/react';
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

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Danh sách đơn hàng | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [querySearch, setQuerySearch] = React.useState<string>('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [filterShows, setFilterShows] = React.useState<FilterShow[]>([]);

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0); // Reset to the first page whenever rows per page change
  };

  const debounceQuerySearch = React.useCallback(debounce((value) => setQuerySearch(value), 500), [])

  const handleSearchTransactions = (event: React.ChangeEvent<HTMLInputElement>) => {
    debounceQuerySearch(event.target.value);
  }
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const [filters, setFilters] = React.useState({
    status: '',
    paymentStatus: '',
    sentTicketEmailStatus: '',
  });


  const handleFilterChange = (key: string, value: any) => {
    setFilters((prevFilters) => ({ ...prevFilters, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      paymentStatus: '',
      sentTicketEmailStatus: '',
    })
  }

  async function fetchTransactions() {
    try {
      setIsLoading(true);
      const response: AxiosResponse<Transaction[]> = await baseHttpServiceInstance.get(
        `/event-studio/events/${params.event_id}/transactions`
      );
      setTransactions(response.data);
    } catch (error) {
      notificationCtx.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch transactions for the event
  React.useEffect(() => {
    fetchTransactions();
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


  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((transaction) => {
      if (querySearch && !(
        (transaction.email.toLocaleLowerCase().includes(querySearch.toLocaleLowerCase())) ||
        (transaction.name.toLocaleLowerCase().includes(querySearch.toLocaleLowerCase())) ||
        (transaction.phoneNumber.toLocaleLowerCase().includes(querySearch.toLocaleLowerCase())) ||
        (transaction.createdAt.toLocaleLowerCase().includes(querySearch.toLocaleLowerCase()))
      )) {
        return false;
      }

      // Transaction Status filter
      if (filters.status && transaction.status !== filters.status) {
        return false;
      }

      // Payment Status filter
      if (filters.paymentStatus && transaction.paymentStatus !== filters.paymentStatus) {
        return false;
      }

      // Sent Ticket Email Status filter
      if (filters.sentTicketEmailStatus && filters.sentTicketEmailStatus === 'sent' && !transaction.sentTicketEmailAt) {
        return false;
      }
      if (filters.sentTicketEmailStatus && filters.sentTicketEmailStatus === 'not_sent' && transaction.sentTicketEmailAt) {
        return false;
      }

      return true;
    });
  }, [transactions, querySearch, filters]);

  const paginatedCustomers = applyPagination(filteredTransactions, page, rowsPerPage);

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
          <Typography variant="h4">Danh sách đơn hàng</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button color="inherit" startIcon={<ArrowCounterClockwise fontSize="var(--icon-fontSize-md)" />} onClick={fetchTransactions}>
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
              defaultValue={querySearch}
              placeholder="Tìm kiếm đơn hàng..."
              onChange={handleSearchTransactions}
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
                <InputLabel>Trạng thái đơn hàng</InputLabel>
                <Select
                  value={filters.status}
                  label="Trạng thái đơn hàng"
                  name="status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value={''}><Empty /></MenuItem>
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
                  <MenuItem value={''}><Empty /></MenuItem>
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
                  name="sentTicketEmailStatus"
                  onChange={(e) => handleFilterChange('sentTicketEmailStatus', e.target.value)}
                >
                  <MenuItem value={''}><Empty /></MenuItem>
                  <MenuItem value="not_sent">Chưa xuất vé</MenuItem>
                  <MenuItem value="sent">Đã xuất vé</MenuItem>
                </Select>
              </FormControl>
              <IconButton onClick={handleClearFilters}>
                <X />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>
      </Card>
      <TransactionsTable
        count={filteredTransactions.length}
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

function applyPagination(rows: Transaction[], page: number, rowsPerPage: number): Transaction[] {
  return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
}
