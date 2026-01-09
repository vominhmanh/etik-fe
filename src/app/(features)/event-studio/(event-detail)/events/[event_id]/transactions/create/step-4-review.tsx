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

import { Order, TicketInfo, HolderInfo } from './page';
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES } from '@/config/phone-countries';

export type Step4ReviewProps = {
  tt: (vi: string, en: string) => string;

  order: Order;
  shows: Show[];

  checkoutFormFields: CheckoutRuntimeField[];
  builtinInternalNames: Set<string>;
  checkoutCustomAnswers: Record<string, any>;

  requireTicketHolderInfo: boolean;

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
    order,
    shows,
    checkoutFormFields,
    builtinInternalNames,
    checkoutCustomAnswers,
    requireTicketHolderInfo,
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

  const customer = order.customer;
  // Format phone number from nationalPhone and phoneCountryIso2
  const customerPhoneCountry = React.useMemo(() => {
    return PHONE_COUNTRIES.find((c) => c.iso2 === customer.phoneCountryIso2) || DEFAULT_PHONE_COUNTRY;
  }, [customer.phoneCountryIso2]);

  const formattedCustomerPhone = React.useMemo(() => {
    if (!customer.nationalPhone) return '';
    const digits = customer.nationalPhone.replace(/\D/g, '');
    const nsn = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
    return `${customerPhoneCountry.dialCode} ${nsn}`;
  }, [customer.nationalPhone, customerPhoneCountry]);

  // Group tickets for display
  const ticketGroups = React.useMemo(() => {
    const groups: any[] = [];
    order.tickets.forEach((t, index) => {
      const key = `${t.showId}-${t.ticketCategoryId}`;
      let g = groups.find(x => x.key === key);
      if (!g) {
        const show = shows.find(s => s.id === t.showId);
        const cat = show?.ticketCategories.find(c => c.id === t.ticketCategoryId);
        g = { key, show, category: cat, quantity: 0, items: [] };
        groups.push(g);
      }
      g.quantity++;
      g.items.push({ index, holder: t.holder });
    });
    return groups;
  }, [order.tickets, shows]);

  return (
    <Stack spacing={3}>
      <Box sx={{ px: { xs: 0, md: 20 } }} >
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
                        <Typography variant="body2" color="text.secondary">{tt("Họ và tên", "Full Name")}</Typography>
                        <Typography variant="subtitle2">{customer.title ? `${customer.title} ` : ''}{customer.name}</Typography>
                      </Box>
                    );
                  }
                  if (field.internalName === 'email') {
                    return (
                      <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">{tt("Địa chỉ Email", "Email Address")}</Typography>
                        <Typography variant="subtitle2">{customer.email}</Typography>
                      </Box>
                    );
                  }
                  if (field.internalName === 'phone_number') {
                    return (
                      <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">{tt("Số điện thoại", "Phone Number")}</Typography>
                        <Typography variant="subtitle2">{formattedCustomerPhone || '-'}</Typography>
                      </Box>
                    );
                  }
                  if (field.internalName === 'address') {
                    return (
                      <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">{tt("Địa chỉ", "Address")}</Typography>
                        <Typography variant="subtitle2">{customer.address || '-'}</Typography>
                      </Box>
                    );
                  }
                  if (field.internalName === 'dob') {
                    return (
                      <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">{tt("Ngày tháng năm sinh", "Date of Birth")}</Typography>
                        <Typography variant="subtitle2">{customer.dob || '-'}</Typography>
                      </Box>
                    );
                  }
                  if (field.internalName === 'idcard_number') {
                    return (
                      <Box key={field.internalName} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">{tt("Số Căn cước công dân", "ID Card Number")}</Typography>
                        <Typography variant="subtitle2">{customer.idcard_number || '-'}</Typography>
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
                    <Typography variant="body2" color="text.secondary">{field.label}</Typography>
                    <Typography variant="subtitle2">{displayValue}</Typography>
                  </Box>
                );
              })}

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {tt("Danh sách vé", "Ticket List")}
                </Typography>
              </Box>

              <Stack spacing={1}>
                {ticketGroups.map((group) => (
                  <Stack spacing={0} key={`review-${group.key}`}>
                    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                        <TicketIcon fontSize="var(--icon-fontSize-md)" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {group.show?.name || tt('Chưa xác định', 'Not specified')} - {group.category?.name || tt('Chưa rõ loại vé', 'Unknown ticket category')}
                        </Typography>
                      </Stack>
                      <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                        <Typography variant="caption">{formatPrice(group.category?.price || 0)}</Typography>
                        <Typography variant="caption">x {group.quantity}</Typography>
                        <Typography variant="caption">= {formatPrice((group.category?.price || 0) * group.quantity)}</Typography>
                      </Stack>
                    </Stack>

                    {requireTicketHolderInfo && group.quantity > 0 && (
                      <Box sx={{ ml: 2 }}>
                        <Stack spacing={1}>
                          {group.items.map((item: any, i: number) => {
                            const holderInfo = item.holder;
                            return (
                              <Stack key={`${group.key}-${i}`} spacing={0} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                                {holderInfo?.avatar && (
                                  <Avatar src={holderInfo.avatar} sx={{ width: 36, height: 36 }} />
                                )}
                                <Box sx={{ ml: holderInfo?.avatar ? 2 : 0, pl: holderInfo?.avatar ? 2 : 0, borderLeft: holderInfo?.avatar ? '2px solid' : 'none', borderColor: 'divider' }}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                    {item.index + 1}. {holderInfo?.name ? `${holderInfo?.title || ''} ${holderInfo?.name}` : tt('Chưa có thông tin', 'No information')}
                                  </Typography>
                                  <br />
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {(() => {
                                      const email = holderInfo?.email || tt('Chưa có email', 'No email');
                                      let phone = tt('Chưa có SĐT', 'No phone');
                                      if (holderInfo?.nationalPhone) {
                                        const holderPhoneCountry = PHONE_COUNTRIES.find((c) => c.iso2 === holderInfo?.phoneCountryIso2) || DEFAULT_PHONE_COUNTRY;
                                        const digits = holderInfo.nationalPhone.replace(/\D/g, '');
                                        const nsn = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
                                        phone = `${holderPhoneCountry.dialCode} ${nsn}`;
                                      }
                                      return `${email} - ${phone}`;
                                    })()}
                                  </Typography>
                                </Box>
                              </Stack>
                            );
                          })}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                ))}
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
      </Box>
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


