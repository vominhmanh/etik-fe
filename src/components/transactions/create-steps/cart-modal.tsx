import * as React from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Box,
    Typography,
    Divider,
    Button,
    IconButton,
    Card,
    CardContent
} from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr/ShoppingCart';
import { X as XIcon, Pencil as PencilIcon, Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr';

interface CartModalProps {
    open: boolean;
    onClose: () => void;
    order: any; // Using any for Order type to avoid circular deps or complex referencing unless specified
    event: any | null; // Using any for EventResponse
    tt: (vi: string, en: string) => string;
    formatPrice: (price: number) => string;
    subtotal: number;
    onEditItem: (showId: number, categoryId: number) => void;
    onRemoveItem: (showId: number, categoryId: number) => void;
}

export function CartModal({
    open,
    onClose,
    order,
    event,
    tt,
    formatPrice,
    subtotal,
    onEditItem,
    onRemoveItem
}: CartModalProps) {
    const totalSelectedTickets = order.tickets.length;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ color: "primary.main", display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <ShoppingCartIcon size={16} />
                    <Typography variant="subtitle1" sx={{ m: 0, fontWeight: 700 }}>
                        {tt('Giỏ hàng', 'Cart')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        ({totalSelectedTickets} {tt('vé', 'tickets')})
                    </Typography>
                </Stack>
                <IconButton onClick={onClose} aria-label={tt('Đóng', 'Close')}>
                    <XIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto', px: 2, py: 1.5 }}>
                {totalSelectedTickets <= 0 ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {tt('Giỏ hàng trống', 'Cart is empty')}
                    </Typography>
                ) : (
                    <Stack spacing={1.25}>
                        {order.tickets.length === 0 ? (
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {tt('Giỏ hàng trống', 'Cart is empty')}
                            </Typography>
                        ) : (
                            <Stack spacing={1.25}>
                                {(() => {
                                    // Group for display
                                    const groups: any[] = [];
                                    order.tickets.forEach((t: any) => {
                                        const key = `${t.showId}-${t.ticketCategoryId}`;
                                        let g = groups.find(x => x.key === key);
                                        if (!g) {
                                            g = { key, showId: t.showId, ticketCategoryId: t.ticketCategoryId, quantity: 0, price: t.price || 0 };
                                            groups.push(g);
                                        }
                                        g.quantity++;
                                    });

                                    return groups.map((g) => {
                                        const show = event?.shows?.find((s: any) => s.id === g.showId);
                                        const ticketCategory = show?.ticketCategories?.find((c: any) => c.id === g.ticketCategoryId);

                                        return (
                                            <Card key={g.key} variant="outlined" sx={{ borderRadius: 1, boxShadow: 'none' }}>
                                                <CardContent sx={{ px: 1.5, py: 1, '&:last-child': { pb: 1 } }}>
                                                    <Stack spacing={0.75}>
                                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ justifyContent: 'space-between' }}>
                                                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                                                <TicketIcon fontSize="var(--icon-fontSize-md)" />
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
                                                                        {show?.name || tt('Chưa xác định', 'Not specified')}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }} noWrap>
                                                                        {ticketCategory?.name || tt('Chưa rõ loại vé', 'Unknown ticket category')}
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>

                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                                                                    {formatPrice(g.price)}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                                                                    x {g.quantity}
                                                                </Typography>
                                                                <IconButton
                                                                    size="small"
                                                                    sx={{ p: 0.5 }}
                                                                    onClick={() => onEditItem(g.showId, g.ticketCategoryId)}
                                                                    aria-label={tt('Chỉnh sửa', 'Edit')}
                                                                >
                                                                    <PencilIcon />
                                                                </IconButton>
                                                                <Typography variant="caption" sx={{ minWidth: 96, textAlign: 'right', fontSize: 12 }}>
                                                                    = {formatPrice(g.price * g.quantity)}
                                                                </Typography>
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    sx={{ p: 0.5 }}
                                                                    onClick={() => onRemoveItem(g.showId, g.ticketCategoryId)}
                                                                    aria-label={tt('Xóa', 'Remove')}
                                                                >
                                                                    <XIcon />
                                                                </IconButton>
                                                            </Stack>
                                                        </Stack>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        );
                                    });
                                })()}
                            </Stack>
                        )}
                        <Divider />
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography variant="subtitle2">{tt('Tổng tiền vé', 'Tickets total')}</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                {formatPrice(subtotal)}
                            </Typography>
                        </Stack>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{tt('Đóng', 'Close')}</Button>
            </DialogActions>
        </Dialog>
    );
}
