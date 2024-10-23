"use client"
import * as React from 'react';
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
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { Eye as EyeIcon } from '@phosphor-icons/react/dist/ssr/Eye';
import axios, { AxiosResponse } from 'axios';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import Chip from '@mui/material/Chip';
import { deepPurple, deepOrange, indigo, cyan, green, pink, yellow } from '@mui/material/colors';

type TicketCategory = {
  id: number;
  eventId: number;
  name: string;
  type: string;
  price: number;
  avatar: string;
  quantity: number;
  sold: number;
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
  const [ticketCategories, setTicketCategories] = React.useState<TicketCategory[]>([]);

  React.useEffect(() => {
    const fetchTicketCategories = async () => {
      try {
        const response: AxiosResponse<TicketCategory[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/ticket_categories/`
        );
        setTicketCategories(response.data);
      } catch (error) {
        console.error('Error fetching ticket categories:', error);
      }
    };

    fetchTicketCategories();
  }, [params.event_id]);

  return (
    <Stack spacing={3}>
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
          <Button startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />} variant="contained" href="ticket-categories/create">
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
                        sx={{ height: '45px', width: '45px', fontSize: '2rem', borderRadius: '5px', bgcolor: colorMap[ticketCategory.id % 8] }}
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
                        {ticketCategory.price.toLocaleString('vi-VN', {style : 'currency', currency : 'VND'})}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Typography align="left" variant="body2">
                    Số lượng: {ticketCategory.quantity} - Đã bán: {ticketCategory.sold} - Còn lại:{' '}
                    {ticketCategory.quantity - ticketCategory.sold}
                  </Typography>
                  <Typography align="left" variant="body2">
                    {ticketCategory.description ? ticketCategory.description : "Chưa có mô tả"}
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
                  <Button href={`/event-studio/events/${params.event_id}/ticket-categories/${ticketCategory.id}`} size="small" startIcon={<EyeIcon />}>
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
