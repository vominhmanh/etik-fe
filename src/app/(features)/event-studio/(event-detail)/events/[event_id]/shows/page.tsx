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
import { LocalizedLink } from '@/components/localized-link';

import * as React from 'react';

import { CompaniesFilters } from '@/components/dashboard/integrations/integrations-filters';
import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { Accordion, AccordionDetails, AccordionSummary, CardHeader, Container, FormControlLabel, IconButton, InputLabel, Modal, OutlinedInput, Switch } from '@mui/material';
import { ArrowRight, Calendar, Clock, Users } from '@phosphor-icons/react';
import { Pencil } from '@phosphor-icons/react/dist/ssr';
import dayjs from 'dayjs';

interface TicketCategory {
  id: number;
  name: string;
  type: string; // or enum if `TicketCategoryType` is defined as such
  price: number;
  avatar?: string | null;
  description?: string | null;
  status: string; // or enum if `TicketCategoryStatus` is defined as such
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

type ColorMap = {
  [key: number]: string
}

const colorMap: ColorMap = {
  0: deepOrange[500],
  1: deepPurple[500],
  2: green[500],
  3: cyan[500],
  4: indigo[500],
  5: pink[500],
  6: yellow[500],
  7: deepPurple[300],
};
export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  const { tt, locale } = useTranslation();
  const statusMap = getStatusMap(tt);
  const typeMap = getTypeMap(tt);

  React.useEffect(() => {
    document.title = tt("Hạng mục vé | ETIK - Vé điện tử & Quản lý sự kiện", "Ticket Categories | ETIK - E-tickets & Event Management");
  }, [tt]);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [shows, setShows] = React.useState<Show[]>([]);
  const [openEditorModal, setOpenEditorModal] = React.useState(false);
  const [selectedShow, setSelectedShow] = React.useState<Show | null>(null);
  const [selectedTicketCategory, setSelectedTicketCategory] = React.useState<TicketCategory | null>(null);
  const [formDataQuantity, setFormDataQuantity] = React.useState(0);
  const [formDataDisabled, setFormDataDisabled] = React.useState(false);

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

    fetchShowsWithTicketCategories();
  }, [params.event_id]);

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
              <Typography variant="h4">{tt("Hạng mục vé", "Ticket Categories")}</Typography>
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
          <CompaniesFilters />
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
                      </Stack>
                      <Stack direction="row" spacing={1}>
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
                                        bgcolor: colorMap[ticketCategory.id % 8],
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
        </Stack>
      </Stack>

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
    </>
  );
}
