'use client';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import * as React from 'react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type EmailMarketingResponse = {
  id: number;
  eventId: number;
  title: string;
  senderName: string;
  sendType: 'by_order' | 'by_ticket';
  createdAt: string;
  updatedAt: string;
};

export default function Page(): React.JSX.Element {
  const { tt, locale } = useTranslation();
  const params = useParams();
  const event_id = params.event_id as string;
  const notificationCtx = React.useContext(NotificationContext);

  const [emails, setEmails] = useState<EmailMarketingResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    document.title = tt(
      "Danh sách email marketing | ETIK - Vé điện tử & Quản lý sự kiện",
      "Email Marketing List | ETIK - E-tickets & Event Management"
    );
  }, [tt]);

  const fetchEmails = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await baseHttpServiceInstance.get(
        `/event-studio/events/${event_id}/email-marketings`
      );
      setEmails(response.data);
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [event_id, notificationCtx]);

  useEffect(() => {
    if (event_id) {
      fetchEmails();
    }
  }, [event_id, fetchEmails]);

  const handleDelete = async (id: number) => {
    if (window.confirm(tt('Bạn có chắc chắn muốn xóa email marketing này không?', 'Are you sure you want to delete this email marketing?'))) {
      try {
        setIsLoading(true);
        await baseHttpServiceInstance.delete(
          `/event-studio/events/${event_id}/email-marketings/${id}`
        );
        notificationCtx.success(tt('Xóa thành công.', 'Deleted successfully.'));
        fetchEmails();
      } catch (error) {
        notificationCtx.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Stack spacing={3}>
      <Backdrop
        open={isLoading}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">{tt("Email Marketing", "Email Marketing")}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          href={`/event-studio/events/${event_id}/templates/email-marketing/create`}
        >
          {tt("Tạo mới", "Create New")}
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{tt("Tiêu đề", "Title")}</TableCell>
                <TableCell>{tt("Tên người gửi", "Sender Name")}</TableCell>
                <TableCell>{tt("Loại gửi", "Send Type")}</TableCell>
                <TableCell>{tt("Ngày tạo", "Created At")}</TableCell>
                <TableCell align="right">{tt("Hành động", "Actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {emails.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" sx={{ py: 3 }}>
                      {tt("Chưa có email marketing nào được tạo.", "No email marketing created yet.")}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                emails.map((email) => (
                  <TableRow key={email.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{email.title}</Typography>
                    </TableCell>
                    <TableCell>{email.senderName}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          email.sendType === 'by_order'
                            ? tt("Theo đơn hàng", "By Order")
                            : tt("Theo từng vé", "By Ticket")
                        }
                        size="small"
                        color={email.sendType === 'by_order' ? 'primary' : 'secondary'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{new Date(email.createdAt).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US')}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        component={Link}
                        href={`/event-studio/events/${event_id}/templates/email-marketing/${email.id}`}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(email.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>{tt("Lưu ý", "Note")}</Typography>
          <ul>
            <li style={{ color: 'red' }}>
              {tt(
                "Nghiêm cấm sử dụng Email marketing để phát tán spam, lừa đảo, virus, tuyên truyền chống Nhà nước và các hành vi trái pháp luật khác.",
                "It is strictly prohibited to use Email marketing to spread spam, fraud, viruses, anti-state propaganda and other illegal acts."
              )}
            </li>
          </ul>
        </CardContent>
      </Card>
    </Stack>
  );
}
