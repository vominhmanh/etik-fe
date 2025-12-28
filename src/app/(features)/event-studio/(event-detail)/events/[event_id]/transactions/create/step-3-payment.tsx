"use client";

import * as React from 'react';
import { Box, IconButton, InputAdornment, MenuItem, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import { X } from '@phosphor-icons/react/dist/ssr';

export type Step3PaymentProps = {
  tt: (vi: string, en: string) => string;
  paramsEventId: number;

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

      {/* Totals */}
      <Card>
        <CardContent>
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
        </CardContent>
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
              >
                <MenuItem value=""></MenuItem>
                <MenuItem value="cash">{tt("Tiền mặt", "Cash")}</MenuItem>
                <MenuItem value="transfer">{tt("Chuyển khoản", "Transfer")}</MenuItem>
                <MenuItem value="napas247">Napas 247</MenuItem>
              </Select>
            </FormControl>
          }
        />
      </Card>

      {/* Step navigation */}
      <Stack direction="row" justifyContent="space-between">
        <Button variant="outlined" onClick={onBack}>
          {tt('Quay lại', 'Back')}
        </Button>
        <Button variant="contained" onClick={onNext}>
          {tt('Xem lại đơn hàng', 'Review order')}
        </Button>
      </Stack>
    </Stack>
  );
}


