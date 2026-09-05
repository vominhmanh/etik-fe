'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Avatar, Box, Container, Modal, Table, TableBody, TableCell, TableRow } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import * as React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

import NotificationContext from '@/contexts/notification-context';

import { Schedules } from './schedules';

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
};

export type Show = {
  id: number;
  name: string;
  type: string;
  status: string;
  disabled: boolean;
  avatar: string | null;
  startDateTime: string; // backend response provides date as string
  endDateTime: string; // backend response provides date as string
  ticketCategories: TicketCategory[];
};

export interface SearchTransactionDTO {
  transaction_id: number;
  address: string;
  name: string;
  ticket_category: { id: number; name: string };
}

export type EventResponse = {
  name: string;
  organizer: string;
  description: string;
  startDateTime: string | null;
  endDateTime: string | null;
  place: string | null;
  locationUrl: string | null;
  bannerUrl: string | null;
  avatarUrl: string | null;
  slug: string;
  locationInstruction: string | null;
  timeInstruction: string | null;
  shows: Show[];
};

export default function Page(): React.JSX.Element {
  const params = { event_slug: 'tft-hon-chien-2026-4vs4' }
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [shows, setShows] = React.useState<Show[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<Record<number, number | null>>({});
  const [customer, setCustomer] = React.useState({
    name: '',
    address: '',
  });
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const captchaRef = React.useRef<ReCAPTCHA | null>(null);
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [ticketCategoryName, setTicketCategoryName] = React.useState<string>('');
  const [searchingAddress, setSearchingAddress] = React.useState<string>('');
  const [searchingName, setSearchingName] = React.useState<string>('');
  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);

  React.useEffect(() => {
    document.title = `Sự kiện ${event?.name} | ETIK - Vé điện tử & Quản lý sự kiện`;
  }, [event]);

  const handleCloseSuccessModal = (event: {}, reason: "backdropClick" | "escapeKeyDown") => {
    setOpenSuccessModal(false)
  }

  // Fetch event details on component mount
  React.useEffect(() => {
    if (params.event_slug) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          const [eventResponse, showsResponse]: [AxiosResponse<EventResponse>, AxiosResponse<Show[]>] = await Promise.all([
            baseHttpServiceInstance.get(`/marketplace/events/${params.event_slug}`),
            // API riêng cho trang tra-cứu: lấy TẤT CẢ Game (kể cả nội bộ), khác với
            // event.shows ở trên vốn chỉ có Game công khai.
            baseHttpServiceInstance.get('/special_events/tft-2026-4vs4/shows'),
          ]);
          setEvent(eventResponse.data);
          // Bỏ Game đầu tiên vì đó là Game ghi danh, không cần tra cứu vị trí.
          setShows(showsResponse.data.slice(1));
        } catch (error) {
          notificationCtx.error('Lỗi:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    }
  }, [params.event_slug]);

  const handleSelectionChange = (selected: Show[]) => {
    setSelectedSchedules(selected);
    const tmpObj: Record<number, number | null> = {};
    selected.forEach((s) => { tmpObj[s.id] = selectedCategories[s.id] ?? null })
    setSelectedCategories(tmpObj);
  };

  const handleSubmit = async () => {

    if (!customer.name && !customer.address) {
      notificationCtx.warning('Vui lòng điền ít nhất một thông tin');
      return;
    }

    const captchaValue = captchaRef.current?.getValue();
    if (!captchaValue) {
      notificationCtx.warning('Vui lòng xác nhận reCAPTCHA!');
      return;
    }

    if (Object.keys(selectedSchedules).length == 0) {
      notificationCtx.warning('Vui lòng chọn trận đấu');
      return;
    }

    try {
      setIsLoading(true);
      // Pick the first selected show
      const showId = selectedSchedules[0].id;

      const res: AxiosResponse<SearchTransactionDTO> = await baseHttpServiceInstance.get('/special_events/tft-2026-4vs4/search-transaction', {
        params: {
          show_id: showId,
          captcha: captchaValue,
          address: customer.address || undefined,
          name: !customer.address ? customer.name : undefined,
        },
      });
      setSearchingAddress(res.data.address)
      setSearchingName(res.data.name)
      setTicketCategoryName(res.data.ticket_category.name);
      setOpenSuccessModal(true)

    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      setIsLoading(false);
      captchaRef.current?.reset()
    }
  };
  return (
    <div
      style={{
        scrollBehavior: 'smooth',
        backgroundColor: '#d1f9db',
        backgroundImage: `linear-gradient(356deg, #d1f9db 0%, #fffed9 100%)`,
      }}
    >
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
      <Container maxWidth="xl" sx={{ py: '64px' }}>
        <Stack spacing={3}>
          <Grid container spacing={3}>
            <Grid item lg={8} md={6} xs={12}>
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
                <Box component="img"
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
            </Grid>
            <Grid item lg={4} md={6} xs={12}>
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
                          : 'Chưa xác định'} {event?.timeInstruction ? `(${event?.timeInstruction})` : ''}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {event?.place ? `${event?.place}` : 'Chưa xác định'} {event?.locationInstruction && event.locationInstruction} {event?.locationUrl && <a href={event.locationUrl} target='_blank'>Xem bản đồ</a>}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Stack direction="row" spacing={3}>
            <Grid container spacing={3}>
              <Grid item lg={8} md={6} xs={12}>
                <Card>
                  <CardContent>
                    {event?.description ? (
                      <Box
                        sx={{
                          margin: 0,
                          padding: 0,
                          '& img': {
                            maxWidth: '100%', // Set images to scale down if they exceed container width
                            height: 'auto', // Maintain aspect ratio
                          },
                        }}
                        dangerouslySetInnerHTML={{ __html: event?.description }}
                      />
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Chưa có mô tả
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item lg={4} md={6} xs={12}></Grid>
            </Grid>
          </Stack>
          <div
            id="registration"
            style={{ display: 'block', height: '100px', marginTop: '-100px', visibility: 'hidden' }}
          ></div>
          <Stack direction="row" spacing={3}>
            <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
              <Typography variant="h6">Tra cứu thông tin thi đấu</Typography>
            </Stack>
          </Stack>
          <Grid container spacing={3}>
            <Grid item lg={4} md={6} xs={12}>
              <Stack spacing={3}>
                <Schedules shows={shows} onSelectionChange={handleSelectionChange} />
              </Stack>
            </Grid>
            <Grid item lg={8} md={6} xs={12}>
              <Stack spacing={3}>
                {/* Customer Information Card */}
                <Card>
                  <CardHeader subheader="Vui lòng điền một trong các trường thông tin phía dưới." title="Thông tin người chơi" />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item lg={3} xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Số báo danh</InputLabel>
                          <OutlinedInput
                            label="Số báo danh"
                            name="customer_address"
                            value={customer.address}
                            onChange={(e) => {
                              setCustomer({ ...customer, address: e.target.value })
                            }} />
                        </FormControl>
                      </Grid>
                      <Grid item lg={1} xs={12} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2">Hoặc</Typography>
                      </Grid>
                      <Grid item lg={8} xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Tên đội thi đấu</InputLabel>
                          <OutlinedInput
                            label="Tên đội thi đấu"
                            name="customer_name"
                            value={customer.name}
                            onChange={(e) => {
                              setCustomer({ ...customer, name: e.target.value })
                            }} />
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>


                {/* Submit Button */}
                <Grid spacing={3} container sx={{ alignItems: 'center', mt: '3' }}>
                  <Grid item sm={9} xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', }}>
                    <ReCAPTCHA
                      sitekey="6LdRnq4aAAAAAFT6htBYNthM-ksGymg70CsoYqHR"
                      ref={captchaRef}
                    />
                  </Grid>
                  <Grid item sm={3} xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', }}>
                    <div>
                      <Button variant="contained" onClick={handleSubmit}>
                        Tìm kiếm
                      </Button>
                    </div>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Container>

      <Modal
        open={openSuccessModal}
        onClose={handleCloseSuccessModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Container maxWidth="xl">
          <Card sx={{
            scrollBehavior: 'smooth',
            backgroundColor: '#d1f9db',
            backgroundImage: `linear-gradient(356deg, #d1f9db 0%, #fffed9 100%)`,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { sm: '500px', xs: '90%' },
            bgcolor: 'background.paper',
            boxShadow: 24,
          }}>
            <CardContent>
              <Stack spacing={3} direction={{ sm: 'column', xs: 'column' }} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Stack spacing={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '450px', maxWidth: '100%' }}>
                  <Typography variant="h4">{`${ticketCategoryName || 'Không tìm thấy bàn'}`}</Typography>
                  <Table sx={{ backgroundColor: "transparent" }}>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ borderBottom: "none", p: 1, textAlign: 'left' }}>
                          <Typography variant="body1">Game đấu:</Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: "none", p: 1 }}>
                          <Typography variant="body1">{selectedSchedules.length > 0 && selectedSchedules[0].name}</Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ borderBottom: "none", p: 1, textAlign: 'left' }}>
                          <Typography variant="body1">Số báo danh: </Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: "none", p: 1 }}>
                          <Typography variant="body1">{searchingAddress}</Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ borderBottom: "none", p: 1, textAlign: 'left' }}>
                          <Typography variant="body1">Tên đội thi đấu: </Typography>
                        </TableCell>
                        <TableCell sx={{ borderBottom: "none", p: 1 }}>
                          <Typography variant="body1">{searchingName}</Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Typography variant="body2" sx={{ textAlign: 'justify' }}>Cảm ơn bạn đã tham gia TFT Hỗn chiến - mùa 3. Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ trọng tài giải đấu.</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>
    </div>
  );
}
