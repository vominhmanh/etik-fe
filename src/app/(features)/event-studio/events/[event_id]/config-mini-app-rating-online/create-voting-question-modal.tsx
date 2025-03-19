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

import { VotingQuestion } from './voting-question-page';

type Props = {
  eventId: number;
  open: boolean;
  onClose: () => void;
  onSave: (votingQuestion: VotingQuestion) => void;
};

const CreateVotingQuestionModal: React.FC<Props> = ({ eventId, open, onClose, onSave }) => {
  const [formValues, setFormValues] = useState<Partial<VotingQuestion>>({
    eventId: eventId,
    questionText: '',
    questionType: 'select_one',
    votingStartTime: '',
    votingDuration: 0,
    votingScore: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const notificationCtx = useContext(NotificationContext);

  async function createVotingQuestion(
    eventId: number,
    votingQuestion: Omit<VotingQuestion, 'id'>
  ): Promise<VotingQuestion | null> {
    try {
      const response: AxiosResponse<VotingQuestion> = await baseHttpServiceInstance.post(
        `/event-studio/events/${eventId}/mini-app-rating-online/voting-questions`,
        votingQuestion
      );

      notificationCtx.success('Câu hỏi bình chọn ứng viên đã được thêm thành công!');
      return response.data;
    } catch (error) {
      notificationCtx.error('Lỗi khi thêm Câu hỏi bình chọn ứng viên. Vui lòng thử lại!');
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
    const newVotingQuestion = {
      eventId: eventId,
      questionText: formValues.questionText || '',
      questionType: formValues.questionType || 'select_one',
      votingStartTime: formValues.votingStartTime || '',
      votingDuration: Number(formValues.votingDuration) || 0,
      votingScore: Number(formValues.votingScore) || 0,
    };

    const createdVotingQuestion = await createVotingQuestion(eventId, newVotingQuestion);

    if (createdVotingQuestion) {
      onSave(createdVotingQuestion);
      onClose();
      setFormValues({
        eventId: eventId,
        questionText: '',
        questionType: 'select_one',
        votingStartTime: '',
        votingDuration: 0,
        votingScore: 0,
      });
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Thêm câu hỏi bình chọn</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Nội dung"
            name="questionText"
            value={formValues.questionText}
            onChange={handleChange}
            fullWidth
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Loại câu hỏi</InputLabel>
            <Select
              name="questionType"
              value={formValues.questionType}
              defaultValue="select_one"
              onChange={handleChange}
            >
              <MenuItem value="select_one">Chọn một</MenuItem>
              <MenuItem value="select_multiple">Chọn nhiều</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Thời gian bắt đầu câu hỏi"
            name="votingStartTime"
            type="datetime-local"
            value={formValues.votingStartTime}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Thời lượng trả lời (phút)"
            name="votingDuration"
            type="number"
            value={Number(formValues.votingDuration)}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Số điểm"
            name="votingScore"
            type="number"
            value={Number(formValues.votingScore)}
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
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateVotingQuestionModal;
