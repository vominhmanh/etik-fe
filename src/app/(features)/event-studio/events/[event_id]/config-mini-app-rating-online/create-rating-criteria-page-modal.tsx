import { useContext, useState } from 'react';
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

import NotificationContext from '@/contexts/notification-context';

import { RatingCriteria } from './rating-criteria-page';

type Props = {
  eventId: number;
  open: boolean;
  onClose: () => void;
  onSave: (criteria: RatingCriteria) => void;
};

const CreateRatingCriteriaModal: React.FC<Props> = ({ eventId, open, onClose, onSave }) => {
  const [formValues, setFormValues] = useState<Partial<RatingCriteria>>({
    name: '',
    eventId: eventId,
    type: 'numeric',
    scaleMin: 1,
    scaleMax: 10,
    scaleStep: 1,
    ratio: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const notificationCtx = useContext(NotificationContext);

  async function createRatingCriteria(
    eventId: number,
    criteria: Omit<RatingCriteria, 'id'>
  ): Promise<RatingCriteria | null> {
    try {
      const response: AxiosResponse<RatingCriteria> = await baseHttpServiceInstance.post(
        `/event-studio/events/${eventId}/mini-app-rating-online/rating-criterias`,
        criteria
      );

      notificationCtx.success('Tiêu chí đánh giá đã được thêm thành công!');
      return response.data;
    } catch (error) {
      notificationCtx.error('Lỗi khi thêm tiêu chí đánh giá. Vui lòng thử lại!');
      return null;
    }
  }

  const handleChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = event.target;

    if (name === 'type' && value === 'favorite') {
      return setFormValues((prev) => ({
        ...prev,
        [name as string]: value,
        scaleMin: 1,
        scaleStep: 1,
      }));
    }

    setFormValues((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleScaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value, // Update the specific field
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const newCriteria = {
      eventId: eventId,
      name: formValues.name || '',
      type: formValues.type || 'numeric',
      scaleMin: Number(formValues.scaleMin) || 1,
      scaleMax: Number(formValues.scaleMax) || 10,
      scaleStep: Number(formValues.scaleStep) || 1,
      ratio: Number(formValues.ratio) || 0,
    };

    const createdCriteria = await createRatingCriteria(eventId, newCriteria);

    if (createdCriteria) {
      onSave(createdCriteria);
      onClose();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Thêm tiêu chí đánh giá</DialogTitle>
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
          <Select name="type" value={formValues.type} defaultValue="star" onChange={handleChange}>
            <MenuItem value="numeric">Số</MenuItem>
            <MenuItem value="star">Sao</MenuItem>
            <MenuItem value="favorite">Yêu thích</MenuItem>
          </Select>
        </FormControl>

        <Stack direction="column" spacing={2}>
          {['numeric', 'star'].includes(formValues.type as string) && (
            <>
              <Box display="flex" gap={2} mt={2}>
                <TextField
                  label="Min"
                  name="scaleMin"
                  type="number"
                  defaultValue={1}
                  value={formValues.scaleMin}
                  onChange={handleScaleChange}
                  fullWidth
                />
                <TextField
                  label="Max"
                  name="scaleMax"
                  type="number"
                  defaultValue={10}
                  value={formValues.scaleMax}
                  onChange={handleScaleChange}
                  fullWidth
                />
                <TextField
                  label="Step"
                  name="scaleStep"
                  type="number"
                  defaultValue={1}
                  value={formValues.scaleStep}
                  onChange={handleScaleChange}
                  fullWidth
                />
              </Box>
            </>
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
                  onChange={handleScaleChange}
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
                  onChange={handleScaleChange}
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
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateRatingCriteriaModal;
