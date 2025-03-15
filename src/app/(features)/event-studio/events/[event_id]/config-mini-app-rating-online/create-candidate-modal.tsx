'use client';

import { useContext, useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AxiosResponse } from 'axios';

import NotificationContext from '@/contexts/notification-context';

import { Candidate } from './candidates-page';

type CreateCandidateModalProps = {
  eventId: number;
  open: boolean;
  onClose: () => void;
  onCandidateCreated: () => void;
};

export default function CreateCandidateModal({
  eventId,
  open,
  onClose,
  onCandidateCreated,
}: CreateCandidateModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const notificationCtx = useContext(NotificationContext);

  const [candidate, setCandidate] = useState<Candidate>({
    id: 1,
    eventId: 1,
    avatarUrl: '',
    name: '',
    ratingStartTime: '',
    ratingDuration: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCandidate((prev) => ({ ...prev, [e.target.name]: e.target.value, ratingDuration: Number(e.target.value) }));
  };

  async function createCandidate(eventId: number, candidate: Omit<Candidate, 'id'>) {
    try {
      const response: AxiosResponse<Candidate> = await baseHttpServiceInstance.post(
        `/event-studio/events/${eventId}/mini-app-rating-online/candidates`,
        candidate
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  const handleSubmit = async () => {
    if (!candidate.name || candidate.ratingDuration <= 0) {
      notificationCtx.error('Tên ứng cử viên và thời lượng bình chọn không được để trống.');
      return;
    }

    try {
      setIsLoading(true);
      await createCandidate(eventId, candidate);
      notificationCtx.success('Ứng cử viên đã được thêm thành công!');
      onCandidateCreated(); // Re-fetch the list
      onClose();
    } catch (error) {
      notificationCtx.error('Lỗi khi thêm ứng cử viên.');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await baseHttpServiceInstance.post('/common/s3/upload_image_temp', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
      });

      return response.data.imageUrl; // Return the image URL
    } catch (error) {
      notificationCtx.error('Lỗi tải ảnh:', error);
      return null;
    }
  };

  // Handle multiple image uploads
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const validFiles = files.filter((file) => file.size <= 5 * 1024 * 1024); // Max 5MB

      setIsLoading(true);
      const uploadedImageUrls = await Promise.all(validFiles.map(uploadImage));

      // Filter out null values and update state
      setCandidate((prev) => ({
        ...prev,
        avatarUrl: uploadedImageUrls[0],
      }));

      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Thêm Ứng Cử Viên</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar src={candidate.avatarUrl!} alt={candidate.name} />

            <TextField
              variant="standard"
              inputProps={{ type: 'file', multiple: false, accept: '.jpg,.jpeg,.png,.pdf' }}
              onChange={handleImageChange}
              helperText="Định dạng .JPG, .JPEG, .PNG, .PDF, tối đa 5MB"
            />
          </Stack>
          <TextField label="Tên" name="name" value={candidate.name} onChange={handleChange} fullWidth />
          <TextField
            label="Mở bình chọn lúc"
            name="ratingStartTime"
            type="datetime-local"
            value={candidate.ratingStartTime}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Thời lượng bình chọn (phút)"
            name="ratingDuration"
            type="number"
            value={Number(candidate.ratingDuration)}
            onChange={handleChange}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Hủy
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Tạo
        </Button>
      </DialogActions>
    </Dialog>
  );
}
