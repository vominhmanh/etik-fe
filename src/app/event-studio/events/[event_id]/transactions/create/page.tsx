"use client"
import Grid from '@mui/material/Unstable_Grid2';
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import * as React from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import { Schedules } from './schedules';
import axios, { AxiosResponse } from 'axios';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { InputAdornment } from '@mui/material';
import { TicketCategories } from './ticket-categories';
import dayjs from 'dayjs';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { Coins as CoinsIcon } from '@phosphor-icons/react/dist/ssr/Coins';
import { Hash as HashIcon } from '@phosphor-icons/react/dist/ssr/Hash';

export type TicketCategory = {
  id: number;
  avatar: string;
  name: string;
  updatedAt: Date;
  price: number;
  type: string;
  status: string;
}

export type Show = {
  id: number;
  eventId: number;
  name: string;
  startDateTime: Date| null;
  endDateTime: Date| null;
  place: string | null;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {

  const [ticketCategories, setTicketCategories] = React.useState<TicketCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  const [customer, setCustomer] = React.useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
  });
  const [extraFee, setExtraFee] = React.useState<number>(0);
  const [shows, setShows] = React.useState<Show[]>([]);
  const [paymentMethod, setPaymentMethod] = React.useState<string>("");
  const [ticketHolders, setTicketHolders] = React.useState<string[]>([""]);

  // Fetch ticket categories
  React.useEffect(() => {
    async function fetchTicketCategories() {
      try {
        const response: AxiosResponse<TicketCategory[]> = await baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}/ticket_categories/`);
        const sortedCategories = response.data.sort((a, b) => {
          if (a.status === 'on_sale' && b.status !== 'on_sale') return -1;
          if (a.status !== 'on_sale' && b.status === 'on_sale') return 1;
          return 0;
        });
        setTicketCategories(sortedCategories);
      } catch (error) {
        console.error('Error fetching ticket categories:', error);
      }
    }
    fetchTicketCategories();
  }, [params.event_id]);

  // Fetch shows
  React.useEffect(() => {
    async function fetchShows() {
      try {
        const response: AxiosResponse<Show[]> = await baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}/shows/`);
        setShows(response.data);
      } catch (error) {
        console.error('Error fetching shows:', error);
      }
    }
    fetchShows();
  }, [params.event_id]);

  const handleCategorySelection = (ticketCategoryId: string) => {
    setSelectedCategoryId(ticketCategoryId);
  };

  const handleTicketQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = Number(event.target.value);
    setTicketQuantity(quantity);
    setTicketHolders(Array(quantity).fill(""));  // Dynamically update ticket holders array
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
    if (!selectedCategoryId || !customer.name || !customer.email || ticketQuantity <= 0) {
      alert("Please fill in the required fields.");
      return;
    }

    try {
      const transactionData = {
        customer: {
          ...customer
        },
        ticket: {
          ticketCategoryId: selectedCategoryId,
          quantity: ticketQuantity,
          ticketHolders: ticketHolders.filter(Boolean) // Ensure no empty names
        },
        paymentMethod,
        extraFee
      };

      const response = await baseHttpServiceInstance.post(`/event-studio/events/${params.event_id}/transactions`, transactionData);
      console.log("Transaction successful:", response.data);
      alert("Transaction created successfully!");
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Error creating transaction.");
    }
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Tạo vé mới</Typography>
        </Stack>
      </Stack>
      <Grid container spacing={3}>
        <Grid lg={4} md={6} xs={12}>
          <Stack spacing={3}>
            <TicketCategories
              ticketCategories={ticketCategories}
              onCategorySelect={handleCategorySelection}
            />
            <Schedules
              shows={shows}
            />
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
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Họ và tên</InputLabel>
                      <OutlinedInput label="Họ và tên" name="customer_name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Địa chỉ Email</InputLabel>
                      <OutlinedInput label="Địa chỉ Email" name="customer_email" type='email' value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Số điện thoại</InputLabel>
                      <OutlinedInput label="Số điện thoại" name="customer_phone_number" type="tel" value={customer.phoneNumber} onChange={(e) => setCustomer({ ...customer, phoneNumber: e.target.value })} />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Địa chỉ</InputLabel>
                      <OutlinedInput label="Địa chỉ" name="customer_address" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Ticket Quantity and Ticket Holders */}
            <Card>
              <CardHeader
                title="Số lượng vé"
                action={<OutlinedInput sx={{ maxWidth: 180 }} type='number' value={ticketQuantity} onChange={handleTicketQuantityChange} />}
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
                          value={holder}
                          onChange={(e) => handleTicketHolderChange(index, e.target.value)}
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

            {/* Payment Summary */}
            <Card>
              <CardHeader title="Thanh toán" />
              <Divider />
              <CardContent>
                <Stack spacing={0}>
                  {selectedCategoryId && ticketCategories.length > 0 && (
                    <>
                      <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <TicketIcon fontSize="var(--icon-fontSize-md)" />
                          <Typography variant="body1">Loại vé:</Typography>
                        </Stack>

                        <Typography variant="body1">{ticketCategories.find(cat => cat.id === selectedCategoryId)?.name || "Chưa xác định"}</Typography>
                      </Grid>
                      <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <TagIcon fontSize="var(--icon-fontSize-md)" />
                          <Typography variant="body1">Đơn giá:</Typography>
                        </Stack>
                        <Typography variant="body1"></Typography>
                        <Typography variant="body1">{formatPrice(ticketCategories.find(cat => cat.id === selectedCategoryId)?.price || 0)}</Typography>
                      </Grid>
                      <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <HashIcon fontSize="var(--icon-fontSize-md)" />
                          <Typography variant="body1">Số lượng:</Typography>
                        </Stack>
                        <Typography variant="body1"></Typography>
                        <Typography variant="body1">{ticketQuantity}</Typography>
                      </Grid>
                      <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <CoinsIcon fontSize="var(--icon-fontSize-md)" />
                          <Typography variant="body1">Thành tiền:</Typography>
                        </Stack>
                        <Typography variant="body1">{formatPrice((ticketCategories.find(cat => cat.id === selectedCategoryId)?.price || 0) * ticketQuantity + extraFee)}</Typography>
                      </Grid>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: '3' }}>
              <Button variant="contained" onClick={handleSubmit}>Tạo</Button>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
