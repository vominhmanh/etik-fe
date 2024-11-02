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
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import dayjs from 'dayjs';

interface TicketCategory {
  id: number;
  eventId: number;
  name: string;
  type: string; // or enum if `TicketCategoryType` is defined as such
  price: number;
  avatar?: string | null;
  description?: string | null;
  status: string; // or enum if `TicketCategoryStatus` is defined as such
  createdAt: string; // ISO string format for datetime
  updatedAt: string; // ISO string format for datetime
}

interface ShowTicketCategory {
  quantity: number;
  sold: number;
  disabled: boolean;
  ticketCategory: TicketCategory;
}

interface Show {
  id: number;
  eventId: number;
  name: string;
  startDateTime?: string | null; // ISO string format for datetime
  endDateTime?: string | null;   // ISO string format for datetime
  showTicketCategories: ShowTicketCategory[];
}

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
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [shows, setShows] = React.useState<Show[]>([]);

  React.useEffect(() => {
    const fetchShowsWithTicketCategories = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<Show[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/shows/get-ticket-categories-by-shows`
        );
        setShows(response.data);
      } catch (error) {
        notificationCtx.error('Error fetching shows and ticket categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShowsWithTicketCategories();
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
          <Typography variant="h4">Loại vé theo sự kiện</Typography>
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
        {shows.map((show) => (
          <Accordion key={show.id} defaultExpanded sx={{ width: '100%' }}>
            <AccordionSummary>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Typography variant="h6">{show.name}</Typography>
                <Typography variant="body2">
                  {show.startDateTime && show.endDateTime ?
                    `Bắt đầu: ${dayjs(show.startDateTime).format('HH:mm:ss DD/MM/YYYY')} - Kết thúc: ${dayjs(show.endDateTime).format('HH:mm:ss DD/MM/YYYY')}`
                    : 'Thời gian: Chưa xác định'
                  }
                </Typography>
              </div>

            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {show.showTicketCategories.map((showTicketCategory) => {
                  const ticketCategory = showTicketCategory.ticketCategory;
                  return (
                    <Grid key={ticketCategory.id} lg={6} md={6} xs={12}>
                      <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <CardContent sx={{ flex: '1 1 auto' }}>
                          <Stack spacing={2}>
                            <Stack spacing={1} direction="row">
                              <Box sx={{ display: 'flex', justifyContent: 'center', mr: 2, width: '50px', height: '50px' }}>
                                <Avatar
                                  src={ticketCategory.avatar || undefined}
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
                            <Typography align="left" variant="body2">
                              Số lượng: {showTicketCategory.quantity} - Đã bán: {showTicketCategory.sold} - Còn lại:{' '}
                              {showTicketCategory.quantity - showTicketCategory.sold}
                            </Typography>
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
                  );
                })}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Grid>
    </Stack>
  );
}
