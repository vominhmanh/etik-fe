"use client"

import * as React from 'react';
import NotificationContext from '@/contexts/notification-context';
import axios, { AxiosResponse } from 'axios';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { useMediaDevices } from "react-media-devices";
import { useZxing } from "react-zxing";
import { Accordion, AccordionDetails, AccordionSummary, Card, CardActions, CardContent, CardHeader, Chip, Container, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, OutlinedInput, Select, styled, SwipeableDrawer, Tooltip } from '@mui/material';
import { Drawer, Stack, Grid, Typography, Checkbox, Button, Divider } from '@mui/material';
import dayjs from 'dayjs';
import { Info as InfoIcon } from '@phosphor-icons/react/dist/ssr/Info';
import { grey } from '@mui/material/colors';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { ArrowDown, ArrowSquareIn, Bank, CaretDown, Lightning, Money } from '@phosphor-icons/react/dist/ssr';
import { Schedules } from './schedules';
import { TicketCategories } from './ticket-categories';
import RouterLink from 'next/link';

const iOS =
  typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);


// Ticket.ts
export interface Ticket {
  id: number;
  holder: string;
  checkInAt: Date | null;
}

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
  show: Show;
};

// transactionTicketCategory.ts
export interface TransactionTicketCategory {
  netPricePerOne: number;
  tickets: Ticket[];
  ticketCategory: TicketCategory;
}

// TransactionResponse.ts
export interface Transaction {
  id: number;
  email: string;
  name: string;
  dob: string;
  phoneNumber: string;
  address: string;
  transactionTicketCategories: TransactionTicketCategory[];
  ticketQuantity: number;
  extraFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: Date;
  exportedTicketAt: string | null;
}

export type Show = {
  id: number;
  name: string;
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

const constraints: MediaStreamConstraints = {
  video: {
    width: 480,
    height: 480,
    facingMode: 'environment',
    aspectRatio: 1 / 1
  },
  audio: false,
};
type MyDynamicObject = {
  [key: string]: boolean; // key is a string, and value is also a string
};

// Function to map payment methods to corresponding labels and icons
const getPaymentMethodDetails = (paymentMethod: string) => {
  switch (paymentMethod) {
    case 'cash':
      return { label: 'Tiền mặt', icon: <Money /> };
    case 'transfer':
      return { label: 'Chuyển khoản', icon: <Bank /> };
    case 'napas247':
      return { label: 'Napas 247', icon: <Lightning /> };
    default:
      return { label: 'Unknown', icon: null };
  }
};


// Function to map payment statuses to corresponding labels and colors
const getPaymentStatusDetails = (paymentStatus: string) => {
  switch (paymentStatus) {
    case 'waiting_for_payment':
      return { label: 'Chờ thanh toán', color: 'warning' };
    case 'paid':
      return { label: 'Đã thanh toán', color: 'success' };
    case 'refund':
      return { label: 'Đã hoàn tiền', color: 'secondary' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

// Function to map row statuses to corresponding labels and colors
const getRowStatusDetails = (status: string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
    case 'normal':
      return { label: 'Bình thường', color: 'success' };
    case 'wait_for_response':
      return { label: 'Đang chờ', color: 'warning' };
    case 'customer_cancelled':
      return { label: 'Huỷ bởi KH', color: 'error' }; // error for danger
    case 'staff_locked':
      return { label: 'Khoá bởi NV', color: 'error' };
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

const getSentEmailTicketStatusDetails = (status: string): { label: string, color: "success" | "error" | "warning" | "info" | "secondary" | "default" | "primary" } => {
  switch (status) {
    case 'sent':
      return { label: 'Đã xuất', color: 'success' };
    case 'not_sent':
      return { label: 'Chưa xuất', color: 'default' }; // error for danger
    default:
      return { label: 'Unknown', color: 'default' };
  }
};

export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Soát vé bằng mã QR | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);

  const [qrManualInput, setQrManualInput] = React.useState<string>('');
  const [eCode, setECode] = React.useState<string>('');
  const [isCheckinControllerOpen, setIsCheckinControllerOpen] = React.useState(false);
  const [isSuccessful, setIsSuccessful] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [trxn, setTrxn] = React.useState<Transaction>();
  const [confirmCheckin, setConfirmCheckin] = React.useState(false);
  const notificationCtx = React.useContext(NotificationContext);
  const [selectedSchedule, setSelectedSchedule] = React.useState<Show>();
  const [selectedCategories, setSelectedCategories] = React.useState<number[]>([]);
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [accordionState, setAccordionState] = React.useState<MyDynamicObject>({});
  const [ticketDisabledState, setTicketDisabledState] = React.useState<MyDynamicObject>({});
  const [ticketCheckboxState, setTicketCheckboxState] = React.useState<MyDynamicObject>({});
  const { ref, torch: { on, off, isOn, isAvailable } } = useZxing({
    onDecodeResult(result) {
      if (!isCheckinControllerOpen) {
        setIsCheckinControllerOpen(true);
        setECode(result.getText());
        getTransactionByECode(result.getText());
      }
    },
    timeBetweenDecodingAttempts: 50,
  });

  const handleCloseDrawer = () => {
    setIsCheckinControllerOpen(false)
  }
  const handleCategorySelection = (categoryIds: number[]) => {
    setSelectedCategories(categoryIds);
  };

  const handleSelectionChange = (selected: Show) => {
    setSelectedSchedule(selected);
  };
  // Define the toggleExpand function
  const toggleExpand = (key: string) => {
    setAccordionState((prevState) => ({
      ...prevState,
      [key]: !prevState[key], // Toggle the value for the specific accordion key
    }));
  };

  // Handler for checkbox change
  const handleCheckboxChange = (key: string) => {
    setTicketCheckboxState((prevState) => ({
      ...prevState,
      [key]: !prevState[key], // Toggle the value for the specific accordion key
    }));
  };


  // Fetch event details on component mount
  React.useEffect(() => {
    if (params.event_id) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
            `/event-studio/events/${params.event_id}/check-in/get-shows-ticket-categories-to-check-in`
          );
          setEvent(response.data);
          // setFormValues(response.data); // Initialize form with the event data
        } catch (error) {
          notificationCtx.error('Lỗi:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    }
  }, [params.event_id]);


  const getTransactionByECode = async (eCode: string) => {
    try {
      setIsLoading(true);
      const transactionResponse: AxiosResponse<Transaction> = await baseHttpServiceInstance
        .get(`/event-studio/events/${params.event_id}/check-in`, { params: { check_in_e_code: eCode } });
      const dataTrxn = transactionResponse.data
      setTrxn(dataTrxn);

      const accordState: MyDynamicObject = {}
      const ticCheckboxState: MyDynamicObject = {}
      const ticDisabledState: MyDynamicObject = {}

      dataTrxn.transactionTicketCategories.forEach(transactionTicketCategory => {
        const accordionKey = `${transactionTicketCategory.ticketCategory.show.id}-${transactionTicketCategory.ticketCategory.id}`
        accordState[accordionKey] = false
        if (transactionTicketCategory.ticketCategory.show.id === selectedSchedule?.id && selectedCategories.includes(transactionTicketCategory.ticketCategory.id)) {
          accordState[accordionKey] = true
        }
      })
      setAccordionState(accordState)

      dataTrxn.transactionTicketCategories.forEach(transactionTicketCategory => {
        transactionTicketCategory.tickets.forEach((ticket) => {
          const ticketKey = `${ticket.id}-${transactionTicketCategory.ticketCategory.show.id}-${transactionTicketCategory.ticketCategory.id}`
          ticDisabledState[ticketKey] = false
          ticCheckboxState[ticketKey] = false

          if (ticket.checkInAt != null) {
            ticDisabledState[ticketKey] = true
            ticCheckboxState[ticketKey] = true
          } else {
            if (transactionTicketCategory.ticketCategory.show.id == selectedSchedule?.id && selectedCategories.includes(transactionTicketCategory.ticketCategory.id)) {
              ticCheckboxState[ticketKey] = true
            } else {
              ticDisabledState[ticketKey] = true
            }
          }
        })
      })

      setTicketDisabledState(ticDisabledState)
      setTicketCheckboxState(ticCheckboxState)

      setIsSuccessful(true);
    } catch (error) {
      notificationCtx.error(error);
      setIsSuccessful(false);
    } finally {
      setIsLoading(false);
    }
  };
  const sendCheckinRequest = (eCode: string) => {
    if (trxn) {

      // Collect check-in details by filtering tickets with true checkbox state and false disabled state
      const ticketsToCheckIn: { [key: string]: number[] } = {};

      Object.keys(ticketCheckboxState).forEach(ticketKey => {
        if (ticketCheckboxState[ticketKey] && !ticketDisabledState[ticketKey]) {
          const [ticketId, showId, ticketCategoryId] = ticketKey.split('-').map(Number);

          const key = `${showId}-${ticketCategoryId}`;
          if (!ticketsToCheckIn[key]) {
            ticketsToCheckIn[key] = [];
          }
          ticketsToCheckIn[key].push(ticketId);
        }
      });

      // Loop through each show/ticketCategory group and send requests
      const requests = Object.entries(ticketsToCheckIn).map(([key, ticketIds]) => {
        const [showId, ticketCategoryId] = key.split('-').map(Number);
        const checkInAll = ticketIds.length === trxn.transactionTicketCategories.find(
          category => category.ticketCategory.show.id === showId &&
            category.ticketCategory.id === ticketCategoryId
        )?.tickets.length;

        return baseHttpServiceInstance.post(`/event-studio/events/${params.event_id}/check-in`, {
          eCode,
          showId,
          ticketCategoryId,
          checkInAll,
          checkInCustomerIds: checkInAll ? [] : ticketIds,
        });
      });

      if (requests.length === 0) {
        notificationCtx.warning(`Vui lòng chọn ít nhất 1 vé để check-in.`);
        return
      }
      setIsLoading(true);

      // Execute all requests and update UI state
      Promise.all(requests)
        .then(() => {
          getTransactionByECode(eCode); // Refresh data after check-in
          setIsSuccessful(true);
          notificationCtx.success(`Check-in thành công.`);
        })
        .catch(error => {
          notificationCtx.error(error);
          setIsSuccessful(false);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const handleManualCheckIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (qrManualInput) {
      setIsCheckinControllerOpen(true);
      setECode(qrManualInput);
      getTransactionByECode(qrManualInput);
    }
  }

  const Puller = styled('div')(({ theme }) => ({
    width: 30,
    height: 6,
    backgroundColor: grey[300],
    borderRadius: 3,
    position: 'absolute',
    top: 8,
    left: 'calc(50% - 15px)',
    ...theme.applyStyles('dark', {
      backgroundColor: grey[900],
    }),
  }));
  const renderTooltip = (checkInAt: string | null) => (
    <Tooltip title={
      <Stack spacing={1}>
        <Typography variant='body2'>Đã check-in lúc {dayjs(checkInAt).format('HH:mm:ss DD/MM/YYYY')}</Typography>
      </Stack>
    }>
      <InfoIcon />
    </Tooltip>
  );

  return (
    <>
      <Stack spacing={3}>
        <div>
          <Typography variant="h4">Check-in sự kiện</Typography>
        </div>
        <Grid container spacing={3}>
          <Grid item lg={5} md={5} xs={12} spacing={3}>
            <Stack spacing={3}>
              <Schedules shows={event?.shows} onSelectionChange={handleSelectionChange} />
              {selectedSchedule &&
                <TicketCategories show={selectedSchedule} onCategoriesSelect={(categoryIds: number[]) => handleCategorySelection(categoryIds)} />
              }
            </Stack>
          </Grid>

          <Grid item lg={7} md={7} xs={12} spacing={3} sx={{ display: selectedSchedule && selectedCategories.length > 0 ? 'block' : 'none' }}>
            <Stack spacing={3}>
              <Card>
                <CardHeader subheader="Vui lòng hướng mã QR về phía camera." title="Quét mã QR" />
                <Divider />
                <CardContent>
                  <video ref={ref} width={'100%'} />
                </CardContent>
                <CardActions>
                  <Button disabled={!isAvailable} onClick={() => (isOn ? off() : on())} startIcon={<Lightning />}>Flash</Button>
                </CardActions>
              </Card>

              <Card>
                <CardHeader subheader="Vui lòng nhập mã để check-in thủ công nếu không quét được mã QR." title="Check-in thủ công" />
                <Divider />
                <CardContent>
                  <form onSubmit={handleManualCheckIn}>
                    <Grid container rowSpacing={2} spacing={2}>
                      <Grid item md={8} xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel>Mã check-in</InputLabel>
                          <OutlinedInput
                            label="Tên loại vé"
                            name="name"
                            value={qrManualInput}
                            onChange={(e) => setQrManualInput(e.target.value)}
                          />
                        </FormControl>
                      </Grid>
                      <Grid item md={4} xs={12}>
                        <Button variant='contained' sx={{ width: '100%', height: '100%' }} onClick={handleManualCheckIn} startIcon={<EyeIcon />}>
                          Kiểm tra
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
      <SwipeableDrawer disableBackdropTransition={!iOS} disableDiscovery={iOS} open={isCheckinControllerOpen} onOpen={() => setIsCheckinControllerOpen(true)} onClose={handleCloseDrawer} anchor="bottom">
        <Puller />
        <Container maxWidth="sm">
          <Stack spacing={2} sx={{ mt: 3 }}>
            <Typography variant="h6">Mã QR: {eCode}</Typography>
            <Divider />
            {isLoading ? (
              <Typography color="warning">Đang kiểm tra...</Typography>
            ) : isSuccessful === false ? (
              <Typography color="error">KHÔNG TÌM THẤY </Typography>
            ) : (
              <>
                <Stack spacing={1}>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Họ tên:</Typography>
                    <Typography variant="body1">{trxn?.name}</Typography>
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Ngày sinh:</Typography>
                    <Typography variant="body1">{trxn?.dob ? dayjs(trxn?.dob || 0).format('DD/MM/YYYY') : `__/__/____`}</Typography>
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Email:</Typography>
                    <Typography variant="body1">{trxn?.email} <IconButton size='small' target='_blank' component={RouterLink} href={`/event-studio/events/${params.event_id}/transactions/${trxn?.id}`}><ArrowSquareIn /></IconButton></Typography>
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Số điện thoại:</Typography>
                    <Typography variant="body1">{trxn?.phoneNumber}</Typography>
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Địa chỉ:</Typography>
                    <Typography variant="body1">{trxn?.address && trxn?.address.length > 30 ? trxn?.address.substring(0, 30) + '...' : trxn?.address}</Typography>
                  </Grid>
                  <Divider />
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Số lượng vé:</Typography>
                    <Typography variant="body1">{trxn?.ticketQuantity}</Typography>
                  </Grid>

                  <div>
                    {trxn?.transactionTicketCategories?.map((category) => {
                      const accordionKey = `${category.ticketCategory.show.id}-${category.ticketCategory.id}`;

                      return (
                        <Accordion
                          key={accordionKey}
                          disableGutters
                          expanded={accordionState[accordionKey]}
                          onChange={() => toggleExpand(accordionKey)} // Use toggleExpand here
                        >
                          <AccordionSummary sx={{ backgroundColor: 'light' }} expandIcon={<CaretDown />}>
                            <Grid container justifyContent="space-between">
                              <Typography variant="body1">Show:</Typography>
                              <Typography variant="body1">
                                {category.ticketCategory.show.name} - {category.ticketCategory.name}
                              </Typography>
                            </Grid>
                          </AccordionSummary>

                          <AccordionDetails>
                            {category.tickets.map((ticket) => {
                              const ticketKey = `${ticket.id}-${category.ticketCategory.show.id}-${category.ticketCategory.id}`


                              return (
                                <FormControlLabel
                                  key={ticketKey}
                                  control={
                                    <Checkbox
                                      checked={ticketCheckboxState[ticketKey]}
                                      onChange={() => handleCheckboxChange(ticketKey)}
                                      disabled={ticketDisabledState[ticketKey]}
                                    />
                                  }
                                  label={
                                    <Stack direction="row" alignItems="center">
                                      <Typography variant="body2">{ticket.holder}</Typography>
                                      {ticketDisabledState[ticketKey] && ticket.checkInAt != null && renderTooltip(ticket.checkInAt.toString())}
                                    </Stack>
                                  }
                                  sx={{ display: 'flex', alignItems: 'center', marginLeft: 2 }}
                                />
                              );
                            })}
                          </AccordionDetails>
                        </Accordion>
                      );
                    })}
                  </div>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Trạng thái giao dịch:</Typography>
                    <Chip
                      size='small'
                      color={getRowStatusDetails(trxn?.status || '').color}
                      label={getRowStatusDetails(trxn?.status || '').label}
                    />
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Trạng thái thanh toán:</Typography>
                    <Chip
                      size='small'
                      color={getPaymentStatusDetails(trxn?.paymentStatus || '').color}
                      label={getPaymentStatusDetails(trxn?.paymentStatus || '').label}
                    />
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Trạng thái xuất vé:</Typography>
                    <Chip
                      size='small'
                      color={getSentEmailTicketStatusDetails(trxn?.exportedTicketAt ? 'sent' : 'not_sent').color}
                      label={getSentEmailTicketStatusDetails(trxn?.exportedTicketAt ? 'sent' : 'not_sent').label}
                    />
                  </Grid>

                  <Divider />




                  {/* <Stack>
                    {tickets.map((ticket, index) => (
                      <Grid container key={ticket.id}>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={ticket.checked}
                                disabled={ticket.disabled}
                                onChange={() => handleEditCheckedTicket(index)}
                              />
                            }
                            label={
                              <Typography>
                                {ticket.holder} {ticket.checkInAt && renderTooltip(ticket.checkInAt)}
                              </Typography>
                            }
                          />
                        </Grid>
                      </Grid>
                    ))}
                  </Stack> */}

                  <Button
                    variant="contained"
                    disabled={!(trxn?.status == 'normal' && trxn?.paymentStatus == 'paid')}
                    onClick={() => {
                      setConfirmCheckin(true);
                      sendCheckinRequest(eCode);
                    }}
                  >
                    {'Check-in'}
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </Container>
      </SwipeableDrawer >

    </>
  );
}

