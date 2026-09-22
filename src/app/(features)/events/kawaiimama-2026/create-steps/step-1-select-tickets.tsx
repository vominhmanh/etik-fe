"use client";

import { Box, Card, CardContent, CardHeader, Checkbox, Divider, Alert, List, ListItem, ListItemAvatar, ListItemText, OutlinedInput, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import * as React from 'react';
import dayjs from 'dayjs';

import NotificationContext from '@/contexts/notification-context';
import { Order, Show, TicketInfo } from './types';

export type Step1SelectTicketsProps = {
  shows?: Show[];
  selectedSchedules: Show[];
  activeScheduleId: number | null;
  onSelectionChange: (selected: Show[]) => void;
  onOpenSchedule: (show: Show | null) => void;

  totalSelectedTickets: number;
  onOpenCart: () => void;

  activeSchedule: Show | null;
  qrOption: 'shared' | 'separate';


  requestedCategoryModalId: number | null;
  onModalRequestHandled: () => void;
  cartQuantitiesForActiveSchedule: Record<number, number>;
  cartAudienceQuantitiesForActiveSchedule?: Record<number, Record<number, number>>;

  order: Order;
  setOrder: React.Dispatch<React.SetStateAction<Order>>;

  tt: (vi: string, en: string) => string;
  onNext: () => void;
  existingSeats?: any[];

  // Cart props
  isCartOpen: boolean;
  onCloseCart: () => void;
  formatPrice: (price: number) => string;
  subtotal: number;
  onEditCartItem: (showId: number, categoryId: number) => void;
  onRemoveCartItem: (showId: number, categoryId: number) => void;
  onUpdateConcessionQuantity?: (showId: number, concessionId: number, quantity: number) => void;
  eventLimitPerTransaction?: number | null;
  eventLimitPerCustomer?: number | null;
  source?: string;
  eventSlug?: string;
  appliedVoucherCode?: string | null;
  invitation?: any;
  /** Called when guest clicks "Change Tickets" – clears all auto-filled tickets so they pick manually */
  onClearAndReselect?: () => void;
};

const formatDateTime = (date: string | Date | null) => {
  if (!date) return '';
  return dayjs(date).format('HH:mm DD/MM/YYYY');
};

// Không dùng đối tượng khán giả (categoryAudiences) thì gom số lượng vào key này.
const NO_AUDIENCE_KEY = -1;

export function Step1SelectTickets(props: Step1SelectTicketsProps): React.JSX.Element {
  const {
    shows,
    order,
    setOrder,
    tt,
    onNext,
    onSelectionChange,
    invitation,
    onClearAndReselect,
    eventLimitPerTransaction,
    eventLimitPerCustomer,
    formatPrice,
  } = props;

  const notificationCtx = React.useContext(NotificationContext);

  const [isEditingTickets, setIsEditingTickets] = React.useState(false);
  const [isMessageExpanded, setIsMessageExpanded] = React.useState(false);
  const [showMessageExpandBtn, setShowMessageExpandBtn] = React.useState(false);
  const messageRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (messageRef.current) {
      if (messageRef.current.scrollHeight > messageRef.current.clientHeight) {
        setShowMessageExpandBtn(true);
      }
    }
  }, [invitation?.message]);

  const hasActualMessage = React.useMemo(() => {
    if (!invitation?.message) return false;
    const plainText = invitation.message.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, '').trim();
    const hasImage = invitation.message.includes('<img');
    return plainText.length > 0 || hasImage;
  }, [invitation?.message]);

  const hasPreSelectedTickets = !!(invitation && !invitation.letCustomerSelect && (invitation.preSelectedTickets?.tickets?.length > 0));
  const showInvitationCard = hasPreSelectedTickets && !isEditingTickets;

  // Mỗi ngày (show) của sự kiện này chỉ có đúng 1 loại vé, nên lấy loại vé của show đầu
  // tiên làm "chuẩn" để hiển thị danh sách đối tượng khán giả dùng chung cho mọi ngày.
  const referenceCategory = shows?.[0]?.ticketCategories?.[0] || null;
  const activeAudiences = React.useMemo(
    () => referenceCategory?.categoryAudiences?.filter((ca) => ca.audience.isActive) || [],
    [referenceCategory]
  );

  // Khởi tạo lại từ order.tickets hiện có (vd quay lại từ bước sau) để không mất lựa chọn.
  const [selectedShowIds, setSelectedShowIds] = React.useState<Set<number>>(
    () => new Set(order.tickets.map((t) => t.showId))
  );
  const [audienceQuantities, setAudienceQuantities] = React.useState<Record<number, number>>(() => {
    const showIds = Array.from(new Set(order.tickets.map((t) => t.showId)));
    const representativeShowId = showIds[0];
    const qty: Record<number, number> = {};
    order.tickets
      .filter((t) => t.showId === representativeShowId)
      .forEach((t) => {
        const key = t.audienceId ?? NO_AUDIENCE_KEY;
        qty[key] = (qty[key] || 0) + 1;
      });
    return qty;
  });

  const handleQuantityChange = (key: number, rawValue: string) => {
    const parsed = parseInt(rawValue, 10);
    const value = Number.isNaN(parsed) ? 0 : parsed;
    setAudienceQuantities((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  };

  const toggleShow = (show: Show) => {
    const isValid = show.status === 'on_sale' && !show.disabled;
    if (!isValid) return;
    setSelectedShowIds((prev) => {
      const next = new Set(prev);
      if (next.has(show.id)) {
        next.delete(show.id);
      } else {
        next.add(show.id);
      }
      return next;
    });
  };

  const totalAttendeesPerDay = React.useMemo(
    () => Object.values(audienceQuantities).reduce((a, b) => a + b, 0),
    [audienceQuantities]
  );

  const adultAudience = React.useMemo(
    () => activeAudiences.find((ca) => ca.audience.code === 'adult'),
    [activeAudiences]
  );

  const handleContinue = () => {
    if (totalAttendeesPerDay <= 0) {
      notificationCtx.error(tt('Vui lòng chọn ít nhất 1 khán giả', 'Please select at least 1 attendee'));
      return;
    }
    if (adultAudience && (audienceQuantities[adultAudience.audienceId] || 0) <= 0) {
      notificationCtx.error(tt('Vui lòng chọn ít nhất 1 vé người lớn', 'Please select at least 1 adult ticket'));
      return;
    }
    if (selectedShowIds.size === 0) {
      notificationCtx.error(tt('Vui lòng chọn ít nhất 1 ngày tham dự', 'Please select at least 1 attendance date'));
      return;
    }

    const selectedShows = (shows || []).filter((s) => selectedShowIds.has(s.id));

    for (const show of selectedShows) {
      const category = show.ticketCategories?.[0];
      if (!category) continue;

      const remaining = Math.max(0, (category.quantity || 0) - (category.sold || 0));
      if (totalAttendeesPerDay > remaining) {
        notificationCtx.error(
          tt(`Loại vé cho ngày "${show.name}" chỉ còn ${remaining} vé`, `Ticket for "${show.name}" only has ${remaining} left`)
        );
        return;
      }

      const limit = category.limitPerTransaction ?? show.limitPerTransaction ?? null;
      if (limit && totalAttendeesPerDay > limit) {
        notificationCtx.error(
          tt(`Bạn chỉ được chọn tối đa ${limit} vé cho ngày "${show.name}"`, `You can select at most ${limit} tickets for "${show.name}"`)
        );
        return;
      }

      const minRequired = category.minPerTransaction ?? show.minPerTransaction ?? null;
      if (minRequired && totalAttendeesPerDay < minRequired) {
        notificationCtx.error(
          tt(`Bạn cần chọn tối thiểu ${minRequired} vé cho ngày "${show.name}"`, `You must select at least ${minRequired} tickets for "${show.name}"`)
        );
        return;
      }
    }

    const totalTickets = totalAttendeesPerDay * selectedShows.length;
    if (eventLimitPerTransaction && totalTickets > eventLimitPerTransaction) {
      notificationCtx.error(
        tt(`Bạn chỉ được chọn tối đa ${eventLimitPerTransaction} vé cho toàn bộ sự kiện`, `You can select at most ${eventLimitPerTransaction} tickets for this event`)
      );
      return;
    }
    if (eventLimitPerCustomer && totalTickets > eventLimitPerCustomer) {
      notificationCtx.error(
        tt(`Bạn chỉ được chọn tối đa ${eventLimitPerCustomer} vé cho toàn bộ sự kiện`, `You can select at most ${eventLimitPerCustomer} tickets for this event`)
      );
      return;
    }

    const newTickets: TicketInfo[] = [];
    selectedShows.forEach((show) => {
      const category = show.ticketCategories?.[0];
      if (!category) return;

      if (activeAudiences.length > 0) {
        activeAudiences.forEach((ca) => {
          const qty = audienceQuantities[ca.audienceId] || 0;
          for (let i = 0; i < qty; i++) {
            newTickets.push({
              showId: show.id,
              showName: show.name,
              ticketCategoryId: category.id,
              ticketCategoryName: category.name,
              price: ca.price,
              audienceId: ca.audienceId,
              audienceName: ca.audience.name,
              holderInfo: undefined,
            });
          }
        });
      } else {
        const qty = audienceQuantities[NO_AUDIENCE_KEY] || 0;
        for (let i = 0; i < qty; i++) {
          newTickets.push({
            showId: show.id,
            showName: show.name,
            ticketCategoryId: category.id,
            ticketCategoryName: category.name,
            price: category.price,
            holderInfo: undefined,
          });
        }
      }
    });

    setOrder((prev) => ({ ...prev, tickets: newTickets }));
    onSelectionChange(selectedShows);
    onNext();
  };

  const invitationBanner = invitation ? (
    <Stack spacing={1}>
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
            {tt(' Bạn đang chọn vé theo thư mời.', ' You are selecting tickets via an invitation.')}
          </Typography>
        </Box>
      </Alert>
      {hasActualMessage && (
        <Box sx={{ p: 1.5, bgcolor: 'rgba(255,204,0,0.1)', borderRadius: '8px', borderLeft: '4px solid #ffcc00' }}>
          <Box sx={{ position: 'relative' }}>
            <Typography
              ref={messageRef}
              dangerouslySetInnerHTML={{ __html: invitation.message }}
              variant="body2"
              sx={{
                color: '#555',
                fontStyle: 'italic',
                display: '-webkit-box',
                WebkitLineClamp: isMessageExpanded ? 'unset' : 10,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            />
          </Box>
          {showMessageExpandBtn && (
            <Button
              size="small"
              variant="text"
              onClick={() => setIsMessageExpanded(!isMessageExpanded)}
              sx={{ mt: 0.5, p: 0, minWidth: 0, fontSize: '0.75rem', textTransform: 'none', color: '#856600', '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
            >
              {isMessageExpanded ? tt('Thu gọn', 'Show less') : tt('Xem thêm...', 'Read more...')}
            </Button>
          )}
        </Box>
      )}
      {invitation.expiresAt && (
        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 2, color: 'error.main' }}>
          {tt('Lời mời có giá trị đến:', 'Invitation valid until:')}{" "}
          {dayjs(invitation.expiresAt).format('DD/MM/YYYY HH:mm')}
        </Typography>
      )}
    </Stack>
  ) : null;

  if (showInvitationCard) {
    return (
      <Stack spacing={2} sx={{ width: '100%' }}>
        {invitationBanner}
        <Card sx={{ borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
          <CardHeader
            title={
              <Stack spacing={0.5}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a3322' }}>
                  {tt('Vé đã được chọn sẵn cho bạn', 'Tickets Pre-selected for You')}
                </Typography>
              </Stack>
            }
            sx={{ backgroundColor: 'rgba(209, 249, 219, 0.3)', pb: 2 }}
          />
          <Divider />
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', bgcolor: 'background.paper', px: 2, py: 0.5 }}>
                {order.tickets.map((ticket, index) => {
                  const show = shows?.find((s) => s.id === ticket.showId);
                  const category = show?.ticketCategories.find((c) => c.id === ticket.ticketCategoryId);
                  const displayCatName = category?.name || ticket.ticketCategoryName || tt('Vé', 'Ticket');
                  const displayShowName = show?.name || ticket.showName;
                  return (
                    <Box
                      key={index}
                      sx={{
                        py: 1.5,
                        borderBottom: index < order.tickets.length - 1 ? '1px dashed' : 'none',
                        borderColor: 'divider',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {displayCatName}
                          </Typography>
                          {displayShowName && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {displayShowName} {show ? `• ${formatDateTime(show.startDateTime)}` : ''}
                            </Typography>
                          )}
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', pl: 2, whiteSpace: 'nowrap' }}>
                          {formatPrice(ticket.price || 0)}
                        </Typography>
                      </Stack>
                      {ticket.audienceName && (
                        <Typography variant="caption" sx={{ px: 1, py: 0.25, bgcolor: 'grey.100', color: 'text.secondary', borderRadius: '4px', fontWeight: 500, alignSelf: 'flex-start' }}>
                          {tt('Đối tượng:', 'Audience:')} {ticket.audienceName}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Stack>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {invitation.allowTicketEdit && (
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => {
                    setOrder((prev) => ({ ...prev, tickets: [], concessions: [], isTicketsEdited: true }));
                    setIsEditingTickets(true);
                    onClearAndReselect?.();
                  }}
                  sx={{ borderRadius: '8px', fontWeight: 600 }}
                >
                  {tt('Thay đổi vé', 'Change Tickets')}
                </Button>
              )}
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                color="primary"
                onClick={onNext}
                sx={{ px: 4, py: 1, borderRadius: '8px', fontWeight: 600 }}
              >
                {tt('Tiếp tục', 'Continue')}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 720, mx: 'auto' }}>
      {invitationBanner}

      <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
        <CardHeader title={tt('Chọn đối tượng khán giả', 'Select audience')} />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            {activeAudiences.length > 0 ? (
              activeAudiences.map((ca) => (
                <Box key={ca.audienceId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack spacing={0}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{ca.audience.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatPrice(ca.price)}</Typography>
                  </Stack>
                  <OutlinedInput
                    sx={{ maxWidth: 90 }}
                    size="small"
                    type="number"
                    value={audienceQuantities[ca.audienceId] || 0}
                    onChange={(e) => handleQuantityChange(ca.audienceId, e.target.value)}
                    inputProps={{ min: 0 }}
                  />
                </Box>
              ))
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack spacing={0}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{referenceCategory?.name || tt('Vé', 'Ticket')}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatPrice(referenceCategory?.price || 0)}</Typography>
                </Stack>
                <OutlinedInput
                  sx={{ maxWidth: 90 }}
                  size="small"
                  type="number"
                  value={audienceQuantities[NO_AUDIENCE_KEY] || 0}
                  onChange={(e) => handleQuantityChange(NO_AUDIENCE_KEY, e.target.value)}
                  inputProps={{ min: 0 }}
                />
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
        <CardHeader title={tt('Chọn ngày có thể tham dự', 'Select the day(s) you can attend')} />
        <Divider />
        {(shows || []).length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">{tt('Không có suất diễn nào', 'No schedules')}</Typography>
          </Box>
        ) : (
          <List>
            {(shows || []).map((show, index) => {
              const isDisabled = show.status !== 'on_sale' || show.disabled;
              const isChecked = selectedShowIds.has(show.id);
              return (
                <ListItem
                  key={show.id}
                  divider={index < (shows || []).length - 1}
                  onClick={() => toggleShow(show)}
                  sx={{
                    cursor: isDisabled ? 'default' : 'pointer',
                    opacity: isDisabled ? 0.6 : 1,
                    backgroundColor: isChecked ? 'action.selected' : 'transparent',
                  }}
                >
                  <Checkbox
                    edge="start"
                    checked={isChecked}
                    disabled={isDisabled}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleShow(show)}
                  />
                  <ListItemAvatar>
                    <Box component="img" src={show.avatar ?? '/assets/product-5.png'} sx={{ borderRadius: 1, height: '48px', width: '48px' }} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={show.name}
                    primaryTypographyProps={{ variant: 'subtitle2' }}
                    secondary={
                      (show.startDateTime && show.endDateTime
                        ? `${dayjs(show.startDateTime).format('HH:mm')} - ${dayjs(show.endDateTime).format('HH:mm | DD/MM/YYYY')}`
                        : '') +
                      (show.disabled
                        ? ` | ${tt('Đang khóa bởi hệ thống', 'Locked by system')}`
                        : show.status !== 'on_sale'
                          ? show.status === 'not_opened_for_sale'
                            ? ` | ${tt('Chưa mở bán', 'Not opened for sale')}`
                            : show.status === 'temporarily_locked'
                              ? ` | ${tt('Đang tạm khóa', 'Temporarily locked')}`
                              : ''
                          : '')
                    }
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Card>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" onClick={handleContinue}>
          {tt('Tiếp tục', 'Continue')}
        </Button>
      </Stack>
    </Stack>
  );
}
