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
import { useTranslation } from '@/contexts/locale-context';

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
  const { tt } = useTranslation();
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
      notificationCtx.error(tt('Tên máy in không được để trống.', 'Printer name cannot be empty.'));
      return;
    }
    if (!formData.ipAddress || !formData.ipAddress.trim()) {
      notificationCtx.error(tt('IP máy in không được để trống.', 'Printer IP cannot be empty.'));
      return;
    }

    // Basic IP validation
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipPattern.test(formData.ipAddress.trim())) {
      notificationCtx.error(tt('Định dạng IP không hợp lệ.', 'Invalid IP format.'));
      return;
    }

    try {
      setIsLoading(true);
      if (printer) {
        await updatePrinter(eventId, printer.id, formData);
        notificationCtx.success(tt('Cập nhật máy in thành công!', 'Printer updated successfully!'));
      } else {
        await createPrinter(eventId, formData);
        notificationCtx.success(tt('Thêm máy in thành công!', 'Printer added successfully!'));
      }
      onPrinterSaved();
      onClose();
    } catch (error: any) {
      notificationCtx.error(error.response?.data?.detail || tt('Có lỗi xảy ra.', 'An error occurred.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{printer ? tt('Sửa máy in', 'Edit Printer') : tt('Thêm máy in', 'Add Printer')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label={tt("Tên máy in", "Printer Name")}
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label={tt("IP máy in", "Printer IP")}
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
          {tt('Hủy', 'Cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isLoading}>
          {printer ? tt('Cập nhật', 'Update') : tt('Thêm', 'Add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

