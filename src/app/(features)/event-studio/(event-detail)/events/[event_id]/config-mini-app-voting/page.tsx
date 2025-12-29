'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Button, Divider, List, ListItem, ListItemText, Stack } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import {
  ListDashes,
  Play,
  SpinnerBall,
  Gift
} from '@phosphor-icons/react/dist/ssr';
import { AxiosResponse } from 'axios';
import * as React from 'react';
import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';

import NotificationContext from '@/contexts/notification-context';

import 'react-quill/dist/quill.snow.css';


import { VotingCategories } from './voting-categories';
import PrizePage from './prize';
import HistoryPage from './history';

interface CheckConfigResponse {
  exists: boolean;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = 'Quay số may mắn | ETIK - Vé điện tử & Quản lý sự kiện';
  }, []);
  const { event_id } = params;
  const reactQuillRef = React.useRef<ReactQuill>(null);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [configExists, setConfigExists] = useState<boolean | null>(null);
  const [selectedPage, setSelectedPage] = useState('candidates');

  const MENU_ITEMS = [
    {
      id: 'voting-categories',
      icon: <ListDashes />,
      label: 'Hạng mục',
      component: <VotingCategories event_id={params.event_id} />,
    },

    {
      id: 'history',
      icon: <SpinnerBall />,
      label: 'Lịch sử',
      component: <HistoryPage eventId={params.event_id} />,
    },
    {
      id: 'ranking',
      icon: <SpinnerBall />,
      label: 'Truy cập trang',
      component:
        <Typography>
          <Button
            variant="contained"
            href={`/event-studio/events/${params.event_id}/mini-app-voting`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Nhấn để đến Trang Bình chọn
          </Button>
        </Typography>
      ,
    },
  ];


  async function checkConfig() {
    if (!event_id) return;

    try {
      setIsLoading(true);
      const response: AxiosResponse<CheckConfigResponse> = await baseHttpServiceInstance.get(
        `/event-studio/events/${event_id}/mini-app-voting/configs/check-config`
      );
      setConfigExists(response.data.exists);
    } catch (error) {
      console.error('Error checking config:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    checkConfig();
  }, [event_id]);

  async function handleCreateConfig() {
    setIsLoading(true);
    try {
      const response = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/mini-app-lucky-wheel/configs/create`,
        { name: 'Lucky Wheel' }
      );
      notificationCtx.success(response.data.message);
      checkConfig();
    } catch (error: any) {
      notificationCtx.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Typography variant="h4" mb={3}>Cấu hình Mini App "Bình chọn"</Typography>

      <Grid container spacing={3}>

        <Grid lg={2} md={3} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title="Tính năng" />
              <Divider />
              <List>
                {MENU_ITEMS.map((item) => (
                  <ListItem
                    key={item.id}
                    divider
                    onClick={() => setSelectedPage(item.id)}
                    sx={{
                      cursor: 'pointer',
                      backgroundColor: selectedPage === item.id ? 'rgba(33, 150, 243, 0.2)' : 'inherit',
                      '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.1)' },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack spacing={2} direction="row">
                          {item.icon}
                          <Typography variant="body2">{item.label}</Typography>
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Stack>
        </Grid>
        <Grid lg={10} md={9} xs={12}>
          <Stack spacing={3}>{MENU_ITEMS.find((item) => item.id === selectedPage)?.component}</Stack>
        </Grid>
      </Grid>
    </>
  );
}
