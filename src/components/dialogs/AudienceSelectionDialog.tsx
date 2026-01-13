'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
    Stack,
    Chip,
} from '@mui/material';
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
import { TicketCategory } from '../transactions/create-steps/types';

interface AudienceSelectionDialogProps {
    open: boolean;
    onClose: () => void;
    audiences: NonNullable<TicketCategory['categoryAudiences']>;
    onSelect: (audienceId: number) => void;
}

export const AudienceSelectionDialog = ({
    open,
    onClose,
    audiences,
    onSelect,
}: AudienceSelectionDialogProps) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Chọn đối tượng</DialogTitle>
            <DialogContent>
                <List>
                    {audiences.map((catAudience) => (
                        <ListItem key={catAudience.id} disablePadding>
                            <ListItemButton onClick={() => onSelect(catAudience.audienceId)}>
                                <ListItemText
                                    primary={
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Typography variant="body1">
                                                {catAudience.audience.name}
                                            </Typography>
                                            {catAudience.isDefault && (
                                                <Chip label="Mặc định" size="small" color="info" sx={{ height: 20, fontSize: '0.625rem' }} />
                                            )}
                                        </Stack>
                                    }
                                    secondary={catAudience.audience.code}
                                />
                                <Typography variant="body2" fontWeight="bold">
                                    {formatCurrency(catAudience.price)}
                                </Typography>
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
        </Dialog>
    );
};
