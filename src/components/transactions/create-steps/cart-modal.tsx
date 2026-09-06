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
    CardContent,
    Tooltip
} from '@mui/material';
import { ShoppingCart as ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr/ShoppingCart';
import { X as XIcon, Pencil as PencilIcon, Ticket as TicketIcon, LinkSimple as LinkIcon } from '@phosphor-icons/react/dist/ssr';

import NotificationContext from '@/contexts/notification-context';

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
    onUpdateConcessionQuantity?: (showId: number, concessionId: number, quantity: number) => void;
    /** Only admin (event-studio) contexts may generate a shareable pre-selected-cart link */
    source?: string;
    eventSlug?: string;
    appliedVoucherCode?: string | null;
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
    onRemoveItem,
    onUpdateConcessionQuantity,
    source,
    eventSlug,
    appliedVoucherCode
}: CartModalProps) {
    const notificationCtx = React.useContext(NotificationContext);
    const totalSelectedTickets = order.tickets.length;

    // Group tickets by show + category + audience, reused for both display and the cart-link payload
    const groups = React.useMemo(() => {
        const list: { key: string, showId: number, ticketCategoryId: number, audienceId?: number, audienceName?: string, quantity: number, price: number }[] = [];
        order.tickets.forEach((t: any) => {
            const key = `${t.showId}-${t.ticketCategoryId}-${t.audienceId || 'default'}`;
            let g = list.find(x => x.key === key);
            if (!g) {
                g = {
                    key,
                    showId: t.showId,
                    ticketCategoryId: t.ticketCategoryId,
                    audienceId: t.audienceId,
                    audienceName: t.audienceName,
                    quantity: 0,
                    price: t.price || 0
                };
                list.push(g);
            }
            g.quantity++;
        });
        return list;
    }, [order.tickets]);

    // Seats are assigned individually and can't be guaranteed available later, so
    // carts containing seat-picked tickets are never eligible for a shareable link
    const hasSeatBasedTickets = order.tickets.some((t: any) => !!t.seatId);
    const showCartLinkButton = source !== 'marketplace' && !!eventSlug;

    const handleGetCartLink = async () => {
        if (!eventSlug) return;
        const params = new URLSearchParams();
        params.set('cart', JSON.stringify({
            v: 1,
            items: groups.map((g) => ({
                showId: g.showId,
                ticketCategoryId: g.ticketCategoryId,
                audienceId: g.audienceId ?? null,
                quantity: g.quantity,
            })),
        }));
        if (appliedVoucherCode) params.set('promoCode', appliedVoucherCode);
        const link = `${window.location.origin}/events/${eventSlug}?${params.toString()}`;
        try {
            await navigator.clipboard.writeText(link);
            notificationCtx.success(tt('Đã sao chép link giỏ hàng vào bộ nhớ tạm!', 'Cart link copied to clipboard!'));
        } catch (err) {
            notificationCtx.error(tt('Không thể sao chép link giỏ hàng', 'Could not copy the cart link'));
        }
    };

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
                                {groups.map((g) => {
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
                                                                        {g.audienceName && <span style={{ fontWeight: 'normal', color: 'var(--mui-palette-text-secondary)' }}> ({g.audienceName})</span>}
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
                                })}
                            </Stack>
                        )}

                        {/* Concessions Section in Cart */}
                        {order.concessions && order.concessions.length > 0 && (
                            <>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {tt('Sản phẩm đi kèm', 'Concessions')}
                                </Typography>
                                <Stack spacing={1.25}>
                                    {order.concessions.map((c: any) => {
                                        const show = event?.shows?.find((s: any) => s.id === c.showId);
                                        const showConcession = show?.showConcessions?.find((sc: any) => sc.concessionId === c.concessionId);
                                        const concession = showConcession?.concession;

                                        return (
                                            <Card key={`${c.showId}-${c.concessionId}`} variant="outlined" sx={{ borderRadius: 1, boxShadow: 'none' }}>
                                                <CardContent sx={{ px: 1.5, py: 1, '&:last-child': { pb: 1 } }}>
                                                    <Stack spacing={0.75}>
                                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ justifyContent: 'space-between' }}>
                                                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                                                                {concession?.imageUrl ? (
                                                                    <Box component="img" src={concession.imageUrl} sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }} />
                                                                ) : (
                                                                    <TicketIcon fontSize="var(--icon-fontSize-md)" />
                                                                )}
                                                                <Box sx={{ minWidth: 0 }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }} noWrap>
                                                                        {concession?.name || tt('Sản phẩm', 'Concession')}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }} noWrap>
                                                                        {show?.name}
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>

                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                                                                    {formatPrice(c.price)}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 12 }}>
                                                                    x {c.quantity}
                                                                </Typography>

                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    sx={{ p: 0.5 }}
                                                                    onClick={() => onUpdateConcessionQuantity?.(c.showId, c.concessionId, 0)}
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
                                    })}
                                </Stack>
                            </>
                        )}

                        <Divider />
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography variant="subtitle2">{tt('Tổng tiền', 'Total')}</Typography>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                {formatPrice(subtotal)}
                            </Typography>
                        </Stack>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
                <Box>
                    {showCartLinkButton && totalSelectedTickets > 0 && (
                        <Tooltip
                            title={hasSeatBasedTickets
                                ? tt('Không thể tạo link cho giỏ hàng có vé chọn ghế, vì ghế có thể bị người khác đặt mất', 'Cannot create a link for a cart with seat-picked tickets, as seats may be taken by someone else')
                                : ''}
                        >
                            <span>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<LinkIcon size={16} />}
                                    disabled={hasSeatBasedTickets}
                                    onClick={handleGetCartLink}
                                >
                                    {tt('Lấy link giỏ hàng', 'Get cart link')}
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                </Box>
                <Button onClick={onClose}>{tt('Đóng', 'Close')}</Button>
            </DialogActions>
        </Dialog >
    );
}
