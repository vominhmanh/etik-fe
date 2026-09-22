"use client";

import * as React from 'react';
import dayjs from 'dayjs';
import { Box, Chip, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import { Armchair, CalendarBlank, CheckCircle, Users, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import ReCAPTCHA from "react-google-recaptcha";

import type { CheckoutRuntimeField, Show, TicketHolderInfo, Order, TicketInfo } from './types';
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, parseE164Phone } from '@/config/phone-countries';

function formatDob(isoDob: string): string {
  const parsed = dayjs(isoDob, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : isoDob;
}

export type Step4ReviewProps = {
  tt: (vi: string, en: string) => string;

  order: Order;
  shows: Show[];

  checkoutFormFields: CheckoutRuntimeField[];
  ticketFormFields?: CheckoutRuntimeField[];
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
  onConfirm: (options?: { receiveMarketingEmails: boolean }) => void | Promise<void>;
  confirmDisabled?: boolean;

  // Captcha props
  enableCaptcha?: boolean;
  captchaRef?: any;
  captchaLang?: string;
};

export function Step4Review(props: Step4ReviewProps): React.JSX.Element {
  const {
    tt,
    order,
    shows,
    checkoutFormFields,
    ticketFormFields = [],
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

  const [receiveMarketingEmails, setReceiveMarketingEmails] = React.useState(true);

  const customer = order.customer;
  // Format phone number from nationalPhone and phoneCountryIso2
  const customerPhoneCountry = React.useMemo(() => {
    return PHONE_COUNTRIES.find((c) => c.iso2 === customer.phoneCountryIso2) || DEFAULT_PHONE_COUNTRY;
  }, [customer.phoneCountryIso2]);

  const formattedCustomerPhone = React.useMemo(() => {
    const rawPhone = customer.nationalPhone || customer.phoneNumber || '';
    if (!rawPhone) return '';
    const parsed = parseE164Phone(rawPhone);
    if (parsed) {
      const country = PHONE_COUNTRIES.find((c) => c.iso2 === parsed.countryCode) || DEFAULT_PHONE_COUNTRY;
      return `${country.dialCode} ${parsed.nationalNumber}`;
    }
    const digits = rawPhone.replace(/\D/g, '');
    const nsn = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
    return `${customerPhoneCountry.dialCode} ${nsn}`;
  }, [customer.nationalPhone, customer.phoneNumber, customerPhoneCountry]);

  // Sự kiện này nhân bản vé theo từng ngày (show) đã chọn - cùng 1 khán giả sẽ xuất hiện
  // ở nhiều vé (nhiều ngày). Gom lại thành 1 dòng / khán giả thay vì lặp lại theo từng show,
  // hiển thị tổng tiền cộng dồn qua các ngày và danh sách ngày áp dụng.
  const NO_AUDIENCE_KEY = -1;
  const referenceCategory = shows?.[0]?.ticketCategories?.[0] || null;
  const audienceCodeMap = React.useMemo(() => {
    const map: Record<number, string> = {};
    referenceCategory?.categoryAudiences?.forEach((ca) => {
      map[ca.audienceId] = ca.audience.code;
    });
    return map;
  }, [referenceCategory]);

  const attendeeGroups = React.useMemo(() => {
    const showOrder: number[] = [];
    const perShowByAudience: Record<number, Record<number, number[]>> = {};

    order.tickets.forEach((t, idx) => {
      if (!perShowByAudience[t.showId]) {
        perShowByAudience[t.showId] = {};
        showOrder.push(t.showId);
      }
      const audienceKey = t.audienceId ?? NO_AUDIENCE_KEY;
      if (!perShowByAudience[t.showId][audienceKey]) perShowByAudience[t.showId][audienceKey] = [];
      perShowByAudience[t.showId][audienceKey].push(idx);
    });

    const audienceKeys = new Set<number>();
    Object.values(perShowByAudience).forEach((byAud) => Object.keys(byAud).forEach((k) => audienceKeys.add(Number(k))));

    const groups: { key: string; audienceKey: number; slotIndex: number; ticketIndices: number[] }[] = [];
    audienceKeys.forEach((audienceKey) => {
      let maxCount = 0;
      showOrder.forEach((showId) => {
        maxCount = Math.max(maxCount, (perShowByAudience[showId][audienceKey] || []).length);
      });
      for (let slot = 0; slot < maxCount; slot++) {
        const indices: number[] = [];
        showOrder.forEach((showId) => {
          const arr = perShowByAudience[showId][audienceKey] || [];
          if (arr[slot] !== undefined) indices.push(arr[slot]);
        });
        groups.push({ key: `${audienceKey}-${slot}`, audienceKey, slotIndex: slot, ticketIndices: indices });
      }
    });

    groups.sort((a, b) => (a.audienceKey - b.audienceKey) || (a.slotIndex - b.slotIndex));

    return groups.map((g) => {
      const repTicket = order.tickets[g.ticketIndices[0]];
      const showNames = Array.from(new Set(g.ticketIndices.map((idx) => order.tickets[idx].showName).filter(Boolean)));
      const total = g.ticketIndices.reduce((sum, idx) => sum + (order.tickets[idx].price ?? 0), 0);
      const isAdult = g.audienceKey === NO_AUDIENCE_KEY ? true : audienceCodeMap[g.audienceKey] === 'adult';
      return {
        key: g.key,
        ticket: repTicket,
        holderInfo: repTicket?.holderInfo,
        showNames,
        dayCount: g.ticketIndices.length,
        total,
        isAdult,
      };
    });
  }, [order.tickets, audienceCodeMap]);

  const totalTicketsCount = order.tickets.length;

  return (
    <Stack spacing={3}>
      <Box sx={{ px: { xs: 0, md: 20 } }} >
        <Card sx={{ borderTop: 3, borderColor: 'primary.main' }}>
          <CardHeader title={tt("Xem lại đơn hàng", "Review Order")} />
          <Divider />
          <CardContent>

            <Stack spacing={2}>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {tt("Danh sách vé", "Ticket List")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {tt(`${attendeeGroups.length} khán giả • ${totalTicketsCount} vé`, `${attendeeGroups.length} attendees • ${totalTicketsCount} tickets`)}
                </Typography>
              </Box>

              <Stack spacing={2}>
                {attendeeGroups.map((group, groupIndex) => {
                  const holderInfo = group.holderInfo;
                  const ticket = group.ticket;
                  // Dữ liệu gửi backend luôn là "Bạn" cho vé không phải người lớn, chỉ hiển
                  // thị "Bé" trên UI cho dễ phân biệt.
                  const displayTitle = group.isAdult ? holderInfo?.title : tt('Bé', 'Kid');

                  return (
                    <Box
                      key={`review-${group.key}`}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'background.paper',
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
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {tt(`Khán giả ${groupIndex + 1}`, `Attendee ${groupIndex + 1}`)}
                            </Typography>
                            {holderInfo?.name ? (
                              <Chip
                                size="small"
                                icon={<CheckCircle size={13} weight="fill" />}
                                color="success"
                                variant="outlined"
                                label={`${displayTitle || ''} ${holderInfo?.name}`.trim()}
                                sx={{ maxWidth: 200, '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
                              />
                            ) : (
                              <Chip
                                size="small"
                                icon={<WarningCircle size={13} weight="fill" />}
                                color="warning"
                                variant="outlined"
                                label={tt('Chưa có thông tin', 'No information')}
                              />
                            )}
                            {ticket?.audienceName && (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Users size={16} weight="duotone" style={{ color: 'var(--mui-palette-text-secondary)' }} />
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{ticket.audienceName}</Typography>
                              </Stack>
                            )}
                            {ticket?.seatLabel && (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Armchair size={14} style={{ color: 'var(--mui-palette-text-secondary)' }} />
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{ticket.seatLabel}</Typography>
                              </Stack>
                            )}
                            {group.showNames.length > 0 && (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <CalendarBlank size={14} style={{ color: 'var(--mui-palette-text-secondary)' }} />
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {tt('Áp dụng:', 'Applies to:')} {group.showNames.join(', ')}
                                </Typography>
                              </Stack>
                            )}
                            <Box sx={{ flexGrow: 1 }} />
                            <Stack alignItems="flex-end">
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                {formatPrice(group.total)}
                              </Typography>
                              {group.dayCount > 1 && (
                                <Typography variant="caption" color="text.secondary">
                                  {tt(`x ${group.dayCount} ngày`, `x ${group.dayCount} days`)}
                                </Typography>
                              )}
                            </Stack>
                          </Stack>
                        </Stack>
                      </Box>

                      {/* Ticket Body */}
                      <Box sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid xs={12} md={group.isAdult ? 5 : 12}>
                            <Box>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {tt('Họ và tên', 'Full Name')}
                              </Typography>
                              <Typography variant="body2">
                                {holderInfo?.name ? `${displayTitle || ''} ${holderInfo?.name}`.trim() : '-'}
                              </Typography>
                            </Box>
                          </Grid>

                          {group.isAdult && (
                            <>
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
                                      const rawPhone = holderInfo?.nationalPhone || holderInfo?.phone || '';
                                      if (!rawPhone) return '-';
                                      const parsed = parseE164Phone(rawPhone);
                                      if (parsed) {
                                        const country = PHONE_COUNTRIES.find((c) => c.iso2 === parsed.countryCode) || DEFAULT_PHONE_COUNTRY;
                                        return `${country.dialCode} ${parsed.nationalNumber}`;
                                      }
                                      const holderPhoneCountry = PHONE_COUNTRIES.find((c) => c.iso2 === holderInfo?.phoneCountryIso2) || DEFAULT_PHONE_COUNTRY;
                                      const digits = rawPhone.replace(/\D/g, '');
                                      const nsn = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
                                      return `${holderPhoneCountry.dialCode} ${nsn}`;
                                    })()}
                                  </Typography>
                                </Box>
                              </Grid>
                            </>
                          )}

                          <Grid xs={12} md={12}>
                            <Grid container spacing={2}>
                              {holderInfo?.idcard_number && (
                                  <Grid xs={12} md={3}>
                                    <Box>
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {tt('CCCD', 'ID Card')}
                                      </Typography>
                                      <Typography variant="body2">
                                        {holderInfo.idcard_number}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                )}
                                {holderInfo?.dob && (
                                  <Grid xs={12} md={3}>
                                    <Box>
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {tt('Ngày sinh', 'DOB')}
                                      </Typography>
                                      <Typography variant="body2">
                                        {formatDob(holderInfo.dob)}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                )}
                                {holderInfo?.address && (
                                  <Grid xs={12} md={3}>
                                    <Box>
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {tt('Địa chỉ', 'Address')}
                                      </Typography>
                                      <Typography variant="body2">
                                        {holderInfo.address}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                )}
                              {ticketFormFields.filter(f => !builtinInternalNames.has(f.internalName) && f.visible).map((field, idx) => {
                                const answer = ticket?.formAnswers ? ticket.formAnswers[field.internalName] : undefined;
                                if (answer === undefined || answer === null || answer === '') return null;

                                let displayValue = answer;
                                if (field.fieldType === 'checkbox') {
                                  displayValue = Array.isArray(answer) ? answer.join(', ') : answer;
                                }

                                return (
                                  <Grid xs={12} md={3} key={`custom-field-${idx}`}>
                                    <Box>
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {field.label}
                                      </Typography>
                                      <Typography variant="body2">
                                        {displayValue}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  );
                })}
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
                        <Typography variant="subtitle2">{customer.dob ? formatDob(customer.dob) : '-'}</Typography>
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

              {finalTotal > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{tt("Phương thức thanh toán", "Payment Method")}</Typography>
                  <Typography variant="body2">{paymentMethodLabel}</Typography>
                </Box>
              )}
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

      <Stack spacing={1} alignItems="center">
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox" 
              checked={receiveMarketingEmails} 
              onChange={(e) => setReceiveMarketingEmails(e.target.checked)} 
              style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }}
            />
          </Box>
          <Typography variant="body2">
            {tt("Nhận thông báo về sự kiện hot và các mã giảm giá độc quyền từ ETIK.", "Receive notifications about hot events and exclusive discount codes from ETIK.")}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {tt("Bằng việc nhấn xác nhận, bạn đồng ý với ", "By clicking confirm, you agree to ETIK's ")}
          <a href="/policies/terms-and-regulations" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--mui-palette-primary-main)', textDecoration: 'underline' }}>
            {tt("Điều khoản Dịch vụ", "Terms of Service")}
          </a>
          {tt(" và ", " and ")}
          <a href="/policies/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--mui-palette-primary-main)', textDecoration: 'underline' }}>
            {tt("Chính sách Bảo mật", "Privacy Policy")}
          </a>
          {tt(" của ETIK.", ".")}
        </Typography>
      </Stack>

      <Stack direction="row" justifyContent="space-between">
        <Button variant="outlined" onClick={onBack}>
          {tt('Quay lại', 'Back')}
        </Button>
        <Button variant="contained" onClick={async () => {
          try {
            await onConfirm({ receiveMarketingEmails });
          } finally {
            if (props.captchaRef?.current?.reset) {
              props.captchaRef.current.reset();
            }
          }
        }} disabled={!!confirmDisabled}>
          {tt('Xác nhận', 'Confirm')}
        </Button>
      </Stack>

    </Stack>
  );
}


