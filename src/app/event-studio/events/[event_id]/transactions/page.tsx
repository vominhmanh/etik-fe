'use client';

import * as React from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { Upload as UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';
import axios, { AxiosError, AxiosResponse } from 'axios';
import RouterLink from 'next/link';

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
import { Grid, FormControl, InputLabel, Select, MenuItem, IconButton, Box, Menu, Divider, CardContent, Table, TableBody, TableCell, TableHead, TableRow, useTheme } from '@mui/material';
import { ArrowBendLeftDown, CaretDown, Empty } from '@phosphor-icons/react';
import { useSelection } from '@/hooks/use-selection';
import dayjs from 'dayjs';
import { HistoryAction } from './[transaction_id]/page';

interface BulkErrorDetail {
  id: number;
  email: string | null;
  reason: string;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Danh sách đơn hàng | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const theme = useTheme();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [querySearch, setQuerySearch] = React.useState<string>('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [bulkErrorMessage, setBulkErrorMessage] = React.useState<string>('');
  const [bulkErrorDetails, setBulkErrorDetails] = React.useState<BulkErrorDetail[]>([]);

  const transactionIds = React.useMemo(() => {
    return transactions.map((transaction) => transaction.id);
  }, [transactions]);

  const [selected, setSelected] = React.useState<Set<number>>(new Set());

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
    setSelected(new Set(transactionIds));
  }, [transactionIds]);

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

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((transaction) => {
      if (querySearch && !(
        (transaction.id.toString().includes(querySearch.toLocaleLowerCase())) ||
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
      if (filters.sentTicketEmailStatus && filters.sentTicketEmailStatus === 'sent' && !transaction.exportedTicketAt) {
        return false;
      }
      if (filters.sentTicketEmailStatus && filters.sentTicketEmailStatus === 'not_sent' && transaction.exportedTicketAt) {
        return false;
      }

      return true;
    });
  }, [transactions, querySearch, filters]);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [paymentAnchorEl, setPaymentAnchorEl] = React.useState<null | HTMLElement>(null);
  const [ticketAnchorEl, setTicketAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const paymentOpen = Boolean(paymentAnchorEl);
  const ticketOpen = Boolean(ticketAnchorEl);

  const handleClick = (setter: React.Dispatch<React.SetStateAction<null | HTMLElement>>) =>
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setter(event.currentTarget);
    };

  const handleClose = (setter: React.Dispatch<React.SetStateAction<null | HTMLElement>>) => () => {
    setter(null);
  };

  const handleSendTicketBulk = async (channel: string | null = null) => {
    setTicketAnchorEl(null)
    if (selected.size === 0) {
      notificationCtx.warning(`Vui lòng chọn ít nhất một đơn hàng để thao tác.`);
      return
    }
    setBulkErrorMessage('');
    setBulkErrorDetails([]);
    try {
      setIsLoading(true); // Optional: Show loading state
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/transactions/send-ticket-bulk`, channel ? { transactionIds: Array.from(selected), channel: channel } : { transactionIds: Array.from(selected) },
        {}, true
      )

      // Optionally handle response
      if (response.status === 200) {
        notificationCtx.success(response.data.message);
        fetchTransactions()
      }
    } catch (error: any) {
      if (error.response?.data.detail.message) {
        // Access the message and errors array
        const message = error.response?.data.detail.message; // "Không thể thực hiện bởi các lỗi sau"
        const errors = error.response?.data.detail.errorDetails || []; // Array of error details
        // You can also use this data in your UI
        setBulkErrorMessage(message);
        setBulkErrorDetails(errors);
      } else if (error.response?.data.detail) {
        notificationCtx.error(error.response?.data.detail);
      } else {
        notificationCtx.error(error);
      }
    } finally {
      setIsLoading(false); // Optional: Hide loading state
    }
  };

  const handleSetTransactionStatusBulk = async (status: string) => {
    setAnchorEl(null)
    if (selected.size === 0) {
      notificationCtx.warning(`Vui lòng chọn ít nhất một đơn hàng để thao tác.`);
      return
    }
    setBulkErrorMessage('');
    setBulkErrorDetails([]);
    try {
      setIsLoading(true); // Optional: Show loading state
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/transactions/set-transaction-status-bulk`, { transactionIds: Array.from(selected), status },
        {}, true
      )

      // Optionally handle response
      if (response.status === 200) {
        notificationCtx.success(response.data.message);
        fetchTransactions()
      }
    } catch (error: any) {
      if (error.response?.data.detail.message) {
        // Access the message and errors array
        const message = error.response?.data.detail.message; // "Không thể thực hiện bởi các lỗi sau"
        const errors = error.response?.data.detail.errorDetails || []; // Array of error details
        // You can also use this data in your UI
        setBulkErrorMessage(message);
        setBulkErrorDetails(errors);
      } else if (error.response?.data.detail) {
        notificationCtx.error(error.response?.data.detail);
      } else {
        notificationCtx.error(error);
      }
    } finally {
      setIsLoading(false); // Optional: Hide loading state
    }
  };
  
  const handleSendPaymentInstructionForTransactionBulk = async (channel: string) => {
    setPaymentAnchorEl(null)
    if (selected.size === 0) {
      notificationCtx.warning(`Vui lòng chọn ít nhất một đơn hàng để thao tác.`);
      return
    }
    setBulkErrorMessage('');
    setBulkErrorDetails([]);
    try {
      setIsLoading(true); // Optional: Show loading state
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/transactions/send-payment-instruction-bulk`, { transactionIds: Array.from(selected), channel },
        {}, true
      )

      // Optionally handle response
      if (response.status === 200) {
        notificationCtx.success(response.data.message);
        // fetchTransactions()
      }
    } catch (error: any) {
      if (error.response?.data.detail.message) {
        // Access the message and errors array
        const message = error.response?.data.detail.message; // "Không thể thực hiện bởi các lỗi sau"
        const errors = error.response?.data.detail.errorDetails || []; // Array of error details
        // You can also use this data in your UI
        setBulkErrorMessage(message);
        setBulkErrorDetails(errors);
      } else if (error.response?.data.detail) {
        notificationCtx.error(error.response?.data.detail);
      } else {
        notificationCtx.error(error);
      }
    } finally {
      setIsLoading(false); // Optional: Hide loading state
    }
  };

  const handleSetPaidForTransactionBulk = async () => {
    setPaymentAnchorEl(null)
    if (selected.size === 0) {
      notificationCtx.warning(`Vui lòng chọn ít nhất một đơn hàng để thao tác.`);
      return
    }
    setBulkErrorMessage('');
    setBulkErrorDetails([]);
    try {
      setIsLoading(true); // Optional: Show loading state
      const response: AxiosResponse = await baseHttpServiceInstance.put(
        `/event-studio/events/${params.event_id}/transactions/set-paid-for-transaction-bulk`, { transactionIds: Array.from(selected) },
        {}, true
      )

      // Optionally handle response
      if (response.status === 200) {
        notificationCtx.success(response.data.message);
        fetchTransactions()
      }
    } catch (error: any) {
      if (error.response?.data.detail.message) {
        // Access the message and errors array
        const message = error.response?.data.detail.message; // "Không thể thực hiện bởi các lỗi sau"
        const errors = error.response?.data.detail.errorDetails || []; // Array of error details
        // You can also use this data in your UI
        setBulkErrorMessage(message);
        setBulkErrorDetails(errors);
      } else if (error.response?.data.detail) {
        notificationCtx.error(error.response?.data.detail);
      } else {
        notificationCtx.error(error);
      }
    } finally {
      setIsLoading(false); // Optional: Hide loading state
    }
  };

  const handleSetRefundForTransactionBulk = async () => {
    setPaymentAnchorEl(null)
    if (selected.size === 0) {
      notificationCtx.warning(`Vui lòng chọn ít nhất một đơn hàng để thao tác.`);
      return
    }
    setBulkErrorMessage('');
    setBulkErrorDetails([]);
    try {
      setIsLoading(true); // Optional: Show loading state
      const response: AxiosResponse = await baseHttpServiceInstance.put(
        `/event-studio/events/${params.event_id}/transactions/set-refund-for-transaction-bulk`, { transactionIds: Array.from(selected) },
        {}, true
      )

      // Optionally handle response
      if (response.status === 200) {
        notificationCtx.success(response.data.message);
        fetchTransactions()
      }
    } catch (error: any) {
      if (error.response?.data.detail.message) {
        // Access the message and errors array
        const message = error.response?.data.detail.message; // "Không thể thực hiện bởi các lỗi sau"
        const errors = error.response?.data.detail.errorDetails || []; // Array of error details
        // You can also use this data in your UI
        setBulkErrorMessage(message);
        setBulkErrorDetails(errors);
      } else if (error.response?.data.detail) {
        notificationCtx.error(error.response?.data.detail);
      } else {
        notificationCtx.error(error);
      }
    } finally {
      setIsLoading(false); // Optional: Hide loading state
    }
  };

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
      <Card>
        <Box sx={{ overflowX: 'auto' }} >
          <Stack spacing={1} direction={'row'} sx={{ flexWrap: 'no-wrap', minWidth: '900px', alignItems: 'center' }}>
            <Button
              sx={{ ml: '37px' }}
              size='small'
              id="basic-button"
              aria-controls={open ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleSelectAll}
            >
              Chọn tất cả
            </Button>
            <Button
              size='small'
              id="basic-button"
              aria-controls={open ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleDeselectAll}
            >
              Bỏ chọn tất cả
            </Button>
            <Typography variant='body2' sx={{ ml: '37px' }}>
              Thao tác nhanh{selected.size > 0 ? ` ${selected.size} đơn hàng` : ''}:
            </Typography>

            {/* Menu for Đơn hàng */}
            <Button
              size='small'
              id="basic-button"
              aria-controls={open ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleClick(setAnchorEl)}
              endIcon={<CaretDown />}
            >
              Đơn hàng
            </Button>
            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose(setAnchorEl)}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
            >
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => handleSetTransactionStatusBulk('staff_locked')}>Chuyển trạng thái 'Khoá bởi Nhân viên'</MenuItem>
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => handleSetTransactionStatusBulk('customer_cancelled')}>Chuyển trạng thái 'Huỷ bởi Khách hàng'</MenuItem>
            </Menu>

            {/* Menu for Thanh toán */}
            <Button
              size='small'
              id="payment-button"
              aria-controls={paymentOpen ? 'payment-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={paymentOpen ? 'true' : undefined}
              onClick={handleClick(setPaymentAnchorEl)}
              endIcon={<CaretDown />}
            >
              Thanh toán
            </Button>
            <Menu
              id="payment-menu"
              anchorEl={paymentAnchorEl}
              open={paymentOpen}
              onClose={handleClose(setPaymentAnchorEl)}
              MenuListProps={{
                'aria-labelledby': 'payment-button',
              }}
            >
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => { handleSendPaymentInstructionForTransactionBulk('email')}}>Gửi h.dẫn t.toán đơn Napas247 qua email</MenuItem>
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => { handleSendPaymentInstructionForTransactionBulk('zalo')}}>Gửi h.dẫn t.toán đơn Napas247 qua Zalo</MenuItem>
              <MenuItem sx={{ fontSize: '14px' }} onClick={handleSetPaidForTransactionBulk}>Chuyển trạng thái 'Đã thanh toán'</MenuItem>
              <MenuItem sx={{ fontSize: '14px' }} onClick={handleSetRefundForTransactionBulk}>Chuyển trạng thái 'Đã hoàn tiền'</MenuItem>
            </Menu>

            {/* Menu for Xuất vé */}
            <Button
              size='small'
              id="ticket-button"
              aria-controls={ticketOpen ? 'ticket-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={ticketOpen ? 'true' : undefined}
              onClick={handleClick(setTicketAnchorEl)}
              endIcon={<CaretDown />}
            >
              Xuất vé
            </Button>
            <Menu
              id="ticket-menu"
              anchorEl={ticketAnchorEl}
              open={ticketOpen}
              onClose={handleClose(setTicketAnchorEl)}
              MenuListProps={{
                'aria-labelledby': 'ticket-button',
              }}
            >
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => { handleSendTicketBulk('email') }}>Xuất vé + gửi Email</MenuItem>
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => { handleSendTicketBulk('zalo') }}>Xuất vé + gửi Zalo</MenuItem>
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => { handleSendTicketBulk() }}>Xuất vé không gửi</MenuItem>
            </Menu>
          </Stack>
        </Box>
        <Divider />
        <Box sx={{ overflowX: 'auto' }} >

        </Box>
      </Card>
      {bulkErrorMessage &&
        <Card>
          <Box sx={{ overflowX: 'auto', pl: '50px', bgcolor: theme.palette.warning[200], }} >
            <Typography variant='body2' >
              <b>{bulkErrorMessage}</b>
            </Typography>
          </Box>
          <Box sx={{ overflow: 'auto', pl: '35px', maxHeight: '200px', bgcolor: theme.palette.warning[200] }} >
            <Table size="small" sx={{ minWidth: '500px' }}>
              <TableBody>
                {bulkErrorDetails.map((error) => (
                  <TableRow hover key={error.id}>
                    <TableCell>
                      {error.id}
                    </TableCell>
                    <TableCell>
                      {error.email}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{error.reason}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>}
      <TransactionsTable
        count={filteredTransactions.length}
        page={page}
        rows={paginatedCustomers}
        rowsPerPage={rowsPerPage}
        eventId={params.event_id}
        selected={selected}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSelectMultiple={handleSelectMultiple}
        onDeselectMultiple={handleDeselectMultiple}
        onSelectOne={handleSelectOne}
        onDeselectOne={handleDeselectOne}
      />
    </Stack>
  );
}

function applyPagination(rows: Transaction[], page: number, rowsPerPage: number): Transaction[] {
  return rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
}
