'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField
} from '@mui/material';
import { AxiosResponse } from 'axios';
import { useContext, useEffect, useState } from 'react';

import NotificationContext from '@/contexts/notification-context';

import { Candidate } from './candidates-page';

type EditCandidateModalProps = {
  eventId: number;
  candidate: Candidate | null;
  open: boolean;
  onClose: () => void;
  onCandidateUpdated: () => void;
};

export default function EditCandidateModal({
  eventId,
  candidate: initialCandidate,
  open,
  onClose,
  onCandidateUpdated,
}: EditCandidateModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const notificationCtx = useContext(NotificationContext);

  const [candidate, setCandidate] = useState<Candidate | null>(initialCandidate);

  useEffect(() => {
    if (initialCandidate) {
      setCandidate(initialCandidate);
    }
  }, [initialCandidate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericFields = ['ratingDuration']; // Fields that should be numbers
    
    setCandidate((prev) => {
      if (!prev) return null;
      
      return {
        ...prev,
        [name]: numericFields.includes(name)
          ? parseFloat(value) || 0  // Fallback to 0 if invalid number
          : value
      };
    });
  };

  async function updateCandidate(eventId: number, candidate: Candidate) {
    try {
      const response: AxiosResponse<Candidate> = await baseHttpServiceInstance.put(
        `/event-studio/events/${eventId}/mini-app-rating-online/candidates/${candidate.id}`,
        candidate
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  const handleSubmit = async () => {
    if (!candidate?.name || candidate.ratingDuration <= 0) {
      notificationCtx.error('Tên ứng cử viên và thời lượng bình chọn không được để trống.');
      return;
    }

    try {
      setIsLoading(true);
      await updateCandidate(eventId, candidate);
      notificationCtx.success('Cập nhật ứng cử viên thành công!');
      onCandidateUpdated(); // Re-fetch the list
      onClose();
    } catch (error) {
      notificationCtx.error('Lỗi khi cập nhật ứng cử viên.');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      // Step 1: Request presigned URL from backend
      const presignedResponse = await baseHttpServiceInstance.post('/common/s3/generate_presigned_url', {
        filename: file.name,
        content_type: file.type,
      });

      const { presignedUrl, fileUrl } = presignedResponse.data;

      // Step 2: Upload file directly to S3 using presigned URL
      await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      // Step 3: Return the public file URL
      return fileUrl; // Return the image URL
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
      setCandidate((prev) =>
        prev
          ? {
              ...prev,
              avatarUrl: uploadedImageUrls[0],
            }
          : null
      );

      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Chỉnh sửa Ứng Cử Viên</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar src={candidate?.avatarUrl!} alt={candidate?.name} />

            <TextField
              variant="standard"
              inputProps={{ type: 'file', multiple: false, accept: '.jpg,.jpeg,.png,.pdf' }}
              onChange={handleImageChange}
              helperText="Định dạng .JPG, .JPEG, .PNG, .PDF, tối đa 5MB"
            />
          </Stack>
          <TextField label="Tên" name="name" value={candidate?.name || ''} onChange={handleChange} fullWidth />
          <TextField
            label="Mở bình chọn lúc"
            name="ratingStartTime"
            type="datetime-local"
            value={candidate?.ratingStartTime || ''}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Thời lượng bình chọn (phút)"
            name="ratingDuration"
            type="number"
            value={candidate?.ratingDuration || 0}
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
          Cập nhật
        </Button>
      </DialogActions>
    </Dialog>
  );
}
