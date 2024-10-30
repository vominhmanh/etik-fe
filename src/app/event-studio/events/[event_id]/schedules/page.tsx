"use client"
import * as React from 'react';
import NotificationContext from '@/contexts/notification-context';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { Upload as UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';
import { CompaniesFilters } from '@/components/dashboard/integrations/integrations-filters';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import axios, { AxiosResponse } from 'axios';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import Chip from '@mui/material/Chip';
import { deepPurple, deepOrange, indigo, cyan, green, pink, yellow } from '@mui/material/colors';
import { Clock as ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { MapPin as MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { HouseLine as HouseLineIcon } from "@phosphor-icons/react/dist/ssr/HouseLine";
import dayjs from 'dayjs';

const statusMap = {
  not_opened_for_sale: { label: 'Chưa mở bán', color: 'secondary' },
  on_sale: { label: 'Đang mở bán', color: 'success' },
  out_of_stock: { label: 'Đã hết', color: 'secondary' },
  temporarily_locked: { label: 'Đang tạm khoá', color: 'warning' },
};

const typeMap = {
  private: { label: 'Nội bộ', color: 'warning' },
  public: { label: 'Công khai', color: 'primary' },
};

const colorMap = {
  0: deepOrange[500],
  1: deepPurple[500],
  2: green[500],
  3: cyan[500],
  4: indigo[500],
  5: pink[500],
  6: yellow[500],
  7: deepPurple[300],
};

export type Show = {
  id: number;
  eventId: number;
  name: string;
  startDateTime: Date| null;
  endDateTime: Date| null;
  place: string | null;
}

export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  const { event_id } = params;
  const [shows, setShows] = React.useState<Show[]>([]);
  const notificationCtx = React.useContext(NotificationContext);

  // Fetch shows
  React.useEffect(() => {
    async function fetchShows() {
      try {
        const response: AxiosResponse<Show[]> = await baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}/shows`);
        setShows(response.data);
      } catch (error) {
        notificationCtx.error('Error fetching shows:', error);
      }
    }
    fetchShows();
  }, [params.event_id]);


  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">Suất diễn</Typography>
        </Stack>
        <div>
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} disabled variant="contained" href="ticket-categories/create">
            Sự kiện này chỉ hỗ trợ 1 suất diễn
          </Button>
        </div>
      </Stack>
      <CompaniesFilters />
      <Grid container spacing={3}>
        {shows.map(show => (
<Grid lg={4} md={6} xs={12}>
          <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <CardContent sx={{ flex: '1 1 auto' }}>
              <Stack spacing={2}>
                <Stack spacing={1} direction={'row'}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mr: 2, width: '50px', height: '50px' }}>
                    <Box component="img" src={'/assets/product-5.png'} sx={{ borderRadius: 1, height: '48px', width: '48px' }} />
                  </Box>
                  <Stack spacing={1}>
                    <Typography align="left" variant="h6">
                      Suất diễn mặc định
                    </Typography>
                    <Typography align="left" variant="body2">
                      Được tạo tự động
                    </Typography>
                  </Stack>
                </Stack>
                <Stack direction="column" spacing={2} sx={{ alignItems: 'left', mt: 2 }}>
                  <Stack direction="row" spacing={1}>
                    <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {show.startDateTime && show.endDateTime
                        ? `${dayjs(show.startDateTime || 0).format('HH:mm:ss DD/MM/YYYY')} - ${dayjs(show.endDateTime || 0).format('HH:mm:ss DD/MM/YYYY')}`
                        : "Chưa xác định"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {show.place ? show.place : "Chưa xác định"}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        ))}
        
      </Grid>
      {/* <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Pagination count={3} size="small" />
      </Box> */}
    </Stack>
  );
}
