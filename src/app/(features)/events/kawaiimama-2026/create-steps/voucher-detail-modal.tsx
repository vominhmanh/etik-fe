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
    Button
} from '@mui/material';
import dayjs from 'dayjs';

interface VoucherDetailModalProps {
    open: boolean;
    onClose: () => void;
    voucher: any | null;
    tt: (vi: string, en: string) => string;
}

export function VoucherDetailModal({ open, onClose, voucher, tt }: VoucherDetailModalProps) {
    if (!voucher) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
        >
            <DialogTitle sx={{ color: "primary.main" }}>
                {tt("Chi tiết khuyến mãi", "Voucher Details")}
            </DialogTitle>
            <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {tt("Mã khuyến mãi", "Voucher Code")}
                        </Typography>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                            {voucher.code}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {tt("Giảm giá:", "Discount:")}
                            </Typography>
                            <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>
                                {voucher.discountType === 'percentage'
                                    ? `${voucher.discountValue}%`
                                    : `${voucher.discountValue.toLocaleString('vi-VN')} đ`}
                                {voucher.applicationType === 'per_ticket' && (
                                    <Typography component="span" variant="body2" sx={{ ml: 0.5, fontWeight: 400 }}>
                                        {tt('mỗi vé', 'per ticket')}
                                    </Typography>
                                )}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {tt("Tên chiến dịch", "Campaign Name")}
                        </Typography>
                        <Typography variant="body1">{voucher.name}</Typography>
                        {voucher.content && (
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {voucher.content}
                            </Typography>
                        )}
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {tt("Thời gian hiệu lực", "Validity Period")}
                        </Typography>
                        <Typography variant="body2">
                            {tt("Từ:", "From:")} {dayjs(voucher.validFrom).format('DD/MM/YYYY HH:mm')}
                        </Typography>
                        <Typography variant="body2">
                            {tt("Đến:", "To:")} {dayjs(voucher.validUntil).format('DD/MM/YYYY HH:mm')}
                        </Typography>
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {tt("Loại áp dụng", "Application Type")}
                        </Typography>
                        <Typography variant="body1">
                            {voucher.applicationType === 'total_order'
                                ? tt('Giảm chung trên tổng đơn hàng', 'Discount on Total Order')
                                : tt('Giảm theo vé', 'Discount per Ticket')}
                        </Typography>
                        {voucher.applicationType === 'per_ticket' && voucher.maxTicketsToDiscount && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {tt(
                                    `Tối đa ${voucher.maxTicketsToDiscount} vé được giảm giá`,
                                    `Maximum ${voucher.maxTicketsToDiscount} tickets can receive discount`
                                )}
                            </Typography>
                        )}
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {tt("Phạm vi áp dụng", "Application Scope")}
                        </Typography>
                        {voucher.applyToAll ? (
                            <Typography variant="body1">
                                {tt("Toàn bộ suất diễn và toàn bộ hạng vé", "All Shows and All Ticket Categories")}
                            </Typography>
                        ) : (
                            <Stack spacing={1}>
                                <Typography variant="body2" color="text.secondary">
                                    {tt("Chỉ áp dụng cho các hạng vé sau:", "Only applies to the following ticket categories:")}
                                </Typography>
                                {voucher.ticketCategories && voucher.ticketCategories.length > 0 ? (
                                    <Stack spacing={0.5}>
                                        {voucher.ticketCategories.map((tc: any, index: number) => (
                                            <Typography key={`tc-${index}`} variant="body2">
                                                • {tc.show ? `${tc.show.name} - ` : ''}{tc.name}
                                            </Typography>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        {tt("Chưa có hạng vé nào được chọn", "No ticket categories selected")}
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {tt("Điều kiện áp dụng", "Application Conditions")}
                        </Typography>
                        <Stack spacing={1}>
                            {voucher.minTicketsRequired ? (
                                <Typography variant="body2">
                                    {tt("Số lượng vé tối thiểu:", "Minimum tickets required:")} <strong>{voucher.minTicketsRequired}</strong>
                                </Typography>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    {tt("Số lượng vé tối thiểu: Không giới hạn", "Minimum tickets required: Unlimited")}
                                </Typography>
                            )}
                            {voucher.maxTicketsAllowed ? (
                                <Typography variant="body2">
                                    {tt("Số lượng vé tối đa:", "Maximum tickets allowed:")} <strong>{voucher.maxTicketsAllowed}</strong>
                                </Typography>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    {tt("Số lượng vé tối đa: Không giới hạn", "Maximum tickets allowed: Unlimited")}
                                </Typography>
                            )}
                            {voucher.maxUsesPerUser ? (
                                <Typography variant="body2">
                                    {tt("Số lần sử dụng tối đa mỗi người:", "Maximum uses per user:")} <strong>{voucher.maxUsesPerUser}</strong>
                                </Typography>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    {tt("Số lần sử dụng tối đa mỗi người: Không giới hạn", "Maximum uses per user: Unlimited")}
                                </Typography>
                            )}
                            <Typography variant="body2">
                                {tt("Yêu cầu đăng nhập:", "Requires login:")} <strong>{voucher.requireLogin ? tt('Có', 'Yes') : tt('Không', 'No')}</strong>
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    {tt("Đóng", "Close")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
