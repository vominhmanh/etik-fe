'use client';

import * as React from 'react';
import NotificationContext from '@/contexts/notification-context';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import dayjs from 'dayjs';
import { ArrowSquareUpRight as ArrowSquareUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowSquareUpRight';
import { Money as MoneyIcon } from '@phosphor-icons/react/dist/ssr/Money';
import { Bank as BankIcon } from '@phosphor-icons/react/dist/ssr/Bank';
import { Lightning as LightningIcon } from '@phosphor-icons/react/dist/ssr/Lightning';
import IconButton from '@mui/material/IconButton';
import { useSelection } from '@/hooks/use-selection';
import { Chip } from '@mui/material';
import { Ticket } from './page'


// Function to map payment methods to corresponding labels and icons
const getPaymentMethodDetails = (paymentMethod: string) => {
  switch (paymentMethod) {
    case 'cash':
      return { label: 'Tiền mặt', icon: <MoneyIcon /> };
    case 'transfer':
      return { label: 'Chuyển khoản', icon: <BankIcon /> };
    case 'napas247':
      return { label: 'Napas 247', icon: <LightningIcon /> };
    default:
      return { label: 'Unknown', icon: null };
  }
};

// Function to map payment statuses to corresponding labels and colors
const getPaymentStatusDetails = (paymentStatus: string) => {
  switch (paymentStatus) {
    case 'waiting_for_payment':
      return { label: 'Đang chờ thanh toán', color: 'default' };
    case 'paid':
      return { label: 'Đã thanh toán', color: 'success' };
    case 'refund':
      return { label: 'Đã hoàn tiền', color: 'secondary' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

// Function to map row statuses to corresponding labels and colors
const getRowStatusDetails = (status: string) => {
  switch (status) {
    case 'normal':
      return { label: 'Bình thường', color: 'default' };
    case 'customer_cancelled':
      return { label: 'Huỷ bởi KH', color: 'error' }; // error for danger
    case 'staff_locked':
      return { label: 'Khoá bởi NV', color: 'error' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};


function noop(): void {
  // do nothing
}

interface CustomersTableProps {
  count?: number;
  page?: number;
  rows?: Ticket[];
  rowsPerPage?: number;
  eventId: number;
}

const formatPrice = (price: number) => {
  return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};


function stringToColor(string: string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

function stringAvatar(name: string) {
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: `${name.split(' ')[0][0]}${name.split(' ').length > 1 ? name.split(' ')[1][0] : ''}`,
  };
}
interface CustomersTableProps {
  count?: number;
  page?: number;
  rows?: Ticket[];
  rowsPerPage?: number;
  eventId: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

export function TicketsTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 10,
  eventId = 0,
  onPageChange,
  onRowsPerPageChange,
}: CustomersTableProps): React.JSX.Element {

  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
  };

  const rowIds = React.useMemo(() => {
    return rows.map((ticket) => ticket.id);
  }, [rows]);

  const { selectAll, deselectAll, selectOne, deselectOne, selected } = useSelection(rowIds);

  const selectedSome = (selected?.size ?? 0) > 0 && (selected?.size ?? 0) < rows.length;
  const selectedAll = rows.length > 0 && selected?.size === rows.length;

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedAll}
                  indeterminate={selectedSome}
                  onChange={(event) => {
                    if (event.target.checked) {
                      selectAll();
                    } else {
                      deselectAll();
                    }
                  }}
                />
              </TableCell>
              <TableCell>Họ tên</TableCell>
              <TableCell>Suất diễn</TableCell>
              <TableCell>Loại vé</TableCell>
              <TableCell>Thanh toán</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Thời gian tạo</TableCell>
              <TableCell>Thời gian check-in</TableCell>
              <TableCell> </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isSelected = selected?.has(row.id);
              return (
                <TableRow hover key={row.id} selected={isSelected}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={(event) => {
                        if (event.target.checked) {
                          selectOne(row.id);
                        } else {
                          deselectOne(row.id);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                      <Tooltip title={
                        <Stack spacing={1}>
                          <Typography>ID vé: {row.id}</Typography>
                          <Typography>ID giao dịch: {row.transactionId}</Typography>
                        </Stack>
                      }>
                        <Avatar {...stringAvatar(row.holder)} />
                      </Tooltip>
                      <Tooltip title={
                        <Stack spacing={1}>
                          <Typography>ID vé: {row.id}</Typography>
                          <Typography>ID giao dịch: {row.transactionId}</Typography>
                        </Stack>
                      }>
                        <Typography variant="subtitle2">{row.holder}</Typography>
                      </Tooltip>

                    </Stack>
                  </TableCell>
                  <TableCell>{row.transactionShowTicketCategory.showTicketCategory.show.name}</TableCell>
                  <TableCell>{row.transactionShowTicketCategory.showTicketCategory.ticketCategory.name}</TableCell>
                  <TableCell>
                    <Chip
                      color={getPaymentStatusDetails(row.transactionShowTicketCategory.transaction.paymentStatus).color}
                      label={
                        getPaymentStatusDetails(row.transactionShowTicketCategory.transaction.paymentStatus).label
                      }
                      size="small"
                    />
                  </TableCell>


                  <TableCell>
                    <Chip
                      color={getRowStatusDetails(row.transactionShowTicketCategory.transaction.status).color}
                      label={getRowStatusDetails(row.transactionShowTicketCategory.transaction.status).label}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{dayjs(row.createdAt).format('HH:mm:ss DD/MM/YYYY')}</TableCell>
                  <TableCell>{row.checkInAt ? dayjs(row.checkInAt).format('HH:mm:ss DD/MM/YYYY') : ''}</TableCell>
                  <TableCell>
                    <IconButton color="primary" href={`/event-studio/events/${eventId}/transactions/${row.transactionId}`}>
                      <ArrowSquareUpRightIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
      <Divider />
      <TablePagination
        component="div"
        count={count}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Card>
  );
}
