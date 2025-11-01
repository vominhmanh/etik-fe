'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { cyan, deepOrange, deepPurple, green, indigo, pink, yellow } from '@mui/material/colors';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { AxiosResponse } from 'axios';
import dayjs from 'dayjs';
import { LocalizedLink } from '@/components/localized-link';

import * as React from 'react';
import { useState } from 'react';

import { CompaniesFilters } from '@/components/dashboard/integrations/integrations-filters';
import NotificationContext from '@/contexts/notification-context';
import { Pencil } from '@phosphor-icons/react/dist/ssr';

const colorMap: ColorMap = {
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
  type: string;
  status: string;
  disabled: boolean;
  startDateTime: Date | null;
  endDateTime: Date | null;
};

const statusMap = {
  not_opened_for_sale: { label: 'Trạng thái: Chưa mở bán', color: 'secondary' },
  on_sale: { label: 'Trạng thái: Đang mở bán', color: 'success' },
  out_of_stock: { label: 'Trạng thái: Đã hết', color: 'secondary' },
  temporarily_locked: { label: 'Trạng thái: Đang tạm khoá', color: 'warning' },
};

const typeMap = {
  private: { label: 'Nội bộ', color: 'warning' },
  public: { label: 'Công khai', color: 'primary' },
};

type ColorMap = {
  [key: number]: string
}


export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Suất diễn | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const { event_id } = params;
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shows, setShows] = React.useState<Show[]>([]);

  React.useEffect(() => {
    const fetchTicketCategories = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<Show[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/shows`
        );
        setShows(response.data);
      } catch (error) {
        notificationCtx.error('Error fetching ticket categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicketCategories();
  }, [params.event_id]);

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
          <Typography variant="h4">Suất diễn</Typography>
        </Stack>
        <div>
          <Button
            component={LocalizedLink}
            startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
            variant="contained"
            href="shows/create"
          >
            Thêm suất diễn
          </Button>
        </div>
      </Stack>
      <CompaniesFilters />
      <Grid container spacing={3}>
        {shows.map((show) => (
          <Grid key={show.id} lg={4} md={6} xs={12}>
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardContent sx={{ flex: '1 1 auto' }}>
                <Stack spacing={2}>
                  <Stack spacing={1} direction={'row'}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mr: 2, width: '50px', height: '50px' }}>
                      <Box
                        component="img"
                        src={'/assets/product-5.png'}
                        sx={{ borderRadius: 1, height: '48px', width: '48px' }}
                      />
                    </Box>
                    <Stack spacing={1}>
                      <Typography align="left" variant="h6">
                        {show.name}
                      </Typography>
                      <Stack sx={{ alignItems: 'center', flexWrap: 'wrap' }} direction="row" spacing={1}>
                        <Chip
                          label={statusMap[show.status]?.label}
                          color={statusMap[show.status]?.color}
                          size="small"
                        />
                        <Chip
                          label={typeMap[show.type]?.label}
                          color={typeMap[show.type]?.color}
                          size="small"
                        />
                        {show.disabled === true &&
                          <Chip
                            label={'Đang khóa bởi hệ thống'}
                            color={'secondary'}
                            size="small"
                          />}
                      </Stack>
                    </Stack>
                  </Stack>
                  <Stack direction="column" spacing={2} sx={{ alignItems: 'left', mt: 2 }}>
                    <Stack direction="row" spacing={1}>
                      <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                      <Typography color="text.secondary" display="inline" variant="body2">
                        {show.startDateTime && show.endDateTime
                          ? `${dayjs(show.startDateTime || 0).format('HH:mm')} - ${dayjs(show.endDateTime || 0).format('HH:mm ngày DD/MM/YYYY')}`
                          : 'Chưa xác định'}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={1}>

                  </Stack>
                  <Stack sx={{ alignItems: 'center' }} direction="row" spacing={1}>
                    <Button
                      component={LocalizedLink}
                      href={`/event-studio/events/${params.event_id}/shows/${show.id}`}
                      size="small"
                      startIcon={<Pencil />}
                    >
                      Chỉnh sửa
                    </Button>
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
