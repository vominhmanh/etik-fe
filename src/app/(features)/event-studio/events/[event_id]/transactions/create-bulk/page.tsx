'use client';

import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Box, CardActions, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, InputLabel, styled, Table, TableBody, TableCell, TableHead, TableRow, Checkbox } from '@mui/material';
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
import axios, { AxiosResponse } from 'axios';
import { LocalizedLink } from '@/components/localized-link';
import FormHelperText from '@mui/material/FormHelperText';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import * as XLSX from 'xlsx';

import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { Download, Pencil, Plus, Upload, X } from '@phosphor-icons/react/dist/ssr';
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
  title: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
};
type CustomerExcelInput = {
  'Danh xưng': string;
  'Họ tên': string;
  'Email': string;
  'Số điện thoại': string;
  'Địa chỉ': string;
};
type CustomerValidationError = { lineId: number; field: string; input: string; msg: string };
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
type TicketHolderInfo = { title: string; name: string; email: string; phone: string };


const paymentMethodLabelMap: Record<string, string> = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
  napas247: 'Napas 247',
};
const customerFieldLabelMap: Record<string, string> = {
  name: 'Họ tên',
  email: 'Email',
  phoneNumber: 'Số điện thoại',
  address: 'Địa chỉ',
  title: 'Danh xưng',
};
const normalizeFieldKey = (field: string): string =>
  field.replace(/[-_\s]+(.)?/g, (_match, group) => (group ? group.toUpperCase() : '')).trim();

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Tạo đơn hàng theo lô | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  const [extraFee, setExtraFee] = React.useState<number>(0);
  const router = useRouter(); // Use useRouter from next/navigation
  const [selectedCategories, setSelectedCategories] = React.useState<Record<number, Record<number, number>>>({});
  const [paymentMethod, setPaymentMethod] = React.useState<string>('napas247');
  const [ticketHolders, setTicketHolders] = React.useState<string[]>(['']);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);
  const [ticketHoldersByCategory, setTicketHoldersByCategory] = React.useState<Record<string, TicketHolderInfo[]>>({});
  const [requestedCategoryModalId, setRequestedCategoryModalId] = React.useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);
  const [customerValidationErrors, setCustomerValidationErrors] = React.useState<CustomerValidationError[]>([]);

  const [customers, setCustomers] = React.useState<Customer[]>([
    { title: 'Bạn', name: '', email: '', phoneNumber: '', address: '' },
  ]);

  const customerErrorsMap = React.useMemo<Record<number, Record<string, CustomerValidationError[]>>>(() => {
    return customerValidationErrors.reduce((acc, error) => {
      const rowIndex = error.lineId - 1;
      if (rowIndex < 0) return acc;
      const key = normalizeFieldKey(error.field);
      if (!acc[rowIndex]) acc[rowIndex] = {};
      if (!acc[rowIndex][key]) acc[rowIndex][key] = [];
      acc[rowIndex][key].push(error);
      return acc;
    }, {} as Record<number, Record<string, CustomerValidationError[]>>);
  }, [customerValidationErrors]);

  const sortedValidationErrors = React.useMemo(() => {
    return [...customerValidationErrors].sort((a, b) => {
      if (a.lineId === b.lineId) {
        return normalizeFieldKey(a.field).localeCompare(normalizeFieldKey(b.field));
      }
      return a.lineId - b.lineId;
    });
  }, [customerValidationErrors]);

  // Handle change in customer fields
  const handleCustomerChange = (index: number, field: keyof Customer, value: string) => {
    const updatedCustomers = [...customers];
    updatedCustomers[index][field] = value;
    setCustomers(updatedCustomers);
    setCustomerValidationErrors(prev =>
      prev.filter(err => !(err.lineId === index + 1 && normalizeFieldKey(err.field) === field))
    );
  };

  // Add a new customer
  const addCustomer = () => {
    setCustomers([...customers, { title: 'Bạn', name: '', email: '', phoneNumber: '', address: '' }]);
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

  const handleCreateClick = () => {
    // Validate all customers
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      if (!customer.name || !customer.email || !customer.phoneNumber) {
        notificationCtx.warning(`Vui lòng điền đầy đủ các thông tin bắt buộc cho khách hàng ${i + 1}`);
        return;
      }
    }

    if (ticketQuantity <= 0) {
      notificationCtx.warning('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    const totalSelectedCategories = Object.values(selectedCategories).reduce((sum, catMap) => sum + Object.keys(catMap || {}).length, 0);
    if (totalSelectedCategories === 0) {
      notificationCtx.warning('Vui lòng chọn ít nhất 1 loại vé');
      return;
    }

    setConfirmOpen(true);
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
          title: d['Danh xưng'], name: d['Họ tên'], email: d['Email'], phoneNumber: d['Số điện thoại'], address: d['Địa chỉ']
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
    setConfirmOpen(false);

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
      setCustomerValidationErrors([]);

      const tickets = Object.entries(selectedCategories).flatMap(([showId, catMap]) => (
        Object.entries(catMap || {}).map(([categoryIdStr, qty]) => {
          const key = `${showId}-${categoryIdStr}`;
          const holders = ticketHoldersByCategory[key] || [];
          return {
            showId: parseInt(showId),
            ticketCategoryId: parseInt(categoryIdStr),
            quantity: qty || 0,
          };
        })
      ));

      const transactionData = {
        customers,
        tickets,
        qrOption: "shared",
        paymentMethod,
        extraFee,
      };

      const response = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/transactions/create-bulk`,
        transactionData, {}, true
      );
      const newTransaction = response.data;
      setConfirmOpen(false);
      router.push(`/event-studio/events/${params.event_id}/transactions`); // Navigate to a different page on success
      notificationCtx.success('Tạo giao dịch thành công');
    } catch (error) {
      const err: any = error as any;
      if ((axios.isAxiosError && axios.isAxiosError(err) && err.response?.status === 422) || err?.response?.status === 422) {
        const detail = err?.response?.data?.detail || [];
        const items: CustomerValidationError[] = Array.isArray(detail)
          ? detail.reduce((acc: CustomerValidationError[], d: any) => {
              const loc = d?.loc || [];
              const idx = typeof loc[2] === 'number' ? loc[2] : null;
              const field = String(loc[3] ?? '');
              if (idx == null) {
                return acc;
              }
              acc.push({
                lineId: idx + 1,
                field,
                input: String(d?.input ?? ''),
                msg: String(d?.msg ?? ''),
              });
              return acc;
            }, [])
          : [];
        setCustomerValidationErrors(items);
        setConfirmOpen(false);
      } else {
        setConfirmOpen(false);
        notificationCtx.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const totalSelectedTickets = React.useMemo(() => {
    return Object.values(selectedCategories).reduce((sum, catMap) => {
      const subtotal = Object.values(catMap || {}).reduce((s, q) => s + (q || 0), 0);
      return sum + subtotal;
    }, 0);
  }, [selectedCategories]);

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
              <TicketCategories
                key={show.id}
                show={show}
                qrOption={'shared'}
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
                      <TableRow
                        hover
                        key={index}
                        sx={
                          customerErrorsMap[index] && Object.keys(customerErrorsMap[index]).length > 0
                            ? { backgroundColor: 'rgba(255, 152, 0, 0.08)' }
                            : undefined
                        }
                      >
                        {(() => {
                          const rowErrors = customerErrorsMap[index] || {};
                          const nameErrors = rowErrors['name'] || [];
                          const emailErrors = rowErrors['email'] || [];
                          const phoneErrors = rowErrors['phoneNumber'] || [];
                          const addressErrors = rowErrors['address'] || [];
                          return (
                            <>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <FormControl fullWidth required error={nameErrors.length > 0}>
                            <OutlinedInput
                              name={`customer_name_${index}`}
                              value={customer.name}
                              onChange={(e) =>
                                handleCustomerChange(index, 'name', e.target.value)
                              }
                              size="small"
                              sx={{ fontSize: '11px' }}
                              startAdornment={
                                <InputAdornment position="start">
                                  <Select
                                    variant="standard"
                                    sx={{ fontSize: '11px' }}
                                    disableUnderline
                                    value={customer.title || "Bạn"}
                                    onChange={(e) =>
                                      handleCustomerChange(index, 'title', e.target.value)
                                    }
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
                            {nameErrors.map((err, errIdx) => (
                              <FormHelperText key={`name-error-${index}-${errIdx}`}>
                                {`${err.msg}`}
                              </FormHelperText>
                            ))}
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth required error={emailErrors.length > 0}>
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
                            {emailErrors.map((err, errIdx) => (
                              <FormHelperText key={`email-error-${index}-${errIdx}`}>
                                {`${err.msg}`}
                              </FormHelperText>
                            ))}
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth required error={phoneErrors.length > 0}>
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
                            {phoneErrors.map((err, errIdx) => (
                              <FormHelperText key={`phone-error-${index}-${errIdx}`}>
                                {`${err.msg}`}
                              </FormHelperText>
                            ))}
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth error={addressErrors.length > 0}>
                            <OutlinedInput
                              name={`customer_address_${index}`}
                              value={customer.address}
                              onChange={(e) =>
                                handleCustomerChange(index, 'address', e.target.value)
                              }
                              size="small"
                              sx={{ fontSize: '11px' }}
                            />
                            {addressErrors.map((err, errIdx) => (
                              <FormHelperText key={`address-error-${index}-${errIdx}`}>
                                {`${err.msg}`}
                              </FormHelperText>
                            ))}
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => removeCustomer(index)}>
                            <X />
                          </IconButton>
                        </TableCell>
                            </>
                          );
                        })()}
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
                <Button startIcon={<Download />} size='small' component={LocalizedLink}
                  href='/assets/create-bulk-transactions-template.xlsx' download={true}>
                  Tải file excel mẫu
                </Button>
              </CardActions>
            </Card>
            {customerValidationErrors.length > 0 && (
            <Card sx={{ backgroundColor: '#FFF9ED' }}>
              <CardHeader
                titleTypographyProps={{ variant: 'subtitle2', sx: { fontWeight: 600 } }}
                subheader="Vui lòng sửa các lỗi bên dưới"
                subheaderTypographyProps={{ variant: 'caption', sx: { color: 'warning.dark' } }}
                sx={{ py: 1 }}
              />
              <Divider />
              <CardContent sx={{ py: 1, px: 2 }}>
                <Stack spacing={0.5}>
                  {sortedValidationErrors.map((e, i) => {
                    const fieldKey = normalizeFieldKey(e.field);
                    const fieldLabel = customerFieldLabelMap[fieldKey] || e.field;
                    const displayValue = e.input ? e.input : 'Trống';
                    return (
                      <Typography key={`${e.lineId}-${fieldKey}-${i}`} variant="caption" sx={{ lineHeight: 1.4 }}>
                        <Box component="span" sx={{ fontWeight: 600 }}>{`Dòng ${e.lineId}`}</Box>
                        {` • ${fieldLabel}: `}
                        <Box component="span" sx={{ fontFamily: 'monospace' }}>{`"${displayValue}"`}</Box>
                        {` — ${e.msg}`}
                      </Typography>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
            )}


            {/* Ticket Quantity and Ticket Holders */}
            {totalSelectedTickets > 0 && (
            <Card>
              <CardHeader
                title="Danh sách vé"
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
                        <Stack spacing={3} key={`${showId}-${categoryId}`}>
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
                        </Stack >
                      );
                    });
                  })}
                </Stack>
              </CardContent>
            </Card>
            )}

            {/* Additional options (read-only) */}
            {totalSelectedTickets > 1 && (
            <Card>
              <CardHeader title="Tùy chọn bổ sung" />
              <Divider />
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Stack>
                    <Typography variant="body2">Sử dụng mã QR riêng cho từng vé</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Bạn cần nhập email cho từng vé.
                    </Typography>
                  </Stack>
                  <Checkbox checked={false} disabled />
                </Stack>
              </CardContent>
            </Card>
            )}


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


            {/* Submit Button */}
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: '3' }}>
              <Button variant="contained" onClick={handleCreateClick}>
                Tạo
              </Button>
            </Grid>
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="md">
              <DialogTitle sx={{ color: "primary.main" }}>Xác nhận tạo {customers.length} đơn hàng</DialogTitle>
              <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {/* <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Thông tin người mua mỗi đơn hàng</Typography> */}
                  <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {customers.map((customer, index) => (
                      <Box key={index} sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Người mua {index + 1}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">Họ và tên</Typography>
                          <Typography variant="body2">{customer.title ? `${customer.title} ` : ''}{customer.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">Email</Typography>
                          <Typography variant="body2">{customer.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Số điện thoại</Typography>
                          <Typography variant="body2">{customer.phoneNumber}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                  <Divider />

                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Danh sách vé mỗi đơn hàng</Typography>
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
