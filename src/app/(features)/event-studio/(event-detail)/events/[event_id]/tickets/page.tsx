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
  holderEmail?: string;
  holderPhone?: string;
  checkInAt?: string | null; // ISO date string or null
  status: string;
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
    document.title = tt("Danh sách đơn hàng | ETIK - Vé điện tử & Quản lý sự kiện", "Order & Ticket List | ETIK - E-tickets & Event Management");
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
  const [spreadsheetId, setSpreadsheetId] = React.useState<string | null>(null);
  const [isGsheetSyncEnabled, setIsGsheetSyncEnabled] = React.useState<boolean | null>(null);

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

  const fetchEventInfo = React.useCallback(async () => {
    try {
      const response: AxiosResponse<{ gsheetSpreadsheetId?: string | null; gsheetSyncEnabled?: boolean }> =
        await baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}`);
      const sheetId = response.data.gsheetSpreadsheetId ?? null;
      setSpreadsheetId(sheetId);
      if (sheetId) {
        setIsGsheetSyncEnabled(
          typeof response.data.gsheetSyncEnabled === 'boolean' ? response.data.gsheetSyncEnabled : true
        );
      } else {
        setIsGsheetSyncEnabled(null);
      }
    } catch (error) {
      console.error(error);
    }
  }, [params.event_id]);

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
    fetchEventInfo();
  }, [params.event_id, fetchTickets, fetchEventInfo]);

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

  // Auto-select first show when filterShows is loaded and no show is selected
  React.useEffect(() => {
    if (filterShows.length > 0 && filters.show.length === 0) {
      setFilters((prevFilters) => ({ ...prevFilters, show: [filterShows[0].id] }));
    }
  }, [filterShows]);


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

  const hasTicketFilter =
    !!querySearch ||
    filters.show.length > 0 ||
    filters.ticketCategory.length > 0 ||
    filters.status.length > 0 ||
    filters.paymentStatus.length > 0 ||
    filters.sentTicketEmailStatus.length > 0 ||
    filters.checkInStatus.length > 0 ||
    filters.cancelRequestStatus.length > 0;


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
          <Typography variant="h4">{tt("Danh sách đơn hàng", "Order List")}</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              component={LocalizedLink}
              href={`/event-studio/events/${params.event_id}/transactions`}
            >
              {tt("Đơn hàng", "Orders")}
            </Button>
            <Button
              variant="contained"
              size="small"
            >
              {tt("Khách hàng & vé", "Customers & Tickets")}
            </Button>
          </Stack>
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
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
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
        {spreadsheetId ? (
          <>
            <FormControlLabel
              control={
                <Switch
                  checked={!!isGsheetSyncEnabled}
                  onChange={async (e) => {
                    const next = e.target.checked;
                    if (!next) {
                      const confirmed = window.confirm(
                        tt(
                          "Dừng đồng bộ sẽ khiến các vé mới/được chỉnh sửa sau này không được cập nhật sang Google Sheets nữa. Bạn có chắc chắn?",
                          "Stopping sync means new or updated tickets will no longer be pushed to Google Sheets. Are you sure?"
                        )
                      );
                      if (!confirmed) {
                        return;
                      }
                    }
                    try {
                      setIsLoading(true);
                      if (next) {
                        await baseHttpServiceInstance.post(
                          `/event-studio/events/${params.event_id}/google-sheet-sync/enable`
                        );
                        setIsGsheetSyncEnabled(true);
                        notificationCtx.success(
                          tt("Đã bật đồng bộ với Google Sheets", "Resumed syncing with Google Sheets")
                        );
                      } else {
                        await baseHttpServiceInstance.post(
                          `/event-studio/events/${params.event_id}/google-sheet-sync/disable`
                        );
                        setIsGsheetSyncEnabled(false);
                        notificationCtx.success(
                          tt("Đã dừng đồng bộ với Google Sheets", "Stopped syncing with Google Sheets")
                        );
                      }
                    } catch (error) {
                      notificationCtx.error(
                        next
                          ? tt("Bật đồng bộ Google Sheets thất bại:", "Enable Google Sheets sync failed:")
                          : tt("Dừng đồng bộ Google Sheets thất bại:", "Disable Google Sheets sync failed:"),
                        error
                      );
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  size="small"
                />
              }
              label={tt("Đồng bộ Google Sheets", "Syncing to Google Sheets")}
              sx={{ ml: 1 }}
            />
            <IconButton
              color="inherit"
              component="a"
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tt("Mở Google Sheets", "Open Google Sheets")}
            >
              <MicrosoftExcelLogo fontSize="var(--icon-fontSize-md)" />
            </IconButton>
            <IconButton
              color="error"
              onClick={async () => {
                const confirmed = window.confirm(
                  tt(
                    "Đồng bộ lại sẽ ghi đè toàn bộ dữ liệu hiện có trên Google Sheets. Bạn có chắc chắn muốn tiếp tục?",
                    "Resync will overwrite all existing data on Google Sheets. Are you sure you want to continue?"
                  )
                );
                if (!confirmed) return;
                try {
                  setIsLoading(true);
                  await baseHttpServiceInstance.post(
                    `/event-studio/events/${params.event_id}/google-sheet-sync`
                  );
                  setIsGsheetSyncEnabled(true);
                  notificationCtx.success(
                    tt("Đã bắt đầu đồng bộ lại dữ liệu", "Started resyncing data to Google Sheets")
                  );
                } catch (error) {
                  notificationCtx.error(
                    tt("Đồng bộ lại Google Sheets thất bại:", "Resync Google Sheets failed:"),
                    error
                  );
                } finally {
                  setIsLoading(false);
                }
              }}
              aria-label={tt("Đồng bộ lại dữ liệu Google Sheets", "Resync Google Sheets data")}
            >
              <ArrowCounterClockwise fontSize="var(--icon-fontSize-md)" />
            </IconButton>
          </>
        ) : (
          <Button
            color="inherit"
            startIcon={<MicrosoftExcelLogo fontSize="var(--icon-fontSize-md)" />}
            onClick={async () => {
              try {
                setIsLoading(true);
                const response: AxiosResponse<{ spreadsheet_id?: string }> =
                  await baseHttpServiceInstance.post(
                    `/event-studio/events/${params.event_id}/google-sheet-sync`
                  );
                if (response.data.spreadsheet_id) {
                  setSpreadsheetId(response.data.spreadsheet_id);
                }
                notificationCtx.success(
                  tt("Đã bắt đầu đồng bộ Google Sheets", "Started syncing to Google Sheets")
                );
              } catch (error) {
                notificationCtx.error(
                  tt("Đồng bộ Google Sheets thất bại:", "Sync Google Sheets failed:"),
                  error
                );
              } finally {
                setIsLoading(false);
              }
            }}
          >
            {tt("Đồng bộ Google Sheets", "Sync Google Sheets")}
          </Button>
        )}
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
                <InputLabel>{tt('Suất diễn', 'Show')}</InputLabel>
                <Select
                  multiple
                  value={filters.show}
                  label={tt('Suất diễn', 'Show')}
                  name="show"
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange('show', typeof value === 'string' ? value.split(',').map(Number) : (value as number[]));
                  }}
                  renderValue={(selected) => {
                    const selectedArray = selected as number[];
                    if (selectedArray.length === 0) {
                      return tt('Tất cả', 'All');
                    }
                    if (selectedArray.length === 1) {
                      const show = filterShows.find(s => s.id === selectedArray[0]);
                      return show ? show.name : '';
                    }
                    return tt(`${selectedArray.length} đã chọn`, `${selectedArray.length} selected`);
                  }}
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
                <InputLabel>{tt('Loại vé', 'Ticket Type')}</InputLabel>
                <Select
                  multiple
                  value={filters.ticketCategory}
                  label={tt('Loại vé', 'Ticket Type')}
                  name="ticketCategory"
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange('ticketCategory', typeof value === 'string' ? value.split(',').map(Number) : (value as number[]));
                  }}
                  renderValue={(selected) => {
                    const selectedArray = selected as number[];
                    if (selectedArray.length === 0) {
                      return tt('Tất cả', 'All');
                    }
                    if (selectedArray.length === 1) {
                      const allTicketCategories = filterShows
                        .filter(show => filters.show.length === 0 || filters.show.includes(show.id))
                        .flatMap(show => show.ticketCategories);
                      const ticketCategory = allTicketCategories.find(tc => tc.id === selectedArray[0]);
                      return ticketCategory ? ticketCategory.name : '';
                    }
                    return tt(`${selectedArray.length} đã chọn`, `${selectedArray.length} selected`);
                  }}
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
                <InputLabel>{tt('Trạng thái đơn hàng', 'Order Status')}</InputLabel>
                <Select
                  multiple
                  value={filters.status}
                  label={tt('Trạng thái đơn hàng', 'Order Status')}
                  name="status"
                  onChange={(e) => handleFilterChange('status', e.target.value as string[])}
                  renderValue={(selected) => {
                    const selectedArray = selected as string[];
                    if (selectedArray.length === 0) {
                      return tt('Tất cả', 'All');
                    }
                    if (selectedArray.length === 1) {
                      const statusLabels: Record<string, string> = {
                        'normal': tt('Bình thường', 'Normal'),
                        'wait_for_response': tt('Đang chờ', 'Pending'),
                        'staff_locked': tt('Khoá bởi NV', 'Locked by Staff'),
                        'customer_cancelled': tt('Huỷ bởi KH', 'Cancelled by Customer'),
                      };
                      return statusLabels[selectedArray[0]] || selectedArray[0];
                    }
                    return tt(`${selectedArray.length} đã chọn`, `${selectedArray.length} selected`);
                  }}
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
                    <ListItemText primary={tt('Bình thường', 'Normal')} />
                  </MenuItem>
                  <MenuItem value="wait_for_response">
                    <Checkbox checked={filters.status.includes('wait_for_response')} />
                    <ListItemText primary={tt('Đang chờ', 'Pending')} />
                  </MenuItem>
                  <MenuItem value="staff_locked">
                    <Checkbox checked={filters.status.includes('staff_locked')} />
                    <ListItemText primary={tt('Khoá bởi NV', 'Locked by Staff')} />
                  </MenuItem>
                  <MenuItem value="customer_cancelled">
                    <Checkbox checked={filters.status.includes('customer_cancelled')} />
                    <ListItemText primary={tt('Huỷ bởi KH', 'Cancelled by Customer')} />
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '230px' }}>
                <InputLabel>{tt('Trạng thái thanh toán', 'Payment Status')}</InputLabel>
                <Select
                  multiple
                  value={filters.paymentStatus}
                  label={tt('Trạng thái thanh toán', 'Payment Status')}
                  name="payment_status"
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value as string[])}
                  renderValue={(selected) => {
                    const selectedArray = selected as string[];
                    if (selectedArray.length === 0) {
                      return tt('Tất cả', 'All');
                    }
                    if (selectedArray.length === 1) {
                      const paymentStatusLabels: Record<string, string> = {
                        'waiting_for_payment': tt('Chờ thanh toán', 'Waiting for Payment'),
                        'paid': tt('Đã thanh toán', 'Paid'),
                        'refund': tt('Đã hoàn tiền', 'Refunded'),
                      };
                      return paymentStatusLabels[selectedArray[0]] || selectedArray[0];
                    }
                    return tt(`${selectedArray.length} đã chọn`, `${selectedArray.length} selected`);
                  }}
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
                    <ListItemText primary={tt('Chờ thanh toán', 'Waiting for Payment')} />
                  </MenuItem>
                  <MenuItem value="paid">
                    <Checkbox checked={filters.paymentStatus.includes('paid')} />
                    <ListItemText primary={tt('Đã thanh toán', 'Paid')} />
                  </MenuItem>
                  <MenuItem value="refund">
                    <Checkbox checked={filters.paymentStatus.includes('refund')} />
                    <ListItemText primary={tt('Đã hoàn tiền', 'Refunded')} />
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>{tt('Trạng thái xuất vé', 'Ticket Issued Status')}</InputLabel>
                <Select
                  multiple
                  value={filters.sentTicketEmailStatus}
                  label={tt('Trạng thái xuất vé', 'Ticket Issued Status')}
                  name="sentTicketEmailStatus"
                  onChange={(e) => handleFilterChange('sentTicketEmailStatus', e.target.value as string[])}
                  renderValue={(selected) => {
                    const selectedArray = selected as string[];
                    if (selectedArray.length === 0) {
                      return tt('Tất cả', 'All');
                    }
                    if (selectedArray.length === 1) {
                      const sentTicketEmailStatusLabels: Record<string, string> = {
                        'not_sent': tt('Chưa xuất vé', 'Not Issued'),
                        'sent': tt('Đã xuất vé', 'Issued'),
                      };
                      return sentTicketEmailStatusLabels[selectedArray[0]] || selectedArray[0];
                    }
                    return tt(`${selectedArray.length} đã chọn`, `${selectedArray.length} selected`);
                  }}
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
                    <ListItemText primary={tt('Chưa xuất vé', 'Not Issued')} />
                  </MenuItem>
                  <MenuItem value="sent">
                    <Checkbox checked={filters.sentTicketEmailStatus.includes('sent')} />
                    <ListItemText primary={tt('Đã xuất vé', 'Issued')} />
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>{tt('Trạng thái check-in', 'Check-in Status')}</InputLabel>
                <Select
                  multiple
                  value={filters.checkInStatus}
                  label={tt('Trạng thái check-in', 'Check-in Status')}
                  name="checkInStatus"
                  onChange={(e) => handleFilterChange('checkInStatus', e.target.value as string[])}
                  renderValue={(selected) => {
                    const selectedArray = selected as string[];
                    if (selectedArray.length === 0) {
                      return tt('Tất cả', 'All');
                    }
                    if (selectedArray.length === 1) {
                      const checkInStatusLabels: Record<string, string> = {
                        'not_checked': tt('Chưa check-in', 'Not Checked In'),
                        'checked': tt('Đã check-in', 'Checked In'),
                      };
                      return checkInStatusLabels[selectedArray[0]] || selectedArray[0];
                    }
                    return tt(`${selectedArray.length} đã chọn`, `${selectedArray.length} selected`);
                  }}
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
                    <ListItemText primary={tt('Chưa check-in', 'Not Checked In')} />
                  </MenuItem>
                  <MenuItem value="checked">
                    <Checkbox checked={filters.checkInStatus.includes('checked')} />
                    <ListItemText primary={tt('Đã check-in', 'Checked In')} />
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>{tt('Trạng thái yêu cầu hủy', 'Cancellation Request Status')}</InputLabel>
                <Select
                  multiple
                  value={filters.cancelRequestStatus}
                  label={tt('Trạng thái yêu cầu hủy', 'Cancellation Request Status')}
                  name="cancelRequestStatus"
                  onChange={(e) => handleFilterChange('cancelRequestStatus', e.target.value as string[])}
                  renderValue={(selected) => {
                    const selectedArray = selected as string[];
                    if (selectedArray.length === 0) {
                      return tt('Tất cả', 'All');
                    }
                    if (selectedArray.length === 1) {
                      const cancelRequestStatusLabels: Record<string, string> = {
                        'pending': tt('Đang yêu cầu hủy', 'Pending Cancellation'),
                        'no_request': tt('Không có yêu cầu hủy', 'No Cancellation Request'),
                      };
                      return cancelRequestStatusLabels[selectedArray[0]] || selectedArray[0];
                    }
                    return tt(`${selectedArray.length} đã chọn`, `${selectedArray.length} selected`);
                  }}
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
                    <ListItemText primary={tt('Đang yêu cầu hủy', 'Pending Cancellation')} />
                  </MenuItem>
                  <MenuItem value="no_request">
                    <Checkbox checked={filters.cancelRequestStatus.includes('no_request')} />
                    <ListItemText primary={tt('Không có yêu cầu hủy', 'No Cancellation Request')} />
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
      <Typography
        variant="body2"
        sx={{ mt: 1, fontWeight: 600 }}
      >
        {tt("Có", "There are")} {filteredTickets.length.toLocaleString()} {tt("vé", "tickets")}
        {hasTicketFilter
          ? ` ${tt("khớp với các bộ lọc hiện tại", "matching current filters")}`
          : null}
      </Typography>
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
