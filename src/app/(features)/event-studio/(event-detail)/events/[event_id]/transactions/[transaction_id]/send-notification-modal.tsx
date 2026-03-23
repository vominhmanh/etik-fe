import React, { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr';
import { Transaction } from './page';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: 'email' | 'zalo';
  transaction: Transaction | null;
  onConfirm: (payload: { channel: string; ticketIds: number[]; sendToBuyer: boolean }) => void;
  isLoading: boolean;
}

const SendNotificationModal: React.FC<SendNotificationModalProps> = ({
  isOpen,
  onClose,
  channel,
  transaction,
  onConfirm,
  isLoading,
}) => {
  const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([]);
  const [sendToBuyer, setSendToBuyer] = useState<boolean>(false);

  useEffect(() => {
    // Reset selection when modal opens
    if (isOpen) {
      setSelectedTicketIds([]);
      setSendToBuyer(false);
    }
  }, [isOpen]);

  if (!transaction) return null;

  const allTickets = transaction.transactionTicketCategories.flatMap((ttc) => ttc.tickets);

  const handleToggleBuyer = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSendToBuyer(event.target.checked);
  };

  const handleToggleTicket = (ticketId: number) => {
    setSelectedTicketIds((prev) =>
      prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]
    );
  };

  const handleToggleAllTickets = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedTicketIds(allTickets.map(t => t.id));
    } else {
      setSelectedTicketIds([]);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      channel,
      ticketIds: selectedTicketIds,
      sendToBuyer,
    });
  };

  const isAllTicketsSelected = selectedTicketIds.length === allTickets.length && allTickets.length > 0;
  const isIndeterminate = selectedTicketIds.length > 0 && selectedTicketIds.length < allTickets.length;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 500 },
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          outline: 'none',
        }}
      >
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            {channel === 'email' ? 'Gửi Email Vé' : 'Gửi Zalo Vé'}
          </Typography>
          <IconButton onClick={onClose} disabled={isLoading}>
            <XIcon />
          </IconButton>
        </Box>
        <Divider />

        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Chọn vé muốn gửi:
          </Typography>
          <FormGroup>
            {channel === 'email' && (
              <>
                <FormControlLabel
                  control={<Checkbox checked={sendToBuyer} onChange={handleToggleBuyer} />}
                  label={
                    <Typography>
                      <strong>Người mua</strong> - {transaction.email}
                    </Typography>
                  }
                />
                <Divider sx={{ my: 1 }} />
              </>
            )}

            {allTickets.length > 0 && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAllTicketsSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleToggleAllTickets}
                  />
                }
                label={<Typography fontWeight="bold">Tất cả người sở hữu vé</Typography>}
              />
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', ml: 3 }}>
              {allTickets.map((ticket) => {
                const identifier = channel === 'email'
                  ? (ticket.holderEmail || 'Không có email')
                  : (ticket.holderPhone || 'Không có SĐT');

                return (
                  <FormControlLabel
                    key={ticket.id}
                    control={
                      <Checkbox
                        checked={selectedTicketIds.includes(ticket.id)}
                        onChange={() => handleToggleTicket(ticket.id)}
                      />
                    }
                    label={`${ticket.holderName} (${identifier})`}
                  />
                );
              })}
            </Box>
          </FormGroup>
        </Box>

        <Divider />
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isLoading}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirm}
            disabled={isLoading || (!sendToBuyer && selectedTicketIds.length === 0)}
          >
            {isLoading ? 'Đang gửi...' : 'Gửi'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SendNotificationModal;
