"use client"
import Grid from '@mui/material/Unstable_Grid2';
import dayjs from 'dayjs';
import * as React from 'react';

import SendRequestEventAgencyAndEventApproval from '@/components/events/event/send-request-event-agency-and-event-approval';
import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Avatar, Box, Container, Modal, Stack } from '@mui/material';
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
import RouterLink from 'next/link';
import { useState } from 'react';
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
  avatar: string | null;
  name: string;
  price: number;
  description: string;
  status: string;
  quantity: number;
  sold: number;
  disabled: boolean;
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

  const handleCategorySelection = (categoryIds: number[]) => {
    setSelectedCategories(categoryIds);
  };

  const handleSelectionChange = (selected: Show) => {
    setSelectedSchedule(selected);
  };
  React.useEffect(() => {
    document.title = `${event?.name || ''} | ETIK - Vé điện tử & Quản lý sự kiện`;
  }, [event]);

  React.useEffect(() => {
    if (eventId) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
            `/event-studio/events/${eventId}/get-event-with-ticket-categories`
          );
          setEvent(response.data);
          setDescription(response.data.description || '');
        } catch (error) {
          notificationCtx.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEventDetails();
    }
  }, [eventId]);


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
        notificationCtx.success("Yêu cầu nâng cấp thành Sự kiện Được xác thực đã được gửi thành công!");
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
                  Tính năng phổ biến:
                </Typography>
                {(eventId === 43 || eventId === 44) &&
                  <>
                    <Button sx={{ minWidth: '140px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/${event?.slug}`} size="small">
                      Tra cứu vị trí ngồi
                    </Button>
                    <Button sx={{ minWidth: '140px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/thiet-lap-tran-dau`} size="small">
                      Thiết lập trận đấu
                    </Button>
                  </>
                }
                <Button sx={{ minWidth: '190px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/event-detail`} size="small">
                  Chỉnh sửa thông tin sự kiện
                </Button>
                <Button sx={{ minWidth: '120px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/transactions/create`} size="small">
                  Tạo giao dịch
                </Button>
                <Button sx={{ minWidth: '100px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/check-in/qr`} size="small">
                  Check-in
                </Button>
                <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/schedules`} size="small">
                  Thiết lập show diễn
                </Button>
                <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/shows`} size="small">
                  Thiết lập loại vé
                </Button>
                {(eventId === 43 || eventId === 44) &&
                  <>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/shows`} size="small">
                      Thay đổi tên bàn
                    </Button>
                    <Button sx={{ minWidth: '170px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/schedules`} size="small">
                      Khóa/Mở khóa tra cứu
                    </Button>
                  </>
                }
                {eventId === 43 &&
                  <>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/leaderboard`} size="small">
                      Leaderboard Duo
                    </Button>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/so-do-tran-dau-lobbies`} size="small">
                      Sơ đồ trận Lobby
                    </Button>
                  </>

                }
                {eventId == 44 &&
                  <>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/leaderboard-a`} size="small">
                      Leaderboard Solo A
                    </Button>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/leaderboard-b`} size="small">
                      Leaderboard Solo B
                    </Button>
                    <Button sx={{ minWidth: '170px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/leaderboard-arena`} size="small">
                      Leaderboard Solo Arena
                    </Button>
                    <Button sx={{ minWidth: '170px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/leaderboard-arena-final`} size="small">
                      Leaderboard Solo Final
                    </Button>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/so-do-tran-dau-lobbies`} size="small">
                      Sơ đồ trận Lobby
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
                          {(event?.name[0] ?? 'a').toUpperCase()}
                        </Avatar>}
                    </div>
                    <Typography variant="h5" sx={{ width: '100%', textAlign: 'center' }}>
                      {event?.name}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <HouseLineIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      Đơn vị tổ chức: {event?.organizer}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {event?.startDateTime && event?.endDateTime
                        ? `${dayjs(event.startDateTime || 0).format('HH:mm DD/MM/YYYY')} - ${dayjs(event.endDateTime || 0).format('HH:mm DD/MM/YYYY')}`
                        : 'Chưa xác định'} {event?.timeInstruction ? `(${event.timeInstruction})` : ''}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {event?.place ? event?.place : 'Chưa xác định'} {event?.locationInstruction ? `(${event.locationInstruction})` : ''}
                    </Typography>
                  </Stack>

                  <Stack sx={{ alignItems: 'left' }} direction="row" spacing={1}>
                    <Storefront fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {event?.displayOnMarketplace ? "Có thể truy cập từ Marketplace" : 'Chỉ có thể truy cập bằng link'}
                      <a href={`/event-studio/events/${eventId}/event-detail#otherSettings`} style={{ textDecoration: 'none' }}> Thay đổi</a>
                    </Typography>
                  </Stack>


                  <Stack direction="row" spacing={1} >
                    <Eye fontSize="var(--icon-fontSize-sm)" />
                    {event?.displayOption !== 'display_with_everyone' ?
                      <Typography display="inline" variant="body2" sx={{ color: 'warning.main' }}>
                        Sự kiện không hiển thị công khai
                        <a href={`/event-studio/events/${eventId}/event-detail#otherSettings`} style={{ textDecoration: 'none' }}> Thay đổi</a>
                      </Typography>
                      :
                      <Typography display="inline" variant="body2" color="text.secondary">
                        Đang hiển thị công khai
                        <a href={`/event-studio/events/${eventId}/event-detail#otherSettings`} style={{ textDecoration: 'none' }}> Thay đổi</a>
                      </Typography>
                    }
                  </Stack>
                </Stack>
                <Box sx={{ mt: 2.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    target="_blank"
                    component={RouterLink}
                    href={`/events/${event?.slug}`}
                    size="small"
                    endIcon={<ArrowSquareIn />}
                  >
                    Đến trang Khách hàng tự đăng ký vé
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
                                Sự kiện Được xác thực
                              </Box>
                              <small>bán vé có thanh toán online, gửi email marketing,...</small>
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
                              <span>Sự kiện đang chờ duyệt</span>
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
                              <small color='error'>Yêu cầu nâng cấp bị từ chối</small>
                              <span>Nhấn để yêu cầu lại</span>
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
                              <span>nâng cấp thành Sự kiện Được xác thực</span>
                              <small>Để bật thanh toán online, gửi email marketing,...</small>
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
                  Tính năng phổ biến:
                </Typography>
                {(eventId === 43 || eventId === 44) &&
                  <>
                    <Button sx={{ minWidth: '140px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/${event?.slug}`} size="small">
                      Tra cứu vị trí ngồi
                    </Button>
                    <Button sx={{ minWidth: '140px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/thiet-lap-tran-dau`} size="small">
                      Thiết lập trận đấu
                    </Button>
                  </>
                }
                <Button sx={{ minWidth: '210px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/event-detail`} size="small">
                  Chỉnh sửa thông tin sự kiện
                </Button>
                <Button sx={{ minWidth: '120px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/transactions/create`} size="small">
                  Tạo giao dịch
                </Button>
                <Button sx={{ minWidth: '100px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/check-in/qr`} size="small">
                  Check-in
                </Button>
                <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/schedules`} size="small">
                  Thiết lập show diễn
                </Button>
                <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/shows`} size="small">
                  Thiết lập loại vé
                </Button>
                {(eventId === 43 || eventId === 44) &&
                  <>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/shows`} size="small">
                      Thay đổi tên bàn
                    </Button>
                    <Button sx={{ minWidth: '170px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/schedules`} size="small">
                      Khóa/Mở khóa tra cứu
                    </Button>
                  </>
                }
                {eventId === 43 &&
                  <>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/leaderboard`} size="small">
                      Leaderboard Duo
                    </Button>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/so-do-tran-dau-lobbies`} size="small">
                      Sơ đồ trận Lobby
                    </Button>
                  </>

                }
                {eventId == 44 &&
                  <>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/leaderboard-a`} size="small">
                      Leaderboard Solo A
                    </Button>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/leaderboard-b`} size="small">
                      Leaderboard Solo B
                    </Button>
                    <Button sx={{ minWidth: '170px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/leaderboard-arena`} size="small">
                      Leaderboard Solo Arena
                    </Button>
                    <Button sx={{ minWidth: '170px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/leaderboard-arena-final`} size="small">
                      Leaderboard Solo Final
                    </Button>
                    <Button sx={{ minWidth: '150px' }} color="primary" variant="text" target="_blank" component={RouterLink} href={`/event-studio/events/${eventId}/so-do-tran-dau-lobbies`} size="small">
                      Sơ đồ trận Lobby
                    </Button>
                  </>
                }
              </Stack>
            </Card>

          </Stack>


        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid lg={4} sm={6} xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
                  <Stack spacing={1}>
                    <Typography color="text.secondary" variant="overline">
                      Tổng doanh thu
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
                      Đơn hàng
                    </Typography>
                  </Stack>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-primary-main)' variant="body2">
                        {eventOverview?.countTotalTickets}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      Vé
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
                      Đã hoàn tất
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
                        Đơn hàng đã xuất
                      </Typography>
                    </Stack>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                      <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                        <Typography color='var(--mui-palette-success-main)' variant="body2">
                          {eventOverview?.countCompletedTickets}
                        </Typography>
                      </Stack>
                      <Typography color="text.secondary" variant="caption" >
                        Vé
                      </Typography>
                    </Stack>
                  </Stack>

                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Typography color="primary" variant="caption" component={Button} onClick={() => setOpenCashWithdrawalModal(true)}>
                      Rút tiền ?
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
                      Đang chờ
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
                      Đơn hàng chưa xuất
                    </Typography>
                  </Stack>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-warning-main)' variant="body2">
                        {eventOverview?.countPendingTickets}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      Vé
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
                      Đơn hủy
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
                      Khóa bởi nhân viên
                    </Typography>
                  </Stack>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
                    <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
                      <Typography color='var(--mui-palette-secondary-main)' variant="body2">
                        {eventOverview?.countCancelledTransactionsCustomerCancelled}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      Hủy bởi khách hàng
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
                      hủy chưa t.toán
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
                      hủy sau thanh toán
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
                      đã hoàn tiền
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
                      Vé
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
      <Stack spacing={3} sx={{ mt: 5 }}>
        <Typography variant="h4">Suất diễn & loại vé</Typography>
        <Grid container spacing={3}>
          <Grid lg={5} md={5} xs={12} spacing={3}>
            <Stack spacing={3}>
              <Schedules shows={event?.shows} onSelectionChange={handleSelectionChange} />
              {selectedSchedule &&
                <TicketCategories show={selectedSchedule} onCategoriesSelect={(categoryIds: number[]) => handleCategorySelection(categoryIds)} />
              }
            </Stack>
          </Grid>
        </Grid>
      </Stack>
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
                Để rút tiền, quý khách vui lòng gửi email với tiêu đề <b>"Yêu cầu rút tiền sự kiện {event?.name}"</b> từ địa chỉ email <b>{event?.organizerEmail}</b> của quý khách đến địa chỉ email <b>tienphongsmart@gmail.com</b>. Chúng tôi sẽ hỗ trợ trong thời gian 24h kể từ khi nhận được yêu cầu. Xin cảm ơn!
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
            <CardHeader title='Quy định chung' />
            <Divider />
            <CardContent>
              <Stack spacing={1} textAlign={'justify'}>
                <Typography variant="body2">
                  <b>Để sự kiện được nâng cấp thành Sự kiện Được xác thực, Nhà tổ chức sự kiện vui lòng tuân thủ các quy định dưới đây trước khi gửi yêu cầu:</b>
                </Typography>
                <Typography variant="body2">
                  - Sự kiện có đầy đủ thông tin về tên, mô tả, đơn vị tổ chức, ảnh bìa, ảnh đại diện.
                </Typography>
                <Typography variant="body2">
                  - Thời gian và địa điểm rõ ràng, chính xác. Hạn chế thay đổi thông tin về thời gian, địa điểm và phải thông báo cho ETIK trước khi thay đổi.
                </Typography>
                <Typography variant="body2">
                  - Chính sách Giá vé, chính sách hoàn trả, hủy vé rõ ràng, minh bạch.
                </Typography>
                <Typography variant="body2">
                  - Sự kiện tuân thủ quy định của pháp luật Việt Nam, phù hợp chuẩn mực đạo đức, thuần phong mỹ tục.
                </Typography>
                <Typography variant="body2">
                  - Cung cấp cho ETIK các thông tin, giấy tờ để xác minh khi được yêu cầu.
                </Typography>
                <Typography variant="body2">
                  Nếu cần hỗ trợ, Quý khách vui lòng liên hệ Hotline CSKH <b>0333.247.242</b> hoặc email <b>tienphongsmart@gmail.com</b>
                </Typography>
              </Stack>
              <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="contained" color="primary" onClick={handleSendRequestEventApproval} disabled={isLoading}>
                  Gửi yêu cầu
                </Button>
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </Modal>
    </>
  );
}
