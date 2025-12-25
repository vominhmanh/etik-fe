'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';

import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

interface LuckyWheelSpinHistoryRow {
  id: number;
  userId: number;
  userFullName: string;
  invoiceCode?: string | null;
  phoneNumber?: string | null;
  prizeId?: number | null;
  prizeName?: string | null;
  spinIndex: number;
  isWin: boolean;
  createdAt: string;
}

export default function HistoryPage({ eventId }: { eventId: number }) {
  const notificationCtx = React.useContext(NotificationContext);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LuckyWheelSpinHistoryRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/mini-app-lucky-wheel/history?limit=200`
      );
      setRows(res.data || []);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Không thể tải lịch sử quay';
      setError(msg);
      notificationCtx.error('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;
    void fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  return (
    <Card>
      <CardHeader title="Lịch sử quay" subheader="Danh sách lượt quay đã ghi nhận (mới nhất trước)" />
      <Divider />
      <CardContent sx={{ padding: 0 }}>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <div style={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width={80}>ID</TableCell>
                  <TableCell>Họ tên</TableCell>
                  <TableCell width={160}>Mã hóa đơn</TableCell>
                  <TableCell width={160}>SĐT</TableCell>
                  <TableCell>Giải thưởng</TableCell>
                  <TableCell width={110}>KQ</TableCell>
                  <TableCell width={200}>Thời gian</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Typography variant="body2">Chưa có lịch sử</Typography>
                    </TableCell>
                  </TableRow>
                ) : null}

                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.userFullName}</TableCell>
                    <TableCell>{r.invoiceCode || '-'}</TableCell>
                    <TableCell>{r.phoneNumber || '-'}</TableCell>
                    <TableCell>{r.prizeName || '-'}</TableCell>
                    <TableCell>
                      {r.isWin ? (
                        <Chip label="Trúng" color="success" size="small" />
                      ) : (
                        <Chip label="Trượt" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Stack>
      </CardContent>
    </Card>
  );
}

