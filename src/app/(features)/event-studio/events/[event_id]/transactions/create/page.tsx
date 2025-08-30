'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Box, InputAdornment, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import NotificationContext from '@/contexts/notification-context';

import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { Schedules } from './schedules';
import { TicketCategories } from './ticket-categories';
import { Pencil } from '@phosphor-icons/react/dist/ssr';

export type TicketCategory = {
  id: number;
  avatar: string | null;
  name: string;
  price: number;
  type: string;
  description: string;
  status: string;
  quantity: number;
  sold: number;
  disabled: boolean;
  limitPerTransaction: number | null;
  limitPerCustomer: number | null;
};

export type Show = {
  id: number;
  name: string;
  avatar: string;
  status: string;
  type: string;
  disabled: boolean;
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
  bannerUrl: string;
  slug: string;
  locationInstruction: string | null;
  shows: Show[];
};
type TicketHolderInfo = { title: string; name: string; email: string; phone: string };

const paymentMethodLabelMap: Record<string, string> = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  napas247: 'Napas 247',
};

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Tạo đơn hàng | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const [qrOption, setQrOption] = React.useState<string>("shared");
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  const [extraFee, setExtraFee] = React.useState<number>(0);
  const router = useRouter(); // Use useRouter from next/navigation
  const [selectedCategories, setSelectedCategories] = React.useState<Record<number, Record<number, number>>>({});
  const [customer, setCustomer] = React.useState({
    title: 'Bạn',
    name: '',
    email: '',
    phoneNumber: '',
    dob: null as string | null,
    address: '',
  });
  const [paymentMethod, setPaymentMethod] = React.useState<string>('napas247');
  const [ticketHolders, setTicketHolders] = React.useState<string[]>(['']);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);
  const [ticketHolderEditted, setTicketHolderEditted] = React.useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);
  const [requestedCategoryModalId, setRequestedCategoryModalId] = React.useState<number | null>(null);
  const [ticketHoldersByCategory, setTicketHoldersByCategory] = React.useState<Record<string, TicketHolderInfo[]>>({});

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
          // setFormValues(response.data); // Initialize form with the event data
        } catch (error) {
          notificationCtx.error(error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    }
  }, [params.event_id]);

  const handleCategorySelection = (showId: number, categoryId: number) => {
    setSelectedCategories(prevCategories => {
      const existingForShow = prevCategories[showId] || {};
      const exists = Object.prototype.hasOwnProperty.call(existingForShow, categoryId);
      const nextForShow = { ...existingForShow } as Record<number, number>;
      if (exists) {
        delete nextForShow[categoryId];
      } else {
        nextForShow[categoryId] = 1; // default quantity when toggled via list
      }
      return {
        ...prevCategories,
        [showId]: nextForShow,
      };
    });
  };

  const handleAddToCartQuantity = (showId: number, categoryId: number, quantity: number, holders?: TicketHolderInfo[]) => {
    setSelectedCategories(prev => {
      const forShow = prev[showId] || {};
      const updatedForShow = { ...forShow } as Record<number, number>;
      if (quantity <= 0) {
        delete updatedForShow[categoryId];
      } else {
        updatedForShow[categoryId] = quantity;
      }
      return {
        ...prev,
        [showId]: updatedForShow,
      };
    });

    const key = `${showId}-${categoryId}`;
    setTicketHoldersByCategory(prev => {
      if (quantity <= 0) {
        const next = { ...prev } as Record<string, TicketHolderInfo[]>;
        delete next[key];
        return next;
      }
      if (holders && holders.length > 0) {
        return { ...prev, [key]: holders.slice(0, quantity) };
      }
      // ensure existing array is sized to quantity
      const existing = prev[key] || [];
      const sized = Array.from({ length: quantity }, (_, i) => existing[i] || { title: 'Bạn', name: '', email: '', phone: '' });
      return { ...prev, [key]: sized };
    });
  };

  const handleSelectionChange = (selected: Show[]) => {
    setSelectedSchedules(selected);
    const tmpObj: Record<number, Record<number, number>> = {}
    selected.forEach((s) => { tmpObj[s.id] = selectedCategories[s.id] || {} })
    setSelectedCategories(tmpObj);

    // filter holders to only keep keys for selected shows
    const allowedShowIds = new Set(selected.map(s => s.id));
    setTicketHoldersByCategory(prev => {
      const next: Record<string, TicketHolderInfo[]> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const showIdStr = k.split('-')[0];
        const sid = parseInt(showIdStr);
        if (allowedShowIds.has(sid)) next[k] = v;
      });
      return next;
    });
  };

  const handleExtraFeeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, ''); // Remove non-digit characters
    setExtraFee(Number(value));
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const handleCreateClick = () => {
    if (!customer.name || !customer.email || !customer.phoneNumber || ticketQuantity <= 0) {
      notificationCtx.warning('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    const totalSelectedCategories = Object.values(selectedCategories).reduce((sum, catMap) => sum + Object.keys(catMap || {}).length, 0);
    if (totalSelectedCategories === 0) {
      notificationCtx.warning('Vui lòng chọn ít nhất 1 loại vé');
      return;
    }


    // Validate per-ticket holder info when separate QR is selected
    if (qrOption === 'separate') {
      for (const [showId, categories] of Object.entries(selectedCategories)) {
        for (const [categoryIdStr, qty] of Object.entries(categories || {})) {
          const categoryId = parseInt(categoryIdStr);
          const quantity = qty || 0;
          if (quantity <= 0) continue;
          const key = `${showId}-${categoryId}`;
          const holders = ticketHoldersByCategory[key] || [];
          let invalid = holders.length < quantity;
          if (!invalid) {
            for (let i = 0; i < quantity; i++) {
              const h = holders[i];
              if (!h || !h.title || !h.name) { invalid = true; break; }
            }
          }
          if (invalid) {
            notificationCtx.warning('Vui lòng điền đủ thông tin người tham dự cho từng vé.');
            setRequestedCategoryModalId(categoryId);
            return;
          }
        }
      }
    }

    setConfirmOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (qrOption === 'separate') {
        for (const [showId, categories] of Object.entries(selectedCategories)) {
          for (const [categoryIdStr, qty] of Object.entries(categories || {})) {
            const categoryId = parseInt(categoryIdStr);
            const quantity = qty || 0;
            if (quantity <= 0) continue;
            const key = `${showId}-${categoryId}`;
            const holders = ticketHoldersByCategory[key] || [];
            let invalid = holders.length < quantity;
            if (!invalid) {
              for (let i = 0; i < quantity; i++) {
                const h = holders[i];
                if (!h || !h.title || !h.name) { invalid = true; break; }
              }
            }
            if (invalid) {
              setConfirmOpen(false);
              notificationCtx.warning('Vui lòng điền đủ thông tin người tham dự cho từng vé.');
              setRequestedCategoryModalId(categoryId);
              return;
            }
          }
        }
      }

      setConfirmOpen(false);
      setIsLoading(true);

      const tickets = Object.entries(selectedCategories).flatMap(([showId, catMap]) => (
        Object.entries(catMap || {}).map(([categoryIdStr, qty]) => {
          const key = `${showId}-${categoryIdStr}`;
          const holders = ticketHoldersByCategory[key] || [];
          return {
            showId: parseInt(showId),
            ticketCategoryId: parseInt(categoryIdStr),
            quantity: qty || 0,
            holders: qrOption === 'separate' ? holders : undefined,
          };
        })
      ));

      const transactionData = {
        customer,
        tickets,
        qrOption,
        paymentMethod,
        extraFee,
      };

      const response = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/transactions`,
        transactionData
      );
      const newTransaction = response.data;
      router.push(`/event-studio/events/${params.event_id}/transactions/${newTransaction.id}`); // Navigate to a different page on success
      notificationCtx.success("Tạo đơn hàng thành công!");
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Tạo đơn hàng mới</Typography>
        </Stack>
      </Stack>
      <Grid container spacing={3}>
        <Grid lg={4} md={6} xs={12}>
          <Stack spacing={3}>
            <Schedules shows={event?.shows} onSelectionChange={handleSelectionChange} />
            {selectedSchedules && selectedSchedules.map(show => (
              <TicketCategories
                key={show.id}
                show={show}
                qrOption={qrOption}
                requestedCategoryModalId={requestedCategoryModalId || undefined}
                onModalRequestHandled={() => setRequestedCategoryModalId(null)}
                onCategorySelect={(categoryId: number) => handleCategorySelection(show.id, categoryId)}
                onAddToCart={(categoryId: number, quantity: number, holders?: { title: string; name: string; email: string; phone: string; }[]) => handleAddToCartQuantity(show.id, categoryId, quantity, holders)}
              />
            ))}
          </Stack>
        </Grid>
        <Grid lg={8} md={6} xs={12}>
          <Stack spacing={3}>
            {/* Customer Information Card */}
            <Card>
              <CardHeader subheader="Vui lòng điền các trường thông tin phía dưới." title="Thông tin người mua" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid lg={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel htmlFor="customer-name">Danh xưng* &emsp; Họ và tên</InputLabel>
                      <OutlinedInput
                        id="customer-name"
                        label="Danh xưng* &emsp; Họ và tên"
                        name="customer_name"
                        value={customer.name}
                        onChange={(e) => {
                          !ticketHolderEditted && ticketHolders.length > 0 &&
                            setTicketHolders((prev) => {
                              const updatedHolders = [...prev];
                              updatedHolders[0] = e.target.value; // update first ticket holder
                              return updatedHolders;
                            });
                          setCustomer({ ...customer, name: e.target.value });
                        }}
                        startAdornment={
                          <InputAdornment position="start">
                            <Select
                              variant="standard"
                              disableUnderline
                              value={customer.title || "Bạn"}
                              onChange={(e) =>
                                setCustomer({ ...customer, title: e.target.value })
                              }
                              sx={{ minWidth: 65 }} // chiều rộng tối thiểu để gọn
                            >
                              <MenuItem value="Anh">Anh</MenuItem>
                              <MenuItem value="Chị">Chị</MenuItem>
                              <MenuItem value="Bạn">Bạn</MenuItem>
                              <MenuItem value="Em">Em</MenuItem>
                              <MenuItem value="Ông">Ông</MenuItem>
                              <MenuItem value="Bà">Bà</MenuItem>
                              <MenuItem value="Cô">Cô</MenuItem>
                              <MenuItem value="Mr.">Mr.</MenuItem>
                              <MenuItem value="Ms.">Ms.</MenuItem>
                              <MenuItem value="Miss">Miss</MenuItem>
                              <MenuItem value="Thầy">Thầy</MenuItem>
                            </Select>
                          </InputAdornment>
                        }
                      />
                    </FormControl>
                  </Grid>

                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Địa chỉ Email</InputLabel>
                      <OutlinedInput
                        label="Địa chỉ Email"
                        name="customer_email"
                        type="email"
                        value={customer.email}
                        onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Số điện thoại</InputLabel>
                      <OutlinedInput
                        label="Số điện thoại"
                        name="customer_phone_number"
                        type="tel"
                        value={customer.phoneNumber}
                        onChange={(e) => setCustomer({ ...customer, phoneNumber: e.target.value })}
                      />
                    </FormControl>
                  </Grid>
                  <Grid lg={6} xs={12}>
                    <TextField

                      fullWidth
                      label="Ngày tháng năm sinh"
                      name="customer_dob"
                      type="date"
                      value={customer.dob || ""}
                      onChange={(e) =>
                        setCustomer({ ...customer, dob: e.target.value })
                      }
                      InputLabelProps={{
                        shrink: true,   // bắt buộc để label không bị chồng
                      }}
                      inputProps={{
                        max: new Date().toISOString().slice(0, 10),
                      }}
                    />
                  </Grid>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Địa chỉ</InputLabel>
                      <OutlinedInput
                        label="Địa chỉ"
                        name="customer_address"
                        value={customer.address}
                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Ticket Quantity and Ticket Holders */}
            <Card>
              <CardHeader
                title="Danh sách vé"
                action={
                  <FormControl size="small" sx={{ width: 210 }}>
                    <InputLabel id="qr-option-label">Thông tin trên vé</InputLabel>
                    <Select
                      labelId="qr-option-label"
                      value={qrOption}
                      label="Thông tin trên vé"
                      onChange={(e) => {
                        setQrOption(e.target.value);
                        if (e.target.value === 'separate') {
                          notificationCtx.info("Vui lòng điền thông tin người sở hữu cho từng vé");
                        }
                      }}
                    >
                      <MenuItem value="shared">
                        <Stack>
                          <Typography variant="body2">Giống thông tin người mua</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            dùng một QR check-in tất cả vé
                          </Typography>
                        </Stack>
                      </MenuItem>
                      <MenuItem value="separate">
                        <Stack>
                          <Typography variant="body2">Nhập thông tin từng vé</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            mỗi vé một mã QR
                          </Typography>
                        </Stack>
                      </MenuItem>
                    </Select>
                  </FormControl>
                }
              />
              <Divider />
              <CardContent>
                <Stack spacing={3}>
                  {Object.entries(selectedCategories).flatMap(([showId, categories]) => {
                    const show = event?.shows.find((show) => show.id === parseInt(showId));
                    return Object.entries(categories || {}).map(([categoryIdStr, qty]) => {
                      const categoryId = parseInt(categoryIdStr);
                      const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
                      const quantity = qty || 0;
                      return (
                        <Stack spacing={2} key={`${showId}-${categoryId}`}>
                          <Stack direction={{ xs: 'column', md: 'row' }} key={`${showId}-${categoryId}`} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                              <TicketIcon fontSize="var(--icon-fontSize-md)" />
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{show?.name || 'Chưa xác định'} - {ticketCategory?.name || 'Chưa rõ loại vé'}</Typography>
                              <IconButton size="small" sx={{ ml: 1, alignSelf: 'flex-start' }} onClick={() => setRequestedCategoryModalId(categoryId)}><Pencil /></IconButton>
                            </Stack>
                            <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                              <Typography variant="caption">{formatPrice(ticketCategory?.price || 0)}</Typography>
                              <Typography variant="caption">x {quantity}</Typography>
                              <Typography variant="caption">
                                = {formatPrice((ticketCategory?.price || 0) * quantity)}
                              </Typography>
                            </Stack>
                          </Stack>

                          {qrOption === 'separate' && quantity > 0 && (
                            <Stack spacing={2}>
                              {Array.from({ length: quantity }, (_, index) => {
                                const holderInfo = ticketHoldersByCategory[`${showId}-${categoryId}`]?.[index];
                                return (
                                  <Box key={index} sx={{ ml: 2, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                      {index + 1}. {holderInfo?.name ? `${holderInfo?.title} ${holderInfo?.name}` : 'Chưa có thông tin'}
                                    </Typography>
                                    <br />
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {holderInfo?.email || 'Chưa có email'} - {holderInfo?.phone || 'Chưa có SĐT'}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Stack>
                          )}
                        </Stack >
                      );
                    });
                  })}
                </Stack>
              </CardContent>
            </Card>

            {/* Extra Fee */}
            <Card>
              <CardHeader
                title="Phụ phí"
                subheader="(nếu có)"
                action={
                  <OutlinedInput
                    size="small"
                    name="extraFee"
                    value={extraFee.toLocaleString()} // Format as currency
                    onChange={handleExtraFeeChange}
                    sx={{ maxWidth: 180 }}
                    endAdornment={<InputAdornment position="end">đ</InputAdornment>}
                  />
                }
              />
            </Card>
            {Object.values(selectedCategories).some((catMap) => Object.keys(catMap || {}).length > 0) && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Tổng cộng:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {formatPrice(
                        Object.entries(selectedCategories).reduce((total, [showId, categories]) => {
                          const show = event?.shows.find((show) => show.id === parseInt(showId));
                          const categoriesTotal = Object.entries(categories || {}).reduce((sub, [categoryIdStr, qty]) => {
                            const categoryId = parseInt(categoryIdStr);
                            const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
                            return sub + (ticketCategory?.price || 0) * (qty || 0);
                          }, 0);
                          return total + categoriesTotal;
                        }, 0) + extraFee
                      )}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
            {/* Payment Method */}
            <Card>
              <CardHeader
                title="Phương thức thanh toán"
                action={
                  <FormControl size="small" sx={{ maxWidth: 180, minWidth: 180 }}>
                    <Select
                      name="payment_method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <MenuItem value=""></MenuItem>
                      <MenuItem value="cash">Tiền mặt</MenuItem>
                      <MenuItem value="transfer">Chuyển khoản</MenuItem>
                      <MenuItem value="napas247">Napas 247</MenuItem>
                    </Select>
                  </FormControl>
                }
              />
            </Card>


            {/* Submit Button */}
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: '3' }}>
              <Button variant="contained" onClick={handleCreateClick}>
                Tạo
              </Button>
            </Grid>
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="md">
              <DialogTitle sx={{ color: "primary.main" }}>Xác nhận tạo đơn hàng</DialogTitle>
              <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Thông tin người mua</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Họ và tên</Typography>
                    <Typography variant="body2">{customer.title ? `${customer.title} ` : ''}{customer.name}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Email</Typography>
                    <Typography variant="body2">{customer.email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Số điện thoại</Typography>
                    <Typography variant="body2">{customer.phoneNumber}</Typography>
                  </Box>
                  <Divider />

                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Danh sách vé</Typography>
                  <Stack spacing={1}>
                    {Object.entries(selectedCategories).flatMap(([showId, categories]) => {
                      const show = event?.shows.find((show) => show.id === parseInt(showId));
                      return Object.entries(categories || {}).map(([categoryIdStr, qty]) => {
                        const categoryId = parseInt(categoryIdStr);
                        const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
                        const quantity = qty || 0;
                        return (
                          <Stack spacing={0} key={`confirm-${showId}-${categoryId}`}>
                            <Stack direction={{ xs: 'column', md: 'row' }} key={`${showId}-${categoryId}`} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                                <TicketIcon fontSize="var(--icon-fontSize-md)" />
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{show?.name || 'Chưa xác định'} - {ticketCategory?.name || 'Chưa rõ loại vé'}</Typography>
                              </Stack>
                              <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                                <Typography variant="caption">{formatPrice(ticketCategory?.price || 0)}</Typography>
                                <Typography variant="caption">x {quantity}</Typography>
                                <Typography variant="caption">
                                  = {formatPrice((ticketCategory?.price || 0) * quantity)}
                                </Typography>
                              </Stack>
                            </Stack>

                            {qrOption === 'separate' && quantity > 0 && (
                              <Box sx={{ ml: 2 }}>
                                <Stack spacing={1}>
                                  {Array.from({ length: quantity }, (_, index) => {
                                    const holderInfo = ticketHoldersByCategory[`${showId}-${categoryId}`]?.[index];
                                    return (
                                      <Box key={index} sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                                          {index + 1}. {holderInfo?.name ? `${holderInfo?.title} ${holderInfo?.name}` : 'Chưa có thông tin'}
                                        </Typography>
                                        <br />
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                          {holderInfo?.email || 'Chưa có email'} - {holderInfo?.phone || 'Chưa có SĐT'}
                                        </Typography>
                                      </Box>
                                    );
                                  })}
                                </Stack>
                              </Box>
                            )}
                          </Stack>
                        );
                      });
                    })}
                  </Stack>
                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Phương thức thanh toán</Typography>
                    <Typography variant="body2">{paymentMethodLabelMap[paymentMethod] || paymentMethod}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Phụ phí</Typography>
                    <Typography variant="body2">{formatPrice(extraFee)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Tổng cộng</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {formatPrice(
                        Object.entries(selectedCategories).reduce((total, [showId, categories]) => {
                          const show = event?.shows.find((show) => show.id === parseInt(showId));
                          const categoriesTotal = Object.entries(categories || {}).reduce((sub, [categoryIdStr, qty]) => {
                            const categoryId = parseInt(categoryIdStr);
                            const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
                            return sub + (ticketCategory?.price || 0) * (qty || 0);
                          }, 0);
                          return total + categoriesTotal;
                        }, 0) + extraFee
                      )}
                    </Typography>
                  </Box>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmOpen(false)}>Quay lại</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>Xác nhận</Button>
              </DialogActions>
            </Dialog>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
