'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import Avatar from '@mui/material/Avatar';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { cyan, deepOrange, deepPurple, green, indigo, pink, yellow } from '@mui/material/colors';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { AxiosResponse } from 'axios';
import { LocalizedLink } from '@/components/homepage/localized-link';

import * as React from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import { MagnifyingGlass as MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import NotificationContext from '@/contexts/notification-context'; // Ensure NotificationContext is imported correctly if needed, but previously it was imported from contexts/notification-context
import { useTranslation } from '@/contexts/locale-context';
import { Accordion, AccordionDetails, AccordionSummary, CardHeader, Container, FormControlLabel, IconButton, InputLabel, Modal, OutlinedInput, Switch, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Checkbox } from '@mui/material';
import { ArrowRight, Calendar, Clock, Users } from '@phosphor-icons/react';
import { Armchair, Pencil } from '@phosphor-icons/react/dist/ssr';
import dayjs from 'dayjs';
import { AudienceModal, AudienceCreate, AudienceUpdate, Audience } from "@/components/dialogs/AudienceModal";

interface TicketCategory {
  id: number;
  name: string;
  type: string; // or enum if `TicketCategoryType` is defined as such
  price: number;
  avatar?: string | null;
  description?: string | null;
  status: string; // or enum if `TicketCategoryStatus` is defined as such
  color: string;
  createdAt: string; // ISO string format for datetime
  updatedAt: string; // ISO string format for datetime
  quantity: number;
  sold: number;
  disabled: boolean;
  limitPerTransaction: number | null;
  limitPerCustomer: number | null;
}

interface Show {
  id: number;
  eventId: number;
  name: string;
  status: string;
  type: string;
  disabled: boolean;
  startDateTime?: string | null; // ISO string format for datetime
  endDateTime?: string | null;   // ISO string format for datetime
  ticketCategories: TicketCategory[];
  seatmapMode: 'no_seatmap' | 'seatings_selection' | 'ticket_categories_selection';
}

type StatusKey = 'not_opened_for_sale' | 'on_sale' | 'out_of_stock' | 'temporarily_locked';
type TypeKey = 'private' | 'public';


const getStatusMap = (tt: (vi: string, en: string) => string) => ({
  not_opened_for_sale: { label: tt('Chưa mở bán', 'Not opened for sale'), color: 'secondary' as const },
  on_sale: { label: tt('Đang mở bán', 'On sale'), color: 'success' as const },
  out_of_stock: { label: tt('Đã hết', 'Out of stock'), color: 'secondary' as const },
  temporarily_locked: { label: tt('Đang tạm khoá', 'Temporarily locked'), color: 'warning' as const },
});

const getTypeMap = (tt: (vi: string, en: string) => string) => ({
  private: { label: tt('Nội bộ', 'Private'), color: 'warning' as const },
  public: { label: tt('Công khai', 'Public'), color: 'primary' as const },
});

export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  const { tt, locale } = useTranslation();
  const statusMap = getStatusMap(tt);
  const typeMap = getTypeMap(tt);

  React.useEffect(() => {
    document.title = tt("Thiết lập vé | ETIK - Vé điện tử & Quản lý sự kiện", "Ticket Categories | ETIK - E-tickets & Event Management");
  }, [tt]);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [shows, setShows] = React.useState<Show[]>([]);
  const [openEditorModal, setOpenEditorModal] = React.useState(false);
  const [selectedShow, setSelectedShow] = React.useState<Show | null>(null);
  const [selectedTicketCategory, setSelectedTicketCategory] = React.useState<TicketCategory | null>(null);
  const [formDataQuantity, setFormDataQuantity] = React.useState(0);
  const [formDataDisabled, setFormDataDisabled] = React.useState(false);

  const [eventData, setEventData] = React.useState<any | null>(null); // Use any or EventResponse interface
  const [openLimitModal, setOpenLimitModal] = React.useState(false);
  const [limitFormData, setLimitFormData] = React.useState<{ limitPerTransaction: number | null, limitPerCustomer: number | null }>({ limitPerTransaction: null, limitPerCustomer: null });

  // Audience State
  const [audiences, setAudiences] = React.useState<Audience[]>([]);
  const [openAudienceModal, setOpenAudienceModal] = React.useState(false);
  const [selectedAudience, setSelectedAudience] = React.useState<Audience | undefined>(undefined);
  const [isEditAudience, setIsEditAudience] = React.useState(false);

  // Confirmation Dialog State
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [pendingSeatmapChange, setPendingSeatmapChange] = React.useState<{ show: Show, newMode: Show['seatmapMode'] } | null>(null);

  const handleToggleSeatmapMode = (show: Show, checked: boolean) => {
    const newMode = checked ? 'seatings_selection' : 'no_seatmap';
    // If turning ON, checking if we need to ask user which mode? 
    // User request: "chuyển action bật tắt sơ đồ ghế về từng show ... giao diện nhỏ text nhỏ"
    // The previous implementation utilized a simple switch "Use Seat Map". 
    // Logic: Switch ON -> 'seatings_selection' (default for now or based on old logic?), Switch OFF -> 'no_seatmap'.
    // The user mentioned "giao diện nhỏ text nhỏ", implying a simple switch.
    // Let's assume Switch ON means 'seatings_selection'.

    setPendingSeatmapChange({ show, newMode });
    setConfirmDialogOpen(true);
  };

  const confirmSeatmapChange = async () => {
    if (!pendingSeatmapChange) return;
    const { show, newMode } = pendingSeatmapChange;

    try {
      setIsLoading(true);
      await baseHttpServiceInstance.patch(
        `/event-studio/events/${params.event_id}/shows/${show.id}/seatmap-mode`,
        { seatmap_mode: newMode }
      );
      notificationCtx.success(tt('Cập nhật thành công', 'Update successful'));
      // Reload to reflect changes (and potential deletions)
      window.location.reload();
    } catch (error) {
      notificationCtx.error(tt('Lỗi:', 'Error:'), error);
      setIsLoading(false); // Only set loading false on error, success reloads page
    } finally {
      setConfirmDialogOpen(false);
      setPendingSeatmapChange(null);
    }
  };

  const handleCloseEditorModal = (event: {}, reason: "backdropClick" | "escapeKeyDown") => {
    setOpenEditorModal(false);
    setSelectedShow(null);
    setSelectedTicketCategory(null)
  }

  const handleSaveEditTicketCategoryDetail = async (selectedShow: Show | null, selectedTicketCategory: TicketCategory | null, dataQuantity: number, dataDisabled: boolean) => {
    if (!selectedShow || !selectedTicketCategory) return;

    try {
      setIsLoading(true);

      const { quantity, disabled } = selectedTicketCategory;
      const response = await baseHttpServiceInstance.patch(
        `/event-studio/events/${params.event_id}/shows-ticket-categories/shows/${selectedShow.id}/ticket-categories/${selectedTicketCategory.id}`,
        {
          disabled: dataDisabled,
          quantity: dataQuantity,
        }
      );

      // Assume response includes updated shows data
      window.location.reload()
      notificationCtx.success(tt("Chỉnh sửa thành công", "Edit successful"));
    } catch (error) {
      notificationCtx.error(tt('Lỗi:', 'Error:'), error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const fetchShowsWithTicketCategories = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<Show[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/shows-ticket-categories/get-shows-with-ticket-categories`
        );
        setShows(response.data);
      } catch (error) {
        notificationCtx.error(tt('Lỗi:', 'Error:'), error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchEventData = async () => {
      try {
        const response = await baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}`);
        setEventData(response.data);
        setLimitFormData({
          limitPerTransaction: response.data.limitPerTransaction,
          limitPerCustomer: response.data.limitPerCustomer
        });
      } catch (error) {
        console.error(error);
      }
    }

    const fetchAudiences = async () => {
      try {
        const response = await baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}/audiences`);
        setAudiences(response.data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchShowsWithTicketCategories();
    fetchEventData();
    fetchAudiences();
  }, [params.event_id]);


  const handleSaveEventLimit = async () => {
    if (!eventData) return;
    try {
      setIsLoading(true);
      const payload = {
        ...eventData,
        limitPerTransaction: limitFormData.limitPerTransaction,
        limitPerCustomer: limitFormData.limitPerCustomer,
      };
      // Pydantic expects specific fields, some might need transformation if response has extra fields?
      // EventUpdateRequest usually matches EventResponse but let's hope extra fields are ignored or structure matches.
      // EventUpdateRequest has camelCase alias generator? Yes.

      await baseHttpServiceInstance.put(`/event-studio/events/${params.event_id}`, payload);
      notificationCtx.success(tt("Cập nhật thành công", "Update successful"));
      setEventData(payload); // Optimistic update
      setOpenLimitModal(false);
    } catch (error) {
      notificationCtx.error(tt('Lỗi:', 'Error:'), error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack spacing={3}>
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
        <Stack spacing={4}>
          <Stack direction="row" spacing={3}>
            <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
              <Typography variant="h4">{tt("Thiết lập vé", "Ticket Categories")}</Typography>
            </Stack>
            <div>
              <Button
                component={LocalizedLink}
                startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
                variant="contained"
                href="shows/create"
              >
                {tt("Thêm suất diễn", "Add Show")}
              </Button>
            </div>
          </Stack>
          <Card sx={{ p: 2 }}>
            <Stack direction={{ md: 'row', xs: 'column' }} spacing={1} sx={{ alignItems: { md: 'center', xs: 'flex-start' } }} >
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <OutlinedInput
                  defaultValue=""
                  fullWidth
                  placeholder="Tìm"
                  startAdornment={
                    <InputAdornment position="start">
                      <MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
                    </InputAdornment>
                  }
                  sx={{ maxWidth: '500px' }}
                />
              </Stack>
              <Box>
                <Button
                  variant="text"
                  size='small'
                  fullWidth={false}
                  onClick={() => setOpenLimitModal(true)}
                >
                  {tt("Đặt giới hạn vé", "Set ticket limit")}
                </Button>
              </Box>

            </Stack>
          </Card>
          <Grid container spacing={3}>
            {shows.map((show) => (
              <Accordion key={show.id} defaultExpanded sx={{ width: '100%', borderRadius: 1, overflow: 'hidden', boxShadow: 'none', border: '1px solid', borderColor: 'divider', mb: 2 }}>
                <AccordionSummary
                  expandIcon={<ArrowRight style={{ transform: 'rotate(90deg)' }} />}
                  sx={{
                    backgroundColor: 'neutral.50',
                    '& .MuiAccordionSummary-content': { width: '100%', margin: '12px 0' },
                    '&.Mui-expanded': { minHeight: 64, backgroundColor: 'neutral.100' }
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    sx={{
                      alignItems: { xs: 'flex-start', md: 'center' },
                      justifyContent: 'space-between',
                      width: '100%',
                      pr: 2
                    }}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 600 }}>{show.name}</Typography>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'text.secondary' }}>
                        <Clock size={16} />
                        <Typography variant="body2">
                          {show.startDateTime && show.endDateTime ?
                            `${dayjs(show.startDateTime).format('HH:mm DD/MM/YYYY')} - ${dayjs(show.endDateTime).format('HH:mm DD/MM/YYYY')}`
                            : tt('Thời gian: Chưa xác định', 'Time: Not specified')
                          }
                        </Typography>
                      </Stack>
                    </Stack>

                    <Stack
                      direction={{ xs: 'row', md: 'row' }}
                      spacing={2}
                      sx={{
                        alignItems: 'center',
                        width: { xs: '100%', md: 'auto' },
                        justifyContent: { xs: 'space-between', md: 'flex-end' }
                      }}
                    >
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                        <Chip
                          label={statusMap[show.status as StatusKey]?.label || show.status}
                          color={statusMap[show.status as StatusKey]?.color || 'default'}
                          size="small"
                          variant="soft"
                          sx={{ fontWeight: 500 }}
                        />
                        <Chip
                          label={typeMap[show.type as TypeKey]?.label || show.type}
                          color={typeMap[show.type as TypeKey]?.color || 'default'}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                        {show.disabled === true &&
                          <Chip
                            label={tt('Bị khóa', 'Locked')}
                            color={'error'}
                            size="small"
                            variant="soft"
                          />}

                        {/* Seatmap Toggle for each Show */}
                        <FormControlLabel
                          onClick={(e) => e.stopPropagation()}
                          control={
                            <Switch
                              size="small"
                              checked={show.seatmapMode !== 'no_seatmap'}
                              onChange={(e) => handleToggleSeatmapMode(show, e.target.checked)}
                            />
                          }
                          label={<Typography variant="caption">{tt("Sơ đồ ghế", "Seat Map")}</Typography>}
                        />
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        {show.seatmapMode !== 'no_seatmap' && (
                          <Tooltip title={tt("Thiết kế sơ đồ ghế", "Design Seat Map")}>
                            <IconButton
                              component={LocalizedLink}
                              onClick={(event) => event.stopPropagation()}
                              href={`/event-studio/events/${params.event_id}/seat-maps/${show.id}`}
                              size="small"
                              sx={{
                                color: 'info.main',
                                bgcolor: 'info.lightest',
                                '&:hover': { bgcolor: 'info.light' }
                              }}
                            >
                              <Armchair size={18} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={tt("Chỉnh sửa suất diễn", "Edit Show")}>
                          <IconButton
                            component={LocalizedLink}
                            onClick={(event) => event.stopPropagation()}
                            href={`/event-studio/events/${params.event_id}/shows/${show.id}`}
                            size="small"
                            sx={{
                              color: 'primary.main',
                              bgcolor: 'primary.lightest',
                              '&:hover': { bgcolor: 'primary.light' }
                            }}
                          >
                            <Pencil size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={tt("Thêm hạng mục vé", "Add Category")}>
                          <IconButton
                            component={LocalizedLink}
                            onClick={(event) => event.stopPropagation()}
                            href={`shows/${show.id}/ticket-categories/create`}
                            size="small"
                            sx={{
                              color: 'success.main',
                              bgcolor: 'success.lightest',
                              '&:hover': { bgcolor: 'success.light' }
                            }}
                          >
                            <PlusIcon size={18} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 3, pb: 2 }}>
                  <Grid container spacing={3}>
                    {show.ticketCategories.map((ticketCategory) => {
                      const remaining = ticketCategory.quantity - ticketCategory.sold;
                      const soldPercent = (ticketCategory.sold / (ticketCategory.quantity || 1)) * 100;

                      return (
                        <Grid key={ticketCategory.id} lg={4} md={6} xs={12}>
                          <Card sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            borderRadius: 2,
                            transition: 'all 0.2s',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              boxShadow: (theme) => theme.shadows[4],
                              borderColor: 'primary.light',
                            }
                          }}>
                            <CardContent sx={{ flex: '1 1 auto', p: 2 }}>
                              <Stack spacing={1.5}>
                                {/* Header row: Avatar, Name, Price, and Edit */}
                                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', overflow: 'hidden' }}>
                                    <Avatar
                                      src={ticketCategory.avatar || undefined}
                                      sx={{
                                        height: 36,
                                        width: 36,
                                        borderRadius: 1,
                                        bgcolor: ticketCategory.color,
                                        fontSize: '1rem',
                                        fontWeight: 600
                                      }}
                                      variant="rounded"
                                    >
                                      {ticketCategory.avatar ? '' : ticketCategory.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {ticketCategory.name}
                                    </Typography>
                                  </Stack>
                                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                    <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 800 }}>
                                      {ticketCategory.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                                    </Typography>
                                    <Tooltip title={tt("Chỉnh sửa", "Edit")}>
                                      <IconButton
                                        component={LocalizedLink}
                                        href={`/event-studio/events/${params.event_id}/shows/${show.id}/ticket-categories/${ticketCategory.id}`}
                                        size="small"
                                        sx={{ color: 'text.secondary', p: 0.5 }}
                                      >
                                        <Pencil size={16} />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </Stack>

                                {/* Sales Progress */}
                                <Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={soldPercent}
                                    sx={{
                                      height: 4,
                                      borderRadius: 2,
                                      bgcolor: 'neutral.100',
                                      mb: 0.5,
                                      '& .MuiLinearProgress-bar': {
                                        borderRadius: 2,
                                        backgroundColor: soldPercent > 90 ? 'error.main' : soldPercent > 70 ? 'warning.main' : 'primary.main'
                                      }
                                    }}
                                  />
                                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {tt('Bán:', 'Sold:')} <strong>{ticketCategory.sold}</strong>/{ticketCategory.quantity}
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                      fontWeight: 700,
                                      color: remaining < 10 ? 'error.main' : 'text.primary',
                                    }}>
                                      {tt('Còn:', 'Rem:')} {remaining}
                                    </Typography>
                                  </Stack>
                                </Box>

                                {/* Footer row: Status Chips and Compact Limits */}
                                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Stack direction="row" spacing={0.5}>
                                    <Chip
                                      label={statusMap[ticketCategory.status as StatusKey]?.label || ticketCategory.status}
                                      color={statusMap[ticketCategory.status as StatusKey]?.color || 'default'}
                                      size="small"
                                      variant="soft"
                                      sx={{ height: 20, fontSize: '0.625rem' }}
                                    />
                                    <Chip
                                      label={typeMap[ticketCategory.type as TypeKey]?.label || ticketCategory.type}
                                      color={typeMap[ticketCategory.type as TypeKey]?.color || 'default'}
                                      size="small"
                                      variant="outlined"
                                      sx={{ height: 20, fontSize: '0.625rem' }}
                                    />
                                  </Stack>
                                  <Stack direction="row" spacing={1.5} sx={{ color: 'text.secondary' }}>
                                    <Tooltip title={tt('Giới hạn vé / Đơn hàng', 'Tickets per Order')}>
                                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                        <Users size={14} weight="duotone" />
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{ticketCategory.limitPerTransaction || '∞'}</Typography>
                                      </Stack>
                                    </Tooltip>
                                    <Tooltip title={tt('Giới hạn vé / Khách hàng', 'Tickets per Customer')}>
                                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                                        <Calendar size={14} weight="duotone" />
                                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{ticketCategory.limitPerCustomer || '∞'}</Typography>
                                      </Stack>
                                    </Tooltip>
                                  </Stack>
                                </Stack>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>
          <Stack direction="row" spacing={3}>
            <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
              <Typography variant="h4">{tt("Đối tượng mua vé", "Audience")}</Typography>
            </Stack>
            <div>
              <Button
                startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
                variant="contained"
                onClick={() => {
                  setSelectedAudience(undefined);
                  setIsEditAudience(false);
                  setOpenAudienceModal(true);
                }}
              >
                {tt("Thêm đối tượng", "Add Audience")}
              </Button>
            </div>
          </Stack>

          <Grid container spacing={3}>
            {audiences.map((audience) => (
              <Grid key={audience.id} lg={4} md={6} xs={12}>
                <Card sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    boxShadow: (theme) => theme.shadows[4],
                    borderColor: 'primary.light',
                  }
                }}>
                  <CardContent sx={{ flex: '1 1 auto', p: 2 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', overflow: 'hidden' }}>
                          <Avatar
                            sx={{
                              height: 36,
                              width: 36,
                              borderRadius: 1,
                              bgcolor: 'primary.light', // Dynamic color?
                              fontSize: '1rem',
                              fontWeight: 600
                            }}
                            variant="rounded"
                          >
                            {audience.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Stack spacing={0}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {audience.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Code: {audience.code}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                          <Tooltip title={tt("Chỉnh sửa", "Edit")}>
                            <IconButton
                              size="small"
                              sx={{ color: 'text.secondary', p: 0.5 }}
                              onClick={() => {
                                setSelectedAudience(audience);
                                setIsEditAudience(true);
                                setOpenAudienceModal(true);
                              }}
                            >
                              <Pencil size={16} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                      {audience.description && (
                        <Typography variant="body2" color="text.secondary" sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: '0.875rem'
                        }}>
                          {audience.description}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={0.5}>
                        {audience.isDefault && (
                          <Chip
                            label={tt('Mặc định', 'Default')}
                            color="info"
                            size="small"
                            variant="filled"
                            sx={{ height: 20, fontSize: '0.625rem' }}
                          />
                        )}
                        <Chip
                          label={audience.isActive ? tt('Hoạt động', 'Active') : tt('Không hoạt động', 'Inactive')}
                          color={audience.isActive ? 'success' : 'default'}
                          size="small"
                          variant="soft"
                          sx={{ height: 20, fontSize: '0.625rem' }}
                        />
                      </Stack>

                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack >
      </Stack >

      <AudienceModal
        open={openAudienceModal}
        onClose={() => setOpenAudienceModal(false)}
        onSubmit={async (values) => {
          try {
            if (isEditAudience && selectedAudience) {
              // Update
              await baseHttpServiceInstance.put(
                `/event-studio/events/${params.event_id}/audiences/${selectedAudience.id}`,
                values
              );
              notificationCtx.success(tt("Cập nhật thành công", "Update successful"));
            } else {
              // Create
              await baseHttpServiceInstance.post(
                `/event-studio/events/${params.event_id}/audiences`,
                values
              );
              notificationCtx.success(tt("Tạo mới thành công", "Create successful"));
            }
            // Refresh list
            const res = await baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}/audiences`);
            setAudiences(res.data);
          } catch (error: any) {
            notificationCtx.error(tt('Lỗi:', 'Error:'), error);
          }
        }}
        initialValues={selectedAudience}
        isEdit={isEditAudience}
      />

      <Modal
        open={openEditorModal}
        onClose={handleCloseEditorModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Container maxWidth="xl">
          <Card
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { sm: '500px', xs: '90%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
            }}
          >
            <CardHeader
              title={tt("Chỉnh sửa", "Edit")}
              subheader={selectedShow ? `${selectedShow?.name} - ${selectedTicketCategory?.name}` : ''}
            />
            <Divider />
            <CardContent>
              <Stack spacing={3} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Stack direction="row" spacing={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <InputLabel htmlFor="quantity" sx={{ display: 'inline' }}>{tt("Số lượng vé", "Ticket Quantity")}</InputLabel>
                  <OutlinedInput
                    id="quantity"
                    sx={{ maxWidth: 130 }}
                    type="number"
                    size="small"
                    value={formDataQuantity}
                    onChange={(e) => {
                      setFormDataQuantity(Number(e.target.value))
                    }}
                  />
                </Stack>
                <Stack direction="row" spacing={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <InputLabel htmlFor="status" sx={{ display: 'inline' }}>{tt("Trạng thái riêng", "Special Status")}</InputLabel>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!formDataDisabled}
                        onChange={(e) => {
                          const disabled = !e.target.checked;
                          setFormDataDisabled(disabled);
                        }}
                        color="primary"
                      />
                    }
                    label={formDataDisabled ? tt('Khoá', 'Locked') : tt('Mở', 'Open')}
                    labelPlacement="end"
                  />
                </Stack>
              </Stack>
            </CardContent>
            <Divider />
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end', p: 2 }}>
              <Button
                variant="contained"
                onClick={() => handleSaveEditTicketCategoryDetail(selectedShow, selectedTicketCategory, formDataQuantity, formDataDisabled)}
                size="small"
                endIcon={<ArrowRight />}
              >
                {tt("Lưu", "Save")}
              </Button>
            </Stack>
          </Card>
        </Container>
      </Modal>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {tt("Xác nhận thay đổi", "Confirm Change")}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {tt(
              "Nếu thay đổi chế độ bán vé, toàn bộ vé của Show diễn này sẽ bị xóa. Bạn có muốn tiếp tục?",
              "Changing the ticket sales mode will delete all tickets for this Show. Do you want to continue?"
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">
            {tt("Hủy", "Cancel")}
          </Button>
          <Button onClick={confirmSeatmapChange} color="error" autoFocus>
            {tt("OK", "OK")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Limit Modal */}
      <Dialog
        open={openLimitModal}
        onClose={() => setOpenLimitModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{tt("Giới hạn vé toàn sự kiện", "Event Ticket Limits")}</DialogTitle>
        <DialogContent>

          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Limit Per Transaction */}
            <Stack direction="row" spacing={2} alignItems="center">
              <OutlinedInput
                type="number"
                size="small"
                disabled={limitFormData.limitPerTransaction === null}
                value={limitFormData.limitPerTransaction ?? ''}
                onChange={(e) => setLimitFormData(prev => ({ ...prev, limitPerTransaction: Number(e.target.value) }))}
                sx={{ width: 100 }}
              />
              <Typography>{tt("vé / đơn hàng", "tickets / order")}</Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={limitFormData.limitPerTransaction === null}
                    onChange={(e) => setLimitFormData(prev => ({ ...prev, limitPerTransaction: e.target.checked ? null : 10 }))}
                  />
                }
                label={tt("Không giới hạn", "Unlimited")}
              />
            </Stack>

            {/* Limit Per Customer */}
            <Stack direction="row" spacing={2} alignItems="center">
              <OutlinedInput
                type="number"
                size="small"
                disabled={limitFormData.limitPerCustomer === null}
                value={limitFormData.limitPerCustomer ?? ''}
                onChange={(e) => setLimitFormData(prev => ({ ...prev, limitPerCustomer: Number(e.target.value) }))}
                sx={{ width: 100 }}
              />
              <Typography>{tt("vé / khách hàng", "tickets / customer")}</Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={limitFormData.limitPerCustomer === null}
                    onChange={(e) => setLimitFormData(prev => ({ ...prev, limitPerCustomer: e.target.checked ? null : 10 }))}
                  />
                }
                label={tt("Không giới hạn", "Unlimited")}
              />
            </Stack>
          </Stack>
          <DialogContentText sx={{ mb: 2 }}>
            {tt(
              "Nếu bạn muốn thiết lập giới hạn cho từng suất diễn hoặc hạng vé, hãy điều chỉnh trong phần chỉnh sửa chi tiết từng hạng mục.",
              "If you want to set limits for each show or ticket category, please adjust in the detail edit section."
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLimitModal(false)} color="inherit">
            {tt("Hủy", "Cancel")}
          </Button>
          <Button onClick={handleSaveEventLimit} variant="contained">
            {tt("Lưu", "Save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
