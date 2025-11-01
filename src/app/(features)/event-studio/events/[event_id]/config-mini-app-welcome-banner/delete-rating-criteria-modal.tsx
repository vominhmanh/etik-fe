import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

interface DeleteRatingCriteriaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteRatingCriteriaModal({ open, onClose, onConfirm }: DeleteRatingCriteriaModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Xác nhận xóa</DialogTitle>
      <DialogContent>Bạn có chắc chắn muốn xóa tiêu chí đánh giá này không?</DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Hủy
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Xóa
        </Button>
      </DialogActions>
    </Dialog>
  );
}
