"use client";

import * as React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
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
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { alpha } from '@mui/material/styles';
import { CaretDown, DotsThreeOutlineVertical, Pencil, Plus, Copy, User, EnvelopeSimple, Phone, MapPin, IdentificationCard, CalendarBlank, Armchair } from '@phosphor-icons/react/dist/ssr';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';

import { LocalizedLink } from '@/components/homepage/localized-link';
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES } from '@/config/phone-countries';

import { Order, TicketInfo, HolderInfo, CheckoutRuntimeField, Show } from './types';

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
    locale,
    defaultTitle,
    paramsEventId,
    formMenuAnchorEl,
    onOpenFormMenu,
    onCloseFormMenu,
    order,
    setOrder,
    checkoutFormFields,
    customCheckoutFields,
    builtinInternalNames,
    checkoutCustomAnswers,
    setCheckoutCustomAnswers,

    shows,
    handleCustomerAvatarFile,
    handleTicketHolderAvatarFile,
    formatPrice,
    setActiveScheduleId,
    setRequestedCategoryModalId,
    onBack,
    onNext,
    source = 'marketplace',
    readonly = false,
    invitation,
    forceEditInfo = false,
  } = props;

  const [isEditingInfo, setIsEditingInfo] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (forceEditInfo && !isEditingInfo) {
      setIsEditingInfo(true);
      setOrder((prev: any) => ({
        ...prev,
        customer: { title: '', name: '', email: '', phoneNumber: '', nationalPhone: '', address: '', phoneCountryIso2: 'VN', dob: null, idcard_number: '', avatar: '' },
        tickets: prev.tickets.map((t: any) => ({ ...t, holder: undefined }))
      }));
    }
  }, [forceEditInfo, isEditingInfo, setOrder]);

  // State to control expanded accordions
  const [expandedAccordions, setExpandedAccordions] = React.useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    order.tickets.forEach((_, index) => {
      initial[index] = true; // Default expanded
    });
    return initial;
  });

  // Update expanded state when tickets count changes
  React.useEffect(() => {
    setExpandedAccordions(prev => {
      const updated = { ...prev };
      order.tickets.forEach((_, index) => {
        if (!(index in updated)) {
          updated[index] = true; // Default expanded for new tickets
        }
      });
      return updated;
    });
  }, [order.tickets.length]);


  const handleAccordionChange = (index: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordions(prev => ({ ...prev, [index]: isExpanded }));
  };

  const customer = order.customer;
  const setCustomer = (patch: any) => {
    setOrder(prev => ({ ...prev, customer: { ...prev.customer, ...patch } }));
  };

  // Group tickets for summary
  const ticketSummary = React.useMemo(() => {
    const groups: Record<string, { show: Show, category: any, quantity: number, total: number, indices: number[] }> = {};
    order.tickets.forEach((t, index) => {
      const key = `${t.showId}-${t.ticketCategoryId}`;
      if (!groups[key]) {
        const show = shows.find(s => s.id === t.showId);
        const cat = show?.ticketCategories.find(c => c.id === t.ticketCategoryId);
        groups[key] = { show: show!, category: cat, quantity: 0, total: 0, indices: [] };
      }
      groups[key].quantity += 1;
      groups[key].total += (t.price ?? groups[key].category?.price ?? 0);
      groups[key].indices.push(index);
    });
    return Object.values(groups);
  }, [order.tickets, shows]);

  // Show invitation summary card only when invitation has pre-filled info AND guest hasn't chosen to re-enter
  const hasPreFilledInfo = !!(invitation && invitation.preFilledInfo && (
    invitation.preFilledInfo.customer?.name || invitation.preFilledInfo.customer?.email
  ));
  const showInvitationCard = hasPreFilledInfo && !isEditingInfo;

  if (showInvitationCard) {
    const pf = invitation.preFilledInfo; // pre-filled info shorthand
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
                    const show = shows.find(s => s.id === ticket.showId);
                    const category = show?.ticketCategories.find(c => c.id === ticket.ticketCategoryId);
                    const holder = ticket.holder;
                    return (
                      <Box key={idx} sx={{ p: 1.5, borderRadius: '8px', border: '1px dashed', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {tt(`Vé #${idx + 1}:`, `Ticket #${idx + 1}:`)} {category?.name || tt('Vé', 'Ticket')}
                            </Typography>
                            {show && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {show.name} • {dayjs(show.startDateTime).format('HH:mm DD/MM/YYYY')}
                              </Typography>
                            )}
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
                          customer: { title: '', name: '', email: '', phoneNumber: '', nationalPhone: '', address: '', phoneCountryIso2: 'VN', dob: null, idcard_number: '', avatar: '' },
                          tickets: prev.tickets.map((t: any) => ({ ...t, holder: undefined }))
                        }));
                        setIsEditingInfo(true);
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
            {/* Ticket holders input (accordion) */}
            {order.tickets.length > 0 && (
              <Card>
                <CardHeader
                  title={tt(
                    `Thông tin người sở hữu vé: ${order.tickets.length} vé`,
                    `Ticket List: ${order.tickets.length} tickets`
                  )}
                />
                <Divider />
                <CardContent sx={{ pt: 1.5, pb: 1.5, pointerEvents: readonly ? 'none' : 'auto', opacity: readonly ? 0.8 : 1 }}>
                  <Stack spacing={2}>
                    {/* Summary of categories */}
                    {/* Summary and Ticket Holders Combined */}
                    {ticketSummary.map((group, groupIdx) => (
                      <Stack spacing={2} key={`group-${groupIdx}`}>
                        {/* Group Header */}
                        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'rgba(0,0,0,0.03)', p: 1.5, borderRadius: 1 }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <TicketIcon fontSize="var(--icon-fontSize-md)" />
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {group.show?.name || tt('Chưa xác định', 'Not specified')} - {group.category?.name || tt('Chưa rõ loại vé', 'Unknown ticket category')}
                            </Typography>
                            <IconButton
                              size="small"
                              sx={{ ml: 1, alignSelf: 'flex-start' }}
                              onClick={() => {
                                setActiveScheduleId(group.show.id);
                                setRequestedCategoryModalId(group.category?.id || 0);
                              }}
                            >
                              <Pencil />
                            </IconButton>
                          </Stack>
                          <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                            <Typography variant="caption">x {group.quantity}</Typography>
                            <Typography variant="caption">= {formatPrice(group.total)}</Typography>
                          </Stack>
                        </Stack>

                        {/* Valid Tickets in this Group */}
                        <Stack spacing={2} sx={{ pl: { md: 2 } }}>
                          {group.indices.map((ticketIndex, i) => {
                            const ticket = order.tickets[ticketIndex];
                            const holderInfo = ticket.holder || {
                              title: '',
                              name: '',
                              email: '',
                              phone: '',
                              nationalPhone: '',
                              phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2,
                              avatar: '',
                            };

                            const setHolderInfo = (patch: Partial<HolderInfo>) => {
                              setOrder(prev => {
                                const newTickets = [...prev.tickets];
                                newTickets[ticketIndex] = {
                                  ...newTickets[ticketIndex],
                                  holder: { ...holderInfo, ...patch } as HolderInfo
                                };
                                return { ...prev, tickets: newTickets };
                              });
                            };

                            return (
                              <Accordion
                                key={`ticket-${ticketIndex}`}
                                expanded={expandedAccordions[ticketIndex] ?? true}
                                onChange={handleAccordionChange(ticketIndex)}
                                disableGutters
                                elevation={0}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  backgroundColor: 'background.paper',
                                  backgroundImage: (theme) =>
                                    `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.secondary.main, 0.04)})`,
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
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                        {tt(`Vé ${ticketIndex + 1}`, `Ticket ${ticketIndex + 1}`)}
                                      </Typography>
                                      {ticket.seatLabel && (
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                          <Armchair size={14} style={{ color: 'var(--mui-palette-text-secondary)' }} />
                                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            {ticket.seatLabel}
                                          </Typography>
                                        </Stack>
                                      )}
                                      {ticket.audienceName && (
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                          ({ticket.audienceName})
                                        </Typography>
                                      )}
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                                        {holderInfo.name ? `${holderInfo.title ? `${holderInfo.title} ` : ''}${holderInfo.name}` : tt('Chưa có thông tin', 'No information')}
                                      </Typography>
                                    </Stack>
                                    <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
                                    <Stack
                                      direction="row"
                                      spacing={0.5}
                                      sx={{
                                        ml: { xs: 0, md: 'auto' },
                                        mt: { xs: 0.5, md: 0 }
                                      }}
                                    >

                                      {ticketIndex > 0 && (
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
                                            // Always expand accordion
                                            setExpandedAccordions(prev => ({ ...prev, [ticketIndex]: true }));
                                            // Copy from ticket 1 (index 0)
                                            const firstTicket = order.tickets[0];
                                            const firstHolder = firstTicket.holder || {
                                              title: '',
                                              name: '',
                                              email: '',
                                              phone: '',
                                              nationalPhone: '',
                                              phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2,
                                              avatar: '',
                                            };

                                            // Copy from ticket 1 - copy nationalPhone and phoneCountryIso2
                                            setHolderInfo({
                                              title: firstHolder.title,
                                              name: firstHolder.name,
                                              email: firstHolder.email,
                                              nationalPhone: firstHolder.nationalPhone || '',
                                              phoneCountryIso2: firstHolder.phoneCountryIso2,
                                              avatar: firstHolder.avatar,
                                            });
                                          }}
                                        >
                                          {tt('Copy từ vé 1', 'Copy from ticket 1')}
                                        </Button>
                                      )}
                                    </Stack>
                                  </Stack>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0, pb: 1.5 }}>
                                  <Grid container spacing={1.5} alignItems="center">
                                    <Grid item xs={12} md={2}>
                                      <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'center' }, width: 48 }}>
                                        <Box sx={{ position: 'relative', width: 48, height: 48, '&:hover .avatarUploadBtn': { opacity: 1, visibility: 'visible' } }}>
                                          <Avatar src={holderInfo.avatar || ''} sx={{ width: 48, height: 48 }} />
                                          <IconButton
                                            className="avatarUploadBtn"
                                            size="small"
                                            sx={{
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '100%',
                                              borderRadius: '50%',
                                              opacity: 0,
                                              visibility: 'hidden',
                                              backdropFilter: 'blur(6px)',
                                              backgroundColor: 'rgba(0,0,0,0.35)',
                                              color: 'white',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              zIndex: 1,
                                            }}
                                            onClick={() => {
                                              const input = document.getElementById(`upload-holder-${ticketIndex}`) as HTMLInputElement | null;
                                              input?.click();
                                            }}
                                            aria-label={tt('Tải ảnh đại diện', 'Upload avatar')}
                                          >
                                            <Plus size={14} />
                                          </IconButton>
                                          <input
                                            id={`upload-holder-${ticketIndex}`}
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={(e) => {
                                              const f = e.target.files?.[0];
                                              handleTicketHolderAvatarFile(ticketIndex, f);
                                              e.currentTarget.value = '';
                                            }}
                                          />
                                        </Box>
                                      </Box>
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                      <FormControl fullWidth required size="small">
                                        <InputLabel>
                                          {tt(`Danh xưng*    Họ và tên`, `Title*    Full Name`)}
                                        </InputLabel>
                                        <OutlinedInput
                                          label={tt(`Danh xưng*    Họ và tên`, `Title*    Full Name`)}
                                          size="small"
                                          autoComplete="name"
                                          value={holderInfo.name}
                                          onChange={(e) => setHolderInfo({ name: e.target.value })}
                                          startAdornment={
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
                                                {source !== 'marketplace' && (
                                                  <>
                                                    <MenuItem value="Em">Em</MenuItem>
                                                    <MenuItem value="Ông">Ông</MenuItem>
                                                    <MenuItem value="Bà">Bà</MenuItem>
                                                    <MenuItem value="Cô">Cô</MenuItem>
                                                    <MenuItem value="Thầy">Thầy</MenuItem>
                                                  </>
                                                )}
                                                <MenuItem value="Mr.">Mr.</MenuItem>
                                                <MenuItem value="Ms.">Ms.</MenuItem>
                                                <MenuItem value="Mx.">Mx.</MenuItem>
                                                {source !== 'marketplace' && <MenuItem value="Miss">Miss</MenuItem>}
                                              </Select>
                                            </InputAdornment>
                                          }
                                        />
                                      </FormControl>
                                    </Grid>

                                    <Grid item xs={12} md={3}>
                                      <FormControl fullWidth size="small">
                                        <InputLabel>{tt(`Email vé ${ticketIndex + 1}`, `Email ticket ${ticketIndex + 1}`)}</InputLabel>
                                        <OutlinedInput
                                          label={tt(`Email vé ${ticketIndex + 1}`, `Email ticket ${ticketIndex + 1}`)}
                                          size="small"
                                          autoComplete="email"
                                          type="email"
                                          value={holderInfo.email || ''}
                                          onChange={(e) => setHolderInfo({ email: e.target.value })}

                                        />
                                      </FormControl>
                                    </Grid>

                                    <Grid item xs={12} md={3}>
                                      <FormControl fullWidth size="small">
                                        <InputLabel>{tt(`SĐT vé ${ticketIndex + 1}`, `Phone ticket ${ticketIndex + 1}`)}</InputLabel>
                                        <OutlinedInput
                                          label={tt(`SĐT vé ${ticketIndex + 1}`, `Phone ticket ${ticketIndex + 1}`)}
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
                                      </FormControl>
                                    </Grid>
                                  </Grid>
                                </AccordionDetails>
                              </Accordion>
                            );
                          })}
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            )}


          </Stack>
        </Grid>
        <Grid item xs={12} md={5}>
          <Stack spacing={3}>
            {/* Customer Information Card */}
            <Card>
              <CardHeader
                title={tt("Thông tin người mua", "Buyer Information")}
                action={
                  <>
                    {order.tickets.length > 0 && (
                      <Button
                        size="small"
                        variant="text"
                        startIcon={<Copy size={12} />}
                        sx={{ mr: 1, textTransform: 'none' }}
                        onClick={() => {
                          const firstTicket = order.tickets[0];
                          const firstHolder = firstTicket?.holder;
                          if (firstHolder) {
                            setCustomer({
                              title: firstHolder.title || '',
                              name: firstHolder.name || '',
                              email: firstHolder.email || '',
                              nationalPhone: firstHolder.nationalPhone || '',
                              phoneCountryIso2: firstHolder.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2,
                              avatar: firstHolder.avatar || '',
                            });
                          }
                        }}
                      >
                        {tt('Copy từ vé 1', 'Copy from ticket 1')}
                      </Button>
                    )}
                    <IconButton onClick={onOpenFormMenu} size='small'>
                      <DotsThreeOutlineVertical />
                    </IconButton>
                    <Menu
                      anchorEl={formMenuAnchorEl}
                      open={Boolean(formMenuAnchorEl)}
                      onClose={onCloseFormMenu}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    >
                      <MenuItem onClick={onCloseFormMenu}>
                        <LocalizedLink
                          style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}
                          href={`/event-studio/events/${paramsEventId}/etik-forms/checkout-form?back_to=/event-studio/events/${paramsEventId}/transactions/create`}
                        >
                          {tt("Thêm câu hỏi vào biểu mẫu này", "Add questions to this form")}
                        </LocalizedLink>
                      </MenuItem>
                    </Menu>
                  </>
                }
              />
              <Divider />
              <CardContent sx={{ pt: 1.5, pb: 1.5 }}>
                <Box sx={{ pointerEvents: readonly ? 'none' : 'auto', opacity: readonly ? 0.8 : 1 }}>
                  <Grid container spacing={2}>
                    <Grid item lg={12} xs={12}>
                      <FormControl fullWidth required size="small">
                        <InputLabel htmlFor="customer-name">{tt("Danh xưng*   Họ và tên", "Title*   Full Name")}</InputLabel>
                        <OutlinedInput
                          id="customer-name"
                          size="small"
                          autoComplete="name"
                          label={tt("Danh xưng*    Họ và tên", "Title*    Full Name")}
                          name="customer_name"
                          value={customer.name}
                          onChange={(e) => {
                            // Update customer
                            setCustomer({ name: e.target.value });

                            // Also auto-fill first ticket holder if it's "you" and empty
                            if (order.tickets.length > 0) {
                              setOrder(prev => {
                                const newTickets = [...prev.tickets];
                                const firstHolder = newTickets[0].holder;
                                if (firstHolder && (!firstHolder.name || firstHolder.name === prev.customer.name)) {
                                  newTickets[0] = {
                                    ...newTickets[0],
                                    holder: { ...firstHolder, name: e.target.value } as HolderInfo
                                  };
                                }
                                // Or if undefined holder, init it? Usually step 1 creates holder undefined.
                                // Logic here is tricky if we don't want to enforce it.
                                // Original logic: !ticketHolderEditted && ticketHolders.length > 0

                                return { ...prev, customer: { ...prev.customer, name: e.target.value }, tickets: newTickets };
                              });
                              return; // handled above
                            }
                            setCustomer({ name: e.target.value });
                          }}
                          startAdornment={
                            <InputAdornment position="start">
                              <Select
                                variant="standard"
                                disableUnderline
                                value={customer.title || ''}
                                onChange={(e) => setCustomer({ ...customer, title: e.target.value })}
                                sx={{ minWidth: 50, '& .MuiSelect-select': { py: 0 } }}
                              >
                                <MenuItem value=""><em>...</em></MenuItem>
                                <MenuItem value="Anh">Anh</MenuItem>
                                <MenuItem value="Chị">Chị</MenuItem>
                                <MenuItem value="Bạn">Bạn</MenuItem>
                                {source !== 'marketplace' && (
                                  <>
                                    <MenuItem value="Em">Em</MenuItem>
                                    <MenuItem value="Ông">Ông</MenuItem>
                                    <MenuItem value="Bà">Bà</MenuItem>
                                    <MenuItem value="Cô">Cô</MenuItem>
                                    <MenuItem value="Thầy">Thầy</MenuItem>
                                  </>
                                )}
                                <MenuItem value="Mr.">Mr.</MenuItem>
                                <MenuItem value="Ms.">Ms.</MenuItem>
                                <MenuItem value="Mx.">Mx.</MenuItem>
                                {source !== 'marketplace' && <MenuItem value="Miss">Miss</MenuItem>}
                              </Select>
                            </InputAdornment>
                          }
                        />
                      </FormControl>
                    </Grid>

                    <Grid item lg={6} xs={12}>
                      <FormControl fullWidth required size="small">
                        <InputLabel>{tt("Địa chỉ Email", "Email Address")}</InputLabel>
                        <OutlinedInput
                          label={tt("Địa chỉ Email", "Email Address")}
                          size="small"
                          autoComplete="email"
                          name="customer_email"
                          type="email"
                          value={customer.email}
                          onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                        />
                      </FormControl>
                    </Grid>

                    <Grid item lg={6} xs={12}>
                      <FormControl fullWidth required size="small">
                        <InputLabel>{tt("Số điện thoại", "Phone Number")}</InputLabel>
                        <OutlinedInput
                          label={tt("Số điện thoại", "Phone Number")}
                          size="small"
                          autoComplete="tel-national"
                          name="customer_national_phone"
                          type="tel"
                          value={customer.nationalPhone}
                          onChange={(e) => setCustomer({ ...customer, nationalPhone: e.target.value })}
                          startAdornment={
                            <InputAdornment position="start">
                              <Select
                                variant="standard"
                                disableUnderline
                                value={customer.phoneCountryIso2}
                                onChange={(e) => setCustomer({ ...customer, phoneCountryIso2: e.target.value as string })}
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
                      </FormControl>
                    </Grid>

                    {/* Builtin optional fields controlled by checkout form config */}
                    {(() => {
                      const dobCfg = checkoutFormFields.find((f) => f.internalName === 'dob');
                      const visible = !!dobCfg && dobCfg.visible;
                      const required = !!dobCfg?.required;
                      return (
                        visible && (
                          <Grid item lg={6} xs={12}>
                            <TextField
                              fullWidth
                              size="small"
                              label={tt("Ngày tháng năm sinh", "Date of Birth")}
                              name="customer_dob"
                              type="date"
                              required={required}
                              value={customer.dob || ""}
                              onChange={(e) => setCustomer({ ...customer, dob: e.target.value })}
                              InputLabelProps={{ shrink: true }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <CalendarBlank size={18} weight="duotone" style={{ opacity: 0.7 }} />
                                  </InputAdornment>
                                ),
                              }}
                              inputProps={{ max: new Date().toISOString().slice(0, 10) }}
                            />
                          </Grid>
                        )
                      );
                    })()}

                    {(() => {
                      const idCfg = checkoutFormFields.find((f) => f.internalName === 'idcard_number');
                      const visible = !!idCfg && idCfg.visible;
                      const required = !!idCfg?.required;
                      return (
                        visible && (
                          <Grid item lg={6} xs={12}>
                            <FormControl fullWidth required={required} size="small">
                              <InputLabel>{tt("Số Căn cước công dân", "ID Card Number")}</InputLabel>
                              <OutlinedInput
                                label={tt("Số Căn cước công dân", "ID Card Number")}
                                size="small"
                                name="customer_idcard_number"
                                value={customer.idcard_number}
                                onChange={(e) => setCustomer({ ...customer, idcard_number: e.target.value })}
                                startAdornment={
                                  <InputAdornment position="start">
                                    <IdentificationCard size={18} weight="duotone" style={{ opacity: 0.7 }} />
                                  </InputAdornment>
                                }
                              />
                            </FormControl>
                          </Grid>
                        )
                      );
                    })()}

                    {(() => {
                      const addrCfg = checkoutFormFields.find((f) => f.internalName === 'address');
                      const visible = !!addrCfg && addrCfg.visible;
                      const required = !!addrCfg?.required;
                      return (
                        visible && (
                          <Grid item lg={12} xs={12}>
                            <FormControl fullWidth required={required} size="small">
                              <InputLabel>{tt("Địa chỉ", "Address")}</InputLabel>
                              <OutlinedInput
                                label={tt("Địa chỉ", "Address")}
                                size="small"
                                autoComplete="street-address"
                                name="customer_address"
                                value={customer.address}
                                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                                startAdornment={
                                  <InputAdornment position="start">
                                    <MapPin size={18} weight="duotone" style={{ opacity: 0.7 }} />
                                  </InputAdornment>
                                }
                              />
                            </FormControl>
                          </Grid>
                        )
                      );
                    })()}

                    {/* Custom checkout fields */}
                    {customCheckoutFields.map((field) => (
                      <Grid item key={field.internalName} xs={12}>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {field.label}
                            {field.required && ' *'}
                          </Typography>
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
