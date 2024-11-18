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

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Danh sách đơn hàng | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [querySearch, setQuerySearch] = React.useState<string>('');
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

  const debounceQuerySearch = React.useCallback(debounce((value) => setQuerySearch(value), 500), [])

  const handleSearchTransactions = (event: React.ChangeEvent<HTMLInputElement>) => {
    debounceQuerySearch(event.target.value);
  }

  const filteredTransactions = React.useMemo(() => 
    transactions.filter(trans => 
      trans.email.toLocaleLowerCase().includes(querySearch.toLocaleLowerCase()) ||
      trans.name.toLocaleLowerCase().includes(querySearch.toLocaleLowerCase()) ||
      trans.phoneNumber.toLocaleLowerCase().includes(querySearch.toLocaleLowerCase()) ||
      trans.createdAt.toLocaleLowerCase().includes(querySearch.toLocaleLowerCase())
    ),
    [transactions, querySearch]
  );

  // Fetch transactions for the event
  React.useEffect(() => {
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
    fetchTransactions();
  }, [params.event_id]);

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
      <Card sx={{ p: 2 }}>
        <OutlinedInput
          defaultValue=""
          fullWidth
          placeholder="Tìm kiếm đơn hàng"
          startAdornment={
            <InputAdornment position="start">
              <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
            </InputAdornment>
          }
          onChange={handleSearchTransactions}
          sx={{ maxWidth: '500px' }}
        />
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
