'use client';

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
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { LocalizedLink } from '@/components/localized-link';
import { useTranslation } from '@/contexts/locale-context';

import * as React from 'react';

import { Chip, ChipProps } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { ArrowSquareUpRight as ArrowSquareUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowSquareUpRight';
import { Bank as BankIcon } from '@phosphor-icons/react/dist/ssr/Bank';
import { Lightning as LightningIcon } from '@phosphor-icons/react/dist/ssr/Lightning';
import { Money as MoneyIcon } from '@phosphor-icons/react/dist/ssr/Money';
import dayjs from 'dayjs';

// Function to map payment methods to corresponding labels and icons
const getPaymentMethodDetails = (paymentMethod: string, tt: (vi: string, en: string) => string) => {
  switch (paymentMethod) {
    case 'cash':
      return { label: tt('Tiền mặt', 'Cash'), icon: <MoneyIcon /> };
    case 'transfer':
      return { label: tt('Chuyển khoản', 'Bank Transfer'), icon: <BankIcon /> };
    case 'napas247':
      return { label: tt('Napas 247', 'Napas 247'), icon: <LightningIcon /> };
    default:
      return { label: tt('Không xác định', 'Unknown'), icon: null };
  }
};

// Function to map payment statuses to corresponding labels and colors
const getPaymentStatusDetails = (paymentStatus: string, tt: (vi: string, en: string) => string): { label: string, color: ChipProps['color'] } => {
  switch (paymentStatus) {
    case 'waiting_for_payment':
      return { label: tt('Chờ thanh toán', 'Waiting for Payment'), color: 'default' };
    case 'paid':
      return { label: tt('Đã thanh toán', 'Paid'), color: 'success' };
    case 'refund':
      return { label: tt('Đã hoàn tiền', 'Refunded'), color: 'secondary' };
    default:
      return { label: tt('Không xác định', 'Unknown'), color: 'default' };
  }
};

// Function to map row statuses to corresponding labels and colors
const getRowStatusDetails = (status: string, tt: (vi: string, en: string) => string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
    case 'normal':
      return { label: tt('Bình thường', 'Normal'), color: 'success' };
    case 'wait_for_response':
      return { label: tt('Đang chờ', 'Pending'), color: 'warning' };
    case 'customer_cancelled':
      return { label: tt('Huỷ bởi KH', 'Cancelled by Customer'), color: 'error' };
    case 'staff_locked':
      return { label: tt('Khoá bởi NV', 'Locked by Staff'), color: 'error' };
    default:
      return { label: tt('Không xác định', 'Unknown'), color: 'default' };
  }
};

const getSentEmailTicketStatusDetails = (status: string, tt: (vi: string, en: string) => string): { label: string, color: ChipProps['color'] } => {
  switch (status) {
    case 'sent':
      return { label: tt('Đã xuất', 'Issued'), color: 'success' };
    case 'not_sent':
      return { label: tt('Chưa xuất', 'Not Issued'), color: 'default' };
    default:
      return { label: tt('Không xác định', 'Unknown'), color: 'default' };
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
  exportedTicketAt: string | null;
  cancelRequestStatus: string | null;
}


type Order = 'asc' | 'desc';

export interface CustomersTableProps {
  count?: number; // Total number of transactions.
  page?: number; // Current page index (0-based).
  rows?: Transaction[]; // Array of transactions to display in the table.
  rowsPerPage?: number; // Number of rows displayed per page.
  eventId: number; // The ID of the event these transactions belong to.
  selected: Set<number>; // Set of selected transaction IDs.
  orderBy?: string; // Current sort column.
  order?: Order; // Current sort order.
  onPageChange: (newPage: number) => void; // Callback to handle page changes.
  onRowsPerPageChange: (newRowsPerPage: number) => void; // Callback to handle changes in rows per page.
  onSortChange: (orderBy: string, order: Order) => void; // Callback to handle sort changes.
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
  orderBy = '',
  order = 'asc',
  onPageChange,
  onRowsPerPageChange,
  onSortChange,
  onSelectMultiple,
  onDeselectMultiple,
  onSelectOne,
  onDeselectOne,
}: CustomersTableProps): React.JSX.Element {
  const { tt } = useTranslation();
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    onSortChange(property, newOrder);
  };

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
              <TableCell sx={{ minWidth: '200px' }}>{tt('Họ tên', 'Full Name')}</TableCell>
              <TableCell sx={{ width: '100px' }}>{tt('Số lượng', 'Quantity')}</TableCell>
              <TableCell>{tt('Trạng thái', 'Status')}</TableCell>
              <TableCell>{tt('Thanh toán', 'Payment')}</TableCell>
              <TableCell>{tt('Xuất vé', 'Ticket Issued')}</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'createdAt'}
                  direction={orderBy === 'createdAt' ? order : 'asc'}
                  onClick={() => handleRequestSort('createdAt')}
                >
                  {tt('Thời gian tạo', 'Created At')}
                </TableSortLabel>
              </TableCell>
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
                          <Typography variant='body2'>{tt('Email:', 'Email:')} {row.email}</Typography>
                          <Typography variant='body2'>{tt('SĐT:', 'Phone:')} {row.phoneNumber}</Typography>
                          <Typography>{tt('ID:', 'ID:')} {row.id}</Typography>
                        </Stack>
                      }>
                        <Avatar {...stringAvatar(row.name)} />
                      </Tooltip>
                      <Tooltip title={
                        <Stack spacing={1}>
                          <Typography>{tt('Email:', 'Email:')} {row.email}</Typography>
                          <Typography>{tt('SĐT:', 'Phone:')} {row.phoneNumber}</Typography>
                          <Typography>{tt('ID:', 'ID:')} {row.id}</Typography>
                        </Stack>
                      }>
                        <Typography variant="subtitle2">{row.name}</Typography>
                      </Tooltip>

                    </Stack>
                  </TableCell>
                  <TableCell>{row.ticketQuantity}</TableCell>
                  <TableCell>
                    <Stack spacing={0} direction={'row'}>
                      <Chip
                        color={getRowStatusDetails(row.status).color}
                        label={getRowStatusDetails(row.status).label}
                        size="small"
                      />
                      {row.cancelRequestStatus == 'pending' &&
                        <Tooltip title={
                          <Typography>{tt('Khách hàng yêu cầu hủy', 'Customer requested cancellation')}</Typography>
                        }>
                          <Chip color={'error'} size="small" label={<WarningCircle size={16} />} />
                        </Tooltip>
                      }
                    </Stack>

                  </TableCell>
                  <TableCell>
                    <Tooltip
                      title={
                        <Stack spacing={1}>
                          <Typography variant="body2">
                            {tt('Phương thức thanh toán:', 'Payment Method:')} {getPaymentMethodDetails(row.paymentMethod, tt).label}
                          </Typography>
                          <Typography variant="body2">{tt('Trạng thái:', 'Status:')} {getPaymentStatusDetails(row.paymentStatus, tt).label}</Typography>
                        </Stack>
                      }
                    >
                      <Chip
                        color={getPaymentStatusDetails(row.paymentStatus, tt).color as ChipProps['color']}
                        label={
                          <>
                            {getPaymentMethodDetails(row.paymentMethod, tt).icon}{" "}
                            {formatPrice(row.totalAmount)}
                          </>
                        }
                        size="small"
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getSentEmailTicketStatusDetails(row.exportedTicketAt ? 'sent' : 'not_sent', tt).color as ChipProps['color']}
                      label={getSentEmailTicketStatusDetails(row.exportedTicketAt ? 'sent' : 'not_sent', tt).label}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{dayjs(row.createdAt).format('HH:mm:ss DD/MM/YYYY')}</TableCell>
                  <TableCell>
                    <IconButton color="primary" target='_blank' component={LocalizedLink}
                      href={`/event-studio/events/${eventId}/transactions/${row.id}`}>
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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2 }}>
        <TablePagination
          component="div"
          count={count}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          showFirstButton
          showLastButton
        />
      </Box>
      <Divider />
    </Card>
  );
}
