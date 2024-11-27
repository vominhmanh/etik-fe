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
import { X } from '@phosphor-icons/react/dist/ssr';
import { Role } from './page';


// Function to map payment statuses to corresponding labels and colors
const getRoleDetails = (role: string) => {
  switch (role) {
    case 'owner':
      return { label: 'Chủ sở hữu', color: 'success' };
    case 'member':
      return { label: 'Thành viên', color: 'default' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

// Function to map row statuses to corresponding labels and colors
const getRowStatusDetails = (status: string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
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


function noop(): void {
  // do nothing
}


interface CustomersTableProps {
  count?: number;
  page?: number;
  rows?: Role[];
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
  rows?: Role[];
  rowsPerPage?: number;
  eventId: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onDeleteMember: (userId: number) => void;
}

export function RolesTable({
  count = 0,
  rows = [],
  page = 0,
  rowsPerPage = 10,
  eventId = 0,
  onPageChange,
  onRowsPerPageChange,
  onDeleteMember,
}: CustomersTableProps): React.JSX.Element {

  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
  };

  const rowIds = React.useMemo(() => {
    return rows.map((transaction) => transaction.userId);
  }, [rows]);

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: '800px' }}>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Tên gợi nhớ</TableCell>
              <TableCell>Quyền</TableCell>
              <TableCell>Thời gian tạo</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              return (
                <TableRow hover key={row.userId} >
                  <TableCell>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                      <Avatar {...stringAvatar(row.user?.email || '')} />
                      <Typography variant="subtitle2">{row.user?.email}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{row.alias}</TableCell>                    
                  <TableCell>
                    <Chip
                      color={getRoleDetails(row.role).color}
                      label={getRoleDetails(row.role).label}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{dayjs(row.createdAt).format('HH:mm:ss DD/MM/YYYY')}</TableCell>
                  <TableCell>
                    {row.role != 'owner' && 
                    <IconButton color="primary" onClick={() => onDeleteMember(row.userId)}>
                      <X />
                    </IconButton>}
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
