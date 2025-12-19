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
import { useTranslation } from '@/contexts/locale-context';
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

type StatusKey = 'not_opened_for_sale' | 'on_sale' | 'out_of_stock' | 'temporarily_locked';
type TypeKey = 'private' | 'public';

const getStatusMap = (tt: (vi: string, en: string) => string) => ({
  not_opened_for_sale: { label: tt('Trạng thái: Chưa mở bán', 'Status: Not opened for sale'), color: 'secondary' as const },
  on_sale: { label: tt('Trạng thái: Đang mở bán', 'Status: On sale'), color: 'success' as const },
  out_of_stock: { label: tt('Trạng thái: Đã hết', 'Status: Out of stock'), color: 'secondary' as const },
  temporarily_locked: { label: tt('Trạng thái: Đang tạm khoá', 'Status: Temporarily locked'), color: 'warning' as const },
});

const getTypeMap = (tt: (vi: string, en: string) => string) => ({
  private: { label: tt('Nội bộ', 'Private'), color: 'warning' as const },
  public: { label: tt('Công khai', 'Public'), color: 'primary' as const },
});

type ColorMap = {
  [key: number]: string
}


export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  const { tt } = useTranslation();
  const statusMap = getStatusMap(tt);
  const typeMap = getTypeMap(tt);
  
  React.useEffect(() => {
    document.title = tt("Suất diễn | ETIK - Vé điện tử & Quản lý sự kiện", "Shows | ETIK - E-tickets & Event Management");
  }, [tt]);
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
        notificationCtx.error(tt('Lỗi khi tải danh sách suất diễn', 'Error fetching shows'), error);
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
          <Typography variant="h4">{tt("Suất diễn", "Shows")}</Typography>
        </Stack>
        <div>
          <Button
            component={LocalizedLink}
            startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
            variant="contained"
            href="shows/create"
          >
            {tt("Thêm suất diễn", "Add Show")}
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
                          label={statusMap[show.status as StatusKey]?.label || show.status}
                          color={statusMap[show.status as StatusKey]?.color || 'default'}
                          size="small"
                        />
                        <Chip
                          label={typeMap[show.type as TypeKey]?.label || show.type}
                          color={typeMap[show.type as TypeKey]?.color || 'default'}
                          size="small"
                        />
                        {show.disabled === true &&
                          <Chip
                            label={tt('Đang khóa bởi hệ thống', 'Locked by system')}
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
                          : tt('Chưa xác định', 'Not determined')}
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
                      {tt("Chỉnh sửa", "Edit")}
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
