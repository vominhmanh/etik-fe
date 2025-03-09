"use client";

import { useContext, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Avatar,
  Stack,
} from "@mui/material";
import { Candidate } from "./candidates-page";
import { AxiosResponse } from "axios";
import { baseHttpServiceInstance } from "@/services/BaseHttp.service";
import NotificationContext from "@/contexts/notification-context";


type CreateCandidateModalProps = {
  eventId: number;
  open: boolean;
  onClose: () => void;
  onCandidateCreated: () => void;
};

export default function CreateCandidateModal({ eventId, open, onClose, onCandidateCreated }: CreateCandidateModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const notificationCtx = useContext(NotificationContext);

  const [candidate, setCandidate] = useState<Candidate>({
    id: 1,
    eventId: 1,
    avatarUrl: "",
    name: "",
    ratingStartTime: "",
    ratingDuration: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCandidate((prev) => ({ ...prev, [e.target.name]: e.target.value, ratingDuration: Number(e.target.value) }));
  };

  async function createCandidate(eventId: number, candidate: Omit<Candidate, "id">) {
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
      notificationCtx.error("Tên ứng cử viên và thời lượng bình chọn không được để trống.");
      return;
    }

    try {
      setIsLoading(true);
      await createCandidate(eventId, candidate);
      notificationCtx.success("Ứng cử viên đã được thêm thành công!");
      onCandidateCreated(); // Re-fetch the list
      onClose();
    } catch (error) {
      notificationCtx.error("Lỗi khi thêm ứng cử viên.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Thêm Ứng Cử Viên</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="ID"
            name="id"
            value={candidate.id}
            onChange={handleChange}
            fullWidth
          />
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar src={candidate.avatarUrl} alt={candidate.name} />
            <TextField
              label="Ảnh URL"
              name="avatarUrl"
              value={candidate.avatarUrl}
              onChange={handleChange}
              fullWidth
            />
          </Stack>
          <TextField
            label="Tên"
            name="name"
            value={candidate.name}
            onChange={handleChange}
            fullWidth
          />
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