"use client";

import { Box, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import { ShoppingCart as ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr/ShoppingCart';
import * as React from 'react';


import NotificationContext from '@/contexts/notification-context';
import dynamic from "next/dynamic";
import { CartModal } from './cart-modal';
import { Schedules } from './schedules';
import { TicketCategories } from './ticket-categories';
import { Order, Show, TicketInfo } from './types';

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
    tt,
    onNext,
    existingSeats,
  } = props;

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
          price: catConfig?.price || 0,
          holder: undefined
        });
      });

      return {
        ...prev,
        tickets: [...filtered, ...ticketsToAdd]
      };
    });
  };

  const handleAddToCart = (categoryId: number, quantity: number) => {
    if (!activeSchedule) return;
    const catConfig = activeSchedule.ticketCategories.find(tc => tc.id === categoryId);
    if (!catConfig) return;

    setOrder(prev => {
      const currentTickets = prev.tickets;
      // Filter tickets for this specific category in this show
      const categoryTickets = currentTickets.filter(
        t => t.showId === activeSchedule.id && t.ticketCategoryId === categoryId
      );
      const otherTickets = currentTickets.filter(
        t => !(t.showId === activeSchedule.id && t.ticketCategoryId === categoryId)
      );

      const currentQty = categoryTickets.length;
      let newCategoryTickets = [...categoryTickets];

      if (quantity > currentQty) {
        // Add more
        const toAdd = quantity - currentQty;
        const newTickets: TicketInfo[] = Array.from({ length: toAdd }).map(() => ({
          showId: activeSchedule.id,
          ticketCategoryId: categoryId,
          price: catConfig.price,
          holder: undefined
        }));
        newCategoryTickets = [...newCategoryTickets, ...newTickets];
      } else if (quantity < currentQty) {
        // Remove some (from end to preserve oldest/filled ones if applicable, or just pop)
        // Taking first 'quantity' items preserves the ones at the start.
        newCategoryTickets = newCategoryTickets.slice(0, quantity);
      }

      return {
        ...prev,
        tickets: [...otherTickets, ...newCategoryTickets]
      };
    });
  };

  return (
    <Stack spacing={3}>
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
              <TicketCategories
                key={activeSchedule.id}
                show={activeSchedule}
                qrOption={qrOption}
                requestedCategoryModalId={requestedCategoryModalId || undefined}
                onModalRequestHandled={onModalRequestHandled}
                onCategorySelect={(categoryId: number) => { }} // Unused or implement if needed
                onAddToCart={(
                  categoryId: number,
                  quantity: number,
                  holders?: { title: string; name: string; email: string; phone: string }[]
                ) => handleAddToCart(categoryId, quantity)}
                cartQuantities={cartQuantitiesForActiveSchedule}
              />
            ) : null}
          </Box>
        </Grid>
      </Grid>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" onClick={onNext}>
          {tt('Tiếp tục', 'Continue')}
        </Button>
      </Stack>

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
      />
    </Stack>
  );
}


