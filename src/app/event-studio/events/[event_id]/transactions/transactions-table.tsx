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
import { Button, CardActionArea, Chip, Menu, MenuItem } from '@mui/material';

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
      return { label: 'Bình thường', color: 'success' };
    case 'customer_cancelled':
      return { label: 'Huỷ bởi KH', color: 'error' }; // error for danger
    case 'staff_locked':
      return { label: 'Khoá bởi NV', color: 'error' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

const getSentEmailTicketStatusDetails = (status: string) => {
  switch (status) {
    case 'sent':
      return { label: 'Đã xuất', color: 'success' };
    case 'not_sent':
      return { label: 'Chưa xuất', color: 'default' }; // error for danger
    default:
      return { label: 'Unknown', color: 'default' };
  }
};


export interface Transaction {
  id: number;
  email: string;
  name: string;
  phoneNumber: string;
  ticketQuantity: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  sentTicketEmailAt: string | null;
}


export interface CustomersTableProps {
  count?: number; // Total number of transactions.
  page?: number; // Current page index (0-based).
  rows?: Transaction[]; // Array of transactions to display in the table.
  rowsPerPage?: number; // Number of rows displayed per page.
  eventId: number; // The ID of the event these transactions belong to.
  selected: Set<number>; // Set of selected transaction IDs.
  onPageChange: (newPage: number) => void; // Callback to handle page changes.
  onRowsPerPageChange: (newRowsPerPage: number) => void; // Callback to handle changes in rows per page.
  onSelectMultiple: (rowIds: number[]) => void; // Callback to handle selecting multiple rows.
  onDeselectMultiple: (rowIds: number[]) => void; // Callback to handle deselecting multiple rows.
  onSelectOne: (rowId: number) => void; // Callback to handle selecting a single row.
  onDeselectOne: (rowId: number) => void; // Callback to handle deselecting a single row.
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
export function TransactionsTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 10,
  eventId = 0,
  selected, // use from parent component
  onPageChange,
  onRowsPerPageChange,
  onSelectMultiple,
  onDeselectMultiple,
  onSelectOne,
  onDeselectOne,
}: CustomersTableProps): React.JSX.Element {
  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
  };

  // Check if some or all rows on the current page are selected
  const currentPageRowIds = rows.map((row) => row.id);
  const selectedSomeThisPage = currentPageRowIds.some((id) => selected.has(id));
  const selectedAllThisPage = currentPageRowIds.every((id) => selected.has(id));

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedAllThisPage}
                  indeterminate={selectedSomeThisPage && !selectedAllThisPage}
                  onChange={(event) => {
                    if (event.target.checked) {
                      // Select all rows on this page
                      onSelectMultiple(currentPageRowIds);
                    } else {
                      // Deselect all rows on this page
                      onDeselectMultiple(currentPageRowIds);
                    }
                  }}
                />
              </TableCell>
              <TableCell sx={{minWidth: '200px'}}>Họ tên</TableCell>
              <TableCell sx={{width: '100px'}}>Số lượng</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Thanh toán</TableCell>
              <TableCell>Xuất vé</TableCell>
              <TableCell>Thời gian tạo</TableCell>
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
                          // Select a single row
                          onSelectOne(row.id);
                        } else {
                          // Deselect a single row
                          onDeselectOne(row.id);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                      <Tooltip title={
                        <Stack spacing={1}>
                          <Typography variant='body2'>Email: {row.email}</Typography>
                          <Typography variant='body2'>SĐT: {row.phoneNumber}</Typography>
                          <Typography>ID: {row.id}</Typography>
                        </Stack>
                      }>
                        <Avatar {...stringAvatar(row.name)} />
                      </Tooltip>
                      <Tooltip title={
                        <Stack spacing={1}>
                          <Typography>Email: {row.email}</Typography>
                          <Typography>SĐT: {row.phoneNumber}</Typography>
                          <Typography>ID: {row.id}</Typography>
                        </Stack>
                      }>
                        <Typography variant="subtitle2">{row.name}</Typography>
                      </Tooltip>

                    </Stack>
                  </TableCell>
                  <TableCell>{row.ticketQuantity}</TableCell>
                  <TableCell>
                    <Chip
                      color={getRowStatusDetails(row.status).color}
                      label={getRowStatusDetails(row.status).label}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip
                      title={
                        <Stack spacing={1}>

                          <Typography variant="body2">
                            Phương thức thanh toán: {getPaymentMethodDetails(row.paymentMethod).label}
                          </Typography>
                          <Typography variant="body2">Trạng thái: {getPaymentStatusDetails(row.paymentStatus).label}</Typography>
                        </Stack>
                      }
                    >
                      <Chip
                        color={getPaymentStatusDetails(row.paymentStatus).color}
                        label={
                          <>
                            {getPaymentMethodDetails(row.paymentMethod).icon}{" "}
                            {formatPrice(row.totalAmount)}
                          </>
                        }
                        size="small"
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getSentEmailTicketStatusDetails(row.sentTicketEmailAt ? 'sent' : 'not_sent').color}
                      label={getSentEmailTicketStatusDetails(row.sentTicketEmailAt ? 'sent' : 'not_sent').label}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{dayjs(row.createdAt).format('HH:mm:ss DD/MM/YYYY')}</TableCell>
                  <TableCell>
                    <IconButton color="primary" target='_blank' href={`/event-studio/events/${eventId}/transactions/${row.id}`}>
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
      <Divider />

    </Card>
  );
}
