'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { AxiosResponse } from 'axios';
import { useContext, useEffect, useState } from 'react';

import NotificationContext from '@/contexts/notification-context';

import { VotingQuestion } from './voting-question-page';

type EditVotingQuestionModalProps = {
  eventId: number;
  question: VotingQuestion | null;
  open: boolean;
  onClose: () => void;
  onQuestionUpdated: () => void;
};

export default function EditVotingQuestionModal({
  eventId,
  question: initialQuestion,
  open,
  onClose,
  onQuestionUpdated,
}: EditVotingQuestionModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const notificationCtx = useContext(NotificationContext);
  const [question, setQuestion] = useState<VotingQuestion | null>(initialQuestion);

  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  const handleChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    const numericFields = ['votingDuration', 'votingScore'];

    setQuestion((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [name as string]: numericFields.includes(name as string) ? parseInt(value as string) || 0 : value,
      };
    });
  };

  async function updateVotingQuestion(eventId: number, question: VotingQuestion) {
    try {
      const response: AxiosResponse<VotingQuestion> = await baseHttpServiceInstance.put(
        `/event-studio/events/${eventId}/mini-app-rating-online/voting-questions/${question.id}`,
        question
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  const handleSubmit = async () => {
    if (!question?.questionText || question.votingDuration <= 0) {
      notificationCtx.error('Nội dung câu hỏi và thời lượng bình chọn không được để trống.');
      return;
    }

    try {
      setIsLoading(true);
      await updateVotingQuestion(eventId, question);
      notificationCtx.success('Cập nhật câu hỏi bình chọn thành công!');
      onQuestionUpdated();
      onClose();
    } catch (error) {
      notificationCtx.error('Lỗi khi cập nhật câu hỏi bình chọn.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Chỉnh sửa Câu Hỏi Bình Chọn</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Nội dung câu hỏi"
            name="questionText"
            value={question?.questionText || ''}
            onChange={handleChange}
            fullWidth
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Loại câu hỏi</InputLabel>
            <Select name="questionType" value={question?.questionType || 'select_one'} onChange={handleChange}>
              <MenuItem value="select_one">Chọn một</MenuItem>
              <MenuItem value="select_multiple">Chọn nhiều</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Thời gian bắt đầu bình chọn"
            name="votingStartTime"
            type="datetime-local"
            value={question?.votingStartTime || ''}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Thời lượng bình chọn (phút)"
            name="votingDuration"
            type="number"
            value={question?.votingDuration || 0}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Điểm bình chọn"
            name="votingScore"
            type="number"
            value={question?.votingScore || 0}
            onChange={handleChange}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={isLoading}>
          Hủy
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isLoading}>
          Cập nhật
        </Button>
      </DialogActions>
    </Dialog>
  );
}
