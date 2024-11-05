'use client';

import * as React from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import Avatar from '@mui/material/Avatar';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { cyan, deepOrange, deepPurple, green, indigo, pink, yellow } from '@mui/material/colors';
import Divider from '@mui/material/Divider';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Download as DownloadIcon } from '@phosphor-icons/react/dist/ssr/Download';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { Upload as UploadIcon } from '@phosphor-icons/react/dist/ssr/Upload';
import axios, { AxiosResponse } from 'axios';

import NotificationContext from '@/contexts/notification-context';
import { CompaniesFilters } from '@/components/dashboard/integrations/integrations-filters';

type TicketCategory = {
  id: number;
  eventId: number;
  name: string;
  type: string;
  price: number;
  avatar: string;
  description: string;
  status: string;
};

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

export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Loại vé | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [ticketCategories, setTicketCategories] = React.useState<TicketCategory[]>([]);

  React.useEffect(() => {
    const fetchTicketCategories = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<TicketCategory[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/ticket-categories`
        );
        setTicketCategories(response.data);
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
          <Typography variant="h4">Loại vé</Typography>
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={1}>
            <Button color="inherit" startIcon={<UploadIcon fontSize="var(--icon-fontSize-md)" />}>
              Import
            </Button>
            <Button color="inherit" startIcon={<DownloadIcon fontSize="var(--icon-fontSize-md)" />}>
              Export
            </Button>
          </Stack>
        </Stack>
        <div>
          <Button
            startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
            variant="contained"
            href="ticket-categories/create"
          >
            Thêm
          </Button>
        </div>
      </Stack>
      <CompaniesFilters />
      <Grid container spacing={3}>
        {ticketCategories.map((ticketCategory) => (
          <Grid key={ticketCategory.id} lg={4} md={6} xs={12}>
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardContent sx={{ flex: '1 1 auto' }}>
                <Stack spacing={2}>
                  <Stack spacing={1} direction={'row'}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mr: 2, width: '50px', height: '50px' }}>
                      <Avatar
                        href={ticketCategory.avatar}
                        sx={{
                          height: '45px',
                          width: '45px',
                          fontSize: '2rem',
                          borderRadius: '5px',
                          bgcolor: colorMap[ticketCategory.id % 8],
                        }}
                        variant="square"
                      >
                        {ticketCategory.avatar ? '' : ticketCategory.name[0]}
                      </Avatar>
                    </Box>
                    <Stack spacing={1}>
                      <Typography align="left" variant="h6">
                        {ticketCategory.name}
                      </Typography>
                      <Typography align="left" variant="body2">
                        {ticketCategory.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                      </Typography>
                    </Stack>
                  </Stack>
                  {ticketCategory?.description ? (
                    <Box
                      sx={{
                        margin: 0,
                        padding: 0,
                        '& img': {
                          maxWidth: '100%', // Set images to scale down if they exceed container width
                          height: 'auto', // Maintain aspect ratio
                        },
                      }}
                      dangerouslySetInnerHTML={{ __html: ticketCategory?.description }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Chưa có mô tả
                    </Typography>
                  )}
                </Stack>
              </CardContent>
              <Divider />
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                <Stack sx={{ alignItems: 'center' }} direction="row" spacing={1}>
                  <Chip
                    label={statusMap[ticketCategory.status]?.label}
                    color={statusMap[ticketCategory.status]?.color}
                    size="small"
                  />
                  <Chip
                    label={typeMap[ticketCategory.type]?.label}
                    color={typeMap[ticketCategory.type]?.color}
                    size="small"
                  />
                </Stack>
                <Stack sx={{ alignItems: 'center' }} direction="row" spacing={1}>
                  <Button
                    href={`/event-studio/events/${params.event_id}/ticket-categories/${ticketCategory.id}`}
                    size="small"
                    startIcon={<EyeIcon />}
                  >
                    Xem chi tiết
                  </Button>
                </Stack>
              </Stack>
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
