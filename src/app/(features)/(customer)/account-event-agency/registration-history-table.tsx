'use client';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
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

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Chip, CircularProgress } from '@mui/material';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';




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




export function RegistrationHistoryTable(): React.JSX.Element {
  const { tt } = useTranslation();
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
        notificationCtx.error(tt('Không thể tải danh sách đơn đăng ký!', 'Unable to load registration list!'));
      } finally {
        setIsLoading(false);
      }
    }
    loadRegistrations();
  }, [tt, notificationCtx]);
  
  const getResponseStatusDetail = React.useCallback((responseStatus: string | null) => {
    switch (responseStatus) {
      case 'waiting_for_acceptance':
        return { label: tt('Đang kiểm tra', 'Under Review'), color: 'warning' as const };
      case 'accepted':
        return { label: tt('Đã duyệt', 'Approved'), color: 'success' as const };
      case 'rejected':
        return { label: tt('Đã từ chối', 'Rejected'), color: 'secondary' as const };
      default:
        return { label: tt('Chưa có phản hồi', 'No Response'), color: 'default' as const };
    }
  }, [tt]);

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
                <TableCell>{tt('Thời gian gửi', 'Submission Time')}</TableCell>
                <TableCell>{tt('Loại hình kinh doanh', 'Business Type')}</TableCell>
                <TableCell>{tt('Tên', 'Name')}</TableCell>
                <TableCell>{tt('Mã số thuế', 'Tax Code')}</TableCell>
                <TableCell sx={{ minWidth: '160px' }}>{tt('Trạng thái đơn', 'Status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                <TableRow hover key={row.id}>
                  <TableCell>{dayjs(row.registrationDate).format('HH:mm:ss DD/MM/YYYY')}</TableCell>
                  <TableCell>{row.businessType === 'individual' ? tt('Cá nhân', 'Individual') : tt('Công ty', 'Company')}</TableCell>
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

