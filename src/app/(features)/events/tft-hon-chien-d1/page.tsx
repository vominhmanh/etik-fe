'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Avatar, Box, Container, Modal, Table, TableBody, TableCell, TableRow, keyframes } from '@mui/material';
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
  shows: Show[];
};

const options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const coordsMap: Record<string, { top: string; left: string}> = {
  "Bàn 1": { top: "42%", left: "45%" },
  "Bàn 2": { top: "49%", left: "25.5%" },
  "Bàn 3": { top: "37%", left: "25.5%" },
  "Bàn 4": { top: "28.5%", left: "36.5%" },
  "Bàn 5": { top: "28.5%", left: "53%" },
  "Bàn 6": { top: "37%", left: "65%" },
  "Bàn 7": { top: "48%", left: "65.5%" },
  "Bàn 8": { top: "17.5%", left: "44.5%" },
  "Bàn 9": { top: "56%", left: "14%" },
  "Bàn 10": { top: "42.5%", left: "11%" },
  "Bàn 11": { top: "29.5%", left: "13%" },
  "Bàn 12": { top: "19.5%", left: "27%" },
  "Bàn 13": { top: "19.5%", left: "60.5%" },
  "Bàn 14": { top: "29.5%", left: "74.5%" },
  "Bàn 15": { top: "42.8%", left: "78%" },
  "Bàn 16": { top: "55.8%", left: "75%" },
  "Bàn 17": { top: "87.8%", left: "14%" },
};

export default function Page(): React.JSX.Element {
  const params = { event_slug: 'tft-hon-chien-d1' }
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [selectedCategories, setSelectedCategories] = React.useState<Record<number, number | null>>({});
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  const [customer, setCustomer] = React.useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
  });
  const [paymentMethod, setPaymentMethod] = React.useState<string>('napas247');
  const [ticketHolders, setTicketHolders] = React.useState<string[]>(['']);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const captchaRef = React.useRef<ReCAPTCHA | null>(null);
  const [position, setPosition] = React.useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [ticketHolderEditted, setTicketHolderEditted] = React.useState<boolean>(false);
  const [ticketCategoryName, setTicketCategoryName] = React.useState<string>('');
  const [searchingAddress, setSearchingAddress] = React.useState<string>('');
  const [searchingName, setSearchingName] = React.useState<string>('');
  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);
  const coords = coordsMap[ticketCategoryName] || { top: "0", left: "0" };

  React.useEffect(() => {
    console.log('Selected table:', ticketCategoryName, '→ coords:', coords);
  }, [ticketCategoryName, coords]);

  React.useEffect(() => {
    document.title = `Sự kiện ${event?.name} | ETIK - Vé điện tử & Quản lý sự kiện`;
  }, [event]);

  const totalAmount = React.useMemo(() => {
    return Object.entries(selectedCategories).reduce((total, [showId, category]) => {
      const show = event?.shows.find((show) => show.id === parseInt(showId));
      const ticketCategory = show?.ticketCategories.find((cat) => cat.id === category);
      return total + (ticketCategory?.price || 0) * (ticketQuantity || 0);
    }, 0)
  }, [selectedCategories])

  const handleCloseSuccessModal = (event: {}, reason: "backdropClick" | "escapeKeyDown") => {
    setOpenSuccessModal(false)
  }

  // Fetch event details on component mount
  React.useEffect(() => {
    if (params.event_slug) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
            `/marketplace/events/${params.event_slug}`
          );
          setEvent(response.data);
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
    const tmpObj = {}
    selected.forEach((s) => { tmpObj[s.id] = selectedCategories[s.id] || null })
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

      // Call your search-transaction endpoint
      const res: AxiosResponse<SearchTransactionDTO> = await baseHttpServiceInstance.get('/special_events/tft-2025/search-transaction', {
        params: {
          show_id: showId,
          // prefer address if filled, otherwise search by name
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
                <img
                  src={event?.bannerUrl || ''}
                  alt="Sự kiện"
                  style={{
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
                    <Stack direction="row" spacing={2} style={{ alignItems: 'center' }}>
                      <div>
                        {event?.avatarUrl ?
                          <img src={event?.avatarUrl} style={{ height: '80px', width: '80px', borderRadius: '50%' }} />
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
                          : 'Chưa xác định'}
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
              <Typography variant="h6">Tìm kiếm vị trí ngồi của bạn</Typography>
            </Stack>
          </Stack>
          <Grid container spacing={3}>
            <Grid item lg={4} md={6} xs={12}>
              <Stack spacing={3}>
                <Schedules shows={event?.shows} onSelectionChange={handleSelectionChange} />
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
                              !ticketHolderEditted && ticketHolders.length > 0 &&
                                setTicketHolders((prev) => {
                                  const updatedHolders = [...prev];
                                  // Update the first item
                                  updatedHolders[0] = e.target.value;
                                  return updatedHolders;
                                });
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
                              !ticketHolderEditted && ticketHolders.length > 0 &&
                                setTicketHolders((prev) => {
                                  const updatedHolders = [...prev];
                                  // Update the first item
                                  updatedHolders[0] = e.target.value;
                                  return updatedHolders;
                                });
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
                  <Table sx={{ backgroundColor: "transparent"}}>
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

                 {coords.top !== "0" && coords.left !== "0" &&
                  <Box position="relative" display="inline-block">
                    <Box
                      component="img"
                      src="/assets/tft_map.jpg"
                      sx={{
                        borderRadius: 1,
                        height: '250px',
                        width: 'auto',
                        display: 'block',
                      }}
                    />

                    {/* Blinking white circle */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: coords.top,
                        left: coords.left,
                        width: 15,
                        height: 15,
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        animation: `${blink} 1s infinite`,
                        boxShadow: '0 0 10px white',
                      }}
                    />
                  </Box>}
                  <Typography variant="body2" sx={{ textAlign: 'justify' }}>Cảm ơn bạn đã tham gia TFT Hỗn chiến - mùa 2. Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ trọng tài giải đấu.</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Modal>
    </div>
  );
}
