'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Button, List, ListItem, ListItemText, Stack } from '@mui/material';
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
  Play,
  Question,
  StarHalf,
  UserCircle,
} from '@phosphor-icons/react/dist/ssr';
import { AxiosResponse } from 'axios';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import ReactQuill from 'react-quill';

import NotificationContext from '@/contexts/notification-context';
import { LocalizedLink } from '@/components/homepage/localized-link';

import 'react-quill/dist/quill.snow.css';

import BackgroundImagePage from './background-image-page';

// Define the event response type
export type EventResponse = {
  id: number;
  name: string;
  organizer: string;
  organizerEmail: string;
  organizerPhoneNumber: string;
  description: string | null;
  startDateTime: string | null;
  endDateTime: string | null;
  place: string | null;
  locationUrl: string | null;
  bannerUrl: string;
  avatarUrl: string;
  slug: string;
  secureApiKey: string;
  locationInstruction: string | null;
  displayOnMarketplace: boolean;
};

interface CheckConfigResponse {
  exists: boolean;
}

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = 'Banner chào mừng | ETIK - Vé điện tử & Quản lý sự kiện';
  }, []);
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [formValues, setFormValues] = useState<EventResponse | null>(null);
  const { event_id } = params;
  const reactQuillRef = React.useRef<ReactQuill>(null);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [configExists, setConfigExists] = useState<boolean | null>(null);
  const [selectedPage, setSelectedPage] = useState('candidates');

  const MENU_ITEMS = [
    
    {
      id: 'background',
      icon: <Panorama />,
      label: 'Thiết kế banner chào mừng',
      component: <BackgroundImagePage eventId={params.event_id} />,
    },
    {
      id: 'voting',
      icon: <StarHalf />,
      label: 'Truy cập trang Banner chào mừng',
      component: (
        <Button
          variant="contained"
          component={LocalizedLink}
          href={`/event-studio/events/${params.event_id}/mini-app-welcome-banner`}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<Play />}
          sx={{ width: 'auto' }}
        >
          Nhấn để đến Trang Banner chào mừng
        </Button>
      ),
    },
    
  ];
  
  async function checkConfig() {
    if (!event_id) return;

    try {
      setIsLoading(true);
      const response: AxiosResponse<CheckConfigResponse> = await baseHttpServiceInstance.get(
        `/event-studio/events/${event_id}/mini-app-welcome-banner/check-config`
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
        `/event-studio/events/${params.event_id}/mini-app-welcome-banner/create-config`
      );
      notificationCtx.success(response.data.message);
      checkConfig();
    } catch (error: any) {
      notificationCtx.error(error.response?.data?.detail || 'Có lỗi khi khởi tạo ứng dụng.');
    } finally {
      setIsLoading(false);
    }
  }

  // Handle saving the avatar
  const handleSaveAvatar = async () => {
    if (!selectedAvatar) return;

    const formData = new FormData();
    formData.append('file', selectedAvatar);

    try {
      // Call API to upload the avatar
      setIsLoading(true);
      await baseHttpServiceInstance.post(`/event-studio/events/${event?.id}/upload-avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // On successful upload, reload the page or update the avatar state
      window.location.reload(); // Optionally, you could call a function to update the state instead of reloading
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (event_id) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
            `/event-studio/events/${event_id}`
          );
          setEvent(response.data);
          setFormValues(response.data);
        } catch (error) {
          notificationCtx.error('Lỗi:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEventDetails();
    }
  }, [event_id]);

  // Image Upload Handler
  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
          // Upload the image to the server
          setIsLoading(true);
          const response = await baseHttpServiceInstance.post(
            `/event-studio/events/${event_id}/upload_image`,
            formData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          );

          const imageUrl = response.data.imageUrl; // Adjust based on response
          const quill = reactQuillRef.current;
          if (quill) {
            const range = quill.getEditorSelection();
            range && quill.getEditor().insertEmbed(range.index, 'image', imageUrl);
          }
        } catch (error) {
          notificationCtx.error('Lỗi:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
  }, []);

  // Custom Toolbar Options
  const modules = {
    toolbar: {
      container: [
        [{ header: '1' }, { header: '2' }, { font: [] }],
        [{ size: [] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: handleImageUpload, // <-
      },
    },
    clipboard: {
      matchVisual: false,
    },
  };

  if (!event || !formValues) {
    return <Typography>Loading...</Typography>;
  }

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
      {!configExists ? (
        <>
          <div>
            <Typography variant="h4"> Mini App "Banner chào mừng"</Typography>
          </div>
          <Stack spacing={3}>
            <Typography variant="body2">
              Ứng dụng Mini App "Banner chào mừng" hỗ trợ nhà tổ chức sự kiện tạo banner chào mừng khi khách hàng check-in vào sự kiện
            </Typography>
          </Stack>
          <div>
            <Button
              variant="contained"
              href={`#registration`}
              size="small"
              startIcon={<Play />}
              onClick={handleCreateConfig}
              disabled={isLoading}
            >
              Khởi tạo ứng dụng
            </Button>
          </div>
        </>
      ) : (
        <>
          <div>
            <Typography variant="h4">Cấu hình Mini App "Banner chào mừng"</Typography>
          </div>
          <Grid container spacing={3}>
            <Grid lg={3} md={4} xs={12}>
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
            <Grid lg={9} md={8} xs={12}>
              <Stack spacing={3}>{MENU_ITEMS.find((item) => item.id === selectedPage)?.component}</Stack>
            </Grid>
          </Grid>
        </>
      )}
    </Stack>
  );
}
