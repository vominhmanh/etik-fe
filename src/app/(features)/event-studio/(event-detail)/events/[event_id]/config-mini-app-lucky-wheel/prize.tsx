'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Paper,
  Chip,
} from '@mui/material';
import { AxiosResponse } from 'axios';
import { useContext, useEffect, useState } from 'react';
import { Pencil, Trash, Plus } from '@phosphor-icons/react/dist/ssr';
import NotificationContext from '@/contexts/notification-context';

export interface Prize {
  id: number;
  luckyWheelConfigId: number;
  name: string;
  imageUrl: string | null;
  prizeValue: Record<string, any> | null;
  probability: number;
  quantityTotal: number | null;
  quantityLeft: number | null;
  createdAt: string;
}

type PrizeModalProps = {
  eventId: number;
  prize: Prize | null;
  open: boolean;
  onClose: () => void;
  onPrizeUpdated: () => void;
};

function PrizeModal({ eventId, prize: initialPrize, open, onClose, onPrizeUpdated }: PrizeModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const notificationCtx = useContext(NotificationContext);
  const [prize, setPrize] = useState<Partial<Prize>>({
    name: '',
    imageUrl: null,
    prizeValue: null,
    probability: 0,
    quantityTotal: null,
    quantityLeft: null,
  });

  useEffect(() => {
    if (initialPrize) {
      setPrize({
        name: initialPrize.name,
        imageUrl: initialPrize.imageUrl,
        prizeValue: initialPrize.prizeValue,
        probability: initialPrize.probability,
        quantityTotal: initialPrize.quantityTotal,
        quantityLeft: initialPrize.quantityLeft,
      });
    } else {
      setPrize({
        name: '',
        imageUrl: null,
        prizeValue: null,
        probability: 0,
        quantityTotal: null,
        quantityLeft: null,
      });
    }
  }, [initialPrize, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericFields = ['quantityTotal', 'quantityLeft'];
    
    setPrize((prev) => ({
      ...prev,
      [name]: numericFields.includes(name)
        ? (value === '' ? null : parseFloat(value) || 0)
        : value
    }));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const presignedResponse = await baseHttpServiceInstance.post('/common/s3/generate_presigned_url', {
        filename: file.name,
        content_type: file.type,
      });

      const { presignedUrl, fileUrl } = presignedResponse.data;

      await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      return fileUrl;
    } catch (error) {
      notificationCtx.error(error);
      return null;
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        notificationCtx.warning('Cảnh báo', 'Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      setIsLoading(true);
      const uploadedUrl = await uploadImage(file);
      if (uploadedUrl) {
        setPrize((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      }
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!prize.name || prize.name.trim() === '') {
      notificationCtx.error('Lỗi', 'Vui lòng nhập tên giải thưởng');
      return;
    }

    const probability = prize.probability ?? 0;
    if (probability <= 0 || probability > 1) {
      notificationCtx.error('Lỗi', 'Tỉ lệ trúng phải lớn hơn 0 và nhỏ hơn hoặc bằng 1 (100%)');
      return;
    }

    try {
      setIsLoading(true);
      if (initialPrize) {
        // Update
        await baseHttpServiceInstance.put(
          `/event-studio/events/${eventId}/mini-app-lucky-wheel/prizes/${initialPrize.id}`,
          prize
        );
        notificationCtx.success('Thành công', 'Cập nhật giải thưởng thành công!');
      } else {
        // Create
        await baseHttpServiceInstance.post(
          `/event-studio/events/${eventId}/mini-app-lucky-wheel/prizes`,
          prize
        );
        notificationCtx.success('Thành công', 'Tạo giải thưởng thành công!');
      }
      onPrizeUpdated();
      onClose();
    } catch (error: any) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialPrize ? 'Chỉnh sửa giải thưởng' : 'Thêm giải thưởng'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              component="img"
              src={prize.imageUrl || undefined}
              alt={prize.name || 'Hình ảnh giải thưởng'}
              sx={{
                width: 120,
                height: 120,
                objectFit: 'cover',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'grey.100',
              }}
            />
            <Stack spacing={1} flex={1}>
              <TextField
                variant="standard"
                inputProps={{ type: 'file', multiple: false, accept: '.jpg,.jpeg,.png,.webp' }}
                onChange={handleImageChange}
                helperText="Định dạng .JPG, .JPEG, .PNG, .WEBP, tối đa 5MB"
                disabled={isLoading}
              />
            </Stack>
          </Stack>
          
          <TextField
            label="Tên giải thưởng"
            name="name"
            value={prize.name || ''}
            onChange={handleChange}
            fullWidth
            required
          />
          
          <TextField
            label="Tỉ lệ trúng (%)"
            name="probability"
            type="number"
            value={prize.probability !== undefined && prize.probability !== null ? (prize.probability * 100) : 0}
            onChange={(e) => {
              const percentValue = parseFloat(e.target.value) || 0;
              setPrize((prev) => ({
                ...prev,
                probability: percentValue / 100
              }));
            }}
            fullWidth
            required
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            helperText="Nhập từ 0 đến 100 (ví dụ: 5 cho 5%)"
          />
          
          <TextField
            label="Số lượng tổng"
            name="quantityTotal"
            type="number"
            value={prize.quantityTotal || ''}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 0 }}
            helperText="Để trống nếu không giới hạn"
          />
          
          <TextField
            label="Số lượng còn lại"
            name="quantityLeft"
            type="number"
            value={prize.quantityLeft || ''}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 0 }}
            helperText="Số lượng giải thưởng còn lại"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={isLoading}>
          Hủy
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isLoading}>
          {initialPrize ? 'Cập nhật' : 'Tạo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PrizePage({ eventId }: { eventId: number }) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const notificationCtx = useContext(NotificationContext);

  const fetchPrizes = async () => {
    try {
      setLoading(true);
      const response: AxiosResponse<Prize[]> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/mini-app-lucky-wheel/prizes`
      );
      setPrizes(response.data);
    } catch (error) {
      console.error('Failed to fetch prizes', error);
      notificationCtx.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrizes();
  }, [eventId]);

  const handleOpenModal = (prize?: Prize) => {
    setEditingPrize(prize || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPrize(null);
  };

  const handleDelete = async (prizeId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giải thưởng này?')) {
      return;
    }

    try {
      await baseHttpServiceInstance.delete(
        `/event-studio/events/${eventId}/mini-app-lucky-wheel/prizes/${prizeId}`
      );
      notificationCtx.success('Thành công', 'Xóa giải thưởng thành công!');
      fetchPrizes();
    } catch (error) {
      notificationCtx.error(error);
    }
  };

  // Calculate total probability
  const totalProbability = prizes.reduce((sum, p) => sum + p.probability, 0);
  const totalProbabilityPercent = totalProbability * 100;

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Danh sách giải thưởng</Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => handleOpenModal()}
        >
          Thêm giải thưởng
        </Button>
      </Box>

      {totalProbabilityPercent < 100 && (
        <Alert severity="warning">
          Tổng tỉ lệ trúng hiện tại: <strong>{totalProbabilityPercent.toFixed(2)}%</strong>. 
          Vui lòng đảm bảo tổng tỉ lệ bằng 100%.
        </Alert>
      )}

      {totalProbabilityPercent > 100 && (
        <Alert severity="error">
          Tổng tỉ lệ trúng vượt quá 100%: <strong>{totalProbabilityPercent.toFixed(2)}%</strong>. 
          Vui lòng điều chỉnh lại.
        </Alert>
      )}

      {totalProbabilityPercent === 100 && (
        <Alert severity="success">
          Tổng tỉ lệ trúng: <strong>100%</strong>. Cấu hình hợp lệ.
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Hình ảnh</TableCell>
              <TableCell>Tên giải thưởng</TableCell>
              <TableCell align="right">Tỉ lệ trúng (%)</TableCell>
              <TableCell align="right">Số lượng tổng</TableCell>
              <TableCell align="right">Số lượng còn lại</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography>Đang tải...</Typography>
                </TableCell>
              </TableRow>
            ) : prizes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">Chưa có giải thưởng nào</Typography>
                </TableCell>
              </TableRow>
            ) : (
              prizes.map((prize) => (
                <TableRow key={prize.id} hover>
                  <TableCell>
                    <Box
                      component="img"
                      src={prize.imageUrl || undefined}
                      alt={prize.name}
                      sx={{
                        width: 60,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        backgroundColor: prize.imageUrl ? 'transparent' : 'grey.100',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{prize.name}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${(prize.probability * 100).toFixed(2)}%`}
                      color={prize.probability > 0.1 ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {prize.quantityTotal !== null ? prize.quantityTotal : '∞'}
                  </TableCell>
                  <TableCell align="right">
                    {prize.quantityLeft !== null ? (
                      <Chip
                        label={prize.quantityLeft}
                        color={prize.quantityLeft > 0 ? 'success' : 'error'}
                        size="small"
                      />
                    ) : (
                      '∞'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenModal(prize)}
                      >
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(prize.id)}
                      >
                        <Trash size={16} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <PrizeModal
        eventId={eventId}
        prize={editingPrize}
        open={modalOpen}
        onClose={handleCloseModal}
        onPrizeUpdated={fetchPrizes}
      />
    </Stack>
  );
}

