import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { Stack } from '@mui/system';
import { AxiosResponse } from 'axios';
import { useContext, useEffect, useState } from 'react';

import NotificationContext from '@/contexts/notification-context';

import { RatingCriteria } from './rating-criteria-page';

type Props = {
  eventId: number;
  criteria: RatingCriteria;
  open: boolean;
  onClose: () => void;
  onCriteriaUpdated: () => void;
};

const EditRatingCriteriaModal: React.FC<Props> = ({ eventId, criteria, open, onClose, onCriteriaUpdated }) => {
  const [formValues, setFormValues] = useState<Partial<RatingCriteria>>(criteria);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const notificationCtx = useContext(NotificationContext);

  useEffect(() => {
    setFormValues(criteria);
  }, [criteria]);

  async function updateRatingCriteria(
    eventId: number,
    criteriaId: number,
    updatedCriteria: Omit<RatingCriteria, 'id'>
  ): Promise<RatingCriteria | null> {
    try {
      const response: AxiosResponse<RatingCriteria> = await baseHttpServiceInstance.put(
        `/event-studio/events/${eventId}/mini-app-rating-online/rating-criterias/${criteriaId}`,
        updatedCriteria
      );

      notificationCtx.success('Tiêu chí đánh giá đã được cập nhật thành công!');
      return response.data;
    } catch (error) {
      notificationCtx.error('Lỗi khi cập nhật tiêu chí đánh giá. Vui lòng thử lại!');
      return null;
    }
  }

  const handleChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const updatedCriteria = {
      eventId: eventId,
      name: formValues.name || '',
      type: formValues.type || 'numeric',
      scaleMin: formValues.type === 'favorite' ? 1 : Number(formValues.scaleMin) || 1,
      scaleMax: Number(formValues.scaleMax) || 10,
      scaleStep: Number(formValues.scaleStep) || 1,
      ratio: Number(formValues.ratio) || 0,
    };

    const result = await updateRatingCriteria(eventId, criteria.id, updatedCriteria);

    if (result) {
      onCriteriaUpdated();
      onClose();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Chỉnh sửa tiêu chí đánh giá</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Tên tiêu chí"
          name="name"
          value={formValues.name}
          onChange={handleChange}
          margin="dense"
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Dạng đánh giá</InputLabel>
          <Select name="type" value={formValues.type} onChange={handleChange}>
            <MenuItem value="numeric">Số</MenuItem>
            <MenuItem value="star">Sao</MenuItem>
            <MenuItem value="favorite">Yêu thích</MenuItem>
          </Select>
        </FormControl>

        <Stack direction="column" spacing={2}>
          {['numeric', 'star'].includes(formValues.type as string) && (
            <Box display="flex" gap={2} mt={2}>
              <TextField
                label="Min"
                name="scaleMin"
                type="number"
                defaultValue={1}
                value={formValues.scaleMin}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Max"
                name="scaleMax"
                type="number"
                defaultValue={10}
                value={formValues.scaleMax}
                onChange={handleChange}
                fullWidth
              />
              <TextField
                label="Step"
                name="scaleStep"
                type="number"
                defaultValue={1}
                value={formValues.scaleStep}
                onChange={handleChange}
                fullWidth
              />
            </Box>
          )}

          {['favorite'].includes(formValues.type as string) && (
            <Box display="flex" flexDirection={'column'} gap={2} mt={2}>
              <Stack direction="row" spacing={1} alignItems={'center'} gap={4}>
                <Chip label="Thích" color="primary" icon={<ThumbUpAltIcon />} sx={{ width: 200 }} />
                <TextField
                  label=""
                  name="scaleMax"
                  type="number"
                  defaultValue={10}
                  value={formValues.scaleMax}
                  onChange={handleChange}
                  fullWidth
                />
              </Stack>

              <Stack direction="row" spacing={1} alignItems={'center'} gap={4}>
                <Chip label="Không bình chọn" color="default" sx={{ width: 200 }} />
                <TextField
                  label=""
                  name="scaleMin"
                  type="number"
                  defaultValue={0}
                  value={0}
                  onChange={handleChange}
                  fullWidth
                  disabled
                />
              </Stack>
            </Box>
          )}

          <TextField
            fullWidth
            label="Tỷ lệ (%)"
            name="ratio"
            type="number"
            value={formValues.ratio}
            onChange={handleChange}
            margin="dense"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Hủy
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditRatingCriteriaModal;
