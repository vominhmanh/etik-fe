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
    case 'initial':
      return { label: 'Khởi tạo', color: 'default' };
    case 'active':
      return { label: 'Khả dụng', color: 'success' };
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

export interface Ticket {
  id: number;
  holder: string;
  createdAt: string;
  checkInAt: string | null;
}

export interface TicketCategory {
  id: number;
  name: string;
  type: string;
  price: number;
  avatar: string | null;
  quantity: number;
  sold: number;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  eventId: number;
  customerId: number;
  email: string;
  name: string;
  gender: string;
  phoneNumber: string;
  address: string;
  dob: string | null;
  ticketCategory: TicketCategory;
  ticketQuantity: number;
  netPricePerOne: number;
  extraFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentOrderCode: string | null;
  paymentDueDatetime: string | null;
  paymentCheckoutUrl: string | null;
  paymentTransactionDatetime: string | null;
  note: string | null;
  status: string;
  createdBy: number;
  createdAt: string;
  tickets: Ticket[];
}


interface CustomersTableProps {
  count?: number;
  page?: number;
  rows?: Transaction[];
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
  rows?: Transaction[];
  rowsPerPage?: number;
  eventId: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

export function TransactionsTable({
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
    return rows.map((transaction) => transaction.id);
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
              <TableCell>Loại vé</TableCell>
              <TableCell>Số lượng</TableCell>
              <TableCell>Thanh toán</TableCell>
              <TableCell>Trạng thái</TableCell>
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
                          <Typography variant='body2'>Email: {row.email}</Typography>
                          <Typography variant='body2'>SĐT: {row.phoneNumber}</Typography>
                        </Stack>
                      }>
                        <Avatar {...stringAvatar(row.name)} />
                      </Tooltip>
                      <Tooltip title={
                        <Stack spacing={1}>
                          <Typography>Email: {row.email}</Typography>
                          <Typography>SĐT: {row.phoneNumber}</Typography>
                        </Stack>
                      }>
                        <Typography variant="subtitle2">{row.name}</Typography>
                      </Tooltip>

                    </Stack>
                  </TableCell>
                  <TableCell>{row.ticketCategory.name}</TableCell>
                  <TableCell>{row.ticketQuantity}</TableCell>

                  <TableCell>
                    <Tooltip
                      title={
                        <Stack spacing={1}>
                          <Typography variant="body2">
                            Giá gốc: {formatPrice(row.netPricePerOne * row.ticketQuantity)}
                          </Typography>
                          <Typography variant="body2">
                            Phụ phí: {formatPrice(row.extraFee)}
                          </Typography>
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
                      color={getRowStatusDetails(row.status).color}
                      label={getRowStatusDetails(row.status).label}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{dayjs(row.createdAt).format('HH:mm:ss DD/MM/YYYY')}</TableCell>
                  <TableCell>
                    <IconButton color="primary" href={`/event-studio/events/${eventId}/transactions/${row.id}`}>
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
