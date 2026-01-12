'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Box,
  Button,
  CircularProgress,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { LuPlus, LuMinus, LuCheck, LuX } from "react-icons/lu";
import { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { LocalizedLink } from '@/components/homepage/localized-link';

import { useTranslation } from '@/contexts/locale-context';
import NotificationContext from '@/contexts/notification-context';

import {
  EventResponse,
  Show
} from '@/components/transactions/create-steps/types';

import Grid from '@mui/material/Unstable_Grid2';
import dynamic from "next/dynamic";
import { Schedules } from '@/components/transactions/create-steps/schedules';

import type { SeatData } from '@/components/seat-map/SeatPickerEditor';

const ViewOnlySeatPicker = dynamic(
  () => import('@/components/seat-map/SeatPickerEditor').then((mod) => mod.ViewOnlySeatPicker),
  { ssr: false }
);

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt, locale } = useTranslation();
  React.useEffect(() => {
    document.title = tt("Sơ đồ vé | ETIK", "Seat Maps | ETIK");
  }, [tt]);

  const [event, setEvent] = React.useState<EventResponse | null>(null);

  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);
  const [activeScheduleId, setActiveScheduleId] = React.useState<number | null>(null);
  const [showSeats, setShowSeats] = React.useState<any[]>([]);

  // Lazy-mount SeatPicker: only mount after the first time a seatmap show is opened.
  const [seatmapEverMounted, setSeatmapEverMounted] = React.useState(false);

  // Keep SeatPicker mounted to avoid fabric dispose/init race when switching shows.
  // If current show has no seatmap, we keep the last seatmap layout in memory and simply hide the canvas.
  const [stickySeatmapLayout, setStickySeatmapLayout] = React.useState<any>({});

  // Fetch event details on component mount
  React.useEffect(() => {
    if (params.event_id) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
            `/event-studio/events/${params.event_id}/transactions/get-info-to-create-transaction`
          );
          setEvent(response.data);
        } catch (error) {
          notificationCtx.error(error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    }
  }, [params.event_id]);

  // Fetch seats for active show if applicable
  React.useEffect(() => {
    if (!activeScheduleId || !event) return;
    const show = event.shows.find((s) => s.id === activeScheduleId);

    // Check if show uses seatmap
    const seatmapModes = ['seatings_selection', 'ticket_categories_selection'];
    if (!show || !show.seatmapMode || !seatmapModes.includes(show.seatmapMode)) {
      setShowSeats([]);
      return;
    }

    const fetchSeats = async () => {
      try {
        const response = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/transactions/shows/${show.id}/seats`
        );
        setShowSeats(response.data);
      } catch (err) {
        console.error("Failed to load seats", err);
      }
    };

    fetchSeats();
  }, [activeScheduleId, event, params.event_id]);

  const activeSchedule = React.useMemo(() => {
    if (!activeScheduleId) return null;
    return selectedSchedules.find((s) => s.id === activeScheduleId) || null;
  }, [selectedSchedules, activeScheduleId]);

  const seatmapVisible =
    !!activeSchedule &&
    (activeSchedule.seatmapMode === 'seatings_selection' ||
      activeSchedule.seatmapMode === 'ticket_categories_selection');

  React.useEffect(() => {
    if (!seatmapVisible || !activeSchedule) return;
    if (!seatmapEverMounted) setSeatmapEverMounted(true);
    setStickySeatmapLayout(activeSchedule.layoutJson || {});
  }, [seatmapVisible, activeSchedule?.id, activeSchedule?.layoutJson, seatmapEverMounted]);

  // Track selected seat IDs derived from simple simplified selection (for now empty or managing local state if needed)
  // For this debugger page, we stick to logging, so we don't strictly need to track state unless we want to highlight them.
  // The user asked to "console log seat id", so we can just satisfy logging.
  // However, CustomerSeatPicker requires `selectedSeatIds`. We can keep it empty or track it locally to show selection.
  // Let's track it locally so the UX is not broken (user sees what they clicked).
  const [selectedSeatIds, setSelectedSeatIds] = React.useState<string[]>([]);

  const handleSelectionChange = (selected: Show[]) => {
    setSelectedSchedules(selected);
    if (activeScheduleId !== null && !selected.some((s) => s.id === activeScheduleId)) {
      setActiveScheduleId(null);
    }
  };

  // Seat Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [selectedSeatDetail, setSelectedSeatDetail] = React.useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);

  const handleSeatSelectionChange = (newIds: string[], newSelectedSeats: SeatData[]) => {
    if (newIds.length > 0) {
      const lastId = newIds[newIds.length - 1];

      // Enforce single selection: always take the last selected seat
      setSelectedSeatIds([lastId]);
      fetchSeatDetail(lastId);
    } else {
      setSelectedSeatIds([]);
      // Optional: close modal if deselect? 
      // closeDetailModal(); 
    }
  };

  const fetchSeatDetail = async (seatId: string) => {
    if (!activeScheduleId) return;
    setIsLoadingDetail(true);
    setIsDetailModalOpen(true); // Open immediately with loading state
    setSelectedSeatDetail(null);

    try {
      const response = await baseHttpServiceInstance.get(
        `/event-studio/events/${params.event_id}/seat-maps/shows/${activeScheduleId}/seats/${seatId}/detail`
      );
      setSelectedSeatDetail(response.data);
    } catch (err) {
      console.error("Failed to fetch seat detail", err);
      // Optional: show error toast
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSeatDetail(null);
  }

  return (
    <>
      <Backdrop
        open={isLoading}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          marginLeft: '0px !important',
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Seat Detail Modal */}
      <Dialog
        open={isDetailModalOpen}
        onClose={closeDetailModal}
        maxWidth="xs"
        fullWidth
        sx={{ zIndex: (theme) => theme.zIndex.modal + 10 }} // Ensure it's on top
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Thông tin ghế
          </Typography>
          <IconButton
            aria-label="close"
            onClick={closeDetailModal}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <LuX />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {isLoadingDetail ? (
            <Stack alignItems="center" justifyContent="center" py={4} spacing={2}>
              <CircularProgress size={30} />
              <Typography variant="body2" color="text.secondary">Đang tải thông tin...</Typography>
            </Stack>
          ) : selectedSeatDetail ? (
            <Stack spacing={3}>
              {/* Seat Basic Info */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: selectedSeatDetail.seatInfo.categoryColor,
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" fontWeight="medium" textTransform="uppercase">
                    {selectedSeatDetail.seatInfo.categoryName}
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight="800" gutterBottom>
                  {selectedSeatDetail.seatInfo.rowLabel}-{selectedSeatDetail.seatInfo.seatNumber}
                </Typography>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedSeatDetail.seatInfo.categoryPrice)}
                </Typography>

                <Box mt={2}>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${selectedSeatDetail.seatInfo.status === 'available' ? 'bg-green-50 text-green-700 border-green-200' :
                    selectedSeatDetail.seatInfo.status === 'sold' ? 'bg-red-50 text-red-700 border-red-200' :
                      selectedSeatDetail.seatInfo.status === 'held' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                    {selectedSeatDetail.seatInfo.status === 'available' ? 'Đang trống' :
                      selectedSeatDetail.seatInfo.status === 'sold' ? 'Đã bán' :
                        selectedSeatDetail.seatInfo.status === 'held' ? 'Đang giữ' :
                          selectedSeatDetail.seatInfo.status === 'blocked' ? 'Đang khóa' :
                            selectedSeatDetail.seatInfo.status}
                  </span>
                </Box>
              </Box>

              {/* Transaction / Holder Info */}
              {(selectedSeatDetail.seatInfo.status === 'sold' || selectedSeatDetail.seatInfo.status === 'held') && selectedSeatDetail.ticketInfo && (
                <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2, border: 1, borderColor: 'grey.200' }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" mb={1} textTransform="uppercase">
                    Thông tin đặt chỗ
                  </Typography>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="text-gray-500 col-span-1">Người giữ vé:</span>
                    <span className="font-medium text-gray-900 col-span-2 truncate">{selectedSeatDetail.ticketInfo.holderName || "N/A"}</span>

                    <span className="text-gray-500 col-span-1">Khách hàng:</span>
                    <span className="font-medium text-gray-900 col-span-2 truncate">{selectedSeatDetail.ticketInfo.customerName || "N/A"}</span>

                    <span className="text-gray-500 col-span-1">Email:</span>
                    <span className="font-medium text-gray-900 col-span-2 truncate" title={selectedSeatDetail.ticketInfo.customerEmail}>{selectedSeatDetail.ticketInfo.customerEmail || "N/A"}</span>

                    <span className="text-gray-500 col-span-1">SĐT:</span>
                    <span className="font-medium text-gray-900 col-span-2">{selectedSeatDetail.ticketInfo.customerPhone || "N/A"}</span>

                    <span className="text-gray-500 col-span-1">Mã thanh toán:</span>
                    <span className="font-mono font-medium text-blue-600 col-span-2">#{selectedSeatDetail.ticketInfo.transactionCode || ' Thanh toán tiền mặt'}</span>
                  </div>

                  <Box mt={2} pt={2} borderTop={1} borderColor="grey.200">
                    <Button
                      component="a"
                      href={`/event-studio/events/${params.event_id}/transactions/${selectedSeatDetail.ticketInfo.transactionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      fullWidth
                      size="small"
                      sx={{ textTransform: 'none' }}
                    >
                      Xem chi tiết giao dịch ↗
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Empty State for Sold/Held but no ticket found */}
              {(selectedSeatDetail.seatInfo.status === 'sold' || selectedSeatDetail.seatInfo.status === 'held') && !selectedSeatDetail.ticketInfo && (
                <Box sx={{ bgcolor: 'error.main', color: 'error.contrastText', p: 2, borderRadius: 1, opacity: 0.1 }}>
                  <Typography variant="body2">Không tìm thấy thông tin vé hoặc giao dịch cho ghế này.</Typography>
                </Box>
              )}

            </Stack>
          ) : (
            <Typography align="center" color="text.secondary" py={4}>
              Không có thông tin ghế
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetailModal} color="inherit">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      <Stack direction="column" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">{tt("Danh sách đơn hàng", "Order List")}</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              component={LocalizedLink}
              href={`/event-studio/events/${params.event_id}/transactions`}
            >
              {tt("Đơn hàng", "Orders")}
            </Button>
            <Button
              variant="outlined"
              size="small"
              component={LocalizedLink}
              href={`/event-studio/events/${params.event_id}/tickets`}
            >
              {tt("Khách hàng & vé", "Customers & Tickets")}
            </Button>
            <Button
              variant="contained"
              size="small"
              component={LocalizedLink}
              href={`/event-studio/events/${params.event_id}/seat-maps`}
            >
              {tt("Sơ đồ vé", "Seat Maps")}
            </Button>
          </Stack>
        </Stack>
        <Stack spacing={4}>
          <Box>
            <Stack spacing={3}>
              <Grid container spacing={3}>
                <Grid lg={3} md={4} xs={12}>
                  <Stack spacing={3}>
                    <Schedules
                      shows={event?.shows}
                      selectedShows={selectedSchedules}
                      activeShowId={activeScheduleId}
                      onSelectionChange={handleSelectionChange}
                      onOpen={(show) => setActiveScheduleId(show ? show.id : null)}
                    />
                  </Stack>
                </Grid>

                <Grid lg={9} md={8} xs={12}>
                  {/* SeatPicker is always mounted; just toggle visibility */}
                  {seatmapEverMounted ? (
                    <Box sx={{ display: seatmapVisible ? 'block' : 'none' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                        * {tt("Click vào ghế để xem thông tin chi tiết", "Click on a seat to view details")}
                      </Typography>
                      <ViewOnlySeatPicker
                        layout={(seatmapVisible ? activeSchedule?.layoutJson : stickySeatmapLayout) || {}}
                        categories={activeSchedule?.ticketCategories || []}
                        selectedSeatIds={selectedSeatIds}
                        existingSeats={showSeats || []}
                        onSelectionChange={handleSeatSelectionChange}
                      />
                    </Box>
                  ) : null}
                </Grid>
              </Grid>
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </>
  );
}
