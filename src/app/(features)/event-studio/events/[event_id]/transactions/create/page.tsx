'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Box, InputAdornment, TextField } from '@mui/material';
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

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Tạo đơn hàng | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  const [extraFee, setExtraFee] = React.useState<number>(0);
  const router = useRouter(); // Use useRouter from next/navigation
  const [selectedCategories, setSelectedCategories] = React.useState<Record<number, number | null>>({});
  const [customer, setCustomer] = React.useState({
    title: 'Bạn',
    name: '',
    email: '',
    phoneNumber: '',
    dob: null,
    address: '',
  });
  const [paymentMethod, setPaymentMethod] = React.useState<string>('napas247');
  const [ticketHolders, setTicketHolders] = React.useState<string[]>(['']);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);
  const [ticketHolderEditted, setTicketHolderEditted] = React.useState<boolean>(false);

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
    setSelectedCategories(prevCategories => ({
      ...prevCategories,
      [showId]: categoryId,
    }));
  };

  const handleSelectionChange = (selected: Show[]) => {
    setSelectedSchedules(selected);
    const tmpObj = {}
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

  const handleExtraFeeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, ''); // Remove non-digit characters
    setExtraFee(Number(value));
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const handleSubmit = async () => {
    if (!customer.name || !customer.email || !customer.phoneNumber || ticketQuantity <= 0) {
      notificationCtx.warning('Vui lòng điền đầy đủ các thông tin bắt buộc');
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
              <TicketCategories key={show.id} show={show} onCategorySelect={(categoryId: number) => handleCategorySelection(show.id, categoryId)}
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
                  <Grid lg={2} xs={4}>
                    <FormControl fullWidth required>
                      <InputLabel id="title-label">Danh xưng</InputLabel>
                      <Select
                        labelId="title-label"
                        id="title-select"
                        name="title"
                        value={customer.title || "Bạn"}
                        onChange={(e) => {
                          setCustomer({ ...customer, title: e.target.value });
                        }}
                        label="Danh xưng"   // 🔑 thêm dòng này để label không bị lỗi UI
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
                    </FormControl>
                  </Grid>
                  <Grid md={4} xs={8}>
                    <FormControl fullWidth required>
                      <InputLabel>Họ và tên</InputLabel>
                      <OutlinedInput
                        label="Họ và tên"
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
                        }}
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
                title="Số lượng vé"
                action={
                  <OutlinedInput
                    sx={{ maxWidth: 180 }}
                    type="number"
                    value={ticketQuantity}
                    onChange={handleTicketQuantityChange}
                  />
                }
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  {ticketHolders.map((holder, index) => (
                    <Grid md={12} xs={12} key={index}>
                      <FormControl fullWidth required>
                        <InputLabel>Họ và tên người tham dự {index + 1}</InputLabel>
                        <OutlinedInput
                          label={`Họ và tên người tham dự ${index + 1}`}
                          defaultValue={index == 0 ? customer.name : ''}
                          value={holder}
                          onChange={(e) => { setTicketHolderEditted(true); handleTicketHolderChange(index, e.target.value) }}
                        />
                      </FormControl>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Extra Fee */}
            <Card>
              <CardHeader
                title="Phụ phí"
                subheader="(nếu có)"
                action={
                  <OutlinedInput
                    name="extraFee"
                    value={extraFee.toLocaleString()} // Format as currency
                    onChange={handleExtraFeeChange}
                    sx={{ maxWidth: 180 }}
                    endAdornment={<InputAdornment position="end">đ</InputAdornment>}
                  />
                }
              />
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader
                title="Phương thức thanh toán"
                action={
                  <FormControl sx={{ maxWidth: 180, minWidth: 180 }}>
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

            {Object.keys(selectedCategories).length > 0 && (
              <Card>
                <CardHeader title="Thanh toán" />
                <Divider />
                <CardContent>
                  <Stack spacing={2}>
                    {Object.entries(selectedCategories).map(([showId, category]) => {
                      const show = event?.shows.find((show) => show.id === parseInt(showId));
                      const ticketCategory = show?.ticketCategories.find((cat) => cat.id === category);

                      return (
                        <Stack direction={{ xs: 'column', sm: 'row' }} key={showId} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                            <TicketIcon fontSize="var(--icon-fontSize-md)" />
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{show?.name || 'Chưa xác định'} - {ticketCategory?.name || 'Chưa rõ loại vé'}</Typography>
                          </Stack>
                          <Stack spacing={2} direction={'row'}>
                            <Typography variant="body1">Giá: {formatPrice(ticketCategory?.price || 0)}</Typography>
                            <Typography variant="body1">SL: {ticketQuantity || 0}</Typography>
                            <Typography variant="body1">
                              Thành tiền: {formatPrice((ticketCategory?.price || 0) * (ticketQuantity || 0))}
                            </Typography>
                          </Stack>
                        </Stack>
                      );
                    })}

                    {/* Total Amount */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1">Phụ phí:</Typography>
                      <Typography variant="body1">{formatPrice(extraFee)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Tổng cộng:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {formatPrice(
                          Object.entries(selectedCategories).reduce((total, [showId, category]) => {
                            const show = event?.shows.find((show) => show.id === parseInt(showId));
                            const ticketCategory = show?.ticketCategories.find((cat) => cat.id === category);
                            return total + (ticketCategory?.price || 0) * (ticketQuantity || 0);
                          }, 0) + extraFee
                        )}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}
            {/* Submit Button */}
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: '3' }}>
              <Button variant="contained" onClick={handleSubmit}>
                Tạo
              </Button>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
