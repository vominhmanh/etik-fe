"use client";

import { Box, Stack, Typography, Card, CardHeader, CardContent, Divider, Alert } from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import { ShoppingCart as ShoppingCartIcon, Minus, Plus, Trash } from '@phosphor-icons/react/dist/ssr';
import * as React from 'react';
import dayjs from 'dayjs';


import NotificationContext from '@/contexts/notification-context';
import dynamic from "next/dynamic";
import { CartModal } from './cart-modal';
import { Schedules } from './schedules';
import { TicketCategories } from './ticket-categories';
import { AudienceSelectionDialog } from '@/components/dialogs/AudienceSelectionDialog';
import { Order, Show, TicketInfo, TicketCategory } from './types';

import type { SeatData } from '@/components/seat-map/SeatPickerEditor';

const CustomerSeatPicker = dynamic(
  () => import('@/components/seat-map/SeatPickerEditor').then((mod) => mod.CustomerSeatPicker),
  { ssr: false }
);

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
  // onCategorySelect: (showId: number, categoryId: number) => void; // Unused?
  // onAddToCart: (showId: number, categoryId: number, quantity: number, holders?: { title: string; name: string; email: string; phone: string }[]) => void; // Replaced by internal logic
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
  invitation?: any;
  /** Called when guest clicks "Change Tickets" – clears all auto-filled tickets so they pick manually */
  onClearAndReselect?: () => void;
};

const formatDateTime = (date: string | Date | null) => {
  if (!date) return '';
  return dayjs(date).format('HH:mm DD/MM/YYYY');
};

export function Step1SelectTickets(props: Step1SelectTicketsProps): React.JSX.Element {
  const {
    shows,
    selectedSchedules,
    activeScheduleId,
    onSelectionChange,
    onOpenSchedule,
    totalSelectedTickets,
    onOpenCart,
    activeSchedule,
    qrOption,
    requestedCategoryModalId,
    onModalRequestHandled,
    order,
    setOrder,
    cartQuantitiesForActiveSchedule,
    cartAudienceQuantitiesForActiveSchedule,
    tt,
    onNext,
    existingSeats,
    invitation,
    onClearAndReselect,
  } = props;

  // isEditingTickets: only true if invitation has pre-selected tickets but user wants to re-pick.
  // When true, we show the normal ticket selection UI.
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

  // Determine if we should show the invitation summary card:
  // invitation exists AND has pre-selected tickets AND guest hasn't chosen to re-pick
  const hasPreSelectedTickets = !!(invitation && !invitation.letCustomerSelect && (invitation.preSelectedTickets?.tickets?.length > 0));
  const showInvitationCard = hasPreSelectedTickets && !isEditingTickets;
  const notificationCtx = React.useContext(NotificationContext);

  const seatmapVisible =
    !!activeSchedule &&
    (activeSchedule.seatmapMode === 'seatings_selection' ||
      activeSchedule.seatmapMode === 'ticket_categories_selection');

  // Lazy-mount SeatPicker: only mount after the first time a seatmap show is opened.
  const [seatmapEverMounted, setSeatmapEverMounted] = React.useState(false);

  // Keep SeatPicker mounted to avoid fabric dispose/init race when switching shows.
  // If current show has no seatmap, we keep the last seatmap layout in memory and simply hide the canvas.
  const [stickySeatmapLayout, setStickySeatmapLayout] = React.useState<any>({});

  React.useEffect(() => {
    if (!seatmapVisible || !activeSchedule) return;
    if (!seatmapEverMounted) setSeatmapEverMounted(true);
    setStickySeatmapLayout(activeSchedule.layoutJson || {});
  }, [seatmapVisible, activeSchedule?.id, activeSchedule?.layoutJson, seatmapEverMounted]);

  // Audience Selection Modal State
  const [audienceSelection, setAudienceSelection] = React.useState<{
    isOpen: boolean;
    pendingSeat: SeatData | null;
    ticketCategory: TicketCategory | null;
  }>({
    isOpen: false,
    pendingSeat: null,
    ticketCategory: null
  });

  const handleAudienceConfirm = (audienceId: number) => {
    const { pendingSeat, ticketCategory } = audienceSelection;
    if (!pendingSeat || !ticketCategory || !activeSchedule) return;

    // Find audience details
    const selectedAudience = ticketCategory.categoryAudiences?.find(ca => ca.audienceId === audienceId);
    if (!selectedAudience) return;

    // Add to order
    setOrder(prev => {
      const ticket: TicketInfo = {
        showId: activeSchedule.id,
        ticketCategoryId: ticketCategory.id,
        seatId: pendingSeat.id,
        seatRow: pendingSeat.rowLabel || undefined,
        seatNumber: pendingSeat.number ? String(pendingSeat.number) : undefined,
        seatLabel: (pendingSeat.rowLabel && pendingSeat.number) ? `${pendingSeat.rowLabel}-${pendingSeat.number}` : undefined,
        price: selectedAudience.price,
        audienceId: audienceId,
        audienceName: selectedAudience.audience.name,
        holder: undefined
      };
      return {
        ...prev,
        tickets: [...prev.tickets, ticket]
      };
    });

    // Close modal
    setAudienceSelection(prev => ({ ...prev, isOpen: false, pendingSeat: null, ticketCategory: null }));
  };

  const handleAudienceCancel = () => {
    setAudienceSelection(prev => ({ ...prev, isOpen: false, pendingSeat: null, ticketCategory: null }));
  };

  // Track selected seat IDs derived from order
  const selectedSeats = React.useMemo(() => {
    const s = new Set<string>();
    if (!activeSchedule) return s;
    order.tickets.forEach(t => {
      if (t.showId === activeSchedule.id && t.seatId) {
        s.add(t.seatId);
      }
    });
    return s;
  }, [order.tickets, activeSchedule]);


  const handleSelectionChange = (newIds: string[], newSelectedSeats: SeatData[]) => {
    // Check limits
    // 1. Event Level Limit Check
    if (props.eventLimitPerTransaction) {
      // Calculate total tickets already selected for OTHER shows + new selection for THIS show
      // Note: order.tickets contains ALL tickets for the order event.
      // We need to count tickets that are NOT for the current activeSchedule, then add new selection count.

      const otherShowsTicketsCount = order.tickets.filter(t => t.showId !== activeSchedule?.id).length;
      const totalNewCount = otherShowsTicketsCount + newSelectedSeats.length;

      if (totalNewCount > props.eventLimitPerTransaction) {
        notificationCtx.error(
          `Bạn chỉ được chọn tối đa ${props.eventLimitPerTransaction} vé cho toàn bộ sự kiện.`
        );
        return;
      }
    }

    if (props.eventLimitPerCustomer) {
      const otherShowsTicketsCount = order.tickets.filter(t => t.showId !== activeSchedule?.id).length;
      const totalNewCount = otherShowsTicketsCount + newSelectedSeats.length;
      if (totalNewCount > props.eventLimitPerCustomer) {
        notificationCtx.error(
          `Bạn chỉ được chọn tối đa ${props.eventLimitPerCustomer} vé cho toàn bộ sự kiện.`
        );
        return;
      }
    }

    if (activeSchedule?.limitPerTransaction) {
      if (newSelectedSeats.length > activeSchedule.limitPerTransaction) {
        notificationCtx.error(
          `Bạn chỉ được chọn tối đa ${activeSchedule.limitPerTransaction} vé cho suất diễn này.`
        );
        return;
      }
    }

    if (activeSchedule?.ticketCategories) {
      const countsByCat: Record<string, number> = {};
      newSelectedSeats.forEach((s) => {
        const catId = String(s.category).trim();
        countsByCat[catId] = (countsByCat[catId] || 0) + 1;
      });

      for (const catIdStr in countsByCat) {
        const count = countsByCat[catIdStr];
        const catConfig = activeSchedule.ticketCategories.find(
          (tc) => String(tc.id) === catIdStr
        );
        const limit = catConfig?.limitPerTransaction;

        if (limit && count > limit) {
          notificationCtx.error(
            `Bạn chỉ được chọn tối đa ${limit} vé cho loại vé ${catConfig?.name || ''}.`
          );
          return; // Reject the update
        }
      }
    }

    // Identify newly added seats for Audience Check
    // We only care if we are adding seats. 
    // currentSeatIds logic needs to account for this specific show
    const currentSeatIds = new Set(order.tickets.filter(t => t.showId === activeSchedule?.id && t.seatId).map(t => t.seatId));
    // newIds contains ALL currently selected. newly added = newIds - currentSeatIds
    const newlyAddedIds = newIds.filter(id => !currentSeatIds.has(id));

    if (newlyAddedIds.length > 0) {
      const addedSeats = newSelectedSeats.filter(s => newlyAddedIds.includes(s.id));
      for (const seat of addedSeats) {
        const catId = Number(seat.category);
        const catConfig = activeSchedule?.ticketCategories.find(tc => tc.id === catId);

        if (!catConfig) continue;

        const activeAudiences = catConfig.categoryAudiences?.filter(ca => ca.audience.isActive) || [];

        if (activeAudiences.length === 0) {
          notificationCtx.error('Loại vé này chưa có đối tượng khán giả nào được kích hoạt.');
          return; // Block selection
        } else if (activeAudiences.length > 1) {
          // Open modal for the first one found and BLOCK the update (so others usually ignored)
          setAudienceSelection({
            isOpen: true,
            pendingSeat: seat,
            ticketCategory: catConfig
          });
          return; // Stop processing, discard selection until confirmed
        }
        // If length === 1, we proceed to add it automatically below (in logic 2)
      }
    }

    // newSelectedSeats now already has rowLabel from CustomerSeatPicker wrapper
    // Update order.tickets based on selection
    setOrder(prev => {
      const currentTickets = [...prev.tickets];
      // 1. Remove tickets for this show that are NOT in newIds (and have seatId)
      // We only touch tickets for the *current active schedule*.
      const newIdSet = new Set(newIds);
      const filtered = currentTickets.filter(t => {
        if (t.showId !== activeSchedule?.id) return true; // Keep other shows' tickets
        if (!t.seatId) return true; // Keep non-seated tickets? (Usually mixed mode not allowed per show)
        return newIdSet.has(t.seatId);
      });

      // 2. Add new tickets using rowLabel and number from newSelectedSeats
      const existingSeatIds = new Set(filtered.filter(t => t.showId === activeSchedule?.id && t.seatId).map(t => t.seatId));

      const ticketsToAdd: TicketInfo[] = [];
      newSelectedSeats.forEach(seat => {
        if (!seat.id) return;
        if (existingSeatIds.has(seat.id)) return;

        // It's a new seat. Create ticket using number and rowLabel from seat.
        const catId = Number(seat.category);
        const catConfig = activeSchedule?.ticketCategories.find(tc => tc.id === catId);

        // Resolve audience (Single audience case)
        const activeAudiences = catConfig?.categoryAudiences?.filter(ca => ca.audience.isActive) || [];
        const singleAudience = activeAudiences.length === 1 ? activeAudiences[0] : null;

        // Use rowLabel and number to create seatLabel
        const seatNumber = seat.number ? String(seat.number) : undefined;
        const seatRow = seat.rowLabel || undefined;
        const seatLabel = (seatRow && seatNumber) ? `${seatRow}-${seatNumber}` : undefined;

        ticketsToAdd.push({
          showId: activeSchedule!.id,
          ticketCategoryId: catId,
          seatId: seat.id,
          seatRow: seatRow,
          seatNumber: seatNumber,
          seatLabel: seatLabel,
          price: singleAudience ? singleAudience.price : (catConfig?.price || 0),
          audienceId: singleAudience?.audienceId,
          audienceName: singleAudience?.audience.name,
          holder: undefined
        });
      });

      return {
        ...prev,
        tickets: [...filtered, ...ticketsToAdd]
      };
    });
  };



  const handleAddToCart = (categoryId: number, quantities: Record<number, number> | number) => {
    if (!activeSchedule) return;
    const catConfig = activeSchedule.ticketCategories.find(tc => tc.id === categoryId);
    if (!catConfig) return;

    let totalQuantity = 0;
    const isSingle = typeof quantities === 'number';
    if (isSingle) {
      totalQuantity = quantities;
    } else {
      totalQuantity = Object.values(quantities).reduce((a, b) => a + b, 0);
    }

    if (activeSchedule.limitPerTransaction) {
      const currentTickets = order.tickets;
      const otherTicketsCount = currentTickets.filter(
        t => t.showId === activeSchedule.id && t.ticketCategoryId !== categoryId
      ).length;

      if (otherTicketsCount + totalQuantity > activeSchedule.limitPerTransaction) {
        notificationCtx.error(
          `Bạn chỉ được chọn tối đa ${activeSchedule.limitPerTransaction} vé cho suất diễn này.`
        );
        return;
      }
    }

    if (props.eventLimitPerTransaction) {
      const ticketsFromOtherShows = order.tickets.filter(t => t.showId !== activeSchedule.id).length;
      const currentCategoryTickets = order.tickets.filter(t => t.showId === activeSchedule.id && t.ticketCategoryId === categoryId).length;
      const otherTicketsTotal = ticketsFromOtherShows + (order.tickets.length - ticketsFromOtherShows - currentCategoryTickets); // effectively total - currentCat

      const ticketsExceptCurrentCat = order.tickets.filter(t => !(t.showId === activeSchedule.id && t.ticketCategoryId === categoryId)).length;

      if (ticketsExceptCurrentCat + totalQuantity > props.eventLimitPerTransaction) {
        notificationCtx.error(
          `Bạn chỉ được chọn tối đa ${props.eventLimitPerTransaction} vé cho toàn bộ sự kiện.`
        );
        return;
      }
    }

    if (props.eventLimitPerCustomer) {
      const ticketsExceptCurrentCat = order.tickets.filter(t => !(t.showId === activeSchedule.id && t.ticketCategoryId === categoryId)).length;
      if (ticketsExceptCurrentCat + totalQuantity > props.eventLimitPerCustomer) {
        notificationCtx.error(
          `Bạn chỉ được chọn tối đa ${props.eventLimitPerCustomer} vé cho toàn bộ sự kiện.`
        );
        return;
      }
    }

    setOrder(prev => {
      const currentTickets = prev.tickets;
      const categoryTickets = currentTickets.filter(
        t => t.showId === activeSchedule.id && t.ticketCategoryId === categoryId
      );
      const otherTickets = currentTickets.filter(
        t => !(t.showId === activeSchedule.id && t.ticketCategoryId === categoryId)
      );

      let newCategoryTickets: TicketInfo[] = [];

      if (isSingle) {
        const currentQty = categoryTickets.length;
        newCategoryTickets = [...categoryTickets];

        if (totalQuantity > currentQty) {
          const toAdd = totalQuantity - currentQty;

          // Use default audience if available, else first active one
          const activeAudiences = catConfig.categoryAudiences?.filter(ca => ca.audience.isActive) || [];
          const defaultAudience = activeAudiences.find(ca => ca.isDefault) || activeAudiences[0];

          const newTickets: TicketInfo[] = Array.from({ length: toAdd }).map(() => ({
            showId: activeSchedule.id,
            ticketCategoryId: categoryId,
            price: defaultAudience ? defaultAudience.price : catConfig.price,
            audienceId: defaultAudience?.audienceId,
            audienceName: defaultAudience?.audience.name,
            holder: undefined
          }));
          newCategoryTickets = [...newCategoryTickets, ...newTickets];
        } else if (totalQuantity < currentQty) {
          newCategoryTickets = newCategoryTickets.slice(0, totalQuantity);
        }
      } else {
        const byAudience: Record<number, TicketInfo[]> = {};
        categoryTickets.forEach(t => {
          const audId = t.audienceId ?? 0;
          if (!byAudience[audId]) byAudience[audId] = [];
          byAudience[audId].push(t);
        });

        Object.entries(quantities).forEach(([audIdStr, qty]) => {
          const audId = Number(audIdStr);
          const existing = byAudience[audId] || [];
          const currentQty = existing.length;

          if (qty > currentQty) {
            const toAdd = qty - currentQty;
            const audConfig = catConfig.categoryAudiences?.find(ca => ca.audienceId === audId);
            const newTickets: TicketInfo[] = Array.from({ length: toAdd }).map(() => ({
              showId: activeSchedule.id,
              ticketCategoryId: categoryId,
              price: audConfig ? audConfig.price : catConfig.price,
              audienceId: audId,
              audienceName: audConfig?.audience.name,
              holder: undefined
            }));
            newCategoryTickets.push(...existing, ...newTickets);
          } else if (qty < currentQty) {
            newCategoryTickets.push(...existing.slice(0, qty));
          } else {
            newCategoryTickets.push(...existing);
          }
        });
      }

      return {
        ...prev,
        tickets: [...otherTickets, ...newCategoryTickets]
      };
    });
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
      {invitation.message && (
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
                const show = shows?.find(s => s.id === ticket.showId);
                const category = show?.ticketCategories.find(c => c.id === ticket.ticketCategoryId);
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
                          {category?.name || tt('Vé', 'Ticket')}
                        </Typography>
                        {show && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {show.name} • {formatDateTime(show.startDateTime)}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', pl: 2, whiteSpace: 'nowrap' }}>
                        {props.formatPrice(ticket.price || 0)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
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
                  </Box>
                );
              })}
            </Box>

              {/* Concessions */}
              {order.concessions && order.concessions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#333' }}>
                    {tt('Dịch vụ đi kèm:', 'Add-ons:')}
                  </Typography>
                  <Stack spacing={1}>
                    {order.concessions.map((con, index) => {
                      let concessionName = tt('Dịch vụ', 'Service');
                      for (const s of shows || []) {
                        const sc = s.showConcessions?.find(x => x.concessionId === con.concessionId);
                        if (sc) { concessionName = sc.concession.name; break; }
                      }
                      return (
                        <Stack key={index} direction="row" justifyContent="space-between">
                          <Typography variant="body2">{concessionName} x{con.quantity}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{props.formatPrice(con.price * con.quantity)}</Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Stack>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {invitation.allowTicketEdit && (
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => {
                    // Clear all tickets so guest picks manually
                    setOrder(prev => ({ ...prev, tickets: [], concessions: [], isTicketsEdited: true }));
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
    <Stack spacing={3}>
      {invitationBanner}
      <Grid container spacing={3}>
        <Grid lg={3} md={4} xs={12}>
          <Stack spacing={3}>
            <Schedules
              shows={shows}
              selectedShows={selectedSchedules}
              activeShowId={activeScheduleId}
              onSelectionChange={onSelectionChange}
              onOpen={onOpenSchedule}
            />

            {/* Giỏ hàng */}
            <Box
              role="button"
              tabIndex={0}
              onClick={() => {
                if (totalSelectedTickets > 0) onOpenCart();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (totalSelectedTickets > 0) onOpenCart();
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                px: 2,
                py: 1.25,
                cursor: totalSelectedTickets > 0 ? 'pointer' : 'default',
                opacity: totalSelectedTickets > 0 ? 1 : 0.55,
                userSelect: 'none',
                transition: 'background-color 120ms ease',
                '&:hover': totalSelectedTickets > 0 ? { backgroundColor: 'action.hover' } : undefined,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <ShoppingCartIcon size={18} />
                <Typography variant="subtitle2">{tt('Giỏ hàng', 'Cart')}</Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {totalSelectedTickets} {tt('vé', 'tickets')}
              </Typography>
            </Box>
          </Stack>
        </Grid>

        <Grid lg={9} md={8} xs={12}>
          {/* SeatPicker is always mounted; just toggle visibility */}
          {seatmapEverMounted ? (
            <Box sx={{ display: seatmapVisible ? 'block' : 'none' }}>
              <CustomerSeatPicker
                layout={(seatmapVisible ? activeSchedule?.layoutJson : stickySeatmapLayout) || {}}
                categories={activeSchedule?.ticketCategories || []}
                selectedSeatIds={Array.from(selectedSeats)}
                existingSeats={existingSeats || []}
                onSelectionChange={handleSelectionChange}
              />
            </Box>
          ) : null}

          <Box sx={{ display: !seatmapVisible && activeSchedule ? 'block' : 'none' }}>
            {activeSchedule ? (
              <>
                <TicketCategories
                  key={activeSchedule.id}
                  show={activeSchedule}
                  source={props.source}
                  qrOption={qrOption}
                  requestedCategoryModalId={requestedCategoryModalId || undefined}
                  onModalRequestHandled={onModalRequestHandled}
                  onCategorySelect={(categoryId: number) => { }} // Unused or implement if needed
                  onAddToCart={(
                    categoryId: number,
                    quantities: Record<number, number> | number,
                    holders?: { title: string; name: string; email: string; phone: string }[]
                  ) => handleAddToCart(categoryId, quantities)}
                  cartQuantities={cartQuantitiesForActiveSchedule}
                  cartAudienceQuantities={cartAudienceQuantitiesForActiveSchedule}
                  eventLimitPerTransaction={props.eventLimitPerTransaction}
                  eventLimitPerCustomer={props.eventLimitPerCustomer}
                  totalTicketsInOrder={totalSelectedTickets}
                />

              </>
            ) : null}
          </Box>

          {/* Concessions Section - Display regardless of seatmap mode */}
          {activeSchedule && activeSchedule.concessionsEnabled && activeSchedule.showConcessions && activeSchedule.showConcessions.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                {tt('Sản phẩm đi kèm', 'Add-ons & Concessions')}
              </Typography>
              <Stack spacing={2}>
                {activeSchedule.showConcessions.map((sc) => {
                  if (!sc.isAvailable) return null;

                  const currentQty = order.concessions?.find(
                    c => c.showId === activeSchedule.id && c.concessionId === sc.concessionId
                  )?.quantity || 0;

                  const price = sc.priceOverride ?? sc.concession.basePrice;

                  const handleUpdateQty = (newQty: number) => {
                    if (newQty < 0) return;
                    setOrder(prev => {
                      const existingConcessions = prev.concessions || [];
                      const otherConcessions = existingConcessions.filter(
                        c => !(c.showId === activeSchedule.id && c.concessionId === sc.concessionId)
                      );

                      if (newQty > 0) {
                        return {
                          ...prev,
                          concessions: [
                            ...otherConcessions,
                            {
                              showId: activeSchedule.id,
                              concessionId: sc.concessionId,
                              quantity: newQty,
                              price: Number(price)
                            }
                          ]
                        };
                      } else {
                        return {
                          ...prev,
                          concessions: otherConcessions
                        };
                      }
                    });
                  };

                  return (
                    <Box
                      key={sc.id}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                        {sc.concession.imageUrl && (
                          <Box
                            component="img"
                            src={sc.concession.imageUrl}
                            alt={sc.concession.name}
                            sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }}
                          />
                        )}
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{sc.concession.name}</Typography>
                          <Typography variant="body2" color="text.secondary">{props.formatPrice(price)}</Typography>
                          {sc.concession.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{sc.concession.description}</Typography>
                          )}
                        </Box>
                      </Stack>

                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ minWidth: 32, width: 32, height: 32, p: 0 }}
                          onClick={() => handleUpdateQty(currentQty - 1)}
                          disabled={currentQty <= 0}
                        >
                          <Minus weight="bold" />
                        </Button>
                        <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{currentQty}</Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ minWidth: 32, width: 32, height: 32, p: 0 }}
                          onClick={() => handleUpdateQty(currentQty + 1)}
                        >
                          <Plus weight="bold" />
                        </Button>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Grid>
      </Grid>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" onClick={onNext}>
          {tt('Tiếp tục', 'Continue')}
        </Button>
      </Stack>

      {/* Audience Selection Dialog */}
      {audienceSelection.isOpen && audienceSelection.ticketCategory && (
        <AudienceSelectionDialog
          open={audienceSelection.isOpen}
          onClose={handleAudienceCancel}
          audiences={audienceSelection.ticketCategory.categoryAudiences?.filter(ca => ca.audience.isActive) || []}
          onSelect={handleAudienceConfirm}
        />
      )}


      <CartModal
        open={props.isCartOpen}
        onClose={props.onCloseCart}
        order={order}
        event={{ shows }} // CartModal expects event.shows
        tt={tt}
        formatPrice={props.formatPrice}
        subtotal={props.subtotal}
        onEditItem={props.onEditCartItem}
        onRemoveItem={props.onRemoveCartItem}
        onUpdateConcessionQuantity={props.onUpdateConcessionQuantity}
      />
    </Stack >
  );
}


