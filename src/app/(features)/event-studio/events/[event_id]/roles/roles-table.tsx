'use client';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import * as React from 'react';

import { Chip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { X } from '@phosphor-icons/react/dist/ssr';
import dayjs from 'dayjs';
import { Role } from './page';
import { useTranslation } from '@/contexts/locale-context';


// Function to map payment statuses to corresponding labels and colors
const getRoleTags = (role: string, tt: (vi: string, en: string) => string) => {
  switch (role) {
    case 'owner':
      return { label: tt('Quản trị viên', 'Administrator'), color: 'success' };
    case 'member':
      return { label: tt('Thành viên', 'Member'), color: 'default' };
    case 'supporter':
      return { label: tt('Cộng tác viên', 'Supporter'), color: 'default' };
    default:
      return { label: tt('Unknown', 'Unknown'), color: 'default' };
  }
};

const getDetailText = (role: string, tt: (vi: string, en: string) => string) => {
  switch (role) {
    case 'isCreator':
      return { label: tt('Người tạo', 'Creator'), color: 'success' };
    case 'allowCheckIn':
      return { label: tt('Soát vé', 'Check-in'), color: 'default' };
    case 'allowSellTicket':
      return { label: tt('Bán vé', 'Sell tickets'), color: 'default' };
    default:
      return { label: tt('Unknown', 'Unknown'), color: 'default' };
  }
};

// Function to map row statuses to corresponding labels and colors
const getRowStatusDetails = (status: string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
    case 'normal':
      return { label: 'Bình thường', color: 'success' };
    case 'wait_for_response':
      return { label: 'Đang chờ', color: 'warning' };
    case 'customer_cancelled':
      return { label: 'Huỷ bởi KH', color: 'error' }; // error for danger
    case 'staff_locked':
      return { label: 'Khoá bởi NV', color: 'error' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
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
  const { tt } = useTranslation();

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
              <TableCell>{tt("Email", "Email")}</TableCell>
              <TableCell>{tt("Tên gợi nhớ", "Alias")}</TableCell>
              <TableCell>{tt("Quyền", "Role")}</TableCell>
              <TableCell>{tt("Chi tiết", "Details")}</TableCell>
              <TableCell>{tt("Thời gian tạo", "Created At")}</TableCell>
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
                      color={getRoleTags(row.role, tt).color}
                      label={getRoleTags(row.role, tt).label}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={1} direction={'row'}>
                      <Typography variant='caption' sx={{textWrap: 'nowrap'}}>{row.isCreator && getDetailText('isCreator', tt).label}</Typography>
                      <Typography variant='caption' sx={{textWrap: 'nowrap'}}>{row.role === 'supporter' && row.allowCheckIn && getDetailText('allowCheckIn', tt).label}</Typography>
                      <Typography variant='caption' sx={{textWrap: 'nowrap'}}>{row.role === 'supporter' && row.allowSellTicket && getDetailText('allowSellTicket', tt).label}</Typography>

                    </Stack>
                  </TableCell>
                  <TableCell>{dayjs(row.createdAt).format('HH:mm:ss DD/MM/YYYY')}</TableCell>
                  <TableCell>
                    {row.isCreator !== true &&
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
