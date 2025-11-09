"use client"

import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, CardActions, CardContent, CardHeader, Checkbox, Chip, Container, Divider, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem, OutlinedInput, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, styled, SwipeableDrawer, Typography } from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import type { SelectChangeEvent } from '@mui/material/Select';
import { grey } from '@mui/material/colors';
import { ArrowClockwise, ArrowSquareIn, Bank, CaretDown, Lightning, Money } from '@phosphor-icons/react/dist/ssr';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import { LocalizedLink } from '@/components/localized-link';

import * as React from 'react';
import { useZxing } from "react-zxing";
import { useTranslation } from '@/contexts/locale-context';
import { Schedules } from './schedules';
import { TicketCategories } from './ticket-categories';

const iOS =
  typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

const CAMERA_STORAGE_KEY = 'etik_check_out_camera_device';

// Ticket.ts
export interface CheckInHistory {
  id: number;
  type: 'check-in' | 'check-out';
  imageUrl: string | null;
  createdAt: string; // ISO 8601 string for datetime
  createdBy: number | null;
  creator: {
    id: number;
    fullName: string;
    email: string;
  };
}

export interface Ticket {
  id: number;
  holderName: string;
  holderTitle: string;
  holderEmail: string | null;
  holderPhone: string | null;
  checkInAt: Date | null;
  historyCheckIns?: CheckInHistory[];
}

export type RecentScan = {
  qrCode: string;
  scannedAt: string;
  type: 'check_in' | 'check_out';
};

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
  title: string;
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
  avatar: string;
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


// These helper functions will be moved inside the component to use tt

export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  const { tt } = useTranslation();

  // Function to map payment statuses to corresponding labels and colors
  const getPaymentStatusDetails = React.useCallback((paymentStatus: string): { label: string, color: ChipProps['color'] } => {
    switch (paymentStatus) {
      case 'waiting_for_payment':
        return { label: tt('Chờ thanh toán', 'Waiting for payment'), color: 'warning' };
      case 'paid':
        return { label: tt('Đã thanh toán', 'Paid'), color: 'success' };
      case 'refund':
        return { label: tt('Đã hoàn tiền', 'Refunded'), color: 'secondary' };
      default:
        return { label: 'Unknown', color: 'default' };
    }
  }, [tt]);

  // Function to map row statuses to corresponding labels and colors
  const getRowStatusDetails = React.useCallback((status: string): { label: string, color: ChipProps['color'] } => {
    switch (status) {
      case 'normal':
        return { label: tt('Bình thường', 'Normal'), color: 'success' };
      case 'wait_for_response':
        return { label: tt('Đang chờ', 'Waiting'), color: 'warning' };
      case 'customer_cancelled':
        return { label: tt('Huỷ bởi KH', 'Cancelled by Customer'), color: 'error' };
      case 'staff_locked':
        return { label: tt('Khoá bởi NV', 'Locked by Staff'), color: 'error' };
      default:
        return { label: 'Unknown', color: 'default' };
    }
  }, [tt]);

  const getSentEmailTicketStatusDetails = React.useCallback((status: string): { label: string, color: ChipProps['color'] } => {
    switch (status) {
      case 'sent':
        return { label: tt('Đã xuất', 'Exported'), color: 'success' };
      case 'not_sent':
        return { label: tt('Chưa xuất', 'Not Exported'), color: 'default' };
      default:
        return { label: 'Unknown', color: 'default' };
    }
  }, [tt]);

  React.useEffect(() => {
    document.title = tt("Soát vé bằng mã QR | ETIK - Vé điện tử & Quản lý sự kiện", "Check-out with QR Code | ETIK - E-tickets & Event Management");
  }, [tt]);

  const [qrManualInput, setQrManualInput] = React.useState<string>('');
  const [eCode, setECode] = React.useState<string>('');
  const [isCheckinControllerOpen, setIsCheckinControllerOpen] = React.useState(false);
  const [isSuccessful, setIsSuccessful] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [trxn, setTrxn] = React.useState<Transaction>();
  const [confirmCheckin, setConfirmCheckin] = React.useState(false);
  const [videoDevices, setVideoDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string>('');
  const notificationCtx = React.useContext(NotificationContext);
  const [selectedSchedule, setSelectedSchedule] = React.useState<Show>();
  const [selectedCategories, setSelectedCategories] = React.useState<number[]>([]);
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [accordionState, setAccordionState] = React.useState<MyDynamicObject>({});
  const [ticketDisabledState, setTicketDisabledState] = React.useState<MyDynamicObject>({});
  const [ticketCheckboxState, setTicketCheckboxState] = React.useState<MyDynamicObject>({});
  const [recentScans, setRecentScans] = React.useState<RecentScan[]>([]);
  const [recentScansLoading, setRecentScansLoading] = React.useState<boolean>(false);
  const hasTicketsSelected = Object.entries(ticketCheckboxState).some(
    ([ticketKey, checked]) =>
      checked && !ticketDisabledState[ticketKey]
  );
  const { ref, torch: { on, off, isOn, isAvailable } } = useZxing({
    onDecodeResult(result) {
      if (!isCheckinControllerOpen) {
        setIsCheckinControllerOpen(true);
        setECode(result.getText());
        getTransactionByECode(result.getText(), true);
      }
    },
    timeBetweenDecodingAttempts: 50,
    constraints: {
      video: selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId } }
        : undefined,
    },
  });

  React.useEffect(() => {
    if (!selectedDeviceId || typeof window === 'undefined') {
      return;
    }

    const ensureCameraSwitch = window.setTimeout(() => {
      const videoEl = ref.current;
      const stream = videoEl?.srcObject instanceof MediaStream ? videoEl.srcObject : null;
      const activeDeviceId = stream?.getVideoTracks()[0]?.getSettings().deviceId;

      if (activeDeviceId && activeDeviceId !== selectedDeviceId) {
        window.location.reload();
      }
    }, 1200);

    return () => window.clearTimeout(ensureCameraSwitch);
  }, [selectedDeviceId, ref]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !navigator?.mediaDevices?.enumerateDevices) {
      return;
    }

    let isMounted = true;

    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!isMounted) {
          return;
        }
        const videoInputs = devices.filter((device) => device.kind === 'videoinput');
        setVideoDevices(videoInputs);

        const savedDeviceId = window.localStorage.getItem(CAMERA_STORAGE_KEY);
        if (savedDeviceId && videoInputs.some((device) => device.deviceId === savedDeviceId)) {
          setSelectedDeviceId(savedDeviceId);
        } else if (videoInputs.length > 0) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        } else {
          setSelectedDeviceId('');
        }
      } catch (error) {
        console.error('Failed to load video input devices', error);
      }
    };

    loadDevices();
    const handleDeviceChange = () => loadDevices();
    navigator.mediaDevices.addEventListener?.('devicechange', handleDeviceChange);

    return () => {
      isMounted = false;
      navigator.mediaDevices.removeEventListener?.('devicechange', handleDeviceChange);
    };
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (selectedDeviceId) {
      window.localStorage.setItem(CAMERA_STORAGE_KEY, selectedDeviceId);
    }
  }, [selectedDeviceId]);

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

  const fetchRecentScans = React.useCallback(async (): Promise<void> => {
    try {
      setRecentScansLoading(true);
      const response: AxiosResponse<RecentScan[]> = await baseHttpServiceInstance.get(
        `/event-studio/events/${params.event_id}/check-in-or-check-out/check-in/recent-scans`,
        {
          params: {
            scan_type: 'check_out',
          },
        }
      );
      setRecentScans(response.data ?? []);
    } catch (error) {
      notificationCtx.error(error);
    } finally {
      setRecentScansLoading(false);
    }
  }, [notificationCtx, params.event_id]);

  React.useEffect(() => {
    void fetchRecentScans();
  }, [fetchRecentScans]);


  // Fetch event details on component mount
  React.useEffect(() => {
    if (params.event_id) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
            `/event-studio/events/${params.event_id}/check-in-or-check-out/get-shows-ticket-categories`
          );
          setEvent(response.data);
          // setFormValues(response.data); // Initialize form with the event data
        } catch (error) {
          notificationCtx.error(tt('Lỗi:', 'Error:'), error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    }
  }, [params.event_id]);


  const getTransactionByECode = async (eCode: string, firstTimeScan: boolean = false) => {
    try {
      setIsLoading(true);
      const transactionResponse: AxiosResponse<Transaction> = await baseHttpServiceInstance
        .get(`/event-studio/events/${params.event_id}/check-in-or-check-out/check-in`, {
          params: {
            check_in_e_code: eCode,
            scan_qr_code: firstTimeScan,
            scan_type: 'check_out',
          },
        });
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
          
          // Check latest HistoryCheckIn to determine if ticket is checked in
          const historyCheckIns = ticket.historyCheckIns || [];
          const latestCheckIn = historyCheckIns.length > 0
            ? historyCheckIns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
            : null;
          
          const isCheckedIn = latestCheckIn?.type === 'check-in';
          const isCheckedOut = latestCheckIn?.type === 'check-out';
          const isInSelectedSchedule = transactionTicketCategory.ticketCategory.show.id === selectedSchedule?.id && selectedCategories.includes(transactionTicketCategory.ticketCategory.id);
          
          // For check-out: only enable tickets that are checked in (not checked out)
          if (isCheckedIn && isInSelectedSchedule) {
            // Ticket is checked in and in selected schedule - can check-out
            ticDisabledState[ticketKey] = false
            ticCheckboxState[ticketKey] = true
          } else if (isCheckedOut || !isCheckedIn) {
            // Ticket is checked out or never checked in - disable
            ticDisabledState[ticketKey] = true
            ticCheckboxState[ticketKey] = false
          } else {
            // Not in selected schedule - disable
            ticDisabledState[ticketKey] = true
            ticCheckboxState[ticketKey] = false
          }
        })
      })

      setTicketDisabledState(ticDisabledState)
      setTicketCheckboxState(ticCheckboxState)
      // NEW: if *all* tickets are disabled, warn the user
      const allDisabled = Object.values(ticDisabledState).every(v => v === true);
      if (allDisabled && selectedSchedule && firstTimeScan) {
        // 1. Pull the names of the selected categories for this schedule
        const invalidCats = selectedSchedule.ticketCategories
          .filter(tc =>
            selectedCategories.includes(tc.id)
          )
          .map(tc => tc.name);

        // 2. Join them with commas
        const joined = invalidCats?.join(', ') || '';

        // 3. Truncate to 25 chars with "…" if necessary
        const display =
          joined.length > 30
            ? joined.slice(0, 27).trimEnd() + '...'
            : joined;

        // 4. Show the warning for check-out
        notificationCtx.warning(
          tt(`Không có vé đã check-in cho danh mục đã chọn: ${selectedSchedule?.name} — ${display}`, `No checked-in tickets for selected categories: ${selectedSchedule?.name} — ${display}`)
        );
      }

      if (firstTimeScan) {
        await fetchRecentScans();
      }

      setIsSuccessful(true);
    } catch (error) {
      notificationCtx.error(error);
      setIsSuccessful(false);
    } finally {
      setIsLoading(false);
    }
  };
  const sendCheckoutRequest = (eCode: string) => {
    if (trxn) {

      // Collect check-out details by filtering tickets with true checkbox state and false disabled state
      const ticketsToCheckOut: { [key: string]: number[] } = {};

      Object.keys(ticketCheckboxState).forEach(ticketKey => {
        if (ticketCheckboxState[ticketKey] && !ticketDisabledState[ticketKey]) {
          const [ticketId, showId, ticketCategoryId] = ticketKey.split('-').map(Number);

          const key = `${showId}-${ticketCategoryId}`;
          if (!ticketsToCheckOut[key]) {
            ticketsToCheckOut[key] = [];
          }
          ticketsToCheckOut[key].push(ticketId);
        }
      });

      // Loop through each show/ticketCategory group and send requests
      const requests = Object.entries(ticketsToCheckOut).map(([key, ticketIds]) => {
        const [showId, ticketCategoryId] = key.split('-').map(Number);
        const checkOutAll = ticketIds.length === trxn.transactionTicketCategories.find(
          category => category.ticketCategory.show.id === showId &&
            category.ticketCategory.id === ticketCategoryId
        )?.tickets.length;

        return baseHttpServiceInstance.post(`/event-studio/events/${params.event_id}/check-in-or-check-out/check-out`, {
          eCode,
          showId,
          ticketCategoryId,
          checkInAll: checkOutAll,
          checkInCustomerIds: checkOutAll ? [] : ticketIds,
        });
      });

      if (requests.length === 0) {
        notificationCtx.warning(tt(`Vui lòng chọn ít nhất 1 vé để check-out.`, `Please select at least 1 ticket to check-out.`));
        return
      }
      setIsLoading(true);

      // Execute all requests and update UI state
      Promise.all(requests)
        .then(() => {
          getTransactionByECode(eCode); // Refresh data after check-out
          setIsSuccessful(true);
          notificationCtx.success(tt(`Check-out thành công.`, `Check-out successful.`));
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

  const handleHistoryRowClick = (code: string) => {
    setIsCheckinControllerOpen(true);
    setECode(code);
    getTransactionByECode(code);
  }

  const runManualCheckIn = () => {
    if (qrManualInput) {
      setIsCheckinControllerOpen(true);
      setECode(qrManualInput);
      getTransactionByECode(qrManualInput, true);
    }
  }

  const handleManualCheckInSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    runManualCheckIn();
  }

  const handleManualCheckInClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    runManualCheckIn();
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

  return (
    <>
      <Stack spacing={3}>
        <div>
          <Typography variant="h4">{tt('Check-out sự kiện', 'Event Check-out')} {event?.name}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <LocalizedLink href={`/event-studio/events/${params.event_id}/check-in/qr`} style={{ textDecoration: 'none', color: 'primary' }}>
              Chuyển sang Check-in
            </LocalizedLink>
          </Typography>
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
                <CardHeader subheader={tt("Vui lòng hướng mã QR về phía camera.", "Please point the QR code towards the camera.")} title={tt("Quét mã QR", "Scan QR Code")} />
                <Divider />
                <CardContent>
                  {videoDevices.length > 0 && (
                    <FormControl size="small" sx={{ mb: 2, minWidth: 200 }}>
                      <InputLabel>{tt('Camera', 'Camera')}</InputLabel>
                      <Select
                        label={tt('Camera', 'Camera')}
                        value={selectedDeviceId}
                        onChange={(event: SelectChangeEvent<string>) => setSelectedDeviceId(event.target.value)}
                      >
                        {videoDevices.map((device, index) => (
                          <MenuItem key={device.deviceId || index} value={device.deviceId}>
                            {device.label || `${tt('Camera', 'Camera')} ${index + 1}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  <video key={selectedDeviceId || 'default'} ref={ref} width={'100%'} />
                </CardContent>
                <CardActions>
                  <Button disabled={!isAvailable} onClick={() => (isOn ? off() : on())} startIcon={<Lightning />}>{tt('Flash', 'Flash')}</Button>
                </CardActions>
              </Card>

              
              <Card>
                <CardHeader subheader={tt("Vui lòng nhập mã để check-out thủ công nếu không quét được mã QR.", "Please enter the code to manually check-out if QR code scanning is not possible.")} title={tt("check-out thủ công", "Manual check-out")} />
                <Divider />
                <CardContent>
                  <form onSubmit={handleManualCheckInSubmit}>
                    <Grid container rowSpacing={2} spacing={2}>
                      <Grid item md={8} xs={12}>
                        <FormControl fullWidth required>
                          <InputLabel>{tt('Mã QR', 'QR Code')}</InputLabel>
                          <OutlinedInput
                            label={tt('Mã QR', 'QR Code')}
                            name="name"
                            value={qrManualInput}
                            onChange={(e) => setQrManualInput(e.target.value)}
                          />
                        </FormControl>
                      </Grid>
                      <Grid item md={4} xs={12}>
                        <Button variant='contained' sx={{ width: '100%', height: '100%' }} onClick={handleManualCheckInClick} startIcon={<EyeIcon />}>
                          {tt('Kiểm tra', 'Check')}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </CardContent>
                <Divider />
                <CardContent>
                  <Typography variant="body1">
                    {tt('Khách hàng không có mã QR?', 'Customer doesn\'t have QR code?')}
                    {' '}
                    <a
                      href={`/event-studio/events/${params.event_id}/tickets`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#1976d2', textDecoration: 'none' }}
                    >
                      {tt('Tìm kiếm trong danh sách vé', 'Search in tickets list')}
                    </a>
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardHeader
                  title={tt('Lịch sử check-out gần nhất', 'Recent check-out history')}
                  action={
                    <IconButton
                      size="small"
                      onClick={() => { void fetchRecentScans(); }}
                      disabled={recentScansLoading}
                    >
                      <ArrowClockwise />
                    </IconButton>
                  }
                />
                <Divider />
                <CardContent sx={{ p: 0 }}>
                  {recentScansLoading ? (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {tt('Đang tải lịch sử check-out...', 'Loading recent check-outs...')}
                      </Typography>
                    </Box>
                  ) : recentScans.length === 0 ? (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {tt('Chưa có lịch sử check-out.', 'No check-out history yet.')}
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer
                      sx={{
                        width: '100%',
                        maxHeight: 320,
                        overflowY: 'auto',
                        overflowX: 'auto',
                      }}
                    >
                      <Table size="small" sx={{ minWidth: '100%' }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>{tt('Mã QR', 'QR Code')}</TableCell>
                            <TableCell align="right">{tt('Thời gian', 'Time')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recentScans.map((scan, index) => (
                            <TableRow
                              key={`${scan.qrCode}-${scan.scannedAt}-${index}`}
                              hover
                              sx={{ cursor: 'pointer' }}
                              onClick={() => handleHistoryRowClick(scan.qrCode)}
                            >
                              <TableCell>{scan.qrCode}</TableCell>
                              <TableCell align="right">
                                {dayjs(scan.scannedAt).format('HH:mm:ss DD/MM/YYYY')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>

            </Stack>
          </Grid>
        </Grid>
      </Stack>
      <SwipeableDrawer disableBackdropTransition={!iOS} disableDiscovery={iOS} open={isCheckinControllerOpen} onOpen={() => setIsCheckinControllerOpen(true)} onClose={handleCloseDrawer} anchor="bottom">
        <Puller />
        <Container maxWidth="sm">
          <Stack spacing={2} sx={{ mt: 3, mb: 2 }}>
            <Typography variant="h6">{tt('Mã QR:', 'QR Code:')} {eCode}</Typography>
            <Divider />
            {isLoading ? (
              <Typography color="warning">{tt('Đang kiểm tra...', 'Checking...')}</Typography>
            ) : isSuccessful === false ? (
              <Typography color="error">{tt('KHÔNG TÌM THẤY', 'NOT FOUND')} </Typography>
            ) : (
              <>
                <Stack spacing={1}>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1" fontWeight="bold">{tt('Người mua:', 'Buyer:')}</Typography>
                    <IconButton size='small' target='_blank' component={LocalizedLink} href={`/event-studio/events/${params.event_id}/transactions/${trxn?.id}?checkInCode=${eCode}`}><ArrowSquareIn /></IconButton>
                  </Grid>

                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">{tt('Họ tên:', 'Full Name:')}</Typography>
                    <Typography variant="body1">{trxn?.title} {trxn?.name}</Typography>
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">{tt('Ngày sinh:', 'Date of Birth:')}</Typography>
                    <Typography variant="body1">{trxn?.dob ? dayjs(trxn?.dob || 0).format('DD/MM/YYYY') : `__/__/____`}</Typography>
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">{tt('Email:', 'Email:')}</Typography>
                    <Typography variant="body1">{trxn?.email}</Typography>
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">{tt('Số điện thoại:', 'Phone Number:')}</Typography>
                    <Typography variant="body1">{trxn?.phoneNumber}</Typography>
                  </Grid>
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1">{tt('Địa chỉ:', 'Address:')}</Typography>
                    <Typography variant="body1">{trxn?.address && trxn?.address.length > 30 ? trxn?.address.substring(0, 30) + '...' : trxn?.address}</Typography>
                  </Grid>
                  <Divider />
                  <Grid container justifyContent="space-between">
                    <Typography variant="body1" fontWeight="bold">{tt('Danh sách vé đang có:', 'Current Tickets:')}</Typography>
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
                              <Typography variant="body1">{tt('Show:', 'Show:')}</Typography>
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
                                    <Stack direction="column" alignItems="left">
                                      <Typography variant="body2">TID-{ticket.id} {ticket.holderName || ticket.holderTitle}</Typography>
                                      {(() => {
                                        const historyCheckIns = ticket.historyCheckIns || [];
                                        const latestCheckIn = historyCheckIns.length > 0
                                          ? historyCheckIns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
                                          : null;
                                        
                                        if (latestCheckIn?.type === 'check-in') {
                                          return (
                                            <Typography variant="caption" color="success.main">
                                              {tt('Đã check-in lúc', 'Checked in at')} {dayjs(latestCheckIn.createdAt).format("HH:mm:ss DD/MM/YYYY")}
                                            </Typography>
                                          );
                                        } else if (latestCheckIn?.type === 'check-out') {
                                          return (
                                            <Typography variant="caption" color="error.main">
                                              {tt('Đã check-out lúc', 'Checked out at')} {dayjs(latestCheckIn.createdAt).format("HH:mm:ss DD/MM/YYYY")}
                                            </Typography>
                                          );
                                        }
                                        return null;
                                      })()}
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
                    <Typography variant="body1" fontWeight="bold">{tt('Trạng thái', 'Status')}</Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip
                        size='small'
                        color={getRowStatusDetails(trxn?.status || '').color}
                        label={getRowStatusDetails(trxn?.status || '').label}
                      />
                      <Chip
                        size='small'
                        color={getPaymentStatusDetails(trxn?.paymentStatus || '').color}
                        label={getPaymentStatusDetails(trxn?.paymentStatus || '').label}
                      />
                      <Chip
                        size='small'
                        color={getSentEmailTicketStatusDetails(trxn?.exportedTicketAt ? 'sent' : 'not_sent').color}
                        label={getSentEmailTicketStatusDetails(trxn?.exportedTicketAt ? 'sent' : 'not_sent').label}
                      />
                    </Stack>
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
                                {ticket.holderName} {ticket.checkInAt && renderTooltip(ticket.checkInAt)}
                              </Typography>
                            }
                          />
                        </Grid>
                      </Grid>
                    ))}
                  </Stack> */}

                  <Button
                    variant="contained"
                    disabled={
                      // existing disable condition OR no tickets selected
                      !(trxn?.status === 'normal' && trxn?.paymentStatus === 'paid')
                      || !hasTicketsSelected
                    }
                    onClick={() => {
                      setConfirmCheckin(true);
                      sendCheckoutRequest(eCode);
                    }}
                  >
                    {tt('check-out', 'check-out')}
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

