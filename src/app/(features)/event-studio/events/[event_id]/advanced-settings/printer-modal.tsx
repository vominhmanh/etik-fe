'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField
} from '@mui/material';
import { AxiosResponse } from 'axios';
import { useContext, useState, useEffect } from 'react';

import NotificationContext from '@/contexts/notification-context';

export interface TicketTagPrinter {
  id: number;
  eventId: number;
  name: string;
  ipAddress: string;
}

type PrinterModalProps = {
  eventId: number;
  printer: TicketTagPrinter | null;
  open: boolean;
  onClose: () => void;
  onPrinterSaved: () => void;
};

export default function PrinterModal({
  eventId,
  printer,
  open,
  onClose,
  onPrinterSaved,
}: PrinterModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const notificationCtx = useContext(NotificationContext);

  const [formData, setFormData] = useState<{
    name: string;
    ipAddress: string;
  }>({
    name: '',
    ipAddress: '',
  });

  useEffect(() => {
    if (printer) {
      setFormData({
        name: printer.name,
        ipAddress: printer.ipAddress,
      });
    } else {
      setFormData({
        name: '',
        ipAddress: '',
      });
    }
  }, [printer, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  async function createPrinter(eventId: number, data: { name: string; ipAddress: string }) {
    try {
      const response: AxiosResponse<TicketTagPrinter> = await baseHttpServiceInstance.post(
        `/event-studio/events/${eventId}/ticket-tag-printers`,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async function updatePrinter(eventId: number, printerId: number, data: { name: string; ipAddress: string }) {
    try {
      const response: AxiosResponse<TicketTagPrinter> = await baseHttpServiceInstance.put(
        `/event-studio/events/${eventId}/ticket-tag-printers/${printerId}`,
        data
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.name.trim()) {
      notificationCtx.error('Tên máy in không được để trống.');
      return;
    }
    if (!formData.ipAddress || !formData.ipAddress.trim()) {
      notificationCtx.error('IP máy in không được để trống.');
      return;
    }

    // Basic IP validation
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipPattern.test(formData.ipAddress.trim())) {
      notificationCtx.error('Định dạng IP không hợp lệ.');
      return;
    }

    try {
      setIsLoading(true);
      if (printer) {
        await updatePrinter(eventId, printer.id, formData);
        notificationCtx.success('Cập nhật máy in thành công!');
      } else {
        await createPrinter(eventId, formData);
        notificationCtx.success('Thêm máy in thành công!');
      }
      onPrinterSaved();
      onClose();
    } catch (error: any) {
      notificationCtx.error(error.response?.data?.detail || 'Có lỗi xảy ra.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{printer ? 'Sửa máy in' : 'Thêm máy in'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Tên máy in"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label="IP máy in"
            name="ipAddress"
            value={formData.ipAddress}
            onChange={handleChange}
            fullWidth
            required
            placeholder="192.168.1.100"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={isLoading}>
          Hủy
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isLoading}>
          {printer ? 'Cập nhật' : 'Thêm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

