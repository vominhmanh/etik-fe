'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { AxiosResponse } from 'axios';
import { LocalizedLink } from '@/components/homepage/localized-link';
import { useTranslation } from '@/contexts/locale-context';

import * as React from 'react';

import NotificationContext from '@/contexts/notification-context';
import { Box, Checkbox, Divider, FormControl, FormControlLabel, Grid, IconButton, InputLabel, ListItemText, Menu, MenuItem, Select, Switch, Table, TableBody, TableCell, TableRow, useTheme } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import { CaretDown, Empty, MicrosoftExcelLogo } from '@phosphor-icons/react';
import { ArrowCounterClockwise, ArrowSquareIn, X } from '@phosphor-icons/react/dist/ssr';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { debounce } from 'lodash';
import { Transaction, TransactionsTable } from './transactions-table';

interface BulkErrorDetail {
  id: number;
  email: string | null;
  reason: string;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt } = useTranslation();
  React.useEffect(() => {
    document.title = tt("Danh sách đơn hàng | ETIK - Vé điện tử & Quản lý sự kiện", "Order List | ETIK - E-tickets & Event Management");
  }, [tt]);
  const theme = useTheme();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [querySearch, setQuerySearch] = React.useState<string>('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const STORAGE_KEY = `transactions-table-sort-${params.event_id}`;
  const AUTO_RELOAD_STORAGE_KEY = `transactions-auto-reload-${params.event_id}`;

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
  const notificationCtx = React.useContext(NotificationContext);
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
  const [bulkErrorMessage, setBulkErrorMessage] = React.useState<string>('');
  const [bulkErrorDetails, setBulkErrorDetails] = React.useState<BulkErrorDetail[]>([]);
  const [spreadsheetId, setSpreadsheetId] = React.useState<string | null>(null);
  const [isGsheetSyncEnabled, setIsGsheetSyncEnabled] = React.useState<boolean | null>(null);

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
    status: [] as string[],
    paymentStatus: [] as string[],
    sentTicketEmailStatus: [] as string[],
    cancelRequestStatus: [] as string[],
  });


  const handleFilterChange = (key: string, value: any) => {
    setFilters((prevFilters) => ({ ...prevFilters, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: [],
      paymentStatus: [],
      sentTicketEmailStatus: [],
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

  const fetchTransactions = React.useCallback(async (showBackdrop: boolean = true) => {
    try {
      if (showBackdrop) {
        setIsLoading(true);
      } else {
        setIsAutoReloading(true);
      }
      const response: AxiosResponse<Transaction[]> = await baseHttpServiceInstance.get(
        `/event-studio/events/${params.event_id}/transactions`
      );
      setTransactions(response.data);
    } catch (error) {
      notificationCtx.error(tt('Lỗi:', 'Error:'), error);
    } finally {
      if (showBackdrop) {
        setIsLoading(false);
      } else {
        setIsAutoReloading(false);
      }
    }
  }, [params.event_id, notificationCtx, tt]);

  const fetchEventInfo = React.useCallback(async () => {
    try {
      const response: AxiosResponse<{ gsheetSpreadsheetId?: string | null; gsheetSyncEnabled?: boolean }> =
        await baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}`);
      const sheetId = response.data.gsheetSpreadsheetId ?? null;
      setSpreadsheetId(sheetId);
      // Nếu backend chưa trả về cờ, mặc định true khi đã có sheet, null khi chưa có
      if (sheetId) {
        setIsGsheetSyncEnabled(
          typeof response.data.gsheetSyncEnabled === 'boolean' ? response.data.gsheetSyncEnabled : true
        );
      } else {
        setIsGsheetSyncEnabled(null);
      }
    } catch (error) {
      // Ignore error; event info is only needed for Google Sheets link
      console.error(error);
    }
  }, [params.event_id]);

  const handleExportExcel = async () => {
    try {
      setIsLoading(true);
      const response: AxiosResponse<Blob> = await baseHttpServiceInstance.get(
        `/event-studio/events/${params.event_id}/transactions/export`,
        { responseType: 'blob' }
      );

      const defaultFilename = `transactions-${params.event_id}.xlsx`;
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
      notificationCtx.success(tt('Đã xuất file Excel', 'Excel file exported successfully'));
    } catch (error) {
      notificationCtx.error(tt('Xuất file thất bại:', 'Export file failed:'), error);
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch transactions for the event
  React.useEffect(() => {
    fetchTransactions();
    fetchEventInfo();
  }, [params.event_id, fetchTransactions, fetchEventInfo]);

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
        fetchTransactions(false); // Don't show backdrop during auto reload
      }, 5000); // 5 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoReload, fetchTransactions]);

  const filteredTransactions = React.useMemo(() => {
    const q = normalizeText(querySearch);
    let filtered = transactions.filter((transaction) => {
      if (querySearch && !(
        (transaction.id.toString().includes(querySearch.toLocaleLowerCase())) ||
        (normalizeText(transaction.email).includes(q)) ||
        (normalizeText(transaction.name).includes(q)) ||
        (normalizeText(transaction.name).includes(q)) ||
        (transaction.phoneNumber.toLocaleLowerCase().includes(querySearch.toLocaleLowerCase())) ||
        (
          transaction.phoneNumber
            .replace(/\s+/g, '')
            .replace(/^\+84/, '0')
            .toLocaleLowerCase()
            .includes(querySearch.replace(/\s+/g, '').replace(/^\+84/, '0').toLocaleLowerCase())
        ) ||
        (normalizeText(transaction.createdAt).includes(q))
      )) {
        return false;
      }

      // Transaction Status filter
      if (filters.status.length > 0 && !filters.status.includes(transaction.status)) {
        return false;
      }

      // Payment Status filter
      if (filters.paymentStatus.length > 0 && !filters.paymentStatus.includes(transaction.paymentStatus)) {
        return false;
      }

      // Sent Ticket Email Status filter
      if (filters.sentTicketEmailStatus.length > 0) {
        const isSent = !!transaction.exportedTicketAt;
        const shouldInclude =
          (filters.sentTicketEmailStatus.includes('sent') && isSent) ||
          (filters.sentTicketEmailStatus.includes('not_sent') && !isSent);
        if (!shouldInclude) {
          return false;
        }
      }

      // Cancel request status filter
      if (filters.cancelRequestStatus.length > 0) {
        const isPending = transaction.cancelRequestStatus === 'pending';
        const hasNoRequest = transaction.cancelRequestStatus == null;
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
    if (orderBy === 'createdAt') {
      filtered = [...filtered].sort((a, b) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();

        if (order === 'asc') {
          return aDate - bDate;
        } else {
          return bDate - aDate;
        }
      });
    }

    return filtered;
  }, [transactions, querySearch, filters, orderBy, order]);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [paymentAnchorEl, setPaymentAnchorEl] = React.useState<null | HTMLElement>(null);
  const [ticketAnchorEl, setTicketAnchorEl] = React.useState<null | HTMLElement>(null);
  const [emailMarketingAnchorEl, setEmailMarketingAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const paymentOpen = Boolean(paymentAnchorEl);
  const ticketOpen = Boolean(ticketAnchorEl);
  const emailMarketingOpen = Boolean(emailMarketingAnchorEl);

  const handleClick = (setter: React.Dispatch<React.SetStateAction<null | HTMLElement>>) =>
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setter(event.currentTarget);
    };

  const handleClose = (setter: React.Dispatch<React.SetStateAction<null | HTMLElement>>) => () => {
    setter(null);
  };


  const handleExportTicketBulk = async () => {
    let userConfirmed = confirm(tt("Bạn đang thao tác với nhiều đơn hàng, bạn có chắc chắn muốn thực hiện?", "You are operating on multiple orders, are you sure you want to proceed?"));
    if (!userConfirmed) {
      return
    }
    setTicketAnchorEl(null)
    if (selected.size === 0) {
      notificationCtx.warning(tt(`Vui lòng chọn ít nhất một đơn hàng để thao tác.`, `Please select at least one order to proceed.`));
      return
    }
    setBulkErrorMessage('');
    setBulkErrorDetails([]);
    try {
      setIsLoading(true); // Optional: Show loading state
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/transactions/export-ticket-bulk`, { transactionIds: Array.from(selected) },
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

  const handleSendTransactionAndTicketBulk = async (channel: string | null = null) => {
    let userConfirmed = confirm(tt("Bạn đang thao tác với nhiều đơn hàng, bạn có chắc chắn muốn thực hiện?", "You are operating on multiple orders, are you sure you want to proceed?"));
    if (!userConfirmed) {
      return
    }
    setTicketAnchorEl(null)
    if (selected.size === 0) {
      notificationCtx.warning(tt(`Vui lòng chọn ít nhất một đơn hàng để thao tác.`, `Please select at least one order to proceed.`));
      return
    }
    setBulkErrorMessage('');
    setBulkErrorDetails([]);
    try {
      setIsLoading(true); // Optional: Show loading state
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/transactions/send-transaction-and-ticket-bulk`, channel ? { transactionIds: Array.from(selected), channel: channel } : { transactionIds: Array.from(selected) },
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
    if (selected.size === 0) {
      notificationCtx.warning(tt(`Vui lòng chọn ít nhất một đơn hàng để thao tác.`, `Please select at least one order to proceed.`));
      return
    }
    let userConfirmed = confirm(tt("Bạn đang thao tác với nhiều đơn hàng, bạn có chắc chắn muốn thực hiện?", "You are operating on multiple orders, are you sure you want to proceed?"));
    if (!userConfirmed) {
      return
    }
    setAnchorEl(null)
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
    if (selected.size === 0) {
      notificationCtx.warning(tt(`Vui lòng chọn ít nhất một đơn hàng để thao tác.`, `Please select at least one order to proceed.`));
      return
    }
    let userConfirmed = confirm(tt("Bạn đang thao tác với nhiều đơn hàng, bạn có chắc chắn muốn thực hiện?", "You are operating on multiple orders, are you sure you want to proceed?"));
    if (!userConfirmed) {
      return
    }
    setPaymentAnchorEl(null)
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


  const handleSendEmailMarketingBulk = async () => {
    if (selected.size === 0) {
      notificationCtx.warning(tt(`Vui lòng chọn ít nhất một đơn hàng để thao tác.`, `Please select at least one order to proceed.`));
      return
    }
    let userConfirmed = confirm(tt("Bạn đang thao tác với nhiều đơn hàng, bạn có chắc chắn muốn thực hiện?", "You are operating on multiple orders, are you sure you want to proceed?"));
    if (!userConfirmed) {
      return
    }
    setEmailMarketingAnchorEl(null)
    setBulkErrorMessage('');
    setBulkErrorDetails([]);
    try {
      setIsLoading(true); // Optional: Show loading state
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/transactions/send-email-marketing-bulk`, { transactionIds: Array.from(selected) },
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
    if (selected.size === 0) {
      notificationCtx.warning(tt(`Vui lòng chọn ít nhất một đơn hàng để thao tác.`, `Please select at least one order to proceed.`));
      return
    }
    let userConfirmed = confirm(tt("Bạn đang thao tác với nhiều đơn hàng, bạn có chắc chắn muốn thực hiện?", "You are operating on multiple orders, are you sure you want to proceed?"));
    if (!userConfirmed) {
      return
    }
    setPaymentAnchorEl(null)
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
    if (selected.size === 0) {
      notificationCtx.warning(tt(`Vui lòng chọn ít nhất một đơn hàng để thao tác.`, `Please select at least one order to proceed.`));
      return
    }
    let userConfirmed = confirm(tt("Bạn đang thao tác với nhiều đơn hàng, bạn có chắc chắn muốn thực hiện?", "You are operating on multiple orders, are you sure you want to proceed?"));
    if (!userConfirmed) {
      return
    }
    setPaymentAnchorEl(null)

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

  const hasFilter =
    !!querySearch ||
    filters.status.length > 0 ||
    filters.paymentStatus.length > 0 ||
    filters.sentTicketEmailStatus.length > 0 ||
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
              variant="contained"
              size="small"
            >
              {tt("Đơn hàng", "Orders")}
            </Button>
            <Button
              variant="outlined"
              size="small"
              component={LocalizedLink}
              href={`/event-studio/events/${params.event_id}/tickets`}
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
        <Button color="inherit" startIcon={<ArrowCounterClockwise fontSize="var(--icon-fontSize-md)" />} onClick={() => fetchTransactions()}>
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
                          "Dừng đồng bộ sẽ khiến các giao dịch mới/được chỉnh sửa sau này không được cập nhật sang Google Sheets nữa. Bạn có chắc chắn?",
                          "Stopping sync means new or updated transactions will no longer be pushed to Google Sheets. Are you sure?"
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
                  // BE nên tự bật lại cờ sync nếu đang tắt
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
              placeholder={tt("Tìm kiếm đơn hàng...", "Search orders...")}
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
                <InputLabel>{tt("Trạng thái đơn hàng", "Order Status")}</InputLabel>
                <Select
                  multiple
                  value={filters.status}
                  label={tt("Trạng thái đơn hàng", "Order Status")}
                  name="status"
                  onChange={(e) => handleFilterChange('status', e.target.value as string[])}
                  renderValue={(selected) => (selected as string[]).length === 0 ? tt("Tất cả", "All") : `${(selected as string[]).length} ${tt("đã chọn", "selected")}`}
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
                    <ListItemText primary={tt("Bình thường", "Normal")} />
                  </MenuItem>
                  <MenuItem value="wait_for_response">
                    <Checkbox checked={filters.status.includes('wait_for_response')} />
                    <ListItemText primary={tt("Đang chờ", "Waiting")} />
                  </MenuItem>
                  <MenuItem value="staff_locked">
                    <Checkbox checked={filters.status.includes('staff_locked')} />
                    <ListItemText primary={tt("Khoá bởi NV", "Locked by Staff")} />
                  </MenuItem>
                  <MenuItem value="customer_cancelled">
                    <Checkbox checked={filters.status.includes('customer_cancelled')} />
                    <ListItemText primary={tt("Huỷ bởi KH", "Cancelled by Customer")} />
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '230px' }}>
                <InputLabel>{tt("Trạng thái thanh toán", "Payment Status")}</InputLabel>
                <Select
                  multiple
                  value={filters.paymentStatus}
                  label={tt("Trạng thái thanh toán", "Payment Status")}
                  name="payment_status"
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value as string[])}
                  renderValue={(selected) => (selected as string[]).length === 0 ? tt("Tất cả", "All") : `${(selected as string[]).length} ${tt("đã chọn", "selected")}`}
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
                    <ListItemText primary={tt("Chờ thanh toán", "Waiting for Payment")} />
                  </MenuItem>
                  <MenuItem value="paid">
                    <Checkbox checked={filters.paymentStatus.includes('paid')} />
                    <ListItemText primary={tt("Đã thanh toán", "Paid")} />
                  </MenuItem>
                  <MenuItem value="refund">
                    <Checkbox checked={filters.paymentStatus.includes('refund')} />
                    <ListItemText primary={tt("Đã hoàn tiền", "Refunded")} />
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>{tt("Trạng thái xuất vé", "Ticket Export Status")}</InputLabel>
                <Select
                  multiple
                  value={filters.sentTicketEmailStatus}
                  label={tt("Trạng thái xuất vé", "Ticket Export Status")}
                  name="sentTicketEmailStatus"
                  onChange={(e) => handleFilterChange('sentTicketEmailStatus', e.target.value as string[])}
                  renderValue={(selected) => (selected as string[]).length === 0 ? tt("Tất cả", "All") : `${(selected as string[]).length} ${tt("đã chọn", "selected")}`}
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
                    <ListItemText primary={tt("Chưa xuất vé", "Not Exported")} />
                  </MenuItem>
                  <MenuItem value="sent">
                    <Checkbox checked={filters.sentTicketEmailStatus.includes('sent')} />
                    <ListItemText primary={tt("Đã xuất vé", "Exported")} />
                  </MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: '200px' }}>
                <InputLabel>{tt("Trạng thái yêu cầu hủy", "Cancel Request Status")}</InputLabel>
                <Select
                  multiple
                  value={filters.cancelRequestStatus}
                  label={tt("Trạng thái yêu cầu hủy", "Cancel Request Status")}
                  name="cancelRequestStatus"
                  onChange={(e) => handleFilterChange('cancelRequestStatus', e.target.value as string[])}
                  renderValue={(selected) => (selected as string[]).length === 0 ? tt("Tất cả", "All") : `${(selected as string[]).length} ${tt("đã chọn", "selected")}`}
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
                    <ListItemText primary={tt("Đang yêu cầu hủy", "Pending Cancellation")} />
                  </MenuItem>
                  <MenuItem value="no_request">
                    <Checkbox checked={filters.cancelRequestStatus.includes('no_request')} />
                    <ListItemText primary={tt("Không có yêu cầu hủy", "No Cancel Request")} />
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
        {tt("Có", "There are")} {filteredTransactions.length.toLocaleString()} {tt("đơn hàng", "orders")}
        {hasFilter
          ? ` ${tt("khớp với các bộ lọc hiện tại", "matching current filters")}`
          : null}
      </Typography>

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
              {tt("Chọn tất cả", "Select All")}
            </Button>
            <Button
              size='small'
              id="basic-button"
              aria-controls={open ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleDeselectAll}
            >
              {tt("Bỏ chọn tất cả", "Deselect All")}
            </Button>
            <Typography variant='body2' sx={{ ml: '37px' }}>
              {tt("Thao tác nhanh", "Quick Actions")}{selected.size > 0 ? ` ${selected.size} ${tt("đơn hàng", "orders")}` : ''}:
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
              {tt("Đơn hàng", "Orders")}
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
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => handleSetTransactionStatusBulk('normal')}>{tt("Phê duyệt đơn hàng", "Approve Order")}</MenuItem>
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => handleSetTransactionStatusBulk('staff_locked')}>{tt("Chuyển trạng thái 'Khoá bởi Nhân viên'", "Change status to 'Locked by Staff'")}</MenuItem>
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => handleSetTransactionStatusBulk('customer_cancelled')}>{tt("Chuyển trạng thái 'Huỷ bởi Khách hàng'", "Change status to 'Cancelled by Customer'")}</MenuItem>
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
              {tt("Thanh toán", "Payment")}
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
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => { handleSendPaymentInstructionForTransactionBulk('email') }}>{tt("Gửi h.dẫn t.toán đơn Napas247 qua email", "Send Napas247 payment instruction via email")}</MenuItem>
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => { handleSendPaymentInstructionForTransactionBulk('zalo') }}>{tt("Gửi h.dẫn t.toán đơn Napas247 qua Zalo", "Send Napas247 payment instruction via Zalo")}</MenuItem>
              <MenuItem sx={{ fontSize: '14px' }} onClick={handleSetPaidForTransactionBulk}>{tt("Chuyển trạng thái 'Đã thanh toán'", "Change status to 'Paid'")}</MenuItem>
              <MenuItem sx={{ fontSize: '14px' }} onClick={handleSetRefundForTransactionBulk}>{tt("Chuyển trạng thái 'Đã hoàn tiền'", "Change status to 'Refunded'")}</MenuItem>
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
              {tt("Xuất vé", "Export Tickets")}
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
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => { handleExportTicketBulk() }}>{tt("Xuất vé", "Export Tickets")}</MenuItem>
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => { handleSendTransactionAndTicketBulk('email') }}>{tt("Gửi Email", "Send Email")}</MenuItem>
            </Menu>

            {/* Menu for Thanh toán */}
            <Button
              size='small'
              id="payment-button"
              aria-controls={paymentOpen ? 'payment-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={paymentOpen ? 'true' : undefined}
              onClick={handleClick(setEmailMarketingAnchorEl)}
              endIcon={<CaretDown />}
            >
              {tt("Email marketing", "Email Marketing")}
            </Button>
            <Menu
              id="email-marketing-menu"
              anchorEl={emailMarketingAnchorEl}
              open={emailMarketingOpen}
              onClose={handleClose(setEmailMarketingAnchorEl)}
              MenuListProps={{
                'aria-labelledby': 'email-marketing-button',
              }}
            >
              <MenuItem sx={{ fontSize: '14px' }}>
                <a href="templates/email-marketing" style={{ textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
                  {tt("Chỉnh sửa mẫu email", "Edit Email Template")} <ArrowSquareIn />
                </a>
              </MenuItem>
              <MenuItem sx={{ fontSize: '14px' }} onClick={() => { handleSendEmailMarketingBulk() }}>{tt("Gửi email marketing", "Send Marketing Email")}</MenuItem>
            </Menu>
          </Stack>
        </Box>
        <Divider />
        <Box sx={{ overflowX: 'auto' }} >

        </Box>
      </Card>
      {bulkErrorMessage &&
        <Card>
          <Box sx={{ overflowX: 'auto', pl: '50px', bgcolor: theme.palette.warning.light, }} >
            <Typography variant='body2' >
              <b>{bulkErrorMessage}</b>
            </Typography>
          </Box>
          <Box sx={{ overflow: 'auto', pl: '35px', maxHeight: '200px', bgcolor: theme.palette.warning.light }} >
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
        orderBy={orderBy}
        order={order}
        selected={selected}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSortChange={handleSortChange}
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
