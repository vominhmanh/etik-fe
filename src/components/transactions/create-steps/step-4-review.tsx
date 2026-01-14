"use client";

import * as React from 'react';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { alpha } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import { Armchair, User } from '@phosphor-icons/react/dist/ssr';
import ReCAPTCHA from "react-google-recaptcha";

import type { CheckoutRuntimeField, Show, TicketHolderInfo, Order, TicketInfo, HolderInfo } from './types';
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES } from '@/config/phone-countries';

export type Step4ReviewProps = {
  tt: (vi: string, en: string) => string;

  order: Order;
  shows: Show[];

  checkoutFormFields: CheckoutRuntimeField[];
  builtinInternalNames: Set<string>;
  checkoutCustomAnswers: Record<string, any>;



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

  // Captcha props
  enableCaptcha?: boolean;
  captchaRef?: any; // Avoiding explicit ReCAPTCHA type import issues in interface for now, or use React.RefObject<any>
  captchaLang?: string;
};

export function Step4Review(props: Step4ReviewProps): React.JSX.Element {
  const {
    tt,
    order,
    shows,
    checkoutFormFields,
    builtinInternalNames,
    checkoutCustomAnswers,

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
        g = {
          key,
          show,
          category: cat,
          quantity: 0,
          total: 0,
          items: []
        };
        groups.push(g);
      }
      g.quantity++;
      g.total += (t.price ?? 0); // Accumulate correct price
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

              <Stack spacing={2}>
                {ticketGroups.map((group) => (
                  <Box key={`review-${group.key}`}>
                    {/* Group Header */}
                    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'rgba(0,0,0,0.03)', p: 1.5, borderRadius: 1, mb: 2 }}>
                      <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                        <TicketIcon fontSize="var(--icon-fontSize-md)" />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {group.show?.name || tt('Chưa xác định', 'Not specified')} - {group.category?.name || tt('Chưa rõ loại vé', 'Unknown ticket category')}
                        </Typography>
                      </Stack>
                      <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                        <Typography variant="caption">x {group.quantity}</Typography>
                        <Typography variant="caption">= {formatPrice(group.total)}</Typography>
                      </Stack>
                    </Stack>

                    {/* Tickets in this Group */}
                    <Stack spacing={2} sx={{ pl: { md: 2 } }}>
                      {group.items.map((item: any, i: number) => {
                        const holderInfo = item.holder;
                        const ticket = order.tickets[item.index];
                        const ticketIndex = item.index;

                        return (
                          <Box
                            key={`${group.key}-${i}`}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              backgroundColor: 'background.paper',
                              backgroundImage: (theme) =>
                                `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.secondary.main, 0.04)})`,
                            }}
                          >
                            {/* Ticket Header */}
                            <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                              <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                spacing={1}
                                alignItems={{ xs: 'flex-start', md: 'center' }}
                                sx={{ width: '100%', minWidth: 0 }}
                              >
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {tt(`Vé ${ticketIndex + 1}`, `Ticket ${ticketIndex + 1}`)}
                                  </Typography>
                                  {ticket?.seatLabel && (
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                      <Armchair size={14} style={{ color: 'var(--mui-palette-text-secondary)' }} />
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {ticket.seatLabel}
                                      </Typography>
                                    </Stack>
                                  )}
                                  {ticket?.audienceName && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                      ({ticket.audienceName})
                                    </Typography>
                                  )}
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                                    {holderInfo?.name ? `${holderInfo?.title || ''} ${holderInfo?.name}`.trim() : tt('Chưa có thông tin', 'No information')}
                                  </Typography>
                                  <Box sx={{ flexGrow: 1 }} />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                    {formatPrice(ticket.price ?? 0)}
                                  </Typography>
                                </Stack>
                              </Stack>
                            </Box>

                            {/* Ticket Body */}
                            <Box sx={{ p: 2 }}>
                              <Grid container spacing={2} alignItems="center">
                                <Grid xs={12} md={2}>
                                  <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'center' }, width: 48 }}>
                                    {holderInfo?.avatar ? (
                                      <Avatar src={holderInfo.avatar} sx={{ width: 48, height: 48 }} />
                                    ) : (
                                      <Avatar sx={{ width: 48, height: 48, bgcolor: 'action.disabledBackground' }}>
                                        <User size={24} style={{ color: 'var(--mui-palette-text-disabled)' }} />
                                      </Avatar>
                                    )}
                                  </Box>
                                </Grid>

                                <Grid xs={12} md={3}>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {tt('Họ và tên', 'Full Name')}
                                    </Typography>
                                    <Typography variant="body2">
                                      {holderInfo?.name ? `${holderInfo?.title || ''} ${holderInfo?.name}`.trim() : '-'}
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid xs={12} md={4}>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {tt('Email', 'Email')}
                                    </Typography>
                                    <Typography variant="body2">
                                      {holderInfo?.email || '-'}
                                    </Typography>
                                  </Box>
                                </Grid>

                                <Grid xs={12} md={3}>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {tt('Số điện thoại', 'Phone Number')}
                                    </Typography>
                                    <Typography variant="body2">
                                      {(() => {
                                        if (!holderInfo?.nationalPhone) return '-';
                                        const holderPhoneCountry = PHONE_COUNTRIES.find((c) => c.iso2 === holderInfo?.phoneCountryIso2) || DEFAULT_PHONE_COUNTRY;
                                        const digits = holderInfo.nationalPhone.replace(/\D/g, '');
                                        const nsn = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
                                        return `${holderPhoneCountry.dialCode} ${nsn}`;
                                      })()}
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                ))}
              </Stack>

              {order.concessions && order.concessions.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {tt("Sản phẩm đi kèm", "Concessions")}
                    </Typography>
                  </Box>
                  <Stack spacing={2}>
                    {order.concessions.map((c: any) => {
                      const show = shows.find(s => s.id === c.showId);
                      const showConcession = show?.showConcessions?.find(sc => sc.concessionId === c.concessionId);
                      const concession = showConcession?.concession;

                      return (
                        <Box
                          key={`${c.showId}-${c.concessionId}`}
                          sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={2} alignItems="center">
                              {concession?.imageUrl ? (
                                <Box component="img" src={concession.imageUrl} sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover' }} />
                              ) : (
                                <Box sx={{ width: 48, height: 48, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography variant="caption">IMG</Typography>
                                </Box>
                              )}
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{concession?.name || tt('Sản phẩm', 'Concession')}</Typography>
                                <Typography variant="caption" color="text.secondary">{show?.name}</Typography>
                              </Box>
                            </Stack>
                            <Stack direction="row" spacing={3} alignItems="center">
                              <Typography variant="body2">{formatPrice(c.price)} x {c.quantity}</Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, minWidth: 80, textAlign: 'right' }}>
                                {formatPrice(c.price * c.quantity)}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </>
              )}

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
                    {order.concessions && order.concessions.length > 0 ? tt("Tạm tính:", "Subtotal:") : tt("Tổng tiền vé:", "Ticket Total:")}
                  </Typography>
                  <Typography variant="body2">{formatPrice(subtotal)}</Typography>
                </Box>
                {order.concessions && order.concessions.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {tt("Tổng tiền sản phẩm:", "Concessions Total:")}
                    </Typography>
                    {(() => {
                      const concessionsTotal = order.concessions.reduce((sum, c) => sum + (c.price * c.quantity), 0);
                      return <Typography variant="body2">{formatPrice(concessionsTotal)}</Typography>;
                    })()}
                  </Box>
                )}
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

      {/* ReCAPTCHA */}
      {props.enableCaptcha && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <ReCAPTCHA
            sitekey="6LdRnq4aAAAAAFT6htBYNthM-ksGymg70CsoYqHR"
            ref={props.captchaRef}
            hl={props.captchaLang}
          />
        </Box>
      )}

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


