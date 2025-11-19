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
import { Checkbox, FormControl, FormControlLabel, Grid, IconButton, InputLabel, ListItemText, MenuItem, Select, Switch } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { ArrowCounterClockwise, Empty, MicrosoftExcelLogo, X } from '@phosphor-icons/react/dist/ssr';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { debounce } from 'lodash';
import { LocalizedLink } from '@/components/localized-link';
import { useTranslation } from '@/contexts/locale-context';

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
  show: number[];
  ticketCategory: number[];
  status: string[];
  paymentStatus: string[];
  sentTicketEmailStatus: string[];
  checkInStatus: string[];
  cancelRequestStatus: string[];
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt } = useTranslation();
  const STORAGE_KEY = `tickets-table-sort-${params.event_id}`;
  const AUTO_RELOAD_STORAGE_KEY = `tickets-auto-reload-${params.event_id}`;
  React.useEffect(() => {
    document.title = tt("Danh sách khách hàng & vé | ETIK - Vé điện tử & Quản lý sự kiện", "Customer & Ticket List | ETIK - E-tickets & Event Management");
  }, [tt]);
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const notificationCtx = React.useContext(NotificationContext);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [autoReload, setAutoReload] = React.useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(AUTO_RELOAD_STORAGE_KEY);
      if (saved !== null) {
        try {
          return JSON.parse(saved) === true;
        } catch {
          return false;
        }
      }
    }
    return false; // Default: off
  });
  const [isAutoReloading, setIsAutoReloading] = React.useState<boolean>(false);
  const [filters, setFilters] = React.useState<Filter>({
    show: [],
    ticketCategory: [],
    status: [],
    paymentStatus: [],
    sentTicketEmailStatus: [],
    checkInStatus: [],
    cancelRequestStatus: [],
  });
  const [filterShows, setFilterShows] = React.useState<FilterShow[]>([]);
  const [querySearch, setQuerySearch] = React.useState<string>('');

  // Load sorting state from localStorage
  const [orderBy, setOrderBy] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.orderBy || '';
        } catch {
          return '';
        }
      }
    }
    return '';
  });

  const [order, setOrder] = React.useState<'asc' | 'desc'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.order || 'asc';
        } catch {
          return 'asc';
        }
      }
    }
    return 'asc';
  });

  // Save to localStorage when sorting changes
  React.useEffect(() => {
    if (typeof window !== 'undefined' && orderBy) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ orderBy, order }));
    }
  }, [orderBy, order, STORAGE_KEY]);

  const handleSortChange = (newOrderBy: string, newOrder: 'asc' | 'desc') => {
    setOrderBy(newOrderBy);
    setOrder(newOrder);
    setPage(0); // Reset to first page when sorting changes
  };

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
      show: [],
      ticketCategory: [],
      status: [],
      paymentStatus: [],
      sentTicketEmailStatus: [],
      checkInStatus: [],
      cancelRequestStatus: [],
    })
  }

  function normalizeText(text: string): string {
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }

  // Fetch tickets for the event 
  const fetchTickets = React.useCallback(async (showBackdrop: boolean = true) => {
    try {
      if (showBackdrop) {
        setIsLoading(true);
      } else {
        setIsAutoReloading(true);
      }
      const response: AxiosResponse<Ticket[]> = await baseHttpServiceInstance.get(
        `/event-studio/events/${params.event_id}/tickets`
      );
      setTickets(response.data);
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      if (showBackdrop) {
        setIsLoading(false);
      } else {
        setIsAutoReloading(false);
      }
    }
  }, [params.event_id, notificationCtx]);

  const handleExportExcel = async () => {
    try {
      setIsLoading(true);
      const response: AxiosResponse<Blob> = await baseHttpServiceInstance.get(
        `/event-studio/events/${params.event_id}/tickets/export`,
        { responseType: 'blob' }
      );

      const defaultFilename = `tickets-${params.event_id}.xlsx`;
      const contentDisposition = (response.headers as any)?.['content-disposition'] as string | undefined;
      let filename = defaultFilename;
      if (contentDisposition) {
        const match = /filename\*?=(?:UTF-8''|")?([^;\n"]+)/i.exec(contentDisposition);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1].replace(/\"/g, '')); 
        }
      }

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      notificationCtx.success('Đã xuất file Excel');
    } catch (error) {
      notificationCtx.error('Xuất file thất bại:', error);
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    fetchTickets();
  }, [params.event_id, fetchTickets]);

  // Save auto reload state to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTO_RELOAD_STORAGE_KEY, JSON.stringify(autoReload));
    }
  }, [autoReload, AUTO_RELOAD_STORAGE_KEY]);

  // Auto reload interval
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoReload) {
      intervalId = setInterval(() => {
        fetchTickets(false); // Don't show backdrop during auto reload
      }, 5000); // 5 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoReload, fetchTickets]);

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
    const q = normalizeText(querySearch);
    let filtered = tickets.filter((ticket) => {
      // Search filter
      if (querySearch && !(
        (ticket.id.toString().includes(querySearch.toLocaleLowerCase())) ||
        (normalizeText(ticket.holderName).includes(q)) ||
        (ticket.transactionTicketCategory.transaction.id.toString().includes(querySearch.toLocaleLowerCase())) ||
        (normalizeText(ticket.transactionTicketCategory.transaction.email).includes(q)) ||
        (normalizeText(ticket.transactionTicketCategory.transaction.name).includes(q)) ||
        (ticket.transactionTicketCategory.transaction.phoneNumber.toLowerCase().includes(querySearch.toLowerCase())) ||
        (
          ticket.transactionTicketCategory.transaction.phoneNumber
            .replace(/\s+/g, '')
            .replace(/^\+84/, '0')
            .toLocaleLowerCase()
            .includes(querySearch.replace(/\s+/g, '').replace(/^\+84/, '0').toLocaleLowerCase())
        )
      )) {
        return false;
      }

      // Show filter
      if (filters.show.length > 0 && !filters.show.includes(ticket.transactionTicketCategory.ticketCategory.show.id)) {
        return false;
      }

      // Ticket Category filter
      if (filters.ticketCategory.length > 0 && !filters.ticketCategory.includes(ticket.ticketCategoryId)) {
        return false;
      }

      // Transaction Status filter
      if (filters.status.length > 0 && !filters.status.includes(ticket.transactionTicketCategory.transaction.status)) {
        return false;
      }

      // Payment Status filter
      if (filters.paymentStatus.length > 0 && !filters.paymentStatus.includes(ticket.transactionTicketCategory.transaction.paymentStatus)) {
        return false;
      }

      // Sent Ticket Email Status filter
      if (filters.sentTicketEmailStatus.length > 0) {
        const isSent = !!ticket.transactionTicketCategory.transaction.exportedTicketAt;
        const shouldInclude = 
          (filters.sentTicketEmailStatus.includes('sent') && isSent) ||
          (filters.sentTicketEmailStatus.includes('not_sent') && !isSent);
        if (!shouldInclude) {
          return false;
        }
      }

      // Check-in Status filter
      if (filters.checkInStatus.length > 0) {
        const isChecked = !!ticket.checkInAt;
        const shouldInclude = 
          (filters.checkInStatus.includes('checked') && isChecked) ||
          (filters.checkInStatus.includes('not_checked') && !isChecked);
        if (!shouldInclude) {
          return false;
        }
      }

      // Cancel request status filter
      if (filters.cancelRequestStatus.length > 0) {
        const isPending = ticket.transactionTicketCategory.transaction.cancelRequestStatus === 'pending';
        const hasNoRequest = ticket.transactionTicketCategory.transaction.cancelRequestStatus == null;
        const shouldInclude = 
          (filters.cancelRequestStatus.includes('pending') && isPending) ||
          (filters.cancelRequestStatus.includes('no_request') && hasNoRequest);
        if (!shouldInclude) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting
    if (orderBy) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | null = null;
        let bValue: string | null = null;

        if (orderBy === 'createdAt') {
          aValue = a.createdAt;
          bValue = b.createdAt;
        } else if (orderBy === 'checkInAt') {
          aValue = a.checkInAt || null;
          bValue = b.checkInAt || null;
        }

        // Handle null values - put nulls at the end
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return 1;
        if (bValue === null) return -1;

        // Compare dates
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();

        if (order === 'asc') {
          return aDate - bDate;
        } else {
          return bDate - aDate;
        }
      });
    }

    return filtered;
  }, [tickets, querySearch, filters, orderBy, order]);

  const paginatedCustomers = applyPagination(filteredTickets, page, rowsPerPage);


  return (
    <Stack spacing={3}>
      <Backdrop
        open={isLoading && !autoReload}
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
          <Typography variant="h4">{tt("Danh sách khách hàng & vé", "Customer & Ticket List")}</Typography>
          
        </Stack>
        <div>
          <Button
            startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
            component={LocalizedLink}
            href="transactions/create"
            variant="contained"
          >
            {tt("Thêm", "Add")}
          </Button>
        </div>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button color="inherit" startIcon={<ArrowCounterClockwise fontSize="var(--icon-fontSize-md)" />} onClick={() => fetchTickets()}>
              {tt("Tải lại", "Reload")}
            </Button>
            <FormControlLabel
              control={
                <Switch
                  checked={autoReload}
                  onChange={(e) => setAutoReload(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Typography variant="body2">{tt("Live Update", "Live Update")}</Typography>
                  {isAutoReloading && (
                    <CircularProgress size={14} sx={{ ml: 0.5 }} />
                  )}
                </Stack>
              }
              sx={{ ml: 1 }}
            />
            <Button color="inherit" startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)" />} onClick={handleExportExcel}>
              {tt("Xuất file excel", "Export Excel")}
            </Button>
            <Button color="inherit" startIcon={<MicrosoftExcelLogo fontSize="var(--icon-fontSize-md)" />}>
              {tt("Đồng bộ Google Sheets", "Sync Google Sheets")}
            </Button>
          </Stack>
      <Card sx={{ p: 2 }}>
        <Grid container spacing={3} direction={'row'} sx={{ alignItems: 'center' }}>
          <Grid item xs={12} md={3}>
            <OutlinedInput
              fullWidth
              defaultValue={querySearch}
              placeholder={tt("Tìm kiếm khách hàng và vé...", "Search customers and tickets...")}
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
                  multiple
                  value={filters.show}
                  label="Suất diễn"
                  name="show"
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange('show', typeof value === 'string' ? value.split(',').map(Number) : (value as number[]));
                  }}
                  renderValue={(selected) => (selected as number[]).length === 0 ? 'Tất cả' : `${(selected as number[]).length} đã chọn`}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {filterShows.map(show => (
                    <MenuItem key={show.id} value={show.id}>
                      <Checkbox checked={filters.show.includes(show.id)} />
                      <ListItemText primary={show.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>Loại vé</InputLabel>
                <Select
                  multiple
                  value={filters.ticketCategory}
                  label="Loại vé"
                  name="ticketCategory"
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange('ticketCategory', typeof value === 'string' ? value.split(',').map(Number) : (value as number[]));
                  }}
                  renderValue={(selected) => (selected as number[]).length === 0 ? 'Tất cả' : `${(selected as number[]).length} đã chọn`}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {
                    filterShows
                      .filter(show => filters.show.length === 0 || filters.show.includes(show.id))
                      .flatMap(show => show.ticketCategories)
                      .map(tc => (
                        <MenuItem key={tc.id} value={tc.id}>
                          <Checkbox checked={filters.ticketCategory.includes(tc.id)} />
                          <ListItemText primary={tc.name} />
                        </MenuItem>
                      ))
                  }
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>Trạng thái đơn hàng</InputLabel>
                <Select
                  multiple
                  value={filters.status}
                  label="Trạng thái đơn hàng"
                  name="status"
                  onChange={(e) => handleFilterChange('status', e.target.value as string[])}
                  renderValue={(selected) => (selected as string[]).length === 0 ? 'Tất cả' : `${(selected as string[]).length} đã chọn`}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="normal">
                    <Checkbox checked={filters.status.includes('normal')} />
                    <ListItemText primary="Bình thường" />
                  </MenuItem>
                  <MenuItem value="wait_for_response">
                    <Checkbox checked={filters.status.includes('wait_for_response')} />
                    <ListItemText primary="Đang chờ" />
                  </MenuItem>
                  <MenuItem value="staff_locked">
                    <Checkbox checked={filters.status.includes('staff_locked')} />
                    <ListItemText primary="Khoá bởi NV" />
                  </MenuItem>
                  <MenuItem value="customer_cancelled">
                    <Checkbox checked={filters.status.includes('customer_cancelled')} />
                    <ListItemText primary="Huỷ bởi KH" />
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '230px' }}>
                <InputLabel>Trạng thái thanh toán</InputLabel>
                <Select
                  multiple
                  value={filters.paymentStatus}
                  label="Trạng thái thanh toán"
                  name="payment_status"
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value as string[])}
                  renderValue={(selected) => (selected as string[]).length === 0 ? 'Tất cả' : `${(selected as string[]).length} đã chọn`}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="waiting_for_payment">
                    <Checkbox checked={filters.paymentStatus.includes('waiting_for_payment')} />
                    <ListItemText primary="Chờ thanh toán" />
                  </MenuItem>
                  <MenuItem value="paid">
                    <Checkbox checked={filters.paymentStatus.includes('paid')} />
                    <ListItemText primary="Đã thanh toán" />
                  </MenuItem>
                  <MenuItem value="refund">
                    <Checkbox checked={filters.paymentStatus.includes('refund')} />
                    <ListItemText primary="Đã hoàn tiền" />
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>Trạng thái xuất vé</InputLabel>
                <Select
                  multiple
                  value={filters.sentTicketEmailStatus}
                  label="Trạng thái xuất vé"
                  name="sentTicketEmailStatus"
                  onChange={(e) => handleFilterChange('sentTicketEmailStatus', e.target.value as string[])}
                  renderValue={(selected) => (selected as string[]).length === 0 ? 'Tất cả' : `${(selected as string[]).length} đã chọn`}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="not_sent">
                    <Checkbox checked={filters.sentTicketEmailStatus.includes('not_sent')} />
                    <ListItemText primary="Chưa xuất vé" />
                  </MenuItem>
                  <MenuItem value="sent">
                    <Checkbox checked={filters.sentTicketEmailStatus.includes('sent')} />
                    <ListItemText primary="Đã xuất vé" />
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>Trạng thái check-in</InputLabel>
                <Select
                  multiple
                  value={filters.checkInStatus}
                  label="Trạng thái check-in"
                  name="checkInStatus"
                  onChange={(e) => handleFilterChange('checkInStatus', e.target.value as string[])}
                  renderValue={(selected) => (selected as string[]).length === 0 ? 'Tất cả' : `${(selected as string[]).length} đã chọn`}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="not_checked">
                    <Checkbox checked={filters.checkInStatus.includes('not_checked')} />
                    <ListItemText primary="Chưa check-in" />
                  </MenuItem>
                  <MenuItem value="checked">
                    <Checkbox checked={filters.checkInStatus.includes('checked')} />
                    <ListItemText primary="Đã check-in" />
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>Trạng thái yêu cầu hủy</InputLabel>
                <Select
                  multiple
                  value={filters.cancelRequestStatus}
                  label="Trạng thái yêu cầu hủy"
                  name="cancelRequestStatus"
                  onChange={(e) => handleFilterChange('cancelRequestStatus', e.target.value as string[])}
                  renderValue={(selected) => (selected as string[]).length === 0 ? 'Tất cả' : `${(selected as string[]).length} đã chọn`}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="pending">
                    <Checkbox checked={filters.cancelRequestStatus.includes('pending')} />
                    <ListItemText primary="Đang yêu cầu hủy" />
                  </MenuItem>
                  <MenuItem value="no_request">
                    <Checkbox checked={filters.cancelRequestStatus.includes('no_request')} />
                    <ListItemText primary="Không có yêu cầu hủy" />
                  </MenuItem>
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
        orderBy={orderBy}
        order={order}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSortChange={handleSortChange}
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
