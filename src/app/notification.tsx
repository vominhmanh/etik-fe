"use client";
import NotificationContext from '@/contexts/notification-context';
import { Alert, Snackbar } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';

const NotificationBar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const notificationCtx = useContext(NotificationContext);

  const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    notificationCtx.clear(); // Optional: clear notification after closing
  };

  useEffect(() => {
    if (notificationCtx.notification) {
      setOpen(true);
    }
  }, [notificationCtx.notification]);

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={5000}
      open={open}
      onClose={handleClose}
      sx={{ position: 'fixed', zIndex: 1500 }}
    >
      <Alert variant="filled" severity={notificationCtx.notification || 'info'} sx={{ width: '100%' }}>
        {notificationCtx.notificationText || ''}
      </Alert>
    </Snackbar>
  );
};

export default NotificationBar;
