'use client';

import * as React from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Avatar, Box, CardMedia, Container, FormHelperText, InputAdornment, Modal, Typography } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import { ArrowRight, UserPlus } from '@phosphor-icons/react/dist/ssr';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Coins as CoinsIcon } from '@phosphor-icons/react/dist/ssr/Coins';
import { Hash as HashIcon } from '@phosphor-icons/react/dist/ssr/Hash';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { Tag as TagIcon } from '@phosphor-icons/react/dist/ssr/Tag';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import axios, { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import ReCAPTCHA from 'react-google-recaptcha';

import NotificationContext from '@/contexts/notification-context';
import EditableGrid from './schedule-grid';

const colLabels = Array.from({ length: 17 }, (_, i) => String.fromCharCode(65 + i)); // A–P
const rowLabels = Array.from({ length: 8 }, (_, i) => (i + 1).toString()); // 1–8


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
};

export type Show = {
  id: number;
  name: string;
  avatar: string | null;
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
  bannerUrl: string | null;
  avatarUrl: string | null;
  slug: string;
  locationInstruction: string | null;
  shows: Show[];
};

const options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

export default function Page(): React.JSX.Element {
  const params = { event_slug: 'tft-hon-chien-d2' }
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [selectedCategories, setSelectedCategories] = React.useState<Record<number, number | null>>({});
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  const [customer, setCustomer] = React.useState({
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
  });
  const [paymentMethod, setPaymentMethod] = React.useState<string>('napas247');
  const [ticketHolders, setTicketHolders] = React.useState<string[]>(['']);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);
  const captchaRef = React.useRef<ReCAPTCHA | null>(null);
  const [position, setPosition] = React.useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [openSuccessModal, setOpenSuccessModal] = React.useState(false);
  const [ticketHolderEditted, setTicketHolderEditted] = React.useState<boolean>(false);
    const [data, setData] = React.useState(
    rowLabels.map(() =>
      colLabels.map(() => '')
    )
  );

  const handleChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    newData[rowIndex][colIndex] = value;
    setData(newData);
  };

  React.useEffect(() => {
    document.title = `Sự kiện ${event?.name} | ETIK - Vé điện tử & Quản lý sự kiện`;
  }, [event]);

  const totalAmount = React.useMemo(() => {
    return Object.entries(selectedCategories).reduce((total, [showId, category]) => {
      const show = event?.shows.find((show) => show.id === parseInt(showId));
      const ticketCategory = show?.ticketCategories.find((cat) => cat.id === category);
      return total + (ticketCategory?.price || 0) * (ticketQuantity || 0);
    }, 0)
  }, [selectedCategories])



  const handleCloseSuccessModal = (event: {}, reason: "backdropClick" | "escapeKeyDown") => {
    setOpenSuccessModal(false)
  }

  // Fetch event details on component mount
  React.useEffect(() => {
    if (params.event_slug) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
            `/marketplace/events/${params.event_slug}`
          );
          setEvent(response.data);
        } catch (error) {
          notificationCtx.error('Lỗi:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    }
  }, [params.event_slug]);


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

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const handleSubmit = async () => {
    if (!customer.name || !customer.email || !customer.address || ticketQuantity <= 0) {
      notificationCtx.warning('Vui lòng điền các trường thông tin bắt buộc');
      return;
    }

    const captchaValue = captchaRef.current?.getValue();
    if (!captchaValue) {
      notificationCtx.warning('Vui lòng xác nhận reCAPTCHA!');
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
        captchaValue,
        "latitude": position?.latitude,
        "longitude": position?.longitude
      };

      const response = await baseHttpServiceInstance.post(
        `/marketplace/events/${params.event_slug}/transactions`,
        transactionData
      );
      // notificationCtx.success('Transaction created successfully!');
      setOpenSuccessModal(true)

      // Redirect to the payment checkout URL
      if (response.data.paymentCheckoutUrl) {
        window.location.href = response.data.paymentCheckoutUrl;
      }
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      setIsLoading(false);
      captchaRef.current?.reset()
    }
  };
  return (
    <>
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
<EditableGrid shows={event?.shows} />
      
    </>
  );
}
