"use client"

import * as React from 'react';
import NotificationContext from '@/contexts/notification-context';
import axios, { AxiosResponse } from 'axios';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { useMediaDevices } from "react-media-devices";
import { useZxing } from "react-zxing";
import { Accordion, AccordionDetails, AccordionSummary, Card, CardActions, CardContent, CardHeader, Container, FormControl, FormControlLabel, InputLabel, MenuItem, OutlinedInput, Select, styled, SwipeableDrawer, Tooltip } from '@mui/material';
import { Drawer, Stack, Grid, Typography, Checkbox, Button, Divider } from '@mui/material';
import dayjs from 'dayjs';
import { Info as InfoIcon } from '@phosphor-icons/react/dist/ssr/Info';
import { grey } from '@mui/material/colors';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { ArrowDown, CaretDown, Lightning } from '@phosphor-icons/react/dist/ssr';
import { Schedules } from './schedules';
import { TicketCategories } from './ticket-categories';

const iOS =
  typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);


// Ticket.ts
export interface Ticket {
  id: number;
  holder: string;
  checkInAt: Date | null;
}

// TransactionShowTicketCategory.ts
export interface TransactionShowTicketCategory {
  netPricePerOne: number;
  tickets: Ticket[];
  showTicketCategory: ShowTicketCategory;
}

// TransactionResponse.ts
export interface Transaction {
  id: number;
  email: string;
  name: string;
  phoneNumber: string;
  address: string;
  transactionShowTicketCategories: TransactionShowTicketCategory[];
  ticketQuantity: number;
  extraFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  createdAt: Date;
}




export type TicketCategory = {
  id: number;
  avatar: string | null;
  name: string;
  price: number;
  description: string;
  status: string;
};

export type ShowTicketCategory = {
  quantity: number;
  sold: number;
  disabled: boolean;
  ticketCategory: TicketCategory;
  show: Show;
};

export type Show = {
  id: number;
  name: string;
  startDateTime: string; // backend response provides date as string
  endDateTime: string; // backend response provides date as string
  showTicketCategories: ShowTicketCategory[];
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
  video: true,
  audio: false,
};
type MyDynamicObject = {
  [key: string]: boolean; // key is a string, and value is also a string
};
export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  const [qrManualInput, setQrManualInput] = React.useState<string>('');
  const [eCode, setECode] = React.useState<string>('');
  const [isCheckinControllerOpen, setIsCheckinControllerOpen] = React.useState(false);
  const [isSuccessful, setIsSuccessful] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
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

  const { devices } = useMediaDevices({ constraints });
  const deviceId = devices?.[0]?.deviceId;
  const { ref } = useZxing({
    paused: !deviceId,
    deviceId,
    onDecodeResult(result) {
      setIsCheckinControllerOpen(true);
      setECode(result.getText());
      getTransactionByECode(result.getText());
    },
    timeBetweenDecodingAttempts: 50,
  });

  // const videoRef = React.useRef<HTMLVideoElement>(null);


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
            `/event-studio/events/${params.event_id}/transactions/get-info-to-create-transaction`
          );
          setEvent(response.data);
          // setFormValues(response.data); // Initialize form with the event data
        } catch (error) {
          notificationCtx.error('Error fetching event details:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    }
  }, [params.event_id]);


  React.useEffect(() => {
    const constraints = {
      video: true,
      audio: false,
    };

    const startVideoStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (ref.current) {
          ref.current.srcObject = stream;
        }
      } catch (err) {
        notificationCtx.error("Error accessing webcam:", err);
      }
    };

    startVideoStream();

    return () => {
      // Stop the stream when the component unmounts
      if (ref.current && ref.current.srcObject) {
        const tracks = (ref.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
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

      dataTrxn.transactionShowTicketCategories.forEach(transactionShowTicketCategory => {
        const accordionKey = `${transactionShowTicketCategory.showTicketCategory.show.id}-${transactionShowTicketCategory.showTicketCategory.ticketCategory.id}`
        accordState[accordionKey] = false
        if (transactionShowTicketCategory.showTicketCategory.show.id == selectedSchedule?.id && selectedCategories.includes(transactionShowTicketCategory.showTicketCategory.ticketCategory.id)) {
          accordState[accordionKey] = true
        }
      })
      setAccordionState(accordState)

      dataTrxn.transactionShowTicketCategories.forEach(transactionShowTicketCategory => {
        transactionShowTicketCategory.tickets.forEach((ticket) => {
          const ticketKey = `${ticket.id}-${transactionShowTicketCategory.showTicketCategory.show.id}-${transactionShowTicketCategory.showTicketCategory.ticketCategory.id}`
          ticDisabledState[ticketKey] = false
          ticCheckboxState[ticketKey] = false

          if (ticket.checkInAt != null) {
            ticDisabledState[ticketKey] = true
            ticCheckboxState[ticketKey] = true
          } else {
            if (transactionShowTicketCategory.showTicketCategory.show.id == selectedSchedule?.id && selectedCategories.includes(transactionShowTicketCategory.showTicketCategory.ticketCategory.id)) {
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
      setError(null);
    } catch (error) {
      setError(error);
      setIsSuccessful(false);
    } finally {
      setIsLoading(false);
    }
  };
  const sendCheckinRequest = (eCode: string) => {
    if (trxn) {
      setIsLoading(true);
  
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
        const checkInAll = ticketIds.length === trxn.transactionShowTicketCategories.find(
          category => category.showTicketCategory.show.id === showId &&
                      category.showTicketCategory.ticketCategory.id === ticketCategoryId
        )?.tickets.length;
  
        return baseHttpServiceInstance.post(`/event-studio/events/${params.event_id}/check-in`, {
          eCode,
          showId,
          ticketCategoryId,
          checkInAll,
          checkInCustomerIds: checkInAll ? [] : ticketIds,
        });
      });
  
      // Execute all requests and update UI state
      Promise.all(requests)
        .then(() => {
          getTransactionByECode(eCode); // Refresh data after check-in
          setIsSuccessful(true);
        })
        .catch(error => {
          setError(error);
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
                <TicketCategories show={selectedSchedule} onCategorySelect={(categoryIds: number[]) => handleCategorySelection(categoryIds)} />
              }

            </Stack>
          </Grid>

          <Grid item lg={7} md={7} xs={12} spacing={3}>
            <Stack spacing={3}>

              <Card>
                <CardHeader subheader="Vui lòng hướng mã QR về phía camera." title="Quét mã QR" />
                <Divider />
                <CardContent>
                  <video ref={ref} autoPlay playsInline width="100%" />
                </CardContent>
                <CardActions>
                  <Button startIcon={<Lightning />}>Flash</Button>
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
      <SwipeableDrawer disableBackdropTransition={!iOS} disableDiscovery={iOS} open={isCheckinControllerOpen} onOpen={() => setIsCheckinControllerOpen(true)} onClose={() => setIsCheckinControllerOpen(false)} anchor="bottom">
        <Puller />
        <Container maxWidth="xl">
          <Stack spacing={2} sx={{ mt: 3 }}>
            <Typography variant="h6">Mã QR: {eCode}</Typography>
            <Divider />
            {isLoading ? (
              <Typography color="warning">Đang kiểm tra...</Typography>
            ) : isSuccessful === false ? (
              <Typography color="error">KHÔNG TÌM THẤY GIAO DỊCH</Typography>
            ) : (
              <>
                <Stack spacing={2}>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Họ tên:</Typography>
                    <Typography variant="body1">{trxn?.name}</Typography>
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Email:</Typography>
                    <Typography variant="body1">{trxn?.email}</Typography>
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Số điện thoại:</Typography>
                    <Typography variant="body1">{trxn?.phoneNumber}</Typography>
                  </Grid>
                  <Divider />
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Số lượng vé:</Typography>
                    <Typography variant="body1">{trxn?.ticketQuantity}</Typography>
                  </Grid>

                  <div>
                    {trxn?.transactionShowTicketCategories?.map((category) => {
                      const accordionKey = `${category.showTicketCategory.show.id}-${category.showTicketCategory.ticketCategory.id}`;

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
                                {category.showTicketCategory.show.name} - {category.showTicketCategory.ticketCategory.name}
                              </Typography>
                            </Grid>
                          </AccordionSummary>

                          <AccordionDetails>
                            {category.tickets.map((ticket) => {
                              const ticketKey = `${ticket.id}-${category.showTicketCategory.show.id}-${category.showTicketCategory.ticketCategory.id}`


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
                                      {ticketDisabledState[ticketKey] && ticket.checkInAt != null && renderTooltip(ticket.checkInAt)}
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
                    // disabled={tickets.filter(ticket => ticket.checked).length === 0}
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
      </SwipeableDrawer>

    </>
  );
}

