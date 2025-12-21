"use client"
import Grid from '@mui/material/Unstable_Grid2';
import dayjs from 'dayjs';
import * as React from 'react';

import SendRequestEventAgencyAndEventApproval from '@/components/events/event/send-request-event-agency-and-event-approval';
import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Avatar, Box, Container, Modal, Stack, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import MuiFormControlLabel from '@mui/material/FormControlLabel';
import MuiSwitch from '@mui/material/Switch';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import { orange } from '@mui/material/colors';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { ArrowCounterClockwise, ArrowSquareIn, CheckCircle, CheckFat, Eye, HourglassLow, ReceiptX, Storefront } from '@phosphor-icons/react/dist/ssr';
import { ArrowUp as ArrowUpIcon } from '@phosphor-icons/react/dist/ssr/ArrowUp';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { CurrencyDollar as CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import type { AxiosResponse } from 'axios';
import { LocalizedLink } from '@/components/localized-link';
import { useTranslation } from '@/contexts/locale-context';

import { useMemo, useState } from 'react';
import type { ApexOptions } from 'apexcharts';
import { Chart } from '@/components/core/chart';
import { Schedules } from './schedules';
import { TicketCategories } from './ticket-categories';

export interface EventOverviewResponse {
  eventId: number;
  countTotalTransactions: number;
  countTotalTickets: number;
  countTotalRevenue: number;

  countCompletedTransactions: number;
  countCompletedTickets: number;
  countCompletedRevenue: number;

  countPendingTransactions: number;
  countPendingTickets: number;
  countPendingRevenue: number;

  countCancelledTransactions: number;
  countCancelledTransactionsStaffLocked: number;
  countCancelledTransactionsCustomerCancelled: number;

  countCancelledBeforePaymentTransactions: number;
  countCancelledBeforePaymentTickets: number;
  countCancelledBeforePaymentRevenue: number;

  countCancelledAfterPaymentTransactions: number;
  countCancelledAfterPaymentTickets: number;
  countCancelledAfterPaymentRevenue: number;

  countRefundedTransactions: number;
  countRefundedTickets: number;
  countRefundedRevenue: number;
}


export type TicketCategory = {
  id: number;
  checkedIn: number;
  nowInside: number;
  nowOutside: number;
  readyToCheckIn: number;
  notEligible: number;
  disabled: boolean;
  avatar: string | null;
  name: string;
  price: number;
  description: string;
  status: string;
  quantity: number;
  sold: number;
  show: Show;
};

export type Show = {
  id: number;
  name: string;
  avatar: string;
  startDateTime: string; // backend response provides date as string
  endDateTime: string; // backend response provides date as string
  ticketCategories: TicketCategory[];
};

// Define the event response type
type EventResponse = {
  id: number;
  name: string;
  organizer: string;
  organizerEmail: string;
  organizerPhoneNumber: string;
  description: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  place: string | null;
  locationUrl: string | null;
  bannerUrl: string;
  avatarUrl: string;
  slug: string;
  secureApiKey: string;
  locationInstruction: string | null;
  timeInstruction: string | null;
  adminReviewStatus: string;
  displayOption: string;
  displayOnMarketplace: boolean;
  shows: Show[];
};

export interface CheckEventAgencyRegistrationAndEventApprovalRequestResponse {
  eventApprovalRequest: string;
  eventAgencyRegistration: boolean;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt } = useTranslation();
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const { event_id: eventId } = params;
  const [description, setDescription] = React.useState<string>('');
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const TrendIcon = ArrowUpIcon;
  const trendColor = 'var(--mui-palette-success-main)';
  const [selectedSchedule, setSelectedSchedule] = React.useState<Show>();
  const [selectedCategories, setSelectedCategories] = React.useState<number[]>([]);
  const [eventOverview, setEventOverview] = React.useState<EventOverviewResponse | null>(null);
  const [openCashWithdrawalModal, setOpenCashWithdrawalModal] = React.useState(false);
  const [eventAgencyRegistrationAndEventApprovalRequest, setEventAgencyRegistrationAndEventApprovalRequest] = useState<CheckEventAgencyRegistrationAndEventApprovalRequestResponse | null>(null);
  const [openEventAgencyRegistrationModal, setOpenEventAgencyRegistrationModal] = useState(false);
  const [openConfirmSubmitEventApprovalModal, setOpenConfirmSubmitEventApprovalModal] = useState(false);
  const [autoReloadShows, setAutoReloadShows] = React.useState(false);

  const handleCategorySelection = (categoryIds: number[]) => {
    setSelectedCategories(categoryIds);
  };

  const handleSelectionChange = (selected: Show) => {
    setSelectedSchedule(selected);
  };

  // Default selectedSchedule = first show (if exists)
  React.useEffect(() => {
    if (!selectedSchedule && event?.shows && event.shows.length > 0) {
      setSelectedSchedule(event.shows[0]);
    }
  }, [event, selectedSchedule]);

  // Update selectedSchedule when shows are updated (for auto reload)
  React.useEffect(() => {
    if (selectedSchedule && event?.shows) {
      const updatedShow = event.shows.find(s => s.id === selectedSchedule.id);
      if (updatedShow) {
        setSelectedSchedule(updatedShow);
      }
    }
  }, [event?.shows]);
  React.useEffect(() => {
    document.title = `${event?.name || ''} | ETIK - Vé điện tử & Quản lý sự kiện`;
  }, [event]);

  // Fetch event information (without shows)
  React.useEffect(() => {
    if (!eventId) return;

    const fetchEventInfo = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
          `/event-studio/events/${eventId}/info`
        );
        setEvent((prev) => ({
          ...(prev || { shows: [] as Show[] }),
          ...response.data,
        }));
        setDescription(response.data.description || '');
      } catch (error) {
        notificationCtx.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventInfo();
  }, [eventId]);

  const fetchEventShows = React.useCallback(async () => {
    if (!eventId) return;

    try {
      const response: AxiosResponse<{ shows: Show[] }> = await baseHttpServiceInstance.get(
        `/event-studio/events/${eventId}/shows-with-ticket-categories`
      );
      setEvent((prev) => {
        // Create a new object to ensure React detects the change
        return {
          ...(prev || ({} as EventResponse)),
          shows: [...response.data.shows], // Create new array reference
        };
      });
    } catch (error) {
      notificationCtx.error(error);
    }
  }, [eventId, notificationCtx]);

  // Initial fetch of shows + ticket categories
  React.useEffect(() => {
    fetchEventShows();
  }, [fetchEventShows]);

  // Auto reload shows every 10s when toggle is on
  React.useEffect(() => {
    if (!autoReloadShows) return;

    const intervalId = setInterval(() => {
      fetchEventShows();
    }, 10_000);

    return () => clearInterval(intervalId);
  }, [autoReloadShows, fetchEventShows]);


  React.useEffect(() => {
    if (eventId) {
      const fetchEventOverview = async () => {
        try {
          setIsLoading(true);
          const response: AxiosResponse<EventOverviewResponse> = await baseHttpServiceInstance.get(
            `/event-studio/events/${eventId}/overview`
          );
          setEventOverview(response.data);
        } catch (error) {
          notificationCtx.error(error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventOverview();
    }
  }, [eventId]);


  React.useEffect(() => {
    if (!params.event_id) return;

    const fetchEventApprovalStatus = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<CheckEventAgencyRegistrationAndEventApprovalRequestResponse> =
          await baseHttpServiceInstance.get(
            `/event-studio/events/${params.event_id}/approval-requests/check-event-agency-registration-and-event-approval-request`
          );
        setEventAgencyRegistrationAndEventApprovalRequest(response.data);
      } catch (error: any) {
        notificationCtx.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventApprovalStatus();
  }, [params.event_id]);

  const handleRequestEventApprovalClick = () => {
    if (!eventAgencyRegistrationAndEventApprovalRequest?.eventAgencyRegistration) {
      setOpenEventAgencyRegistrationModal(true); // Show modal if eventAgencyRegistration is false
    } else {
      setOpenConfirmSubmitEventApprovalModal(true)
    }
  };

  const handleSendRequestEventApproval = async () => {
    try {
      setIsLoading(true);

      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/approval-requests/event-approval-request`
      );

      // Handle success response
      if (response.status === 200) {
        notificationCtx.success(tt("Yêu cầu nâng cấp thành Sự kiện Được xác thực đã được gửi thành công!", "The request to upgrade to a Verified Event has been sent successfully!"));
        setEventAgencyRegistrationAndEventApprovalRequest(eventAgencyRegistrationAndEventApprovalRequest ? ({
          ...eventAgencyRegistrationAndEventApprovalRequest,
          eventApprovalRequest: 'waiting_for_acceptance'
        }) : eventAgencyRegistrationAndEventApprovalRequest)
        setOpenConfirmSubmitEventApprovalModal(false)

      }
    } catch (error: any) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnCloseEventAgencyRegistrationModal = () => {
    setOpenEventAgencyRegistrationModal(false)
    setEventAgencyRegistrationAndEventApprovalRequest(eventAgencyRegistrationAndEventApprovalRequest ? ({
      ...eventAgencyRegistrationAndEventApprovalRequest,
      eventApprovalRequest: 'waiting_for_acceptance'
    }) : eventAgencyRegistrationAndEventApprovalRequest)
  }

  return (
    <>
      <Backdrop
        open={isLoading}
        sx={{
          color: 'common.white',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          marginLeft: '0px !important',
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Grid container spacing={3} sx={{ marginBottom: '20px' }}>

        <Grid lg={8} md={6} xs={12}>
          <Stack spacing={2}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                aspectRatio: 16 / 6, // 16:9 aspect ratio (modify as needed)
                overflow: 'hidden',
                border: 'grey 1px',
                borderRadius: '20px',
                backgroundColor: 'gray',
              }}
            >
              <Box
                component="img"
                src={event?.bannerUrl || ''}
                alt="Sự kiện"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: 'auto',
                  objectFit: 'cover', // or 'contain' depending on your preference
                }}
              />
            </Box>

            <Card
              sx={{
                height: '100%',
                overflowX: 'auto',
                display: { xs: 'none', sm: 'none', md: 'block' },
                '&::-webkit-scrollbar': {
                  height: '4px', // scrollbar thickness
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#bbb',
                  borderRadius: '5px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: '#888',
                },
                scrollbarWidth: 'thin', // Firefox
                scrollbarColor: '#bbb transparent', // Firefox
              }}
            >
              <Stack spacing={1} direction={'row'}>
                <Typography variant='caption' sx={{ pl: 2, minWidth: '130px', display: 'flex', alignItems: 'center' }}>
                  {tt("Tính năng phổ biến:", "Popular features:")}
                </Typography>
                {(eventId === 43 || eventId === 44) &&
                  <>
                    <Button sx={{ minWidth: '140px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/${event?.slug}`} size="small">
                      {tt("Tra cứu vị trí ngồi", "Check Seating")}
                    </Button>
                    <Button sx={{ minWidth: '140px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/thiet-lap-tran-dau`} size="small">
                      {tt("Thiết lập trận đấu", "Setup Matches")}
                    </Button>
                  </>
                }
                <Button sx={{ minWidth: '190px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/event-detail`} size="small">
                  {tt("Chỉnh sửa thông tin sự kiện", "Edit Event Information")}
                </Button>
                <Button sx={{ minWidth: '120px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/transactions/create`} size="small">
                  {tt("Tạo giao dịch", "Create Transaction")}
                </Button>
                <Button sx={{ minWidth: '100px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/check-in/qr`} size="small">
                  Check-in
                </Button>
                <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/shows`} size="small">
                  {tt("Thiết lập hạng mục vé", "Setup Ticket Categories")}
                </Button>
                {(eventId === 43 || eventId === 44) &&
                  <>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/shows`} size="small">
                      {tt("Thay đổi tên bàn", "Change Table Names")}
                    </Button>
                    <Button sx={{ minWidth: '170px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/schedules`} size="small">
                      {tt("Khóa/Mở khóa tra cứu", "Lock/Unlock Lookup")}
                    </Button>
                  </>
                }
                {eventId === 43 &&
                  <>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/leaderboard`} size="small">
                      {tt("Leaderboard Duo", "Leaderboard Duo")}
                    </Button>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/so-do-tran-dau-lobbies`} size="small">
                      {tt("Sơ đồ trận Lobby", "Lobby Bracket")}
                    </Button>
                  </>

                }
                {eventId == 44 &&
                  <>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/leaderboard-a`} size="small">
                      {tt("Leaderboard Solo A", "Leaderboard Solo A")}
                    </Button>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/leaderboard-b`} size="small">
                      {tt("Leaderboard Solo B", "Leaderboard Solo B")}
                    </Button>
                    <Button sx={{ minWidth: '170px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/leaderboard-arena`} size="small">
                      {tt("Leaderboard Solo Arena", "Leaderboard Solo Arena")}
                    </Button>
                    <Button sx={{ minWidth: '170px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/leaderboard-arena-final`} size="small">
                      {tt("Leaderboard Solo Final", "Leaderboard Solo Final")}
                    </Button>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/so-do-tran-dau-lobbies`} size="small">
                      {tt("Sơ đồ trận Lobby", "Lobby Bracket")}
                    </Button>
                  </>
                }
              </Stack>
            </Card>
          </Stack>
        </Grid>
        <Grid lg={4} md={6} xs={12}>
          <Stack spacing={2}>
            <Card sx={{ height: '100%' }}>
              <CardContent
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <Stack direction="column" spacing={2}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <div>
                      {event?.avatarUrl ?
                        <Box component="img" src={event?.avatarUrl} sx={{ height: '80px', width: '80px', borderRadius: '50%' }} />
                        :
                        <Avatar sx={{ height: '80px', width: '80px', fontSize: '2rem' }}>
                          {(event?.name?.[0] ?? 'A').toUpperCase()}
                        </Avatar>}
                    </div>
                    <Typography variant="h5" sx={{ width: '100%', textAlign: 'center' }}>
                      {event?.name}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <HouseLineIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {tt("Đơn vị tổ chức:", "Organizer:")} {event?.organizer}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {event?.startDateTime && event?.endDateTime
                        ? `${dayjs(event.startDateTime || 0).format('HH:mm DD/MM/YYYY')} - ${dayjs(event.endDateTime || 0).format('HH:mm DD/MM/YYYY')}`
                        : tt('Chưa xác định', 'Not specified')} {event?.timeInstruction ? `(${event.timeInstruction})` : ''}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {event?.place ? event?.place : tt('Chưa xác định', 'Not specified')} {event?.locationInstruction ? `(${event.locationInstruction})` : ''}
                    </Typography>
                  </Stack>

                  <Stack sx={{ alignItems: 'left' }} direction="row" spacing={1}>
                    <Storefront fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {event?.displayOnMarketplace ? tt("Có thể truy cập từ Marketplace", "Accessible from Marketplace") : tt('Chỉ có thể truy cập bằng link', 'Only accessible via link')}
                      <a href={`/event-studio/events/${eventId}/event-detail#otherSettings`} style={{ textDecoration: 'none' }}> {tt("Thay đổi", "Change")}</a>
                    </Typography>
                  </Stack>


                  <Stack direction="row" spacing={1} >
                    <Eye fontSize="var(--icon-fontSize-sm)" />
                    {event?.displayOption !== 'display_with_everyone' ?
                      <Typography display="inline" variant="body2" sx={{ color: 'warning.main' }}>
                        {tt("Sự kiện không hiển thị công khai", "Event not publicly visible")}
                        <a href={`/event-studio/events/${eventId}/event-detail#otherSettings`} style={{ textDecoration: 'none' }}> {tt("Thay đổi", "Change")}</a>
                      </Typography>
                      :
                      <Typography display="inline" variant="body2" color="text.secondary">
                        {tt("Đang hiển thị công khai", "Publicly visible")}
                        <a href={`/event-studio/events/${eventId}/event-detail#otherSettings`} style={{ textDecoration: 'none' }}> {tt("Thay đổi", "Change")}</a>
                      </Typography>
                    }
                  </Stack>
                </Stack>
                <Box sx={{ mt: 2.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    target="_blank"
                    component={LocalizedLink}
                    href={`/events/${event?.slug}`}
                    size="small"
                    endIcon={<ArrowSquareIn />}
                  >
                    {tt("Đến trang khách hàng tự đăng ký vé", "Go to Customer Registration Page")}
                  </Button>
                </Box>
                <Box sx={{ mt: 2.5 }}>
                  {eventAgencyRegistrationAndEventApprovalRequest &&
                    (
                      <>
                        {eventAgencyRegistrationAndEventApprovalRequest.eventApprovalRequest == 'accepted' && (
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            color='success'
                          >
                            <Stack spacing={0} sx={{ alignItems: 'center' }}>
                              <Box
                                component="span"
                                sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, lineHeight: 1 }}
                              >
                                <CheckCircle size={16} weight="fill" />
                                {tt("Sự kiện Được xác thực", "Verified Event")}
                              </Box>
                              <small>{tt("bán vé có thanh toán online, gửi email marketing,...", "sell tickets with online payment, send marketing emails,...")}</small>
                            </Stack>
                          </Button>
                        )}
                        {eventAgencyRegistrationAndEventApprovalRequest.eventApprovalRequest == 'waiting_for_acceptance' && (
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            disabled
                          >
                            <Stack spacing={0} sx={{ alignItems: 'center' }}>
                              <span>{tt("Sự kiện đang chờ duyệt", "Event Pending Approval")}</span>
                            </Stack>
                          </Button>
                        )}
                        {eventAgencyRegistrationAndEventApprovalRequest.eventApprovalRequest == 'rejected' && (
                          <Button
                            fullWidth
                            variant="outlined"
                            color='error'
                            size="small"
                            onClick={handleRequestEventApprovalClick}
                          >
                            <Stack spacing={0} sx={{ alignItems: 'center' }}>
                              <small color='error'>{tt("Yêu cầu nâng cấp bị từ chối", "Upgrade Request Rejected")}</small>
                              <span>{tt("Nhấn để yêu cầu lại", "Click to Request Again")}</span>
                            </Stack>
                          </Button>
                        )}
                        {eventAgencyRegistrationAndEventApprovalRequest.eventApprovalRequest == 'no_request_from_user' && (
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            onClick={handleRequestEventApprovalClick}
                          >
                            <Stack spacing={0} sx={{ alignItems: 'center' }}>
                              <span>{tt("nâng cấp thành Sự kiện Được xác thực", "Upgrade to Verified Event")}</span>
                              <small>{tt("Để bật thanh toán online, gửi email marketing,...", "To enable online payment, send marketing emails,...")}</small>
                            </Stack>
                          </Button>
                        )}
                      </>
                    )
                  }
                </Box>
              </CardContent>
            </Card>
            <Card sx={{ height: '100%', overflowX: 'auto', display: { xs: 'block', sm: 'block', md: 'none' } }}>
              <Stack spacing={1} direction={'row'}>
                <Typography variant='caption' sx={{ pl: 2, minWidth: '130px', display: 'flex', alignItems: 'center' }}>
                  {tt("Tính năng phổ biến:", "Popular features:")}
                </Typography>
                {(eventId === 43 || eventId === 44) &&
                  <>
                    <Button sx={{ minWidth: '140px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/${event?.slug}`} size="small">
                      {tt("Tra cứu vị trí ngồi", "Check Seating")}
                    </Button>
                    <Button sx={{ minWidth: '140px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/thiet-lap-tran-dau`} size="small">
                      {tt("Thiết lập trận đấu", "Setup Matches")}
                    </Button>
                  </>
                }
                <Button sx={{ minWidth: '210px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/event-detail`} size="small">
                  {tt("Chỉnh sửa thông tin sự kiện", "Edit Event Information")}
                </Button>
                <Button sx={{ minWidth: '120px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/transactions/create`} size="small">
                  {tt("Tạo giao dịch", "Create Transaction")}
                </Button>
                <Button sx={{ minWidth: '100px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/check-in/qr`} size="small">
                  Check-in
                </Button>
                <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/shows`} size="small">
                  {tt("Thiết lập hạng mục vé", "Setup Ticket Categories")}
                </Button>
                {(eventId === 43 || eventId === 44) &&
                  <>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/shows`} size="small">
                      {tt("Thay đổi tên bàn", "Change Table Names")}
                    </Button>
                    <Button sx={{ minWidth: '170px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/schedules`} size="small">
                      {tt("Khóa/Mở khóa tra cứu", "Lock/Unlock Lookup")}
                    </Button>
                  </>
                }
                {eventId === 43 &&
                  <>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/leaderboard`} size="small">
                      {tt("Leaderboard Duo", "Leaderboard Duo")}
                    </Button>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/so-do-tran-dau-lobbies`} size="small">
                      {tt("Sơ đồ trận Lobby", "Lobby Bracket")}
                    </Button>
                  </>

                }
                {eventId == 44 &&
                  <>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/leaderboard-a`} size="small">
                      {tt("Leaderboard Solo A", "Leaderboard Solo A")}
                    </Button>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/leaderboard-b`} size="small">
                      {tt("Leaderboard Solo B", "Leaderboard Solo B")}
                    </Button>
                    <Button sx={{ minWidth: '170px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/leaderboard-arena`} size="small">
                      {tt("Leaderboard Solo Arena", "Leaderboard Solo Arena")}
                    </Button>
                    <Button sx={{ minWidth: '170px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/leaderboard-arena-final`} size="small">
                      {tt("Leaderboard Solo Final", "Leaderboard Solo Final")}
                    </Button>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={LocalizedLink} href={`/event-studio/events/${eventId}/so-do-tran-dau-lobbies`} size="small">
                      {tt("Sơ đồ trận Lobby", "Lobby Bracket")}
                    </Button>
                  </>
                }
              </Stack>
            </Card>

          </Stack>


        </Grid>
      </Grid>
      <Stack spacing={3} sx={{ mb: 5 }}>
        <Card>
          <CardHeader
            title={tt("ETIK Dashboard", "ETIK Dashboard")}
            action={(
              <MuiFormControlLabel
                control={(
                  <MuiSwitch
                    color="primary"
                    checked={autoReloadShows}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAutoReloadShows(e.target.checked)
                    }
                  />
                )}
                label={tt("Auto Reload", "Auto Reload")}
              />
            )}
          />
        </Card>
        {/* Part 1 (4/12) */}
        <Grid container spacing={3}>
          <Grid lg={4} md={4} xs={12}>
            <Stack spacing={3}>
              <Schedules shows={event?.shows} onSelectionChange={handleSelectionChange} />
              {selectedSchedule && (
                <TicketCategories show={selectedSchedule} onCategoriesSelect={handleCategorySelection} />
              )}
            </Stack>
          </Grid>

          {/* Right side: Check-in statistics dashboard */}
          <Grid lg={8} md={8} xs={12}>
            <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
              <CardHeader
                title={tt('Thống kê Check-in', 'Check-in statistics')}
                subheader={selectedSchedule ? selectedSchedule.name : event?.name}
              />
              <CardContent>
                {(() => {
                  const activeShow = selectedSchedule ?? event?.shows?.[0];

                  // Avoid rendering charts on the very first render while data is still loading
                  if (!activeShow) {
                    return (
                      <Typography variant="body2" color="text.secondary">
                        {tt('Đang tải dữ liệu lịch diễn...', 'Loading schedule data...')}
                      </Typography>
                    );
                  }

                  const categories = activeShow.ticketCategories ?? [];

                  const totals = categories.reduce(
                    (acc, c) => {
                      acc.totalCheckedIn += c.checkedIn || 0;
                      acc.totalSold += c.sold || 0;
                      acc.totalNowInside += c.nowInside || 0;
                      acc.totalNowOutside += c.nowOutside || 0;
                      acc.totalReadyToCheckIn += c.readyToCheckIn || 0;
                      acc.totalNotEligible += c.notEligible || 0;
                      return acc;
                    },
                    { totalCheckedIn: 0, totalSold: 0, totalNowInside: 0, totalNowOutside: 0, totalReadyToCheckIn: 0, totalNotEligible: 0 }
                  );

                  const remainingNotCheckedIn = Math.max(
                    totals.totalReadyToCheckIn - totals.totalCheckedIn,
                    0
                  );

                  const formatPercentOfSold = (value: number) => {
                    if (totals.totalSold <= 0) return '0%';
                    const rate = (value / totals.totalSold) * 100;
                    return `${rate.toFixed(1)}%`;
                  };

                  const formatPercentOfReady = (value: number) => {
                    if (totals.totalReadyToCheckIn <= 0) return '0%';
                    const rate = (value / totals.totalReadyToCheckIn) * 100;
                    return `${rate.toFixed(1)}%`;
                  };

                  const overallRate =
                    totals.totalSold > 0 ? (totals.totalCheckedIn / totals.totalSold) * 100 : 0;

                  // Always provide a numeric series so ApexCharts doesn't see undefined on first render
                  const donutSeries =
                    totals.totalReadyToCheckIn > 0
                      ? [totals.totalCheckedIn, Math.max(totals.totalReadyToCheckIn - totals.totalCheckedIn, 0)]
                      : [0, 0];

                  const donutOptions: ApexOptions = {
                    chart: { type: 'donut' as const, background: 'transparent' },
                    labels: [tt('Đã check-in', 'Checked-in'), tt('Chưa check-in', 'Not checked-in')],
                    colors: ['#22c55e', '#e5e7eb'],
                    dataLabels: {
                      enabled: true,
                      formatter: (val: any) => {
                        const num = typeof val === 'number' ? val : parseFloat(val);
                        if (!Number.isFinite(num)) return '';
                        return `${num.toFixed(1)}%`;
                      },
                    },
                    legend: { position: 'bottom' as const },
                    stroke: { width: 0 },
                  };

                  const barCategories = categories.map((c) => c.name);
                  const barSeriesData = categories.map((c) => {
                    const val = c.readyToCheckIn > 0 ? (c.checkedIn / c.readyToCheckIn) * 100 : 0;
                    return Number.isFinite(val) ? val : 0;
                  });

                  const barOptions: ApexOptions = {
                    chart: { type: 'bar' as const, toolbar: { show: false } },
                    plotOptions: {
                      bar: {
                        horizontal: true,
                        borderRadius: 4,
                      },
                    },
                    xaxis: {
                      categories: barCategories,
                      labels: {
                        formatter: (val: any) => {
                          const num = typeof val === 'number' ? val : parseFloat(val);
                          if (!Number.isFinite(num)) return '';
                          return `${num.toFixed(0)}%`;
                        },
                      },
                      max: 100,
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: function (val: any) {
                        const num = typeof val === 'number' ? val : parseFloat(val);
                        if (!Number.isFinite(num)) return '';
                        return `${num.toFixed(1)}%`;
                      },
                    },
                    tooltip: {
                      y: {
                        formatter: function (val: any) {
                          const num = typeof val === 'number' ? val : parseFloat(val);
                          if (!Number.isFinite(num)) return '';
                          return `${num.toFixed(1)}%`;
                        },
                      },
                    },
                    colors: ['#f59e0b'],
                  };

                  const hasDonutData = donutSeries.length > 0 && donutSeries.some((v) => v > 0);
                  const hasBarData = barCategories.length > 0 && barSeriesData.some((v) => v > 0);

                  return (
                    <Stack spacing={3}>
                      {/* Top: donut + summary cards */}
                      <Grid container spacing={3}>
                        <Grid lg={5} md={6} xs={12}>
                          <Stack spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Box
                              sx={{
                                minHeight: 220,
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {hasDonutData ? (
                                <Chart
                                  height={220}
                                  width="100%"
                                  options={donutOptions}
                                  series={donutSeries}
                                  type="donut"
                                />
                              ) : (
                                <Typography variant="body2" color="text.secondary" align="center">
                                  {tt('Chưa có dữ liệu check-in', 'No check-in data yet')}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </Grid>
                        <Grid lg={7} md={6} xs={12}>
                          <Grid container spacing={2}>
                            <Grid xs={6} md={6}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2">
                                  {tt('Tổng vé xuất', 'Total exported tickets')}
                                </Typography>
                                <Typography variant="h5">{totals.totalSold}</Typography>
                              </Paper>
                            </Grid>
                            <Grid xs={6} md={6}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2">
                                  {tt('Sẵn sàng check-in', 'Ready to check-in')}
                                </Typography>
                                <Typography variant="h5">{totals.totalReadyToCheckIn}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  100%
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid xs={6} md={6}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  {tt('Không đủ điều kiện', 'Not eligible')}
                                </Typography>
                                <Typography variant="h5" color="text.secondary">
                                  {totals.totalNotEligible}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatPercentOfSold(totals.totalNotEligible)}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid xs={6} md={6}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2">
                                  {tt('Đã check-in', 'Checked-in')}
                                </Typography>
                                <Typography variant="h5">{totals.totalCheckedIn}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatPercentOfReady(totals.totalCheckedIn)}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid xs={6} md={6}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="warning.main">
                                  {tt('Chưa check-in', 'Not yet checked-in')}
                                </Typography>
                                <Typography variant="h5" color="warning.main">
                                  {remainingNotCheckedIn}
                                </Typography>
                                <Typography variant="body2" color="warning.main">
                                  {formatPercentOfReady(remainingNotCheckedIn)}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid xs={6} md={6}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2">
                                  {tt('Trong sự kiện', 'Inside event')}
                                </Typography>
                                <Typography variant="h5">{totals.totalNowInside}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatPercentOfSold(totals.totalNowInside)}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid xs={6} md={6}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2">
                                  {tt('Đã ra ngoài', 'Outside event')}
                                </Typography>
                                <Typography variant="h5">{totals.totalNowOutside}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatPercentOfSold(totals.totalNowOutside)}
                                </Typography>
                              </Paper>
                            </Grid>
                          </Grid>
                        </Grid>
                      </Grid>

                      {/* Middle: horizontal bar chart */}
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          {tt('Tỉ lệ check-in theo loại vé', 'Check-in rate by ticket type')}
                        </Typography>
                        {hasBarData ? (
                          <Chart
                            height={260}
                            width="100%"
                            options={barOptions}
                            series={[{ name: tt('Tỉ lệ check-in', 'Check-in rate'), data: barSeriesData }]}
                            type="bar"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {tt('Chưa có dữ liệu để hiển thị', 'No data to display')}
                          </Typography>
                        )}
                      </Box>

                      {/* Bottom: detail table */}
                      <Box sx={{ mt: 2, overflowX: 'auto' }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          {tt('Chi tiết theo loại vé', 'Details by ticket type')}
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>{tt('Loại vé', 'Ticket type')}</TableCell>
                              <TableCell>{tt('Giá bán', 'Price')}</TableCell>
                              <TableCell>{tt('Đã bán', 'Sold')}</TableCell>
                              <TableCell>{tt('Sẵn sàng check-in', 'Ready to check-in')}</TableCell>
                              <TableCell>{tt('Không đủ điều kiện', 'Not eligible')}</TableCell>
                              <TableCell>{tt('Đã check-in', 'Checked-in')}</TableCell>
                              <TableCell>{tt('Tỉ lệ check-in', 'Check-in rate')}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {categories.map((c) => {
                              const rate = c.readyToCheckIn > 0 ? (c.checkedIn / c.readyToCheckIn) * 100 : 0;
                              return (
                                <TableRow key={c.id}>
                                  <TableCell>{c.name}</TableCell>
                                  <TableCell>{c.price.toLocaleString('vi-VN')}đ</TableCell>
                                  <TableCell>{c.sold}</TableCell>
                                  <TableCell>{c.readyToCheckIn}</TableCell>
                                  <TableCell>{c.notEligible}</TableCell>
                                  <TableCell>{c.checkedIn}</TableCell>
                                  <TableCell>{`${rate.toFixed(1)}%`}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </Box>
                    </Stack>
                  );
                })()}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
      <Grid container spacing={3}>
        <Grid lg={4} sm={6} xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
                  <Stack spacing={1}>
                    <Typography color="text.secondary" variant="overline">
                      {tt("Tổng doanh thu", "Total Revenue")}
                    </Typography>
                    <Typography variant="h4">
                      {eventOverview?.countTotalRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                    </Typography>
                  </Stack>
                  <Avatar sx={{ backgroundColor: 'var(--mui-palette-primary-main)', height: '56px', width: '56px' }}>
                    <CurrencyDollarIcon fontSize="var(--icon-fontSize-lg)" />
                  </Avatar>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-primary-main)' variant="body2">
                        {eventOverview?.countTotalTransactions}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      {tt("Đơn hàng", "Orders")}
                    </Typography>
                  </Stack>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-primary-main)' variant="body2">
                        {eventOverview?.countTotalTickets}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      {tt("Vé", "Tickets")}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>

            </CardContent>
          </Card>
        </Grid>
        <Grid lg={4} sm={6} xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
                  <Stack spacing={1}>
                    <Typography color="text.secondary" variant="overline">
                      {tt("Đã hoàn tất", "Completed")}
                    </Typography>
                    <Typography variant="h4">
                      {eventOverview?.countCompletedRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                    </Typography>
                  </Stack>
                  <Avatar sx={{ backgroundColor: 'var(--mui-palette-success-main)', height: '56px', width: '56px' }}>
                    <CheckFat fontSize="var(--icon-fontSize-lg)" />
                  </Avatar>
                </Stack>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                      <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                        <Typography color='var(--mui-palette-success-main)' variant="body2">
                          {eventOverview?.countCompletedTransactions}
                        </Typography>
                      </Stack>
                      <Typography color="text.secondary" variant="caption">
                        {tt("Đơn hàng đã xuất", "Orders Issued")}
                      </Typography>
                    </Stack>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                      <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                        <Typography color='var(--mui-palette-success-main)' variant="body2">
                          {eventOverview?.countCompletedTickets}
                        </Typography>
                      </Stack>
                      <Typography color="text.secondary" variant="caption" >
                        {tt("Vé", "Tickets")}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Typography color="primary" variant="caption" component={Button} onClick={() => setOpenCashWithdrawalModal(true)}>
                      {tt("Rút tiền ?", "Withdraw ?")}
                    </Typography>
                  </Stack>
                </div>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid lg={4} sm={6} xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
                  <Stack spacing={1}>
                    <Typography color="text.secondary" variant="overline">
                      {tt("Đang chờ", "Pending")}
                    </Typography>
                    <Typography variant="h4">
                      {eventOverview?.countPendingRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                    </Typography>
                  </Stack>
                  <Avatar sx={{ backgroundColor: 'var(--mui-palette-warning-main)', height: '56px', width: '56px' }}>
                    <HourglassLow fontSize="var(--icon-fontSize-lg)" />
                  </Avatar>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-warning-main)' variant="body2">
                        {eventOverview?.countPendingTransactions}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      {tt("Đơn hàng chưa xuất", "Orders Not Issued")}
                    </Typography>
                  </Stack>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-warning-main)' variant="body2">
                        {eventOverview?.countPendingTickets}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      {tt("Vé", "Tickets")}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid lg={3} sm={6} xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
                  <Stack spacing={1}>
                    <Typography color="text.secondary" variant="overline">
                      {tt("Đơn hủy", "Cancelled Orders")}
                    </Typography>
                    <Typography variant="h4">
                      {eventOverview?.countCancelledTransactions}
                    </Typography>
                  </Stack>
                  <Avatar sx={{ backgroundColor: 'var(--mui-palette-secondary-main)', height: '56px', width: '56px' }}>
                    <ReceiptX fontSize="var(--icon-fontSize-lg)" />
                  </Avatar>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-secondary-main)' variant="body2">
                        {eventOverview?.countCancelledTransactionsStaffLocked}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      {tt("Khóa bởi nhân viên", "Locked by Staff")}
                    </Typography>
                  </Stack>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-secondary-main)' variant="body2">
                        {eventOverview?.countCancelledTransactionsCustomerCancelled}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      {tt("Hủy bởi khách hàng", "Cancelled by Customer")}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid lg={3} sm={6} xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
                  <Stack spacing={1}>
                    <Typography color="text.secondary" variant="overline">
                      {tt("hủy chưa t.toán", "Cancelled Before Payment")}
                    </Typography>
                    <Typography variant="h4">{eventOverview?.countCancelledBeforePaymentTransactions}</Typography>
                  </Stack>
                  <Avatar sx={{ backgroundColor: 'var(--mui-palette-secondary-main)', height: '56px', width: '56px' }}>
                    <CurrencyDollarIcon fontSize="var(--icon-fontSize-lg)" />
                  </Avatar>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-secondary-main)' variant="body2">
                        {eventOverview?.countCancelledBeforePaymentTickets}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      Vé
                    </Typography>
                  </Stack>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-secondary-main)' variant="body2">
                        {eventOverview?.countCancelledBeforePaymentRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid lg={3} sm={6} xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
                  <Stack spacing={1}>
                    <Typography color="text.secondary" variant="overline">
                      {tt("hủy sau thanh toán", "Cancelled After Payment")}
                    </Typography>
                    <Typography variant="h4">
                      {eventOverview?.countCancelledAfterPaymentTransactions}

                    </Typography>
                  </Stack>
                  <Avatar sx={{ backgroundColor: 'var(--mui-palette-secondary-main)', height: '56px', width: '56px' }}>
                    <CurrencyDollarIcon fontSize="var(--icon-fontSize-lg)" />
                  </Avatar>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-secondary-main)' variant="body2">
                        {eventOverview?.countCancelledAfterPaymentTickets}

                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      Vé
                    </Typography>
                  </Stack>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-secondary-main)' variant="body2">
                        {eventOverview?.countCancelledAfterPaymentRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}

                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid lg={3} sm={6} xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
                  <Stack spacing={1}>
                    <Typography color="text.secondary" variant="overline">
                      {tt("đã hoàn tiền", "Refunded")}
                    </Typography>
                    <Typography variant="h4">
                      {eventOverview?.countRefundedTransactions}
                    </Typography>
                  </Stack>
                  <Avatar sx={{ backgroundColor: 'var(--mui-palette-secondary-main)', height: '56px', width: '56px' }}>
                    <ArrowCounterClockwise fontSize="var(--icon-fontSize-lg)" />
                  </Avatar>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-secondary-main)' variant="body2">
                        {eventOverview?.countRefundedTickets}

                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      {tt("Vé", "Tickets")}
                    </Typography>
                  </Stack>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-secondary-main)' variant="body2">
                        {eventOverview?.countRefundedRevenue.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                      </Typography>
                    </Stack>

                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* <Grid lg={3} sm={6} xs={12}>
          <CheckIn diff={12} trend="up" sx={{ height: '100%' }} value="$24k" />
        </Grid>
        <Grid lg={3} sm={6} xs={12}>
          <TotalProfit sx={{ height: '100%' }} value="$15k" />
        </Grid>
        <Grid lg={3} sm={6} xs={12}>
          <Refund diff={12} trend="up" sx={{ height: '100%' }} value="$24k" />
        </Grid> */}

        {/* <Grid lg={8} xs={12}>
          <Sales
            chartSeries={[
              { name: 'This year', data: [18, 16, 5, 8, 3, 14, 14, 16, 17, 19, 18, 20] },
              { name: 'Last year', data: [12, 11, 4, 6, 2, 9, 9, 10, 11, 12, 13, 13] },
            ]}
            sx={{ height: '100%' }}
          />
        </Grid>
        <Grid lg={4} md={6} xs={12}>
          <Traffic chartSeries={[63, 15, 22]} labels={['Desktop', 'Tablet', 'Phone']} sx={{ height: '100%' }} />
        </Grid>
        <Grid lg={4} md={6} xs={12}>
          <LatestProducts
            products={[
              {
                id: 'PRD-005',
                name: 'Soja & Co. Eucalyptus',
                image: '/assets/product-5.png',
                updatedAt: dayjs().subtract(18, 'minutes').subtract(5, 'hour').toDate(),
              },
              {
                id: 'PRD-004',
                name: 'Necessaire Body Lotion',
                image: '/assets/product-4.png',
                updatedAt: dayjs().subtract(41, 'minutes').subtract(3, 'hour').toDate(),
              },
              {
                id: 'PRD-003',
                name: 'Ritual of Sakura',
                image: '/assets/product-3.png',
                updatedAt: dayjs().subtract(5, 'minutes').subtract(3, 'hour').toDate(),
              },
              {
                id: 'PRD-002',
                name: 'Lancome Rouge',
                image: '/assets/product-2.png',
                updatedAt: dayjs().subtract(23, 'minutes').subtract(2, 'hour').toDate(),
              },
              {
                id: 'PRD-001',
                name: 'Erbology Aloe Vera',
                image: '/assets/product-1.png',
                updatedAt: dayjs().subtract(10, 'minutes').toDate(),
              },
            ]}
            sx={{ height: '100%' }}
          />
        </Grid>
        <Grid lg={8} md={12} xs={12}>
          <LatestOrders
            orders={[
              {
                id: 'ORD-007',
                customer: { name: 'Ekaterina Tankova' },
                amount: 30.5,
                status: 'pending',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-006',
                customer: { name: 'Cao Yu' },
                amount: 25.1,
                status: 'delivered',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-004',
                customer: { name: 'Alexa Richardson' },
                amount: 10.99,
                status: 'refunded',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-003',
                customer: { name: 'Anje Keizer' },
                amount: 96.43,
                status: 'pending',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-002',
                customer: { name: 'Clarke Gillebert' },
                amount: 32.54,
                status: 'delivered',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
              {
                id: 'ORD-001',
                customer: { name: 'Adam Denisov' },
                amount: 16.76,
                status: 'delivered',
                createdAt: dayjs().subtract(10, 'minutes').toDate(),
              },
            ]}
            sx={{ height: '100%' }}
          />
        </Grid> */}
      </Grid>

      <Modal
        open={openCashWithdrawalModal}
        onClose={() => setOpenCashWithdrawalModal(false)}
        aria-labelledby="ticket-category-description-modal-title"
        aria-describedby="ticket-category-description-modal-description"
      >
        <Container maxWidth="xl">
          <Card
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { sm: "500px", xs: "90%" },
              bgcolor: "background.paper",
              boxShadow: 24,
            }}
          >
            <CardContent>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {tt(
                  `Để rút tiền, quý khách vui lòng gửi email với tiêu đề "Yêu cầu rút tiền sự kiện ${event?.name}" từ địa chỉ email ${event?.organizerEmail} của quý khách đến địa chỉ email tienphongsmart@gmail.com. Chúng tôi sẽ hỗ trợ trong thời gian 24h kể từ khi nhận được yêu cầu. Xin cảm ơn!`,
                  `To withdraw funds, please send an email with the subject "Withdrawal request for event ${event?.name}" from your email address ${event?.organizerEmail} to tienphongsmart@gmail.com. We will assist you within 24 hours of receiving the request. Thank you!`
                )}
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Modal>
      <SendRequestEventAgencyAndEventApproval open={openEventAgencyRegistrationModal} onClose={handleOnCloseEventAgencyRegistrationModal} eventId={params.event_id} />
      <Modal
        open={openConfirmSubmitEventApprovalModal}
        onClose={() => setOpenConfirmSubmitEventApprovalModal(false)}
        aria-labelledby="ticket-category-description-modal-title"
        aria-describedby="ticket-category-description-modal-description"
      >
        <Container maxWidth="xl">
          <Card
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { sm: "500px", xs: "90%" },
              bgcolor: "background.paper",
              boxShadow: 24,
            }}
          >
            <CardHeader title={tt('Quy định chung', 'General Regulations')} />
            <Divider />
            <CardContent>
              <Stack spacing={1} textAlign={'justify'}>
                <Typography variant="body2">
                  <b>{tt("Để sự kiện được nâng cấp thành Sự kiện Được xác thực, Nhà tổ chức sự kiện vui lòng tuân thủ các quy định dưới đây trước khi gửi yêu cầu:", "To upgrade your event to a Verified Event, the event organizer must comply with the following regulations before submitting the request:")}</b>
                </Typography>
                <Typography variant="body2">
                  {tt("- Sự kiện có đầy đủ thông tin về tên, mô tả, đơn vị tổ chức, ảnh bìa, ảnh đại diện.", "- The event must have complete information including name, description, organizer, banner image, and avatar.")}
                </Typography>
                <Typography variant="body2">
                  {tt("- Thời gian và địa điểm rõ ràng, chính xác. Hạn chế thay đổi thông tin về thời gian, địa điểm và phải thông báo cho ETIK trước khi thay đổi.", "- Clear and accurate time and location. Minimize changes to time and location information and must notify ETIK before making changes.")}
                </Typography>
                <Typography variant="body2">
                  {tt("- Chính sách Giá vé, chính sách hoàn trả, hủy vé rõ ràng, minh bạch.", "- Clear and transparent ticket pricing, refund policy, and cancellation policy.")}
                </Typography>
                <Typography variant="body2">
                  {tt("- Sự kiện tuân thủ quy định của pháp luật Việt Nam, phù hợp chuẩn mực đạo đức, thuần phong mỹ tục.", "- The event must comply with Vietnamese law and be consistent with ethical standards and good customs.")}
                </Typography>
                <Typography variant="body2">
                  {tt("- Cung cấp cho ETIK các thông tin, giấy tờ để xác minh khi được yêu cầu.", "- Provide ETIK with information and documents for verification when requested.")}
                </Typography>
                <Typography variant="body2">
                  {tt("Nếu cần hỗ trợ, Quý khách vui lòng liên hệ Hotline CSKH 0333.247.242 hoặc email tienphongsmart@gmail.com", "If you need support, please contact Customer Service Hotline 0333.247.242 or email tienphongsmart@gmail.com")}
                </Typography>
              </Stack>
              <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="contained" color="primary" onClick={handleSendRequestEventApproval} disabled={isLoading}>
                  {tt("Gửi yêu cầu", "Submit Request")}
                </Button>
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </Modal>
    </>
  );
}
