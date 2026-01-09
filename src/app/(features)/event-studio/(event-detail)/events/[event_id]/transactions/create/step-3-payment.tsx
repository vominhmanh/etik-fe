"use client";

import * as React from 'react';
import { Box, IconButton, InputAdornment, MenuItem, Stack, Typography, ListItemIcon, ListItemText } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import { X, Money, Bank, CreditCard, Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr';

export type Step3PaymentProps = {
  tt: (vi: string, en: string) => string;
  paramsEventId: number;

  order: any; // Using any to avoid circular dependency or import type if possible, or import Order type
  shows: any[]; // Using any[] for now, or import Show type

  extraFee: number;
  handleExtraFeeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;

  manualDiscountCode: string;
  setManualDiscountCode: (v: string) => void;
  availableVouchers: any[];
  appliedVoucher: any | null;
  voucherValidation: { valid: boolean; message?: string };
  handleValidateAndDisplayVoucher: (voucher: any) => void;
  validateVoucherByApi: (code: string) => Promise<any | null>;
  onOpenVoucherDetail: (voucher: any) => void;
  onRemoveAppliedVoucher: () => void;
  handleApplyVoucher: (voucher: any) => void;

  subtotal: number;
  discountAmount: number;
  finalTotal: number;
  formatPrice: (price: number) => string;

  paymentMethod: string;
  onPaymentMethodChange: (v: string) => void;

  onBack: () => void;
  onNext: () => void;
};

export function Step3Payment(props: Step3PaymentProps): React.JSX.Element {
  const {
    tt,
    order,
    shows,
    extraFee,
    handleExtraFeeChange,
    manualDiscountCode,
    setManualDiscountCode,
    availableVouchers,
    appliedVoucher,
    voucherValidation,
    handleValidateAndDisplayVoucher,
    validateVoucherByApi,
    onOpenVoucherDetail,
    onRemoveAppliedVoucher,
    handleApplyVoucher,
    subtotal,
    discountAmount,
    finalTotal,
    formatPrice,
    paymentMethod,
    onPaymentMethodChange,
    onBack,
    onNext,
  } = props;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid xs={12} lg={5}>
          <Stack spacing={3}>
            {/* Totals */}
            <Card>
              <CardHeader
                title={tt("Chi tiết đơn hàng", "Order Details")}
                action={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TicketIcon size={20} />
                    <Typography variant="subtitle2" color="text.secondary">
                      {order.tickets?.length || 0} {tt('vé', 'tickets')}
                    </Typography>
                  </Box>
                }
              />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  {/* Ticket List */}
                  <Stack spacing={1.5}>
                    {(() => {
                      const groups: any[] = [];
                      (order.tickets || []).forEach((t: any) => {
                        const key = `${t.showId}-${t.ticketCategoryId}`;
                        let g = groups.find(x => x.key === key);
                        if (!g) {
                          g = { key, showId: t.showId, ticketCategoryId: t.ticketCategoryId, quantity: 0, price: t.price || 0 };
                          groups.push(g);
                        }
                        g.quantity++;
                      });

                      if (groups.length === 0) {
                        return (
                          <Typography variant="body2" color="text.secondary" align="center">
                            {tt("Chưa chọn vé nào", "No tickets selected")}
                          </Typography>
                        );
                      }

                      return groups.map((g) => {
                        const show = shows?.find((s: any) => s.id === g.showId);
                        const ticketCategory = show?.ticketCategories?.find((c: any) => c.id === g.ticketCategoryId);

                        return (
                          <Card key={g.key} variant="outlined" sx={{ borderRadius: 1, boxShadow: 'none', bgcolor: 'background.default' }}>
                            <CardContent sx={{ px: 1.5, py: 1, '&:last-child': { pb: 1 } }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ overflow: 'hidden' }}>
                                  <TicketIcon size={18} weight="duotone" style={{ opacity: 0.7, flexShrink: 0 }} />
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                      {show?.name || tt('Chưa xác định', 'Not specified')}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {ticketCategory?.name || tt('Chưa rõ loại vé', 'Unknown ticket category')}
                                    </Typography>
                                  </Box>
                                </Stack>

                                <Stack direction="row" spacing={2} alignItems="center" sx={{ flexShrink: 0 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatPrice(g.price)} x {g.quantity}
                                  </Typography>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, minWidth: 80, textAlign: 'right' }}>
                                    {formatPrice(g.price * g.quantity)}
                                  </Typography>
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        );
                      });
                    })()}
                  </Stack>

                  <Divider sx={{ borderStyle: 'dashed' }} />

                  {/* Totals */}
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {tt("Tổng tiền vé:", "Ticket Total:")}
                      </Typography>
                      <Typography variant="body2">{formatPrice(subtotal)}</Typography>
                    </Box>
                    {extraFee > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {tt("Phụ phí:", "Extra Fee:")}
                        </Typography>
                        <Typography variant="body2">{formatPrice(extraFee)}</Typography>
                      </Box>
                    )}
                    {discountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {tt("Giảm giá:", "Discount:")}
                        </Typography>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                          - {formatPrice(discountAmount)}
                        </Typography>
                      </Box>
                    )}
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {tt("Tổng cộng:", "Total:")}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {formatPrice(finalTotal)}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

          </Stack>
        </Grid>
        <Grid xs={12} lg={7}>
          <Stack spacing={3}>

            {/* Extra Fee */}
            <Card>
              <CardHeader
                title={tt("Phụ phí", "Extra Fee")}
                subheader={tt("(nếu có)", "(if any)")}
                action={
                  <OutlinedInput
                    size="small"
                    name="extraFee"
                    value={extraFee.toLocaleString()}
                    onChange={handleExtraFeeChange}
                    sx={{ maxWidth: 180 }}
                    startAdornment={
                      <InputAdornment position="start">
                        <Money size={18} weight="duotone" style={{ opacity: 0.7 }} />
                      </InputAdornment>
                    }
                    endAdornment={<InputAdornment position="end">đ</InputAdornment>}
                  />
                }
              />
            </Card>

            {/* Discount */}
            <Card>
              <CardHeader
                title={tt("Khuyến mãi", "Discount")}
                action={
                  !appliedVoucher && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <OutlinedInput
                        size="small"
                        name="discountCode"
                        placeholder={tt("Nhập mã khuyến mãi", "Enter discount code")}
                        value={manualDiscountCode}
                        onChange={(e) => setManualDiscountCode(e.target.value)}
                        sx={{ maxWidth: 180 }}
                        startAdornment={
                          <InputAdornment position="start">
                            <TicketIcon size={18} weight="duotone" style={{ opacity: 0.7 }} />
                          </InputAdornment>
                        }
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={async () => {
                          const code = manualDiscountCode.trim();
                          if (!code) return;
                          // First try public list
                          const voucher = availableVouchers.find((v) => v.code.toLowerCase() === code.toLowerCase());
                          if (voucher) {
                            handleValidateAndDisplayVoucher(voucher);
                            setManualDiscountCode('');
                            return;
                          }
                          const apiVoucher = await validateVoucherByApi(code);
                          if (apiVoucher) {
                            handleValidateAndDisplayVoucher(apiVoucher);
                            setManualDiscountCode('');
                          }
                        }}
                      >
                        {tt("Áp dụng", "Apply")}
                      </Button>
                    </Box>
                  )
                }
              />
              {(appliedVoucher || availableVouchers.length > 0) && (
                <>
                  <Divider />
                  <CardContent sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {appliedVoucher ? (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          border: '1px solid',
                          borderColor: voucherValidation.valid ? 'success.main' : 'error.main',
                          borderRadius: 1,
                          bgcolor: voucherValidation.valid ? 'success.50' : 'error.50',
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Stack spacing={0.5}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: voucherValidation.valid ? 'success.main' : 'error.main' }}>
                                {tt('Đã áp dụng:', 'Applied:')} {appliedVoucher.code}
                              </Typography>
                            </Box>
                            {!voucherValidation.valid && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                                  {tt('Mã khuyến mãi không hợp lệ', 'Invalid discount code')}
                                  {voucherValidation.message && `: ${voucherValidation.message}`}
                                </Typography>
                                <Button
                                  variant="text"
                                  size="small"
                                  sx={{
                                    p: 0,
                                    minWidth: 'auto',
                                    fontSize: '0.75rem',
                                    textTransform: 'none',
                                    color: 'primary.main',
                                    '&:hover': { textDecoration: 'underline' }
                                  }}
                                  onClick={() => onOpenVoucherDetail(appliedVoucher)}
                                >
                                  {tt('Xem thêm', 'View Details')}
                                </Button>
                              </Box>
                            )}
                            {voucherValidation.valid && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                <Typography variant="caption" color="text.secondary">
                                  {appliedVoucher.name}
                                </Typography>
                                <Button
                                  variant="text"
                                  size="small"
                                  sx={{
                                    p: 0,
                                    minWidth: 'auto',
                                    fontSize: '0.75rem',
                                    textTransform: 'none',
                                    color: 'primary.main',
                                    '&:hover': { textDecoration: 'underline' }
                                  }}
                                  onClick={() => onOpenVoucherDetail(appliedVoucher)}
                                >
                                  {tt('Xem thêm', 'View Details')}
                                </Button>
                              </Box>
                            )}
                          </Stack>
                        </Box>
                        <IconButton size="small" onClick={onRemoveAppliedVoucher} sx={{ color: 'error.main' }}>
                          <X size={20} />
                        </IconButton>
                      </Box>
                    ) : (
                      availableVouchers.length > 0 && (
                        <Stack spacing={2}>
                          {availableVouchers.map((voucher) => (
                            <Box
                              key={voucher.id}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                gap: 2,
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Stack spacing={0.5}>
                                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {voucher.code}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {voucher.name}
                                  </Typography>
                                  <Button
                                    variant="text"
                                    size="small"
                                    sx={{ p: 0, minWidth: 'auto', fontSize: '0.75rem', textTransform: 'none', color: 'primary.main' }}
                                    onClick={() => onOpenVoucherDetail(voucher)}
                                  >
                                    {tt('Xem thêm', 'View Details')}
                                  </Button>
                                </Stack>
                              </Box>
                              <Button variant="outlined" size="small" onClick={() => handleApplyVoucher(voucher)}>
                                {tt('Áp dụng', 'Apply')}
                              </Button>
                            </Box>
                          ))}
                        </Stack>
                      )
                    )}
                  </CardContent>
                </>
              )}
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader
                title={tt("Phương thức thanh toán", "Payment Method")}
                action={
                  <FormControl size="small" sx={{ maxWidth: 180, minWidth: 180 }}>
                    <Select
                      name="payment_method"
                      value={paymentMethod}
                      onChange={(e) => onPaymentMethodChange(e.target.value)}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) return <Typography variant="body2" color="text.secondary">{tt("Chọn phương thức", "Select method")}</Typography>;
                        if (selected === 'cash') return tt("Tiền mặt", "Cash");
                        if (selected === 'transfer') return tt("Chuyển khoản", "Transfer");
                        if (selected === 'napas247') return 'Napas 247';
                        return selected;
                      }}
                    >
                      <MenuItem value="" disabled>
                        <Typography variant="body2" color="text.secondary">
                          {tt("Chọn phương thức thanh toán", "Select payment method")}
                        </Typography>
                      </MenuItem>
                      <MenuItem value="cash">
                        <ListItemIcon>
                          <Money size={20} weight="duotone" />
                        </ListItemIcon>
                        <ListItemText primary={tt("Tiền mặt", "Cash")} />
                      </MenuItem>
                      <MenuItem value="transfer">
                        <ListItemIcon>
                          <Bank size={20} weight="duotone" />
                        </ListItemIcon>
                        <ListItemText primary={tt("Chuyển khoản", "Transfer")} />
                      </MenuItem>
                      <MenuItem value="napas247">
                        <ListItemIcon>
                          <CreditCard size={20} weight="duotone" />
                        </ListItemIcon>
                        <ListItemText primary="Napas 247" />
                      </MenuItem>
                    </Select>
                  </FormControl>
                }
              />
            </Card>



          </Stack>
        </Grid>
      </Grid>

      {/* Step navigation */}
      <Stack direction="row" justifyContent="space-between">
        <Button variant="outlined" onClick={onBack}>
          {tt('Quay lại', 'Back')}
        </Button>
        <Button variant="contained" onClick={onNext}>
          {tt('Tiếp tục', 'Next')}
        </Button>
      </Stack>
    </Stack>
  );
}


