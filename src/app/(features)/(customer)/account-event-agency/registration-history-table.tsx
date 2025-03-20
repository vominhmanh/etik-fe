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
import { Chip, CircularProgress } from '@mui/material';
import { X } from '@phosphor-icons/react/dist/ssr';
import { AxiosResponse } from 'axios';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';


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


export interface EventAgencyRegistration {
  id: number;
  userId: number;
  businessType: 'individual' | 'company';
  contactFullName: string;
  contactEmail: string;
  contactPhoneNumber: string;
  contactAddress: string;
  registrationDate: string; // ISO format
  responseStatus: string | null;
  responseDatetime: string | null;


  // Individual fields
  fullName?: string;
  placeOfResidence?: string;

  // Shared field
  taxCode: string;

  // Company fields
  companyName?: string;
  businessAddress?: string;
  gcnIssueDate?: string;
  gcnIssuePlace?: string;
  registrationImage?: string | null;
}



const getResponseStatusDetail = (responseStatus: string | null) => {
  switch (responseStatus) {
    case 'waiting_for_acceptance':
      return { label: 'Đang kiểm tra', color: 'warning' };
    case 'accepted':
      return { label: 'Đã duyệt', color: 'success' };
    case 'rejected':
      return { label: 'Đã từ chối', color: 'secondary' };
    default:
      return { label: 'Chưa có phản hồi', color: 'default' }; // Handle null or unexpected values
  }
};


export function RegistrationHistoryTable(): React.JSX.Element {

  const [rows, setRows] = React.useState<EventAgencyRegistration[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [page, setPage] = React.useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = React.useState<number>(10);
  const notificationCtx = React.useContext(NotificationContext);

  async function fetchRegistrations(): Promise<EventAgencyRegistration[]> {
    try {
      const response: AxiosResponse<EventAgencyRegistration[]> = await baseHttpServiceInstance.get('/account/event_agency/registrations');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  React.useEffect(() => {
    async function loadRegistrations() {
      try {
        setIsLoading(true);
        const data = await fetchRegistrations();
        setRows(data);
      } catch (error) {
        notificationCtx.error('Không thể tải danh sách đơn đăng ký!');
      } finally {
        setIsLoading(false);
      }
    }
    loadRegistrations();
  }, []);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Card>
      <Box sx={{ overflowX: 'auto' }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: '800px' }}>
            <TableHead>
              <TableRow>
                <TableCell>Thời gian gửi</TableCell>
                <TableCell>Loại hình kinh doanh</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell>Mã số thuế</TableCell>
                <TableCell sx={{ minWidth: '160px' }}>Trạng thái đơn</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                <TableRow hover key={row.id}>
                  <TableCell>{dayjs(row.registrationDate).format('HH:mm:ss DD/MM/YYYY')}</TableCell>
                  <TableCell>{row.businessType === 'individual' ? 'Cá nhân' : 'Công ty'}</TableCell>
                  <TableCell>{row.fullName ?? row.companyName}</TableCell>
                  <TableCell>{row.taxCode || 'N/A'}</TableCell>
                  <TableCell>
                    <Stack spacing={0}>
                      <Chip
                        label={getResponseStatusDetail(row.responseStatus).label}
                        color={getResponseStatusDetail(row.responseStatus).color as any} // Ensure MUI color types are handled
                        size="small"
                      />
                      {row.responseDatetime &&
                        <Typography variant='body2'>
                          {dayjs(row.responseDatetime).format('HH:mm:ss DD/MM/YYYY')}
                        </Typography>}
                    </Stack>

                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
      <Divider />
      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Card>
  );
}

