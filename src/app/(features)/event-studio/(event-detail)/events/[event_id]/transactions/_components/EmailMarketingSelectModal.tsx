'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  CircularProgress,
  Box,
  Divider,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { useTranslation } from '@/contexts/locale-context';

interface EmailMarketing {
  id: number;
  title: string;
  senderName: string;
  sendType: 'by_order' | 'by_ticket';
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (templateId: number) => void;
  eventId: string | number;
}

export const EmailMarketingSelectModal: React.FC<Props> = ({ open, onClose, onSelect, eventId }) => {
  const { tt } = useTranslation();
  const router = useRouter();
  const [templates, setTemplates] = React.useState<EmailMarketing[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchTemplates = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await baseHttpServiceInstance.get(`/event-studio/events/${eventId}/email-marketings`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch email marketing templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, fetchTemplates]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{tt('Chọn mẫu Email Marketing', 'Select Email Marketing Template')}</DialogTitle>
      <Divider />
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : templates.length > 0 ? (
          <List>
            {templates.map((template) => (
              <ListItem key={template.id} disablePadding>
                <ListItemButton onClick={() => onSelect(template.id)}>
                  <ListItemText
                    primary={template.title}
                    secondary={`${tt('Người gửi:', 'Sender:')} ${template.senderName} | ${
                      template.sendType === 'by_order'
                        ? tt('Gửi theo đơn hàng', 'Send by Order')
                        : tt('Gửi theo vé', 'Send by Ticket')
                    }`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {tt(
                'Chưa có mẫu email marketing nào được tạo cho sự kiện này.',
                'No email marketing templates have been created for this event yet.'
              )}
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push(`/event-studio/events/${eventId}/templates/email-marketing/create`)}
            >
              {tt('Tạo mẫu mới', 'Create New Template')}
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tt('Hủy', 'Cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
};
