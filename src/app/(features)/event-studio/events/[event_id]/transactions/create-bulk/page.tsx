'use client';

import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Box, CardActions, IconButton, InputAdornment, styled, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import { AxiosResponse } from 'axios';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import * as XLSX from 'xlsx';

import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { Download, Plus, Upload, X } from '@phosphor-icons/react/dist/ssr';
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

// Define the Customer type
type Customer = {
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
};
type CustomerExcelInput = {
  'Họ tên': string;
  'Email': string;
  'Số điện thoại': string;
  'Địa chỉ': string;
};
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});


export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Tạo đơn hàng theo lô | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  const [extraFee, setExtraFee] = React.useState<number>(0);
  const router = useRouter(); // Use useRouter from next/navigation
  const [selectedCategories, setSelectedCategories] = React.useState<Record<number, number | null>>({});
  const [paymentMethod, setPaymentMethod] = React.useState<string>('napas247');
  const [ticketHolders, setTicketHolders] = React.useState<string[]>(['']);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);

  const [customers, setCustomers] = React.useState<Customer[]>([
    { name: '', email: '', phoneNumber: '', address: '' },
  ]);

  // Handle change in customer fields
  const handleCustomerChange = (index: number, field: keyof Customer, value: string) => {
    const updatedCustomers = [...customers];
    updatedCustomers[index][field] = value;
    setCustomers(updatedCustomers);
  };

  // Add a new customer
  const addCustomer = () => {
    setCustomers([...customers, { name: '', email: '', phoneNumber: '', address: '' }]);
  };

  // Remove a customer
  const removeCustomer = (index: number) => {
    const updatedCustomers = customers.filter((_, i) => i !== index);
    setCustomers(updatedCustomers);
  };

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

  // Handle file upload and parse the Excel file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json<CustomerExcelInput>(sheet);
        const formattedData: Customer[] = parsedData.map(d => ({
          name: d['Họ tên'], email: d['Email'], phoneNumber: d['Số điện thoại'], address: d['Địa chỉ']
        }))
        setCustomers(formattedData);
        event.target.value = ''
      };
      reader.readAsBinaryString(file);
    }
  };


  const handleExtraFeeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, ''); // Remove non-digit characters
    setExtraFee(Number(value));
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const handleSubmit = async () => {

    const invalidCustomers = customers.filter(customer => (!customer.name || !customer.email))
    if (invalidCustomers.length > 0) {
      notificationCtx.warning('Vui lòng điền "Họ tên", "Email" và "Số điện thoại" của tất cả người mua');
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
        customers,
        tickets,
        paymentMethod,
        ticketHolders: ticketHolders.filter(Boolean), // Ensure no empty names
        quantity: ticketQuantity,
        extraFee,
      };

      const response = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/transactions/create-bulk`,
        transactionData
      );
      const newTransaction = response.data;
      router.push(`/event-studio/events/${params.event_id}/transactions`); // Navigate to a different page on success
      notificationCtx.success('Tạo giao dịch thành công');
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
          <Typography variant="h4">Tạo đơn hàng theo lô</Typography>
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
              <CardHeader
                subheader="Mỗi đơn hàng 1 dòng."
                title="Thông tin người mua"
                action={
                  <Button color="inherit" component="label" role={undefined} size="small" startIcon={<Upload fontSize="var(--icon-fontSize-md)" />}>
                    Upload excel
                    <VisuallyHiddenInput
                      type="file"
                      accept=".xlsx, .xls"
                      onInput={handleFileUpload}
                    />
                  </Button>
                }
              />
              <Divider />
              <CardContent sx={{ overflow: 'auto', padding: 0, maxHeight: 400 }}>
                <Table sx={{ minWidth: '800px' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '20px' }}></TableCell>
                      <TableCell>Họ tên *</TableCell>
                      <TableCell sx={{ width: '200px' }}>Email *</TableCell>
                      <TableCell sx={{ width: '135px' }}>Số điện thoại *</TableCell>
                      <TableCell>Địa chỉ</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.map((customer, index) => (
                      <TableRow hover key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <FormControl fullWidth required>
                            <OutlinedInput
                              name={`customer_name_${index}`}
                              value={customer.name}
                              onChange={(e) =>
                                handleCustomerChange(index, 'name', e.target.value)
                              }
                              size="small"
                              sx={{ fontSize: '11px' }}
                            />
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth required>
                            <OutlinedInput
                              name={`customer_email_${index}`}
                              type="email"
                              value={customer.email}
                              onChange={(e) =>
                                handleCustomerChange(index, 'email', e.target.value)
                              }
                              size="small"
                              sx={{ fontSize: '11px' }}
                            />
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth>
                            <OutlinedInput
                              name={`customer_phone_number_${index}`}
                              type="tel"
                              value={customer.phoneNumber}
                              onChange={(e) =>
                                handleCustomerChange(index, 'phoneNumber', e.target.value)
                              }
                              size="small"
                              sx={{ fontSize: '11px' }}
                            />
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth>
                            <OutlinedInput
                              name={`customer_address_${index}`}
                              value={customer.address}
                              onChange={(e) =>
                                handleCustomerChange(index, 'address', e.target.value)
                              }
                              size="small"
                              sx={{ fontSize: '11px' }}
                            />
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => removeCustomer(index)}>
                            <X />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <Divider />
              <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button startIcon={<Plus />} size='small' onClick={addCustomer}>
                  Thêm hàng
                </Button>
                <Button startIcon={<Download />} size='small' component={RouterLink}
                  href='/assets/create-bulk-transactions-template.xlsx' download={true}>
                  Tải file excel mẫu
                </Button>
              </CardActions>
            </Card>
            {/* Ticket Quantity and Ticket Holders */}
            <Card>
              <CardHeader
                title="Số lượng người tham dự"
                subheader='Mặc định 1 người tham dự / 1 đơn hàng'
                action={
                  <OutlinedInput
                    sx={{ maxWidth: 180 }}
                    type="number"
                    value={ticketQuantity}
                    onChange={handleTicketQuantityChange}
                    inputProps={{ min: 1, max: 1 }}
                  />
                }
              />
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
                <CardHeader title="Thanh toán mỗi đơn hàng" />
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
