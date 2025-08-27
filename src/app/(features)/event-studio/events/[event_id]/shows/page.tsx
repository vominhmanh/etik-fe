'use client';

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
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Plus as PlusIcon } from '@phosphor-icons/react/dist/ssr/Plus';
import { AxiosResponse } from 'axios';
import RouterLink from 'next/link';
import * as React from 'react';

import { CompaniesFilters } from '@/components/dashboard/integrations/integrations-filters';
import NotificationContext from '@/contexts/notification-context';
import { Accordion, AccordionDetails, AccordionSummary, CardHeader, Container, FormControlLabel, InputLabel, Modal, OutlinedInput, Switch } from '@mui/material';
import { ArrowRight } from '@phosphor-icons/react';
import { Pencil } from '@phosphor-icons/react/dist/ssr';
import dayjs from 'dayjs';

interface TicketCategory {
  id: number;
  name: string;
  type: string; // or enum if `TicketCategoryType` is defined as such
  price: number;
  avatar?: string | null;
  description?: string | null;
  status: string; // or enum if `TicketCategoryStatus` is defined as such
  createdAt: string; // ISO string format for datetime
  updatedAt: string; // ISO string format for datetime
  quantity: number;
  sold: number;
  disabled: boolean;
  limitPerTransaction: number | null;
  limitPerCustomer: number | null;
}

interface Show {
  id: number;
  eventId: number;
  name: string;
  startDateTime?: string | null; // ISO string format for datetime
  endDateTime?: string | null;   // ISO string format for datetime
  ticketCategories: TicketCategory[];
}

const statusMap = {
  not_opened_for_sale: { label: 'Trạng thái: Chưa mở bán', color: 'secondary' },
  on_sale: { label: 'Trạng thái: Đang mở bán', color: 'success' },
  // out_of_stock: { label: 'Trạng thái: Đã hết', color: 'secondary' },
  temporarily_locked: { label: 'Trạng thái: Đang tạm khoá', color: 'warning' },
};

const typeMap = {
  private: { label: 'Nội bộ', color: 'warning' },
  public: { label: 'Công khai', color: 'primary' },
};

type ColorMap = {
  [key: number]: string
}

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
export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Hạng mục vé | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [shows, setShows] = React.useState<Show[]>([]);
  const [openEditorModal, setOpenEditorModal] = React.useState(false);
  const [selectedShow, setSelectedShow] = React.useState<Show | null>(null);
  const [selectedTicketCategory, setSelectedTicketCategory] = React.useState<TicketCategory | null>(null);
  const [formDataQuantity, setFormDataQuantity] = React.useState(0);
  const [formDataDisabled, setFormDataDisabled] = React.useState(false);

  const handleCloseEditorModal = (event: {}, reason: "backdropClick" | "escapeKeyDown") => {
    setOpenEditorModal(false);
    setSelectedShow(null);
    setSelectedTicketCategory(null)
  }

  const handleSaveEditTicketCategoryDetail = async (selectedShow: Show | null, selectedTicketCategory: TicketCategory | null, dataQuantity: number, dataDisabled: boolean) => {
    if (!selectedShow || !selectedTicketCategory) return;

    try {
      setIsLoading(true);

      const { quantity, disabled } = selectedTicketCategory;
      const response = await baseHttpServiceInstance.patch(
        `/event-studio/events/${params.event_id}/shows-ticket-categories/shows/${selectedShow.id}/ticket-categories/${selectedTicketCategory.id}`,
        {
          disabled: dataDisabled,
          quantity: dataQuantity,
        }
      );

      // Assume response includes updated shows data
      window.location.reload()
      notificationCtx.success("Chỉnh sửa thành công");
    } catch (error) {
      notificationCtx.error('Lỗi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const fetchShowsWithTicketCategories = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<Show[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/shows-ticket-categories/get-shows-with-ticket-categories`
        );
        setShows(response.data);
      } catch (error) {
        notificationCtx.error('Lỗi:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShowsWithTicketCategories();
  }, [params.event_id]);

  return (
    <>
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
            <Typography variant="h4">Hạng mục vé</Typography>
          </Stack>

        </Stack>
        <CompaniesFilters />
        <Grid container spacing={3}>
          {shows.map((show) => (
            <Accordion key={show.id} defaultExpanded sx={{ width: '100%' }}>
              <AccordionSummary>
                <Stack direction={{ md: 'row', xs: 'column' }} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Typography variant="h6">{show.name}</Typography>
                  <Typography variant="body2">
                    {show.startDateTime && show.endDateTime ?
                      `Bắt đầu: ${dayjs(show.startDateTime).format('HH:mm:ss DD/MM/YYYY')} - Kết thúc: ${dayjs(show.endDateTime).format('HH:mm:ss DD/MM/YYYY')}`
                      : 'Thời gian: Chưa xác định'
                    }
                  </Typography>
                  <Button
                    startIcon={<PlusIcon fontSize="var(--icon-fontSize-md)" />}
                    variant="outlined"
                    component={RouterLink}
                    onClick={(event) => event.stopPropagation()}
                    href={`shows/${show.id}/ticket-categories/create`}
                  >
                    Thêm loại vé
                  </Button>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  {show.ticketCategories.map((ticketCategory) => {
                    return (
                      <Grid key={ticketCategory.id} lg={4} md={6} xs={12}>
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
                                    {ticketCategory.avatar ? '' : ticketCategory.name[ticketCategory.name.length - 1]}
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
                                Còn {ticketCategory.quantity - ticketCategory.sold}/{ticketCategory.quantity} vé
                              </Typography>
                              <Stack sx={{ alignItems: 'center', flexWrap: 'wrap' }} direction="row" spacing={1}>
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
                                {ticketCategory.disabled === true &&
                                  <Chip
                                    label={'Đang khóa bởi hệ thống'}
                                    color={'secondary'}
                                    size="small"
                                  />}
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
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              Số vé tối đa mỗi đơn hàng: {ticketCategory.limitPerTransaction || "Không giới hạn"}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              Số vé tối đa mỗi khách hàng: {ticketCategory.limitPerCustomer || "Không giới hạn"}
                            </Typography>
                          </CardContent>
                          <Divider />
                          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
                            <Stack sx={{ alignItems: 'center' }} direction="row" spacing={1}>

                            </Stack>
                            <Stack sx={{ alignItems: 'center' }} direction="row" spacing={1}>
                              <Button
                                component={RouterLink}
                                href={`/event-studio/events/${params.event_id}/shows/${show.id}/ticket-categories/${ticketCategory.id}`}
                                size="small"
                                startIcon={<Pencil />}
                              >
                                Chỉnh sửa
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

      <Modal
        open={openEditorModal}
        onClose={handleCloseEditorModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Container maxWidth="xl">
          <Card
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { sm: '500px', xs: '90%' },
              bgcolor: 'background.paper',
              boxShadow: 24,
            }}
          >
            <CardHeader
              title="Chỉnh sửa"
              subheader={selectedShow ? `${selectedShow?.name} - ${selectedTicketCategory?.name}` : ''}
            />
            <Divider />
            <CardContent>
              <Stack spacing={3} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Stack direction="row" spacing={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <InputLabel htmlFor="quantity" sx={{ display: 'inline' }}>Số lượng vé</InputLabel>
                  <OutlinedInput
                    id="quantity"
                    sx={{ maxWidth: 130 }}
                    type="number"
                    size="small"
                    value={formDataQuantity}
                    onChange={(e) => {
                      setFormDataQuantity(e.target.value)
                    }}
                  />
                </Stack>
                <Stack direction="row" spacing={3} sx={{ display: 'flex', alignItems: 'center' }}>
                  <InputLabel htmlFor="status" sx={{ display: 'inline' }}>Trạng thái riêng</InputLabel>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!formDataDisabled}
                        onChange={(e) => {
                          const disabled = !e.target.checked;
                          setFormDataDisabled(disabled);
                        }}
                        color="primary"
                      />
                    }
                    label={formDataDisabled ? 'Khoá' : 'Mở'}
                    labelPlacement="end"
                  />
                </Stack>
              </Stack>
            </CardContent>
            <Divider />
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end', p: 2 }}>
              <Button
                variant="contained"
                onClick={() => handleSaveEditTicketCategoryDetail(selectedShow, selectedTicketCategory, formDataQuantity, formDataDisabled)}
                size="small"
                endIcon={<ArrowRight />}
              >
                Lưu
              </Button>
            </Stack>
          </Card>
        </Container>
      </Modal>
    </>
  );
}
