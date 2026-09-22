"use client";

import * as React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  Typography,
  Alert
} from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import dayjs from 'dayjs';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Radio from '@mui/material/Radio';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { CaretDown, DotsThreeOutlineVertical, Pencil, Copy, User, EnvelopeSimple, Phone, MapPin, IdentificationCard, Armchair, CheckCircle, X, CalendarBlank, Users, WarningCircle } from '@phosphor-icons/react/dist/ssr';

import { LocalizedLink } from '@/components/homepage/localized-link';
import { DobDatePicker } from '@/components/core/dob-date-picker';
import { FormFieldLabel } from '@/components/core/form-field-label';
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES } from '@/config/phone-countries';

import { Order, TicketInfo, TicketHolderInfo, CheckoutRuntimeField, Show, CustomerInfo } from './types';

// Fields shared by name between a ticket holder and the buyer; only the keys
// present in `patch` are forwarded, so unrelated buyer fields stay untouched.
function mapHolderPatchToCustomer(patch: Partial<TicketHolderInfo>): Partial<CustomerInfo> {
  const out: Partial<CustomerInfo> = {};
  (['title', 'name', 'email', 'nationalPhone', 'phoneCountryIso2', 'avatar', 'dob', 'address', 'idcard_number'] as const)
    .forEach((key) => {
      if (key in patch) (out as any)[key] = (patch as any)[key];
    });
  return out;
}

// Không có đối tượng khán giả riêng (chỉ 1 loại vé, không chia audience) thì gom vào key này.
const NO_AUDIENCE_KEY = -1;

type AttendeeGroup = {
  key: string;
  audienceKey: number;
  slotIndex: number;
  ticketIndices: number[]; // index 0 luôn thuộc "show đầu tiên" (show được thêm vào order.tickets trước nhất)
  isAdult: boolean;
};

export type Step2InfoProps = {
  tt: (vi: string, en: string) => string;
  locale: string;
  defaultTitle: string;
  paramsEventId: number;

  formMenuAnchorEl: HTMLElement | null;
  onOpenFormMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onCloseFormMenu: () => void;

  order: Order;
  setOrder: React.Dispatch<React.SetStateAction<Order>>;

  checkoutFormFields: CheckoutRuntimeField[];
  ticketFormFields?: CheckoutRuntimeField[];
  customCheckoutFields: CheckoutRuntimeField[];
  builtinInternalNames: Set<string>;
  checkoutCustomAnswers: Record<string, any>;
  setCheckoutCustomAnswers: React.Dispatch<React.SetStateAction<Record<string, any>>>;


  shows: Show[];

  handleCustomerAvatarFile: (file?: File) => void;
  handleTicketHolderAvatarFile: (index: number, file?: File) => void;
  formatPrice: (price: number) => string;
  setActiveScheduleId: (showId: number) => void;
  setRequestedCategoryModalId: (categoryId: number) => void;

  onBack: () => void;
  onNext: () => void;

  source?: 'marketplace' | 'event-studio';
  readonly?: boolean;
  invitation?: any;
  forceEditInfo?: boolean;
};

export function Step2Info(props: Step2InfoProps): React.JSX.Element {
  const {
    tt,
    order,
    setOrder,
    checkoutFormFields,
    ticketFormFields = [],
    customCheckoutFields,
    builtinInternalNames,
    checkoutCustomAnswers,
    setCheckoutCustomAnswers,

    shows,
    formatPrice,
    onBack,
    onNext,
    source = 'marketplace',
    readonly = false,
    invitation,
    forceEditInfo = false,
  } = props;

  const [isEditingInfo, setIsEditingInfo] = React.useState<boolean>(false);

  // Whether the buyer's info is currently auto-synced from the first adult attendee's info
  const [customerLinkedToTicket1, setCustomerLinkedToTicket1] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (forceEditInfo && !isEditingInfo) {
      setIsEditingInfo(true);
      setCustomerLinkedToTicket1(true);
      setOrder((prev: any) => ({
        ...prev,
        customer: { title: 'Bạn', name: '', email: '', phoneNumber: '', nationalPhone: '', address: '', phoneCountryIso2: 'VN', dob: null, idcard_number: '', avatar: '' },
        tickets: prev.tickets.map((t: any) => ({ ...t, holderInfo: undefined }))
      }));
    }
  }, [forceEditInfo, isEditingInfo, setOrder]);

  // Default title to "Bạn" for the buyer and every ticket holder whenever a new,
  // not-yet-filled entry appears, so users don't have to pick it manually.
  React.useEffect(() => {
    setOrder(prev => {
      let changed = false;
      let customer = prev.customer;
      if (!customer.title) {
        customer = { ...customer, title: 'Bạn' };
        changed = true;
      }
      const tickets = prev.tickets.map((t) => {
        if (t.holderInfo?.title) return t;
        changed = true;
        const holder = t.holderInfo || {
          name: '', email: '', phone: '', nationalPhone: '',
          phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2, avatar: '',
        };
        return { ...t, holderInfo: { ...holder, title: 'Bạn' } };
      });
      return changed ? { ...prev, customer, tickets } : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.tickets.length]);

  // Vé của sự kiện này được nhân bản theo từng ngày (show) đã chọn ở bước 1: cùng 1 khán
  // giả sẽ có N vé (N = số ngày). Gom các vé đó lại thành 1 "khán giả" duy nhất để chỉ
  // phải nhập thông tin 1 lần, rồi tự nhân bản sang các ngày còn lại.
  const referenceCategory = shows?.[0]?.ticketCategories?.[0] || null;
  const audienceCodeMap = React.useMemo(() => {
    const map: Record<number, string> = {};
    referenceCategory?.categoryAudiences?.forEach((ca) => {
      map[ca.audienceId] = ca.audience.code;
    });
    return map;
  }, [referenceCategory]);

  const attendeeGroups = React.useMemo<AttendeeGroup[]>(() => {
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

    const groups: AttendeeGroup[] = [];
    audienceKeys.forEach((audienceKey) => {
      let maxCount = 0;
      showOrder.forEach((showId) => {
        maxCount = Math.max(maxCount, (perShowByAudience[showId][audienceKey] || []).length);
      });
      const isAdult = audienceKey === NO_AUDIENCE_KEY ? true : audienceCodeMap[audienceKey] === 'adult';

      for (let slot = 0; slot < maxCount; slot++) {
        const indices: number[] = [];
        showOrder.forEach((showId) => {
          const arr = perShowByAudience[showId][audienceKey] || [];
          if (arr[slot] !== undefined) indices.push(arr[slot]);
        });
        groups.push({ key: `${audienceKey}-${slot}`, audienceKey, slotIndex: slot, ticketIndices: indices, isAdult });
      }
    });

    // Khán giả người lớn hiển thị trước, rồi tới các đối tượng khác
    groups.sort((a, b) => {
      if (a.isAdult !== b.isAdult) return a.isAdult ? -1 : 1;
      if (a.audienceKey !== b.audienceKey) return a.audienceKey - b.audienceKey;
      return a.slotIndex - b.slotIndex;
    });

    return groups;
  }, [order.tickets, audienceCodeMap]);

  const primaryGroupIndex = React.useMemo(() => {
    const idx = attendeeGroups.findIndex((g) => g.isAdult);
    return idx >= 0 ? idx : 0;
  }, [attendeeGroups]);

  const primaryTicket = attendeeGroups[primaryGroupIndex]
    ? order.tickets[attendeeGroups[primaryGroupIndex].ticketIndices[0]]
    : undefined;

  // Vé trẻ em (đối tượng khác "adult"): không nhập email/SĐT/danh xưng riêng, luôn dùng
  // "Bạn" làm danh xưng và tự động lấy email/SĐT của khán giả người lớn đầu tiên.
  React.useEffect(() => {
    const adultHolder = primaryTicket?.holderInfo;
    if (!adultHolder) return;
    const { email, phone, nationalPhone, phoneCountryIso2 } = adultHolder;

    setOrder(prev => {
      let changed = false;
      const newTickets = [...prev.tickets];
      attendeeGroups.forEach((group) => {
        if (group.isAdult) return;
        group.ticketIndices.forEach((idx) => {
          const t = newTickets[idx];
          const h = t.holderInfo;
          const needsUpdate = !h || h.email !== email || h.nationalPhone !== nationalPhone
            || h.phoneCountryIso2 !== phoneCountryIso2 || h.title !== 'Bạn';
          if (needsUpdate) {
            changed = true;
            newTickets[idx] = {
              ...t,
              holderInfo: { ...(h || { name: '' }), title: 'Bạn', email, phone, nationalPhone, phoneCountryIso2 },
            };
          }
        });
      });
      return changed ? { ...prev, tickets: newTickets } : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryTicket?.holderInfo?.email, primaryTicket?.holderInfo?.nationalPhone, primaryTicket?.holderInfo?.phoneCountryIso2, attendeeGroups]);

  // State to control expanded accordions (keyed by attendee group key, not raw ticket index)
  const [expandedAccordions, setExpandedAccordions] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setExpandedAccordions(prev => {
      const updated = { ...prev };
      attendeeGroups.forEach((group) => {
        if (!(group.key in updated)) updated[group.key] = true;
      });
      return updated;
    });
  }, [attendeeGroups]);

  const handleAccordionChange = (key: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordions(prev => ({ ...prev, [key]: isExpanded }));
  };

  const customer = order.customer;
  const setCustomer = (patch: any) => {
    setOrder(prev => ({ ...prev, customer: { ...prev.customer, ...patch } }));
  };

  // Manual edits to the buyer's info break the auto-sync link with the first adult attendee
  const setCustomerField = (patch: any) => {
    setCustomerLinkedToTicket1(false);
    setCustomer(patch);
  };

  // One-shot full copy, used only when the user re-links via the button
  const relinkCustomerToTicket1 = () => {
    const firstHolder = primaryTicket?.holderInfo;
    if (firstHolder) {
      setCustomer({
        title: firstHolder.title || 'Bạn',
        name: firstHolder.name || '',
        email: firstHolder.email || '',
        nationalPhone: firstHolder.nationalPhone || '',
        phoneCountryIso2: firstHolder.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2,
        avatar: firstHolder.avatar || '',
        dob: firstHolder.dob || null,
        address: firstHolder.address || '',
        idcard_number: firstHolder.idcard_number || '',
      });
    }
    setCustomerLinkedToTicket1(true);
  };

  // Break the auto-sync link so the user can edit the buyer's info independently -
  // keeps the values already copied from the first attendee (just stops mirroring further edits).
  const unlinkCustomerToEdit = () => {
    setCustomerLinkedToTicket1(false);
  };

  // Clear all buyer fields for a fresh manual entry, breaking the link with the first attendee
  const clearCustomerInfo = () => {
    setCustomerLinkedToTicket1(false);
    setCustomer({
      title: 'Bạn',
      name: '',
      email: '',
      nationalPhone: '',
      phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2,
      avatar: '',
      dob: null,
      address: '',
      idcard_number: '',
    });
  };

  // Cập nhật thông tin cho MỘT khán giả - tự động ghi đè vào toàn bộ vé cùng nhóm
  // (tức là cùng khán giả đó ở mọi ngày đã chọn).
  const setHolderInfoForGroup = (group: AttendeeGroup, patch: Partial<TicketHolderInfo>) => {
    setOrder(prev => {
      const newTickets = [...prev.tickets];
      const repIndex = group.ticketIndices[0];
      const currentHolder = newTickets[repIndex]?.holderInfo || {
        title: '', name: '', email: '', phone: '', nationalPhone: '',
        phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2, avatar: '',
      };
      const mergedHolder = { ...currentHolder, ...patch };
      group.ticketIndices.forEach((idx) => {
        newTickets[idx] = { ...newTickets[idx], holderInfo: { ...mergedHolder } };
      });

      const isPrimaryGroup = attendeeGroups[primaryGroupIndex]?.key === group.key;
      const customerPatch = isPrimaryGroup && customerLinkedToTicket1
        ? { ...prev.customer, ...mapHolderPatchToCustomer(patch) }
        : prev.customer;

      return { ...prev, tickets: newTickets, customer: customerPatch };
    });
  };

  // Cập nhật câu trả lời form tuỳ chỉnh cho MỘT khán giả - tự động nhân bản sang các
  // ngày còn lại của cùng khán giả đó.
  const setTicketFormAnswerForGroup = (group: AttendeeGroup, internalName: string, value: any) => {
    setOrder(prev => {
      const newTickets = [...prev.tickets];
      group.ticketIndices.forEach((idx) => {
        const currentAnswers = newTickets[idx].formAnswers || {};
        newTickets[idx] = { ...newTickets[idx], formAnswers: { ...currentAnswers, [internalName]: value } };
      });
      return { ...prev, tickets: newTickets };
    });
  };

  const customTicketFields = ticketFormFields.filter(f => !builtinInternalNames.has(f.internalName));

  // Ghi chú (hướng dẫn nhập liệu) cho các trường mặc định, do BTC cấu hình trong Form mua vé / Form thông tin vé
  const ticketTitleNote = ticketFormFields.find((f) => f.internalName === 'title')?.note || undefined;
  const ticketNameNote = ticketFormFields.find((f) => f.internalName === 'name')?.note || undefined;
  const ticketCombinedNameNote = ticketNameNote || ticketTitleNote;
  const ticketEmailNote = ticketFormFields.find((f) => f.internalName === 'email')?.note || undefined;
  const ticketPhoneNote = ticketFormFields.find((f) => f.internalName === 'phone_number')?.note || undefined;

  const customerTitleNote = checkoutFormFields.find((f) => f.internalName === 'title')?.note || undefined;
  const customerNameNote = checkoutFormFields.find((f) => f.internalName === 'name')?.note || undefined;
  const customerCombinedNameNote = customerNameNote || customerTitleNote;
  const customerEmailNote = checkoutFormFields.find((f) => f.internalName === 'email')?.note || undefined;
  const customerPhoneNote = checkoutFormFields.find((f) => f.internalName === 'phone_number')?.note || undefined;

  // Show invitation summary card only when invitation has pre-filled info AND guest hasn't chosen to re-enter
  const hasPreFilledInfo = !!(invitation && !invitation.letCustomerFillInfo && invitation.preFilledInfo && (
    invitation.preFilledInfo.customer?.name || invitation.preFilledInfo.customer?.email
  ));
  const showInvitationCard = hasPreFilledInfo && !isEditingInfo;

  if (showInvitationCard) {
    return (
      <Stack spacing={2} sx={{ width: '100%' }}>
        {invitation && (
          <Alert
            severity="info"
            sx={{ borderRadius: '12px' }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('invitationUuid');
                    window.location.href = url.toString();
                  }
                }}
                sx={{ fontWeight: 600, textTransform: 'none', whiteSpace: 'nowrap' }}
              >
                {tt('Thoát', 'Exit')}
              </Button>
            }
          >
            <Box>
              <Typography variant="body2">
                {tt('Người nhận:', 'Recipient:')} <strong>{invitation.recipientTitle || ''} {invitation.recipientName}</strong>.
              </Typography>
              <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                {tt(' Bạn đang điền thông tin theo thư mời.', ' You are entering info via an invitation.')}
              </Typography>
            </Box>
          </Alert>
        )}

        <Card sx={{ borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
          <CardHeader
            title={
              <Stack spacing={0.5}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a3322' }}>
                  {tt('Thông tin đã được điền sẵn cho bạn', 'Information Pre-filled for You')}
                </Typography>
              </Stack>
            }
            sx={{ backgroundColor: 'rgba(209, 249, 219, 0.3)', pb: 2 }}
          />
          <Divider />
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={3}>

              {/* Ticket Holders */}
              <Box>
                <Stack spacing={1.5}>
                  {order.tickets.map((ticket, idx) => {
                    const holder = ticket.holderInfo;
                    return (
                      <Box key={idx} sx={{ p: 1.5, borderRadius: '8px', border: '1px dashed', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {ticket.ticketCategoryName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {ticket.showName}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {ticket.seatLabel && (
                              <Typography variant="caption" sx={{ px: 1, py: 0.25, bgcolor: 'primary.50', color: 'primary.main', borderRadius: '4px', fontWeight: 500 }}>
                                {tt('Ghế:', 'Seat:')} {ticket.seatLabel}
                              </Typography>
                            )}
                            {ticket.audienceName && (
                              <Typography variant="caption" sx={{ px: 1, py: 0.25, bgcolor: 'grey.100', color: 'text.secondary', borderRadius: '4px', fontWeight: 500 }}>
                                {tt('Đối tượng:', 'Audience:')} {ticket.audienceName}
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                        {holder && (holder.name || holder.email || holder.nationalPhone || holder.phone) && (
                          <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                            {holder.name && (
                              <Grid item xs={12} sm={4}>
                                <Typography variant="caption" color="text.secondary" display="block">{tt('Người sử dụng', 'Attendee')}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{holder.title ? `${holder.title} ` : ''}{holder.name}</Typography>
                              </Grid>
                            )}
                            {holder.email && (
                              <Grid item xs={12} sm={4}>
                                <Typography variant="caption" color="text.secondary" display="block">Email</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{holder.email}</Typography>
                              </Grid>
                            )}
                            {(holder.phone) && (
                              <Grid item xs={12} sm={4}>
                                <Typography variant="caption" color="text.secondary" display="block">{tt('Số điện thoại', 'Phone')}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{holder.phone}</Typography>
                              </Grid>
                            )}
                          </Grid>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              <Divider />

              {/* Buyer Information */}
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', bgcolor: 'background.paper', p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
                  {tt('Thông tin người mua vé', 'Buyer Information')}
                </Typography>
                <Grid container spacing={1.5}>
                  {order.customer.name && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" display="block">{tt('Họ và tên', 'Full Name')}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.customer.title} {order.customer.name}</Typography>
                    </Grid>
                  )}
                  {order.customer.email && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" display="block">{tt('Email', 'Email')}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.customer.email}</Typography>
                    </Grid>
                  )}
                  {(order.customer.phoneNumber || order.customer.nationalPhone) && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" display="block">{tt('Số điện thoại', 'Phone Number')}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.customer.phoneNumber || order.customer.nationalPhone}</Typography>
                    </Grid>
                  )}
                </Grid>

                {/* Custom Form Answers */}
                {customCheckoutFields.length > 0 && (
                  <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                    <Grid container spacing={1.5}>
                      {customCheckoutFields.map((field) => {
                        const value = checkoutCustomAnswers[field.internalName];
                        let displayValue = '';
                        if (Array.isArray(value)) displayValue = value.join(', ');
                        else if (value !== undefined && value !== null) displayValue = String(value);
                        if (!displayValue) return null;
                        return (
                          <Grid item xs={12} sm={6} key={field.internalName}>
                            <Typography variant="caption" color="text.secondary" display="block">{field.label}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{displayValue}</Typography>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </Box>
                )}
              </Box>


              <Stack spacing={2} sx={{ mt: 2, width: '100%' }}>
                {invitation.allowInfoEdit && (
                  <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() => {
                        setOrder((prev: any) => ({
                          ...prev,
                          customer: { title: 'Bạn', name: '', email: '', phoneNumber: '', nationalPhone: '', address: '', phoneCountryIso2: 'VN', dob: null, idcard_number: '', avatar: '' },
                          tickets: prev.tickets.map((t: any) => ({ ...t, holderInfo: undefined })),
                          isInfoEdited: true
                        }));
                        setIsEditingInfo(true);
                        setCustomerLinkedToTicket1(true);
                      }}
                      sx={{ borderRadius: '8px', fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
                    >
                      {tt('Thay đổi thông tin', 'Change Information')}
                    </Button>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    variant="text"
                    color="inherit"
                    onClick={onBack}
                    sx={{ fontWeight: 600 }}
                  >
                    {tt('Quay lại', 'Back')}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={onNext}
                    sx={{ px: 4, py: 1, borderRadius: '8px', fontWeight: 600 }}
                  >
                    {tt('Tiếp tục', 'Continue')}
                  </Button>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            {/* Ticket holders input (accordion) - 1 form / khán giả, tự nhân bản cho các ngày còn lại */}
            {attendeeGroups.length > 0 && (
              <Card sx={{ borderTop: 3, borderColor: 'primary.main' }}>
                <CardHeader
                  title={tt(
                    `Thông tin người tham gia: ${attendeeGroups.length} người`,
                    `Attendee Information: ${attendeeGroups.length} people`
                  )}
                />
                <Divider />
                <CardContent sx={{ pt: 1.5, pb: 1.5, pointerEvents: readonly ? 'none' : 'auto', opacity: readonly ? 0.8 : 1 }}>
                  <Stack spacing={3}>
                    {attendeeGroups.map((group, groupIndex) => {
                      const repIndex = group.ticketIndices[0];
                      const ticket = order.tickets[repIndex];
                      const holderInfo = ticket.holderInfo || {
                        title: '',
                        name: '',
                        email: '',
                        phone: '',
                        nationalPhone: '',
                        phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2,
                        avatar: '',
                      };
                      const isAdultGroup = group.isAdult;
                      // Dữ liệu gửi lên backend luôn là "Bạn" cho vé không phải người lớn, chỉ
                      // hiển thị "Bé" trên UI cho dễ phân biệt.
                      const displayTitle = isAdultGroup ? holderInfo.title : tt('Bé', 'Kid');
                      const showNames = Array.from(new Set(group.ticketIndices.map((idx) => order.tickets[idx].showName).filter(Boolean)));

                      const setHolderInfo = (patch: Partial<TicketHolderInfo>) => setHolderInfoForGroup(group, patch);

                      return (
                        <Accordion
                          key={group.key}
                          expanded={expandedAccordions[group.key] ?? true}
                          onChange={handleAccordionChange(group.key)}
                          disableGutters
                          elevation={0}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            backgroundColor: 'background.paper',
                            '&:before': { display: 'none' },
                          }}
                        >
                          <AccordionSummary
                            expandIcon={<CaretDown />}
                            sx={{
                              minHeight: 44,
                              '& .MuiAccordionSummary-content': { my: 0.5, alignItems: 'center' },
                            }}
                          >
                            <Stack
                              direction={{ xs: 'column', md: 'row' }}
                              spacing={1}
                              alignItems={{ xs: 'flex-start', md: 'center' }}
                              sx={{ width: '100%', minWidth: 0, flex: 1 }}
                            >
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                  {tt(`${groupIndex + 1}`, `Attendee ${groupIndex + 1}`)}
                                </Typography>
                                {holderInfo.name ? (
                                  <Chip
                                    size="small"
                                    icon={<CheckCircle size={13} weight="fill" />}
                                    color="success"
                                    variant="outlined"
                                    label={`${displayTitle ? `${displayTitle} ` : ''}${holderInfo.name}`}
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
                                {ticket.audienceName && (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Users size={16} weight="duotone" style={{ color: 'var(--mui-palette-text-secondary)' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{ticket.audienceName}</Typography>
                                  </Stack>
                                )}
                                {ticket.seatLabel && (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Armchair size={14} style={{ color: 'var(--mui-palette-text-secondary)' }} />
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{ticket.seatLabel}</Typography>
                                  </Stack>
                                )}
                                {showNames.length > 0 && (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <CalendarBlank size={14} style={{ color: 'var(--mui-palette-text-secondary)' }} />
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {tt('Áp dụng:', 'Applies to:')} {showNames.join(', ')}
                                    </Typography>
                                  </Stack>
                                )}
                              </Stack>
                              <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
                              {isAdultGroup && groupIndex !== primaryGroupIndex && (
                                <Stack
                                  direction="row"
                                  spacing={0.5}
                                  sx={{
                                    ml: { xs: 0, md: 'auto' },
                                    mt: { xs: 0.5, md: 0 }
                                  }}
                                >
                                  <Button
                                    size="small"
                                    variant="text"
                                    startIcon={<Copy size={12} />}
                                    sx={{
                                      minWidth: 'auto',
                                      px: 1,
                                      py: 0.25,
                                      fontSize: '0.75rem',
                                      textTransform: 'none',
                                      '&:hover': { backgroundColor: 'action.hover' }
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedAccordions(prev => ({ ...prev, [group.key]: true }));

                                      const firstGroup = attendeeGroups[primaryGroupIndex];
                                      const firstTicket = order.tickets[firstGroup.ticketIndices[0]];
                                      const firstHolder = firstTicket.holderInfo || {
                                        title: '', name: '', email: '', phone: '', nationalPhone: '',
                                        phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2, avatar: '',
                                        address: '', dob: '', idcard_number: '',
                                      };

                                      setHolderInfo({
                                        title: firstHolder.title,
                                        name: firstHolder.name,
                                        email: firstHolder.email,
                                        nationalPhone: firstHolder.nationalPhone || '',
                                        phoneCountryIso2: firstHolder.phoneCountryIso2,
                                        avatar: firstHolder.avatar,
                                        address: firstHolder.address,
                                        dob: firstHolder.dob,
                                        idcard_number: firstHolder.idcard_number,
                                      });

                                      if (firstTicket.formAnswers) {
                                        setOrder(prev => {
                                          const newTickets = [...prev.tickets];
                                          group.ticketIndices.forEach((idx) => {
                                            newTickets[idx] = { ...newTickets[idx], formAnswers: { ...firstTicket.formAnswers } };
                                          });
                                          return { ...prev, tickets: newTickets };
                                        });
                                      }
                                    }}
                                  >
                                    {tt('Copy từ vé 1', 'Copy from attendee 1')}
                                  </Button>
                                </Stack>
                              )}
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 0, pb: 1.5 }}>
                            <Grid container spacing={1.5} alignItems="center">
                              <Grid item xs={12} md={5}>
                                <FormFieldLabel label={tt(isAdultGroup ? 'Danh xưng - Họ và tên' : 'Họ và tên', isAdultGroup ? 'Title - Full Name' : 'Full Name')} required />
                                <OutlinedInput
                                  fullWidth
                                  size="small"
                                  autoComplete="name"
                                  value={holderInfo.name}
                                  onChange={(e) => setHolderInfo({ name: e.target.value })}
                                  startAdornment={isAdultGroup ? (
                                    <InputAdornment position="start">
                                      <Select
                                        variant="standard"
                                        disableUnderline
                                        value={holderInfo.title || ''}
                                        onChange={(e) => setHolderInfo({ title: e.target.value })}
                                        sx={{ minWidth: 50, '& .MuiSelect-select': { py: 0 } }}
                                      >
                                        <MenuItem value=""><em>...</em></MenuItem>
                                        <MenuItem value="Anh">Anh</MenuItem>
                                        <MenuItem value="Chị">Chị</MenuItem>
                                        <MenuItem value="Bạn">Bạn</MenuItem>
                                        {source !== 'marketplace' && <MenuItem value="Em">Em</MenuItem>}
                                        {source !== 'marketplace' && <MenuItem value="Ông">Ông</MenuItem>}
                                        {source !== 'marketplace' && <MenuItem value="Bà">Bà</MenuItem>}
                                        {source !== 'marketplace' && <MenuItem value="Cô">Cô</MenuItem>}
                                        {source !== 'marketplace' && <MenuItem value="Thầy">Thầy</MenuItem>}
                                        <MenuItem value="Mr.">Mr.</MenuItem>
                                        <MenuItem value="Ms.">Ms.</MenuItem>
                                        <MenuItem value="Mx.">Mx.</MenuItem>
                                        {source !== 'marketplace' && <MenuItem value="Miss">Miss</MenuItem>}
                                      </Select>
                                    </InputAdornment>
                                  ) : undefined}
                                />
                                {ticketCombinedNameNote && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                    {ticketCombinedNameNote}
                                  </Typography>
                                )}
                              </Grid>

                              {isAdultGroup && (
                                <>
                                  <Grid item xs={12} md={3}>
                                    <FormFieldLabel label={tt(`Email`, `Email`)} />
                                    <OutlinedInput
                                      fullWidth
                                      size="small"
                                      autoComplete="email"
                                      type="email"
                                      value={holderInfo.email || ''}
                                      onChange={(e) => setHolderInfo({ email: e.target.value })}
                                    />
                                    {ticketEmailNote && (
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                        {ticketEmailNote}
                                      </Typography>
                                    )}
                                  </Grid>

                                  <Grid item xs={12} md={3}>
                                    <FormFieldLabel label={tt(`Số điện thoại`, `Phone`)} />
                                    <OutlinedInput
                                      fullWidth
                                      size="small"
                                      autoComplete="tel-national"
                                      type="tel"
                                      value={holderInfo.nationalPhone || ''}
                                      onChange={(e) => setHolderInfo({ nationalPhone: e.target.value })}
                                      startAdornment={
                                        <InputAdornment position="start">
                                          <Select
                                            variant="standard"
                                            disableUnderline
                                            value={holderInfo.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2}
                                            onChange={(event) => setHolderInfo({ phoneCountryIso2: event.target.value })}
                                            sx={{ minWidth: 50, '& .MuiSelect-select': { py: 0 } }}
                                            renderValue={(value) => {
                                              const country = PHONE_COUNTRIES.find((c) => c.iso2 === value) || DEFAULT_PHONE_COUNTRY;
                                              return country.dialCode;
                                            }}
                                          >
                                            {PHONE_COUNTRIES.map((country) => (
                                              <MenuItem key={country.iso2} value={country.iso2}>
                                                {country.nameVi} ({country.dialCode})
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        </InputAdornment>
                                      }
                                    />
                                    {ticketPhoneNote && (
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                        {ticketPhoneNote}
                                      </Typography>
                                    )}
                                  </Grid>
                                </>
                              )}

                              {/* Additional Built-in Fields */}
                              {(() => {
                                const idcardCfg = ticketFormFields.find((f) => f.internalName === 'idcard_number');
                                const visible = !!idcardCfg && idcardCfg.visible;
                                const required = !!idcardCfg?.required;
                                return (
                                  visible && (
                                    <Grid item xs={12} md={6}>
                                      <FormFieldLabel label={tt('Số Căn cước công dân', 'ID Card Number')} required={required} />
                                      <OutlinedInput
                                        fullWidth
                                        size="small"
                                        value={holderInfo.idcard_number || ''}
                                        onChange={(e) => setHolderInfo({ idcard_number: e.target.value })}
                                      />
                                      {idcardCfg?.note && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                          {idcardCfg.note}
                                        </Typography>
                                      )}
                                    </Grid>
                                  )
                                );
                              })()}

                              {(() => {
                                const dobCfg = ticketFormFields.find((f) => f.internalName === 'dob');
                                const visible = !!dobCfg && dobCfg.visible;
                                const required = !!dobCfg?.required;
                                return (
                                  visible && (
                                    <Grid item xs={12} md={5}>
                                      <FormFieldLabel label={tt('Ngày sinh', 'Date of Birth')} required={required} />
                                      <DobDatePicker
                                        required={required}
                                        value={holderInfo.dob}
                                        onChange={(dob) => setHolderInfo({ dob })}
                                      />
                                      {dobCfg?.note && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                          {dobCfg.note}
                                        </Typography>
                                      )}
                                    </Grid>
                                  )
                                );
                              })()}

                              {(() => {
                                const addrCfg = ticketFormFields.find((f) => f.internalName === 'address');
                                const visible = !!addrCfg && addrCfg.visible;
                                const required = !!addrCfg?.required;
                                return (
                                  visible && (
                                    <Grid item xs={12}>
                                      <FormFieldLabel label={tt('Địa chỉ', 'Address')} required={required} />
                                      <OutlinedInput
                                        fullWidth
                                        size="small"
                                        value={holderInfo.address || ''}
                                        onChange={(e) => setHolderInfo({ address: e.target.value })}
                                      />
                                      {addrCfg?.note && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                          {addrCfg.note}
                                        </Typography>
                                      )}
                                    </Grid>
                                  )
                                );
                              })()}

                              {/* Ticket Custom Fields */}
                              {customTicketFields.map((field) => (
                                <Grid item xs={12} key={field.internalName}>
                                  <Stack spacing={0.5}>
                                    <FormFieldLabel label={field.label} required={field.required} />
                                    {field.note && (
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {field.note}
                                      </Typography>
                                    )}

                                    {['text', 'number'].includes(field.fieldType) && (
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type={field.fieldType === 'number' ? 'number' : 'text'}
                                        value={(ticket.formAnswers?.[field.internalName]) ?? ''}
                                        onChange={(e) => setTicketFormAnswerForGroup(group, field.internalName, e.target.value)}
                                      />
                                    )}

                                    {['date', 'time', 'datetime'].includes(field.fieldType) && (
                                      <TextField
                                        fullWidth
                                        size="small"
                                        type={
                                          field.fieldType === 'date'
                                            ? 'date'
                                            : field.fieldType === 'time'
                                              ? 'time'
                                              : 'datetime-local'
                                        }
                                        InputLabelProps={{ shrink: true }}
                                        value={(ticket.formAnswers?.[field.internalName]) ?? ''}
                                        onChange={(e) => setTicketFormAnswerForGroup(group, field.internalName, e.target.value)}
                                      />
                                    )}

                                    {field.fieldType === 'radio' && field.options && (
                                      <FormControl component="fieldset" variant="standard">
                                        <Stack spacing={0.5}>
                                          {field.options.map((opt) => (
                                            <FormControlLabel
                                              key={opt.value}
                                              value={opt.value}
                                              control={
                                                <Radio
                                                  size="small"
                                                  sx={{ p: 0.5 }}
                                                  checked={(ticket.formAnswers?.[field.internalName]) === opt.value}
                                                  onChange={() => setTicketFormAnswerForGroup(group, field.internalName, opt.value)}
                                                />
                                              }
                                              label={opt.label}
                                              componentsProps={{ typography: { variant: 'body2', fontSize: '0.875rem' } }}
                                            />
                                          ))}
                                        </Stack>
                                      </FormControl>
                                    )}

                                    {field.fieldType === 'checkbox' && field.options && (
                                      <FormGroup>
                                        <Stack spacing={0.5}>
                                          {field.options.map((opt) => {
                                            const current: string[] = ticket.formAnswers?.[field.internalName] ?? [];
                                            const checked = current.includes(opt.value);
                                            return (
                                              <FormControlLabel
                                                key={opt.value}
                                                control={
                                                  <Checkbox
                                                    size="small"
                                                    sx={{ p: 0.5 }}
                                                    checked={checked}
                                                    onChange={(e) => {
                                                      const nextArr = e.target.checked
                                                        ? Array.from(new Set([...current, opt.value]))
                                                        : current.filter((v) => v !== opt.value);
                                                      setTicketFormAnswerForGroup(group, field.internalName, nextArr);
                                                    }}
                                                  />
                                                }
                                                label={opt.label}
                                                componentsProps={{ typography: { variant: 'body2', fontSize: '0.875rem' } }}
                                              />
                                            );
                                          })}
                                        </Stack>
                                      </FormGroup>
                                    )}
                                  </Stack>
                                </Grid>
                              ))}
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            )}


          </Stack>
        </Grid>
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            {/* Customer Information Card */}
            <Card sx={{ borderTop: 3, borderColor: 'primary.main' }}>
              <CardHeader
                title={tt("Thông tin người mua", "Buyer Information")}
                action={
                  <>
                    {order.tickets.length > 0 && (
                      customerLinkedToTicket1 ? (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mr: 1 }}>
                          <Button
                            size="small"
                            variant="text"
                            color="success"
                            disabled
                            startIcon={<CheckCircle size={14} weight="fill" />}
                            sx={{ textTransform: 'none', '&.Mui-disabled': { color: 'success.main' } }}
                          >
                            {tt('Đã copy từ khán giả 1', 'Copied from attendee 1')}
                          </Button>
                          <IconButton
                            size="small"
                            onClick={unlinkCustomerToEdit}
                            aria-label={tt('Nhập thông tin người mua khác', 'Enter different buyer information')}
                          >
                            <X size={14} />
                          </IconButton>
                        </Stack>
                      ) : (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mr: 1 }}>
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<Copy size={12} />}
                            sx={{ textTransform: 'none' }}
                            onClick={relinkCustomerToTicket1}
                          >
                            {tt('Copy từ khán giả 1', 'Copy from attendee 1')}
                          </Button>
                          <IconButton
                            size="small"
                            onClick={clearCustomerInfo}
                            aria-label={tt('Xoá trắng', 'Clear all')}
                          >
                            <X size={14} />
                          </IconButton>
                        </Stack>
                      )
                    )}
                    {source !== 'marketplace' && (
                      <>
                        <IconButton onClick={props.onOpenFormMenu} size='small'>
                          <DotsThreeOutlineVertical />
                        </IconButton>
                        <Menu
                          anchorEl={props.formMenuAnchorEl}
                          open={Boolean(props.formMenuAnchorEl)}
                          onClose={props.onCloseFormMenu}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        >
                          <MenuItem onClick={props.onCloseFormMenu}>
                            <LocalizedLink
                              style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}
                              href={`/event-studio/events/${props.paramsEventId}/etik-forms/checkout-form?back_to=/event-studio/events/${props.paramsEventId}/transactions/create`}
                            >
                              {tt("Thêm câu hỏi vào biểu mẫu này", "Add questions to this form")}
                            </LocalizedLink>
                          </MenuItem>
                        </Menu>
                      </>
                    )}
                  </>
                }
              />
              <Divider />
              <CardContent sx={{ pt: 1.5, pb: 1.5 }}>
                <Box sx={{ pointerEvents: readonly ? 'none' : 'auto', opacity: readonly ? 0.8 : 1 }}>
                  <Grid container spacing={2}>
                    {/* Đã copy từ khán giả 1: ẩn các field trùng (đã có sẵn giá trị), chỉ hiện
                        tóm tắt cho gọn - bấm "X" ở header (clearCustomerInfo) mới hiện lại để
                        nhập thủ công. Câu hỏi riêng của checkout (không có ở vé) vẫn luôn hiện
                        vì chưa được copy từ đâu cả. */}
                    {customerLinkedToTicket1 && (
                      <Grid item xs={12}>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {customer.title} {customer.name || tt('(Chưa có thông tin)', '(No information)')}
                          </Typography>
                          {(customer.email || customer.nationalPhone) && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {[customer.email, customer.nationalPhone].filter(Boolean).join(' • ')}
                            </Typography>
                          )}
                        </Stack>
                      </Grid>
                    )}

                    {!customerLinkedToTicket1 && (
                      <>
                        <Grid item lg={12} xs={12}>
                          <FormFieldLabel label={tt('Danh xưng - Họ và tên', 'Title - Full Name')} required />
                          <OutlinedInput
                            id="customer-name"
                            fullWidth
                            size="small"
                            autoComplete="name"
                            name="customer_name"
                            value={customer.name}
                            onChange={(e) => setCustomerField({ name: e.target.value })}
                            startAdornment={
                              <InputAdornment position="start">
                                <Select
                                  variant="standard"
                                  disableUnderline
                                  value={customer.title || ''}
                                  onChange={(e) => setCustomerField({ title: e.target.value })}
                                  sx={{ minWidth: 50, '& .MuiSelect-select': { py: 0 } }}
                                >
                                  <MenuItem value=""><em>...</em></MenuItem>
                                  <MenuItem value="Anh">Anh</MenuItem>
                                  <MenuItem value="Chị">Chị</MenuItem>
                                  <MenuItem value="Bạn">Bạn</MenuItem>
                                  {source !== 'marketplace' && <MenuItem value="Em">Em</MenuItem>}
                                  {source !== 'marketplace' && <MenuItem value="Ông">Ông</MenuItem>}
                                  {source !== 'marketplace' && <MenuItem value="Bà">Bà</MenuItem>}
                                  {source !== 'marketplace' && <MenuItem value="Cô">Cô</MenuItem>}
                                  {source !== 'marketplace' && <MenuItem value="Thầy">Thầy</MenuItem>}
                                  <MenuItem value="Mr.">Mr.</MenuItem>
                                  <MenuItem value="Ms.">Ms.</MenuItem>
                                  <MenuItem value="Mx.">Mx.</MenuItem>
                                  {source !== 'marketplace' && <MenuItem value="Miss">Miss</MenuItem>}
                                </Select>
                              </InputAdornment>
                            }
                          />
                          {customerCombinedNameNote && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {customerCombinedNameNote}
                            </Typography>
                          )}
                        </Grid>

                        <Grid item lg={6} xs={12}>
                          <FormFieldLabel label={tt('Địa chỉ Email', 'Email Address')} required />
                          <OutlinedInput
                            fullWidth
                            size="small"
                            autoComplete="email"
                            name="customer_email"
                            type="email"
                            value={customer.email}
                            onChange={(e) => setCustomerField({ email: e.target.value })}
                          />
                          {customerEmailNote && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {customerEmailNote}
                            </Typography>
                          )}
                        </Grid>

                        <Grid item lg={6} xs={12}>
                          <FormFieldLabel label={tt('Số điện thoại', 'Phone Number')} required />
                          <OutlinedInput
                            fullWidth
                            size="small"
                            autoComplete="tel-national"
                            name="customer_national_phone"
                            type="tel"
                            value={customer.nationalPhone}
                            onChange={(e) => setCustomerField({ nationalPhone: e.target.value })}
                            startAdornment={
                              <InputAdornment position="start">
                                <Select
                                  variant="standard"
                                  disableUnderline
                                  value={customer.phoneCountryIso2}
                                  onChange={(e) => setCustomerField({ phoneCountryIso2: e.target.value as string })}
                                  sx={{ minWidth: 50, '& .MuiSelect-select': { py: 0 } }}
                                  renderValue={(value) => {
                                    const country = PHONE_COUNTRIES.find((c) => c.iso2 === value) || DEFAULT_PHONE_COUNTRY;
                                    return country.dialCode;
                                  }}
                                >
                                  {PHONE_COUNTRIES.map((country) => (
                                    <MenuItem key={country.iso2} value={country.iso2}>
                                      {tt(country.nameVi, country.nameEn)} ({country.dialCode})
                                    </MenuItem>
                                  ))}
                                </Select>
                              </InputAdornment>
                            }
                          />
                          {customerPhoneNote && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {customerPhoneNote}
                            </Typography>
                          )}
                        </Grid>
                      </>
                    )}

                    {/* Builtin optional fields controlled by checkout form config. Chỉ ẩn khi
                        đang linked VÀ field này thực sự tồn tại ở form vé (nên đã được copy) -
                        nếu form vé không có field này thì chưa từng được copy, vẫn phải hiện
                        ra để nhập, kể cả khi đang linked. */}
                    {(() => {
                      const dobCfg = checkoutFormFields.find((f) => f.internalName === 'dob');
                      const visible = !!dobCfg && dobCfg.visible;
                      const required = !!dobCfg?.required;
                      const copiedFromTicket = !!ticketFormFields.find((f) => f.internalName === 'dob')?.visible;
                      const hidden = customerLinkedToTicket1 && copiedFromTicket;
                      return (
                        visible && !hidden && (
                          <Grid item lg={6} xs={12}>
                            <FormFieldLabel label={tt('Ngày tháng năm sinh', 'Date of Birth')} required={required} />
                            <DobDatePicker
                              required={required}
                              value={customer.dob}
                              onChange={(dob) => (copiedFromTicket ? setCustomerField({ dob }) : setCustomer({ dob }))}
                            />
                            {dobCfg?.note && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {dobCfg.note}
                              </Typography>
                            )}
                          </Grid>
                        )
                      );
                    })()}

                    {(() => {
                      const idCfg = checkoutFormFields.find((f) => f.internalName === 'idcard_number');
                      const visible = !!idCfg && idCfg.visible;
                      const required = !!idCfg?.required;
                      const copiedFromTicket = !!ticketFormFields.find((f) => f.internalName === 'idcard_number')?.visible;
                      const hidden = customerLinkedToTicket1 && copiedFromTicket;
                      return (
                        visible && !hidden && (
                          <Grid item lg={6} xs={12}>
                            <FormFieldLabel label={tt('Số Căn cước công dân', 'ID Card Number')} required={required} />
                            <OutlinedInput
                              fullWidth
                              size="small"
                              name="customer_idcard_number"
                              value={customer.idcard_number}
                              onChange={(e) => (copiedFromTicket ? setCustomerField({ idcard_number: e.target.value }) : setCustomer({ idcard_number: e.target.value }))}
                              startAdornment={
                                <InputAdornment position="start">
                                  <IdentificationCard size={18} weight="duotone" style={{ opacity: 0.7 }} />
                                </InputAdornment>
                              }
                            />
                            {idCfg?.note && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {idCfg.note}
                              </Typography>
                            )}
                          </Grid>
                        )
                      );
                    })()}

                    {(() => {
                      const addrCfg = checkoutFormFields.find((f) => f.internalName === 'address');
                      const visible = !!addrCfg && addrCfg.visible;
                      const required = !!addrCfg?.required;
                      const copiedFromTicket = !!ticketFormFields.find((f) => f.internalName === 'address')?.visible;
                      const hidden = customerLinkedToTicket1 && copiedFromTicket;
                      return (
                        visible && !hidden && (
                          <Grid item lg={12} xs={12}>
                            <FormFieldLabel label={tt('Địa chỉ', 'Address')} required={required} />
                            <OutlinedInput
                              fullWidth
                              size="small"
                              autoComplete="street-address"
                              name="customer_address"
                              value={customer.address}
                              onChange={(e) => (copiedFromTicket ? setCustomerField({ address: e.target.value }) : setCustomer({ address: e.target.value }))}
                              startAdornment={
                                <InputAdornment position="start">
                                  <MapPin size={18} weight="duotone" style={{ opacity: 0.7 }} />
                                </InputAdornment>
                              }
                            />
                            {addrCfg?.note && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                {addrCfg.note}
                              </Typography>
                            )}
                          </Grid>
                        )
                      );
                    })()}

                    {/* Custom checkout fields - luôn hiện vì không có tương ứng ở vé để copy */}
                    {customCheckoutFields.map((field) => (
                      <Grid item key={field.internalName} xs={12}>
                        <Stack spacing={0.5}>
                          <FormFieldLabel label={field.label} required={field.required} />
                          {field.note && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {field.note}
                            </Typography>
                          )}

                          {['text', 'number'].includes(field.fieldType) && (
                            <TextField
                              fullWidth
                              size="small"
                              type={field.fieldType === 'number' ? 'number' : 'text'}
                              value={checkoutCustomAnswers[field.internalName] ?? ''}
                              onChange={(e) =>
                                setCheckoutCustomAnswers((prev) => ({
                                  ...prev,
                                  [field.internalName]: e.target.value,
                                }))
                              }
                            />
                          )}

                          {['date', 'time', 'datetime'].includes(field.fieldType) && (
                            <TextField
                              fullWidth
                              size="small"
                              type={
                                field.fieldType === 'date'
                                  ? 'date'
                                  : field.fieldType === 'time'
                                    ? 'time'
                                    : 'datetime-local'
                              }
                              InputLabelProps={{ shrink: true }}
                              value={checkoutCustomAnswers[field.internalName] ?? ''}
                              onChange={(e) =>
                                setCheckoutCustomAnswers((prev) => ({
                                  ...prev,
                                  [field.internalName]: e.target.value,
                                }))
                              }
                            />
                          )}

                          {field.fieldType === 'radio' && field.options && (
                            <FormControl component="fieldset" variant="standard">
                              <Stack spacing={0.5}>
                                {field.options.map((opt) => (
                                  <FormControlLabel
                                    key={opt.value}
                                    value={opt.value}
                                    control={
                                      <Radio
                                        size="small"
                                        sx={{ p: 0.5 }}
                                        checked={checkoutCustomAnswers[field.internalName] === opt.value}
                                        onChange={() =>
                                          setCheckoutCustomAnswers((prev) => ({
                                            ...prev,
                                            [field.internalName]: opt.value,
                                          }))
                                        }
                                      />
                                    }
                                    label={opt.label}
                                    componentsProps={{ typography: { variant: 'body2', fontSize: '0.875rem' } }}
                                  />
                                ))}
                              </Stack>
                            </FormControl>
                          )}

                          {field.fieldType === 'checkbox' && field.options && (
                            <FormGroup>
                              <Stack spacing={0.5}>
                                {field.options.map((opt) => {
                                  const current: string[] = checkoutCustomAnswers[field.internalName] ?? [];
                                  const checked = current.includes(opt.value);
                                  return (
                                    <FormControlLabel
                                      key={opt.value}
                                      control={
                                        <Checkbox
                                          size="small"
                                          sx={{ p: 0.5 }}
                                          checked={checked}
                                          onChange={(e) => {
                                            setCheckoutCustomAnswers((prev) => {
                                              const prevArr: string[] = prev[field.internalName] ?? [];
                                              const nextArr = e.target.checked
                                                ? Array.from(new Set([...prevArr, opt.value]))
                                                : prevArr.filter((v) => v !== opt.value);
                                              return { ...prev, [field.internalName]: nextArr };
                                            });
                                          }}
                                        />
                                      }
                                      label={opt.label}
                                      componentsProps={{ typography: { variant: 'body2', fontSize: '0.875rem' } }}
                                    />
                                  );
                                })}
                              </Stack>
                            </FormGroup>
                          )}
                        </Stack>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="outlined" onClick={onBack} sx={{ fontWeight: 600 }}>
          {tt('Quay lại', 'Back')}
        </Button>
        <Button variant="contained" onClick={onNext} sx={{ px: 4, py: 1, borderRadius: '8px', fontWeight: 600 }}>
          {tt('Tiếp tục', 'Next')}
        </Button>
      </Box>
    </Stack>
  );
}
