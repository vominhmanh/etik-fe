'use client';

import React, { useContext, useEffect, useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { AxiosResponse } from 'axios';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { PencilSimple as PencilIcon } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { useRouter } from 'next/navigation';
import { LocalizedLink } from '@/components/homepage/localized-link';
import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';

interface InvitationDesign {
  id: number;
  name: string;
  size: string;
  customSize?: { width: number; height: number } | null;
  createdAt?: string;
  updatedAt?: string;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt } = useTranslation();
  const router = useRouter();
  const notificationCtx = useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState(false);
  const [designs, setDesigns] = useState<InvitationDesign[]>([]);

  useEffect(() => {
    document.title = tt('Danh sách thiết kế thư mời | ETIK - Vé điện tử & Quản lý sự kiện', 'Invitation Designs List | ETIK - E-tickets & Event Management');
  }, [tt]);

  // Fetch designs
  useEffect(() => {
    let isCancelled = false;
    const fetchDesigns = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<InvitationDesign[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/invitation-letter-designs`
        );
        if (response.status === 200 && !isCancelled) {
          setDesigns(response.data || []);
        }
      } catch (error: any) {
        if (!isCancelled) {
          notificationCtx.error(tt('Không thể tải danh sách thiết kế thư mời.', 'Unable to load invitation designs.') + ` ${error?.message || error}`);
          setDesigns([]);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };
    fetchDesigns();
    return () => {
      isCancelled = true;
    };
  }, [params.event_id, notificationCtx, tt]);

  const handleDelete = async (id: number) => {
    if (!window.confirm(tt('Bạn có chắc chắn muốn xóa thiết kế thư mời này?', 'Are you sure you want to delete this invitation design?'))) {
      return;
    }
    try {
      setIsLoading(true);
      await baseHttpServiceInstance.delete(
        `/event-studio/events/${params.event_id}/invitation-letter-designs/${id}`
      );
      setDesigns(prev => prev.filter(design => design.id !== id));
      notificationCtx.success(tt('Đã xóa thiết kế thư mời thành công!', 'Invitation design deleted successfully!'));
    } catch (error: any) {
      notificationCtx.error(tt('Lỗi khi xóa thiết kế thư mời:', 'Error deleting invitation design:') + ` ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">
          {tt('Danh sách thiết kế thư mời', 'Invitation Designs List')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<PlusIcon />}
          disabled={isLoading}
          component={LocalizedLink}
          href={`/event-studio/events/${params.event_id}/invitation-letter-designs/create`}
        >
          {tt('Tạo thiết kế mới', 'Create New Design')}
        </Button>
      </Stack>

      {isLoading && designs.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : designs.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              {tt('Chưa có thiết kế thư mời nào. Hãy tạo thiết kế mới!', 'No invitation designs yet. Create a new design!')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {designs.map((design) => (
            <Grid item xs={12} sm={6} md={4} key={design.id}>
              <Card>
                <CardActionArea
                  component={LocalizedLink}
                  href={`/event-studio/events/${params.event_id}/invitation-letter-designs/${design.id}`}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                      <Typography variant="h6" component="div" sx={{ flex: 1 }}>
                        {design.name || tt('Thiết kế không tên', 'Unnamed Design')}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {tt('Kích thước:', 'Size:')} {design.size}
                      {design.customSize && ` (${design.customSize.width}x${design.customSize.height}mm)`}
                    </Typography>
                    {design.updatedAt && (
                      <Typography variant="caption" color="text.secondary">
                        {tt('Cập nhật:', 'Updated:')} {formatDate(design.updatedAt)}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<PencilIcon />}
                    component={LocalizedLink}
                    href={`/event-studio/events/${params.event_id}/invitation-letter-designs/${design.id}`}
                  >
                    {tt('Chỉnh sửa', 'Edit')}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<TrashIcon />}
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(design.id);
                    }}
                    disabled={isLoading}
                  >
                    {tt('Xóa', 'Delete')}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
