"use client";

import * as React from 'react';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';

import type { CheckoutRuntimeField, Show, TicketHolderInfo } from './page';

export type Step4ReviewProps = {
  tt: (vi: string, en: string) => string;

  checkoutFormFields: CheckoutRuntimeField[];
  builtinInternalNames: Set<string>;
  checkoutCustomAnswers: Record<string, any>;

  customer: { title: string; name: string; email: string; phoneNumber: string; address: string; dob: string | null; idcard_number: string; avatar: string };
  formattedCustomerPhone: string;

  selectedCategories: Record<number, Record<number, number>>;
  shows: Show[];
  ticketHoldersByCategory: Record<string, TicketHolderInfo[]>;

  requireGuestAvatar: boolean;
  requireTicketHolderInfo: boolean;
  qrOption: 'shared' | 'separate';

  paymentMethodLabel: string;
  extraFee: number;
  subtotal: number;
  discountAmount: number;
  appliedVoucherCode?: string | null;
  finalTotal: number;
  formatPrice: (price: number) => string;

  onBack: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
};

export function Step4Review(props: Step4ReviewProps): React.JSX.Element {
  const {
    tt,
    checkoutFormFields,
    builtinInternalNames,
    checkoutCustomAnswers,
    customer,
    formattedCustomerPhone,
    selectedCategories,
    shows,
    ticketHoldersByCategory,
    requireGuestAvatar,
    requireTicketHolderInfo,
    qrOption,
    paymentMethodLabel,
    extraFee,
    subtotal,
    discountAmount,
    appliedVoucherCode,
    finalTotal,
    formatPrice,
    onBack,
    onConfirm,
    confirmDisabled,
  } = props;

  return (
    <Stack spacing={3}>
      <Card>
        <CardHeader title={tt("Xem lại đơn hàng", "Review Order")} />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {tt("Thông tin người mua", "Buyer Information")}
            </Typography>

            {checkoutFormFields.filter((f) => f.visible).map((field) => {
              if (builtinInternalNames.has(field.internalName)) {
                if (field.internalName === 'name') {
                  return (
                    <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Họ và tên", "Full Name")}</Typography>
                      <Typography variant="body2">{customer.title ? `${customer.title} ` : ''}{customer.name}</Typography>
                    </Box>
                  );
                }
                if (field.internalName === 'email') {
                  return (
                    <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Địa chỉ Email", "Email Address")}</Typography>
                      <Typography variant="body2">{customer.email}</Typography>
                    </Box>
                  );
                }
                if (field.internalName === 'phone_number') {
                  return (
                    <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Số điện thoại", "Phone Number")}</Typography>
                      <Typography variant="body2">{formattedCustomerPhone || customer.phoneNumber}</Typography>
                    </Box>
                  );
                }
                if (field.internalName === 'address') {
                  return (
                    <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Địa chỉ", "Address")}</Typography>
                      <Typography variant="body2">{customer.address || '-'}</Typography>
                    </Box>
                  );
                }
                if (field.internalName === 'dob') {
                  return (
                    <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Ngày tháng năm sinh", "Date of Birth")}</Typography>
                      <Typography variant="body2">{customer.dob || '-'}</Typography>
                    </Box>
                  );
                }
                if (field.internalName === 'idcard_number') {
                  return (
                    <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{tt("Số Căn cước công dân", "ID Card Number")}</Typography>
                      <Typography variant="body2">{customer.idcard_number || '-'}</Typography>
                    </Box>
                  );
                }
                return null;
              }

              const answer = checkoutCustomAnswers[field.internalName];
              let displayValue = '-';
              if (answer !== undefined && answer !== null && answer !== '') {
                if (field.fieldType === 'checkbox' && Array.isArray(answer)) displayValue = answer.join(', ');
                else if (field.fieldType === 'radio' && field.options) {
                  const option = field.options.find((opt) => opt.value === answer);
                  displayValue = option ? option.label : answer;
                } else displayValue = String(answer);
              }

              return (
                <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{field.label}</Typography>
                  <Typography variant="body2">{displayValue}</Typography>
                </Box>
              );
            })}

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {tt("Danh sách vé", "Ticket List")}
              </Typography>
              {requireGuestAvatar && qrOption === 'shared' && (
                <Avatar src={customer.avatar || ''} sx={{ width: 36, height: 36 }} />
              )}
            </Box>

            <Stack spacing={1}>
              {Object.entries(selectedCategories).flatMap(([showId, categories]) => {
                const show = shows.find((s) => s.id === parseInt(showId));
                return Object.entries(categories || {}).map(([categoryIdStr, qty]) => {
                  const categoryId = parseInt(categoryIdStr);
                  const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
                  const quantity = qty || 0;
                  return (
                    <Stack spacing={0} key={`review-${showId}-${categoryId}`}>
                      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <TicketIcon fontSize="var(--icon-fontSize-md)" />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {show?.name || tt('Chưa xác định', 'Not specified')} - {ticketCategory?.name || tt('Chưa rõ loại vé', 'Unknown ticket category')}
                          </Typography>
                        </Stack>
                        <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                          <Typography variant="caption">{formatPrice(ticketCategory?.price || 0)}</Typography>
                          <Typography variant="caption">x {quantity}</Typography>
                          <Typography variant="caption">= {formatPrice((ticketCategory?.price || 0) * quantity)}</Typography>
                        </Stack>
                      </Stack>

                      {requireTicketHolderInfo && quantity > 0 && (
                        <Box sx={{ ml: 2 }}>
                          <Stack spacing={1}>
                            {Array.from({ length: quantity }, (_, index) => {
                              const holderInfo = ticketHoldersByCategory[`${showId}-${categoryId}`]?.[index];
                              return (
                                <Stack key={`${showId}-${categoryId}-${index}`} spacing={0} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                                  {requireGuestAvatar && (
                                    <Avatar src={holderInfo?.avatar || ''} sx={{ width: 36, height: 36 }} />
                                  )}
                                  <Box sx={{ ml: 2, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                      {index + 1}. {holderInfo?.name ? `${holderInfo?.title} ${holderInfo?.name}` : tt('Chưa có thông tin', 'No information')}
                                    </Typography>
                                    <br />
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {holderInfo?.email || tt('Chưa có email', 'No email')} - {holderInfo?.phone || tt('Chưa có SĐT', 'No phone')}
                                    </Typography>
                                  </Box>
                                </Stack>
                              );
                            })}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  );
                });
              })}
            </Stack>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">{tt("Phương thức thanh toán", "Payment Method")}</Typography>
              <Typography variant="body2">{paymentMethodLabel}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">{tt("Phụ phí", "Extra Fee")}</Typography>
              <Typography variant="body2">{formatPrice(extraFee)}</Typography>
            </Box>

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
                    {tt("Giảm giá:", "Discount:")}{appliedVoucherCode ? ` (${appliedVoucherCode})` : ''}
                  </Typography>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                    - {formatPrice(discountAmount)}
                  </Typography>
                </Box>
              )}
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {tt("Tổng cộng", "Total")}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {formatPrice(finalTotal)}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" justifyContent="space-between">
        <Button variant="outlined" onClick={onBack}>
          {tt('Quay lại', 'Back')}
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={!!confirmDisabled}>
          {tt('Xác nhận', 'Confirm')}
        </Button>
      </Stack>
    </Stack>
  );
}


