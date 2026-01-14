"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  InputAdornment,
} from '@mui/material';
import { Add, Edit, CloudUpload, Delete } from '@mui/icons-material';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import NotificationContext from '@/contexts/notification-context';
import { useContext } from 'react';

interface Concession {
  id: number;
  eventId: number;
  code: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  status: 'active' | 'archived';
  createdAt: string;
}

interface ConcessionFormData {
  name: string;
  code: string;
  basePrice: number;
  description: string;
  imageUrl: string | null;
  status: 'active' | 'archived';
}

const initialForm: ConcessionFormData = {
  name: '',
  code: '',
  basePrice: 0,
  description: '',
  imageUrl: null,
  status: 'active',
};

export default function ConcessionsPage({ params }: { params: { event_id: string } }) {
  const eventId = parseInt(params.event_id);
  const notificationCtx = useContext(NotificationContext);

  const [concessions, setConcessions] = useState<Concession[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ConcessionFormData>(initialForm);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchConcessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await baseHttpServiceInstance.get(`/event-studio/events/${eventId}/concessions`);
      setConcessions(res.data);
    } catch (error: any) {
      notificationCtx.error('Lỗi tải danh sách hàng hóa: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [eventId, notificationCtx]);

  useEffect(() => {
    fetchConcessions();
  }, [fetchConcessions]);

  const handleOpenModal = (concession?: Concession) => {
    if (concession) {
      setIsEdit(true);
      setEditId(concession.id);
      setFormData({
        name: concession.name,
        code: concession.code,
        basePrice: concession.basePrice,
        description: concession.description || '',
        imageUrl: concession.imageUrl,
        status: concession.status,
      });
      setImagePreview(concession.imageUrl);
    } else {
      setIsEdit(false);
      setEditId(null);
      setFormData(initialForm);
      setImagePreview(null);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      // Step 1: Request presigned URL
      const presignedResponse = await baseHttpServiceInstance.post('/common/s3/generate_presigned_url', {
        filename: file.name,
        content_type: file.type,
      });

      const { presignedUrl, fileUrl } = presignedResponse.data;

      // Step 2: Upload file to S3
      await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      setImagePreview(fileUrl);
      setFormData(prev => ({ ...prev, imageUrl: fileUrl }));
    } catch (error: any) {
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      notificationCtx.error(`Lỗi tải ảnh: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (isEdit && editId) {
        await baseHttpServiceInstance.put(`/event-studio/events/${eventId}/concessions/${editId}`, formData);
        notificationCtx.success('Cập nhật hàng hóa thành công');
      } else {
        await baseHttpServiceInstance.post(`/event-studio/events/${eventId}/concessions`, formData);
        notificationCtx.success('Thêm hàng hóa thành công');
      }
      handleCloseModal();
      fetchConcessions();
    } catch (error: any) {
      notificationCtx.error('Lỗi lưu hàng hóa: ' + (error?.response?.data?.detail || error.message));
    }
  };

  const handleToggleStatus = async (concession: Concession) => {
    try {
      const newStatus = concession.status === 'active' ? 'archived' : 'active';
      await baseHttpServiceInstance.put(`/event-studio/events/${eventId}/concessions/${concession.id}`, {
        status: newStatus
      });
      notificationCtx.success('Cập nhật trạng thái thành công');
      fetchConcessions();
    } catch (error: any) {
      notificationCtx.error('Lỗi cập nhật trạng thái: ' + error.message);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">Quản lý Hàng hóa</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenModal()}
        >
          Thêm hàng hóa
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Hình ảnh</TableCell>
              <TableCell>Mã</TableCell>
              <TableCell>Tên hàng hóa</TableCell>
              <TableCell>Giá bán</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Đang tải...</TableCell>
              </TableRow>
            ) : concessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Chưa có hàng hóa nào</TableCell>
              </TableRow>
            ) : (
              concessions.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Box
                      component="img"
                      src={item.imageUrl || 'https://via.placeholder.com/50?text=No+Img'}
                      alt={item.name}
                      sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {item.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.basePrice)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={item.status === 'active'}
                      onChange={() => handleToggleStatus(item)}
                      color="success"
                    />
                    <Typography variant="caption" component="span" ml={1}>
                      {item.status === 'active' ? 'Đang bán' : 'Đã lưu trữ'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Chỉnh sửa">
                      <IconButton color="primary" onClick={() => handleOpenModal(item)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal Add/Edit */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Chỉnh sửa hàng hóa' : 'Thêm hàng hóa mới'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} pt={1}>
            {/* Image Upload Area */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src={imagePreview || 'https://via.placeholder.com/150?text=Upload+Image'}
                sx={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 2, border: '1px dashed #ccc' }}
              />
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUpload />}
                disabled={uploading}
              >
                {uploading ? 'Đang tải...' : 'Tải ảnh lên'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </Button>
            </Box>

            <TextField
              label="Tên hàng hóa"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Mã hàng hóa (Tự động nếu để trống)"
              fullWidth
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              helperText="Mã duy nhất, không dấu, viết liền (ví dụ: bap_rang_bo)"
            />
            <TextField
              label="Giá bán (VND)"
              fullWidth
              required
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
              InputProps={{
                endAdornment: <InputAdornment position="end">đ</InputAdornment>,
              }}
            />
            <TextField
              label="Mô tả"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit">Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {isEdit ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
