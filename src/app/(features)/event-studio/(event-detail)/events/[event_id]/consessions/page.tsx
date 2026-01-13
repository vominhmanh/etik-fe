'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import Avatar from '@mui/material/Avatar';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
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
import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  OutlinedInput,
  Switch,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { ArrowRight, Clock, Trash } from '@phosphor-icons/react';
import { Warehouse } from '@phosphor-icons/react/dist/ssr';
import dayjs from 'dayjs';

interface Concession {
  id: number;
  eventId: number;
  code: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: number;
  status: 'active' | 'archived';
  createdAt: string;
}

interface ShowConcession {
  id: number;
  showId: number;
  concessionId: number;
  isAvailable: boolean;
  priceOverride: number | null;
  availableFrom: string | null;
  availableTo: string | null;
  createdAt: string;
  updatedAt: string;
  concession: Concession;
}

interface Show {
  id: number;
  eventId: number;
  name: string;
  status: string;
  type: string;
  disabled: boolean;
  startDateTime?: string | null;
  endDateTime?: string | null;
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
  const { tt } = useTranslation();
  const statusMap = getStatusMap(tt);
  const typeMap = getTypeMap(tt);

  React.useEffect(() => {
    document.title = tt("Thiết lập bỏng nước | ETIK - Vé điện tử & Quản lý sự kiện", "Concessions setups | ETIK - E-tickets & Event Management");
  }, [tt]);

  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [shows, setShows] = React.useState<Show[]>([]);

  // Show Concessions State
  const [showConcessionsMap, setShowConcessionsMap] = React.useState<Record<number, ShowConcession[]>>({});
  const [openShowConcessionModal, setOpenShowConcessionModal] = React.useState(false);
  const [selectedShowForConcession, setSelectedShowForConcession] = React.useState<Show | null>(null);
  const [inventory, setInventory] = React.useState<Concession[]>([]);

  const fetchShowConcessions = async (showId: number) => {
    try {
      const res = await baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}/consessions/shows/${showId}/concessions`);
      setShowConcessionsMap(prev => ({ ...prev, [showId]: res.data }));
    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {
    const fetchShows = async () => {
      try {
        setIsLoading(true);
        // Using get-shows-with-ticket-categories mainly for consistent Show list order/structure if preferred, 
        // or effectively just getting shows. The endpoint is robust.
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

    const fetchInventory = async () => {
      try {
        const res = await baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}/consessions`);
        setInventory(res.data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchShows();
    fetchInventory();
  }, [params.event_id]);

  React.useEffect(() => {
    if (shows.length > 0) {
      shows.forEach(show => fetchShowConcessions(show.id));
    }
  }, [shows]);

  const handleAddShowConcession = async (concessionId: number) => {
    if (!selectedShowForConcession) return;
    try {
      await baseHttpServiceInstance.post(`/event-studio/events/${params.event_id}/consessions/shows/${selectedShowForConcession.id}/concessions`, {
        concessionId,
        isAvailable: true,
      });
      notificationCtx.success(tt("Thêm sản phẩm thành công", "Product added successfully"));
      fetchShowConcessions(selectedShowForConcession.id);
    } catch (error: any) {
      notificationCtx.error(tt('Lỗi:', 'Error:'), error?.response?.data?.detail || error.message);
    }
  };

  const handleUpdateShowConcession = async (showId: number, item: ShowConcession, updates: Partial<ShowConcession>) => {
    try {
      // Optimistic update
      setShowConcessionsMap(prev => ({
        ...prev,
        [showId]: prev[showId]?.map(i => i.id === item.id ? { ...i, ...updates } : i) || []
      }));

      await baseHttpServiceInstance.put(`/event-studio/events/${params.event_id}/consessions/shows/${showId}/concessions/${item.id}`, updates);
      notificationCtx.success(tt("Cập nhật thành công", "Update successful"));
      fetchShowConcessions(showId); // Refresh to be safe
    } catch (error: any) {
      notificationCtx.error(tt('Lỗi:', 'Error:'), error?.message);
      fetchShowConcessions(showId); // Revert
    }
  };

  const handleDeleteShowConcession = async (showId: number, id: number) => {
    try {
      if (!window.confirm(tt("Bạn có chắc chắn muốn xóa?", "Are you sure?"))) return;

      // Optimistic
      setShowConcessionsMap(prev => ({
        ...prev,
        [showId]: prev[showId]?.filter(i => i.id !== id) || []
      }));

      await baseHttpServiceInstance.delete(`/event-studio/events/${params.event_id}/consessions/shows/${showId}/concessions/${id}`);
      notificationCtx.success(tt("Xóa thành công", "Delete successful"));
      fetchShowConcessions(showId);
    } catch (error: any) {
      notificationCtx.error(tt('Lỗi:', 'Error:'), error?.message);
      fetchShowConcessions(showId);
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
              <Typography variant="h4">{tt("Thiết lập bỏng nước", "Concessions setups")}</Typography>
            </Stack>
            <div>
              <Button
                component={LocalizedLink}
                startIcon={<Warehouse fontSize="var(--icon-fontSize-md)" />}
                variant="contained"
                href="consessions/inventory"
              >
                {tt("Kho hàng", "Inventory")}
              </Button>
            </div>
          </Stack>

          {/* Shows List */}
          <Stack spacing={2}>
            {shows.map((show) => (
              <Accordion
                key={show.id}
                defaultExpanded
                sx={{
                  width: '100%',
                  borderRadius: 1,
                  overflow: 'hidden',
                  boxShadow: 'none',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
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

                    <Stack direction="row" spacing={1}>
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
                    </Stack>
                  </Stack>
                </AccordionSummary>

                <AccordionDetails sx={{ pt: 3, pb: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {tt("Danh sách sản phẩm", "Product List")}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PlusIcon />}
                      onClick={() => {
                        setSelectedShowForConcession(show);
                        setOpenShowConcessionModal(true);
                      }}
                    >
                      {tt("Thêm sản phẩm", "Add Product")}
                    </Button>
                  </Stack>

                  <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                    {(showConcessionsMap[show.id] || []).length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: 'neutral.50' }}>
                              <TableCell>{tt("Sản phẩm", "Product")}</TableCell>
                              <TableCell>{tt("Giá gốc", "Base Price")}</TableCell>
                              <TableCell>{tt("Giá bán (Show)", "Show Price")}</TableCell>
                              <TableCell align="center">{tt("Mở bán", "Available")}</TableCell>
                              <TableCell align="right"></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(showConcessionsMap[show.id] || []).map((item) => (
                              <TableRow key={item.id} hover>
                                <TableCell>
                                  <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar
                                      src={item.concession.imageUrl || undefined}
                                      variant="rounded"
                                      sx={{ width: 40, height: 40 }}
                                    >
                                      {item.concession.name.charAt(0)}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="subtitle2" fontWeight={600}>{item.concession.name}</Typography>
                                      <Typography variant="caption" color="text.secondary">{item.concession.code}</Typography>
                                    </Box>
                                  </Stack>
                                </TableCell>
                                <TableCell>
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.concession.basePrice)}
                                </TableCell>
                                <TableCell>
                                  <OutlinedInput
                                    size="small"
                                    type="number"
                                    placeholder="Default"
                                    value={item.priceOverride ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value ? Number(e.target.value) : null;
                                      // Optimistic local update via handleUpdate
                                    }}
                                    onBlur={(e) => {
                                      // Update on blur to avoid excessive API calls
                                      const val = e.target.value ? Number(e.target.value) : null;
                                      if (val !== item.priceOverride) {
                                        handleUpdateShowConcession(show.id, item, { priceOverride: val });
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const val = (e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : null;
                                        if (val !== item.priceOverride) {
                                          handleUpdateShowConcession(show.id, item, { priceOverride: val });
                                        }
                                      }
                                    }}
                                    sx={{ width: 140 }}
                                    endAdornment={<InputAdornment position="end">đ</InputAdornment>}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                    <Switch
                                      checked={!!item.isAvailable}
                                      onChange={(e) => handleUpdateShowConcession(show.id, item, { isAvailable: e.target.checked })}
                                      color="success"
                                      size="small"
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                      {item.isAvailable ? tt('Bật', 'On') : tt('Tắt', 'Off')}
                                    </Typography>
                                  </Stack>
                                </TableCell>
                                <TableCell align="right">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteShowConcession(show.id, item.id)}
                                  >
                                    <Trash size={18} />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                        <Warehouse size={48} weight="duotone" style={{ opacity: 0.5, marginBottom: 8 }} />
                        <Typography variant="body2">{tt("Chưa có sản phẩm nào cho show này", "No products for this show")}</Typography>
                      </Box>
                    )}
                  </Paper>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Stack>
      </Stack>

      {/* Show Concession Add Modal */}
      <Dialog
        open={openShowConcessionModal}
        onClose={() => setOpenShowConcessionModal(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{tt("Thêm sản phẩm từ kho", "Add Product from Inventory")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {inventory.map((concession) => {
              const showId = selectedShowForConcession?.id;
              const isAdded = showId && showConcessionsMap[showId]?.some(sc => sc.concessionId === concession.id);

              return (
                <Box
                  key={concession.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    opacity: isAdded ? 0.6 : 1,
                    bgcolor: isAdded ? 'action.hover' : 'background.paper'
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={concession.imageUrl || undefined} variant="rounded">
                      {concession.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>{concession.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(concession.basePrice)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant={isAdded ? "outlined" : "contained"}
                    size="small"
                    disabled={Boolean(isAdded)}
                    onClick={() => handleAddShowConcession(concession.id)}
                  >
                    {isAdded ? tt("Đã thêm", "Added") : tt("Thêm", "Add")}
                  </Button>
                </Box>
              );
            })}
            {inventory.length === 0 && (
              <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                <Typography>{tt("Kho hàng trống", "Inventory empty")}</Typography>
                <Button
                  component={LocalizedLink}
                  href="consessions/inventory"
                  variant="text"
                  size="small"
                  sx={{ mt: 1 }}
                >
                  {tt("Quản lý kho hàng", "Manage Inventory")}
                </Button>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShowConcessionModal(false)}>{tt("Đóng", "Close")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
