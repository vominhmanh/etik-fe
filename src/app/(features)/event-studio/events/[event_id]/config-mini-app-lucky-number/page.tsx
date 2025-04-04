'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { List, ListItem, ListItemText, Stack } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import {
  Gear,
  ListDashes,
  ListNumbers,
  ListStar,
  Panorama,
  Question,
  StarHalf,
  UserCircle,
} from '@phosphor-icons/react/dist/ssr';
import { AxiosResponse } from 'axios';
import ReactQuill from 'react-quill';

import NotificationContext from '@/contexts/notification-context';

import 'react-quill/dist/quill.snow.css';

import { useRouter } from 'next/navigation'; // ✅ Import router

import OptionList from './option-list-page';

interface CheckConfigResponse {
  exists: boolean;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = 'Chỉnh sửa chi tiết sự kiện| ETIK - Vé điện tử & Quản lý sự kiện';
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
      id: 'optionList',
      icon: <ListDashes />,
      label: 'Danh sách cần quay',
      component: <OptionList eventId={params.event_id} />,
    },
    {
      id: 'ranking',
      icon: <ListNumbers />,
      label: 'Truy cập trang bình chọn',
      component: <Typography>Trang bình chọn</Typography>,
    },
  ];

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
      <>
        <div>
          <Typography variant="h4">Cấu hình Mini App "Lucky Number"</Typography>
        </div>
        <Grid container spacing={3}>
          <Grid lg={4} md={6} xs={12}>
            <Stack spacing={3}>
              <Card>
                <CardHeader title="Tính năng" />
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
          <Grid lg={8} md={6} xs={12}>
            <Stack spacing={3}>{MENU_ITEMS.find((item) => item.id === selectedPage)?.component}</Stack>
          </Grid>
        </Grid>
      </>
    </Stack>
  );
}
