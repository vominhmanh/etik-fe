"use client";

import * as React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import { ShoppingCart as ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr/ShoppingCart';

import { Schedules } from './schedules';
import { TicketCategories } from './ticket-categories';
import type { Show } from './page';
import dynamic from "next/dynamic";

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
  requireTicketHolderInfo: boolean;

  requestedCategoryModalId: number | null;
  onModalRequestHandled: () => void;
  onCategorySelect: (showId: number, categoryId: number) => void;
  onAddToCart: (showId: number, categoryId: number, quantity: number, holders?: { title: string; name: string; email: string; phone: string }[]) => void;
  cartQuantitiesForActiveSchedule: Record<number, number>;

  tt: (vi: string, en: string) => string;
  onNext: () => void;
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
    requireTicketHolderInfo,
    requestedCategoryModalId,
    onModalRequestHandled,
    onCategorySelect,
    onAddToCart,
    cartQuantitiesForActiveSchedule,
    tt,
    onNext,
  } = props;

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

  // Track selected seat IDs
  const [selectedSeats, setSelectedSeats] = React.useState<Set<string>>(new Set());

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
                ticketCategories={activeSchedule?.ticketCategories || []}
                selectedSeatIds={Array.from(selectedSeats)}
                onSelectionChange={(newIds: string[], newSelectedSeats: any[]) => {
                  console.log('Selection Changed:', newIds, newSelectedSeats);
                  setSelectedSeats(new Set(newIds));
                }}
              />
            </Box>
          ) : null}

          <Box sx={{ display: !seatmapVisible && activeSchedule ? 'block' : 'none' }}>
            {activeSchedule ? (
              <TicketCategories
                key={activeSchedule.id}
                show={activeSchedule}
                qrOption={qrOption}
                requireTicketHolderInfo={requireTicketHolderInfo}
                requestedCategoryModalId={requestedCategoryModalId || undefined}
                onModalRequestHandled={onModalRequestHandled}
                onCategorySelect={(categoryId: number) => onCategorySelect(activeSchedule.id, categoryId)}
                onAddToCart={(
                  categoryId: number,
                  quantity: number,
                  holders?: { title: string; name: string; email: string; phone: string }[]
                ) => onAddToCart(activeSchedule.id, categoryId, quantity, holders)}
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
    </Stack>
  );
}


