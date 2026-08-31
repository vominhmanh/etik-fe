'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Avatar, Box, Container, Typography, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, OutlinedInput } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import Backdrop from '@mui/material/Backdrop';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { Gear as GearIcon } from '@phosphor-icons/react/dist/ssr/Gear';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import * as React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

import NotificationContext from '@/contexts/notification-context';
import EditableGrid from './schedule-grid';

const colLabels = Array.from({ length: 17 }, (_, i) => String.fromCharCode(65 + i)); // A–P
const rowLabels = Array.from({ length: 8 }, (_, i) => (i + 1).toString()); // 1–8


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
  avatar: string | null;
  startDateTime: string; // backend response provides date as string
  endDateTime: string; // backend response provides date as string
  ticketCategories: TicketCategory[];
};

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

const options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

import { Tabs, Tab } from '@mui/material';

export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  const eventId = Number.parseInt(params.event_id)
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [selectedTab, setSelectedTab] = React.useState<number>(0);
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
  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);
  const captchaRef = React.useRef<ReCAPTCHA | null>(null);
  const [position, setPosition] = React.useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [ticketHolderEditted, setTicketHolderEditted] = React.useState<boolean>(false);
  
  // Settings Config
  const [configModalOpen, setConfigModalOpen] = React.useState(false);
  const [availableFields, setAvailableFields] = React.useState<{id: string, name: string}[]>([]);
  const [cardFields, setCardFields] = React.useState<string[]>([]);
  const [tooltipFields, setTooltipFields] = React.useState<string[]>([]);
  const [viewMode, setViewMode] = React.useState<'transaction' | 'ticket'>('transaction');
  const [tempViewMode, setTempViewMode] = React.useState<'transaction' | 'ticket'>('transaction');

  const [data, setData] = React.useState(
    rowLabels.map(() =>
      colLabels.map(() => '')
    )
  );

  const handleChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    newData[rowIndex][colIndex] = value;
    setData(newData);
  };

  React.useEffect(() => {
    document.title = `Sự kiện ${event?.name || ''} | ETIK - Vé điện tử & Quản lý sự kiện`;
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
    if (params.event_id) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          const [eventRes, showsRes, fieldsRes, settingsRes] = await Promise.all([
            baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}`),
            baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}/shows-with-ticket-categories`),
            baseHttpServiceInstance.get(`/event-studio/table-arrangements/${params.event_id}/available-fields`),
            baseHttpServiceInstance.get(`/event-studio/table-arrangements/${params.event_id}/settings`)
          ]);
          setEvent({ ...eventRes.data, shows: showsRes.data.shows });
          setAvailableFields(fieldsRes.data);
          setCardFields(settingsRes.data.card_fields || []);
          setTooltipFields(settingsRes.data.tooltip_fields || []);
          
          if (typeof window !== 'undefined') {
            const savedViewMode = (localStorage.getItem(`viewMode_${params.event_id}`) as 'transaction' | 'ticket') || 'transaction';
            setViewMode(savedViewMode);
            setTempViewMode(savedViewMode);
          }
        } catch (error) {
          notificationCtx.error('Lỗi:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    }
  }, [params.event_id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleSaveGlobalConfig = async () => {
    try {
      await baseHttpServiceInstance.post(`/event-studio/table-arrangements/${params.event_id}/settings`, {
        card_fields: cardFields,
        tooltip_fields: tooltipFields
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(`viewMode_${params.event_id}`, tempViewMode);
      }
      setViewMode(tempViewMode);
      notificationCtx.success('Lưu cấu hình thành công!');
      setConfigModalOpen(false);
    } catch (e) {
      notificationCtx.error('Lỗi khi lưu cấu hình', e);
    }
  };

  const handleCategorySelection = (showId: number, categoryId: number) => {
    setSelectedCategories(prevCategories => ({
      ...prevCategories,
      [showId]: categoryId,
    }));
  };

  const handleSelectionChange = (selected: Show[]) => {
    setSelectedSchedules(selected);
    const tmpObj: Record<number, number | null> = {}
    selected.forEach((s) => { tmpObj[s.id] = selectedCategories[s.id] || null })
    setSelectedCategories(tmpObj);
  };

  const handleTicketQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = Number(event.target.value);
    setTicketQuantity(quantity);
    setTicketHolders(Array(quantity).fill('')); // Dynamically update ticket holders array
  };

  const handleTicketHolderChange = (index: number, value: string) => {
    const updatedHolders = [...ticketHolders];
    updatedHolders[index] = value;
    setTicketHolders(updatedHolders);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const handleSubmit = async () => {
    if (!customer.name || !customer.email || !customer.address || ticketQuantity <= 0) {
      notificationCtx.warning('Vui lòng điền các trường thông tin bắt buộc');
      return;
    }

    const captchaValue = captchaRef.current?.getValue();
    if (!captchaValue) {
      notificationCtx.warning('Vui lòng xác nhận reCAPTCHA!');
      return;
    }

    if (Object.keys(selectedCategories).length == 0) {
      notificationCtx.warning('Vui lòng chọn ít nhất 1 loại vé');
      return;
    }

    const emptyTicketShowIds = Object.entries(selectedCategories).filter(([showId, ticketCategoryId]) => (ticketCategoryId == null)).map(([showId, ticketCategoryId]) => (Number.parseInt(showId)));
    if (emptyTicketShowIds.length > 0) {
      const emptyTicketNames = event?.shows.filter(show => emptyTicketShowIds.includes(show.id)).map(show => show.name)
      notificationCtx.warning(`Vui lòng chọn loại vé cho ${emptyTicketNames?.join(', ')}`);
      return;
    }
    try {
      setIsLoading(true);

      const tickets = Object.entries(selectedCategories).map(([showId, ticketCategoryId]) => ({
        showId: parseInt(showId),
        ticketCategoryId,
      }));

      const transactionData = {
        customer,
        tickets,
        paymentMethod,
        ticketHolders: ticketHolders.filter(Boolean), // Ensure no empty names
        quantity: ticketQuantity,
        captchaValue,
        "latitude": position?.latitude,
        "longitude": position?.longitude
      };

      const response = await baseHttpServiceInstance.post(
        `/marketplace/events/${params.event_id}/transactions`,
        transactionData
      );
      // notificationCtx.success('Transaction created successfully!');
      setOpenSuccessModal(true)

      // Redirect to the payment checkout URL
      if (response.data.paymentCheckoutUrl) {
        window.location.href = response.data.paymentCheckoutUrl;
      }
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
                        <Box component="img" src={event?.avatarUrl} style={{ height: '80px', width: '80px', borderRadius: '50%' }} />
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
                      {event?.place ? `${event?.place}` : 'Chưa xác định'} {event?.locationInstruction && event.locationInstruction} {event?.locationUrl && <a href={event.locationUrl} target='_blank'>Xem bản đồ</a>}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <div
          id="registration"
          style={{ display: 'block', height: '100px', marginTop: '-100px', visibility: 'hidden' }}
        ></div>
        <Stack direction="row" spacing={3}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: '1 1 auto' }}>
            <Typography variant="h6">Thiết lập các trận đấu</Typography>
            <Tooltip title="Cấu hình hiển thị thẻ/tooltip cho sự kiện">
              <IconButton onClick={() => setConfigModalOpen(true)} size="small" sx={{ ml: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
                <GearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {event?.shows && event.shows.length > 0 && (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={selectedTab} 
                onChange={handleTabChange} 
                aria-label="show tabs"
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTabs-scroller': {
                    overflowX: 'auto !important',
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': { height: '4px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.1)', borderRadius: '4px' },
                    '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(0,0,0,0.2)' }
                  }
                }}
              >
                {event.shows.map((show, index) => (
                  <Tab label={show.name} id={`show-tab-${index}`} aria-controls={`show-tabpanel-${index}`} key={show.id} />
                ))}
              </Tabs>
            </Box>

            {event.shows.map((show, index) => (
              <div
                role="tabpanel"
                hidden={selectedTab !== index}
                id={`show-tabpanel-${index}`}
                aria-labelledby={`show-tab-${index}`}
                key={show.id}
              >
                {selectedTab === index && (
                  <Box sx={{ pt: 1 }}>
                    <EditableGrid 
                      eventId={Number(params.event_id)} 
                      show={show} 
                      allShows={event.shows} 
                      cardFields={cardFields}
                      tooltipFields={tooltipFields}
                      availableFields={availableFields}
                      viewMode={viewMode}
                    />
                  </Box>
                )}
              </div>
            ))}
          </Box>
        )}
      </Stack>

      <Dialog open={configModalOpen} onClose={() => setConfigModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cấu hình hiển thị</DialogTitle>
        <DialogContent dividers sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Chọn các trường dữ liệu muốn hiển thị trên thẻ người chơi và tooltip khi rê chuột vào thẻ. Cấu hình này áp dụng chung cho sự kiện.
          </Typography>
          
          <FormControl fullWidth>
            <InputLabel>Hiển thị trên thẻ (Card)</InputLabel>
            <Select
              multiple
              value={cardFields}
              onChange={(e: SelectChangeEvent<typeof cardFields>) => setCardFields(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Hiển thị trên thẻ (Card)" />}
              renderValue={(selected) => selected.map(id => availableFields.find(f => f.id === id)?.name || id).join(', ')}
            >
              {availableFields.map((field) => (
                <MenuItem key={field.id} value={field.id}>
                  <Checkbox checked={cardFields.indexOf(field.id) > -1} />
                  <ListItemText primary={field.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Hiển thị trên Tooltip</InputLabel>
            <Select
              multiple
              value={tooltipFields}
              onChange={(e: SelectChangeEvent<typeof tooltipFields>) => setTooltipFields(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Hiển thị trên Tooltip" />}
              renderValue={(selected) => selected.map(id => availableFields.find(f => f.id === id)?.name || id).join(', ')}
            >
              {availableFields.map((field) => (
                <MenuItem key={field.id} value={field.id}>
                  <Checkbox checked={tooltipFields.indexOf(field.id) > -1} />
                  <ListItemText primary={field.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Chế độ xem bảng thi đấu</InputLabel>
            <Select
              value={tempViewMode}
              onChange={(e: SelectChangeEvent) => setTempViewMode(e.target.value as 'transaction' | 'ticket')}
              label="Chế độ xem bảng thi đấu"
            >
              <MenuItem value="transaction">Xem theo giao dịch (Ẩn vé trùng)</MenuItem>
              <MenuItem value="ticket">Xem theo vé (Hiện tất cả)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setConfigModalOpen(false)} color="inherit">Hủy</Button>
          <Button onClick={handleSaveGlobalConfig} variant="contained">Lưu cấu hình</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
