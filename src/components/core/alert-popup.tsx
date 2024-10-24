import React, { forwardRef } from 'react';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

interface PopupProps {
  message: string;
  open: boolean;
  onClose: () => void;
  severity?: 'error' | 'success' | 'info' | 'warning';
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Popup: React.FC<PopupProps> = ({ message, open, onClose, severity }) => (
  <Snackbar
    open={open}
    autoHideDuration={5000}
    onClose={onClose}
    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
  >
    <Alert onClose={onClose} severity={severity}>
      {message}
    </Alert>
  </Snackbar>
);

export default Popup;
