"use client"

import * as React from 'react';
import NotificationContext from '@/contexts/notification-context';
import axios, { AxiosResponse } from 'axios';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { useMediaDevices } from "react-media-devices";
import { useZxing } from "react-zxing";
import { Card, CardActions, CardContent, CardHeader, Container, FormControl, FormControlLabel, InputLabel, MenuItem, OutlinedInput, Select, styled, SwipeableDrawer, Tooltip } from '@mui/material';
import { Drawer, Stack, Grid, Typography, Checkbox, Button, Divider } from '@mui/material';
import dayjs from 'dayjs';
import { Info as InfoIcon } from '@phosphor-icons/react/dist/ssr/Info';
import { grey } from '@mui/material/colors';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { Lightning } from '@phosphor-icons/react/dist/ssr';

const iOS =
  typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export interface TransactionTicket {
  id: number;
  holder: string;
  createdAt: string;
  checkInAt: string | null;
}

export interface Ticket {
  id: number;
  holder: string;
  checkInAt: string | null;
  disabled: boolean;
  checked: boolean;
}

export interface TicketCategory {
  id: number;
  name: string;
  type: string;
  price: number;
  avatar: string | null;
  quantity: number;
  sold: number;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  eventId: number;
  customerId: number;
  email: string;
  name: string;
  gender: string;
  phoneNumber: string;
  address: string;
  dob: string | null;
  ticketCategory: TicketCategory;
  ticketQuantity: number;
  netPricePerOne: number;
  extraFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentOrderCode: string | null;
  paymentDueDatetime: string | null;
  paymentCheckoutUrl: string | null;
  paymentTransactionDatetime: string | null;
  note: string | null;
  status: string;
  createdBy: number;
  createdAt: string;
  tickets: TransactionTicket[];
}
const constraints: MediaStreamConstraints = {
  video: true,
  audio: false,
};
export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  const [qrManualInput, setQrManualInput] = React.useState<string>('');
  const [eCode, setECode] = React.useState<string>('');
  const [isCheckinControllerOpen, setIsCheckinControllerOpen] = React.useState(false);
  const [isSuccessful, setIsSuccessful] = React.useState(false);
  const [error, setError] = React.useState();
  const [isLoading, setIsLoading] = React.useState(false);
  const [trxn, setTrxn] = React.useState<Transaction>();
  const [confirmCheckin, setConfirmCheckin] = React.useState(false);
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const notificationCtx = React.useContext(NotificationContext);

  const { devices } = useMediaDevices({ constraints });
  const deviceId = devices?.[0]?.deviceId;
  const ticketsToCheckInCount = React.useMemo(() => tickets.filter(ticket => ticket.checked).length, [tickets])
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
        .get(`/event-studio/events/${params.event_id}/check-in/`, { params: { check_in_e_code: eCode } });
      const dataTrxn = transactionResponse.data
      setTrxn(dataTrxn);

      // Map trxn.tickets to the new Ticket interface
      const ticketData: Ticket[] = dataTrxn.tickets.map((ticket) => ({
        id: ticket.id,
        holder: ticket.holder,
        disabled: ticket.checkInAt !== null,
        checkInAt: ticket.checkInAt,
        checked: false,
      }));
      setTickets(ticketData);

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
      const ticketIds = tickets
        .filter(ticket => ticket.checked)
        .map(t => t.id);
      let checkInAll = false
      if (ticketIds.length === tickets.length) {
        checkInAll = true
      }

      baseHttpServiceInstance
        .post(`/event-studio/events/${params.event_id}/check-in/`, {
          eCode,
          checkInAll,
          checkInCustomerIds: checkInAll ? [] : ticketIds,
        })
        .then(function (response) {
          getTransactionByECode(eCode);
        })
        .catch(function (error) {
          setError(error);
        })
        .finally(function () {
          setIsLoading(false);
        });
    }
  };

  const handleEditCheckedTicket = (index: number) => {
    setConfirmCheckin(false);
    const updatedTickets = tickets.map((ticket, i) =>
      i === index ? { ...ticket, checked: !ticket.checked } : ticket
    );
    setTickets(updatedTickets);
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
  const renderTooltip = (checkInAt: string) => (
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
            </Stack>
          </Grid>

          <Grid item lg={7} md={7} xs={12} spacing={3}>
            <Stack spacing={3}>
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
                    <Typography variant="body1">Loại vé:</Typography>
                    <Typography variant="body1">{trxn?.ticketCategory.name || "Chưa xác định"}</Typography>
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">Số lượng vé:</Typography>
                    <Typography variant="body1">{trxn?.ticketQuantity}</Typography>
                  </Grid>


                  <Stack>
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
                  </Stack>

                  <Button
                    variant="contained"
                    disabled={tickets.filter(ticket => ticket.checked).length === 0}
                    onClick={() => {
                      setConfirmCheckin(true);
                      sendCheckinRequest(eCode);
                    }}
                  >
                    {ticketsToCheckInCount > 0 && ticketsToCheckInCount !== tickets.length && `Check-in ${ticketsToCheckInCount} vé`}
                    {ticketsToCheckInCount === tickets.length && 'Check-in tất cả'}
                    {ticketsToCheckInCount === 0 && 'Check-in'}
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

