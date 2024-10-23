'use client';

import * as React from 'react';
import Typography from '@mui/material/Typography';
import { Clock as ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { MapPin as MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { HouseLine as HouseLineIcon } from "@phosphor-icons/react/dist/ssr/HouseLine";
import { CardMedia, MenuItem, Select } from "@mui/material";
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Grid from '@mui/material/Unstable_Grid2';
import { Stack, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { AxiosResponse } from 'axios';


// Define the event response type
type EventResponse = {
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
  slug: string;
  secureApiKey: string;
  locationInstruction: string | null;
  displayOnMarketplace: boolean;
};

export default function Page({ params }: { params: { event_id: string } }): React.JSX.Element {
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [formValues, setFormValues] = useState<EventResponse | null>(null);
  const { event_id } = params;


  // Fetch event details on component mount
  useEffect(() => {
    if (event_id) {
      const fetchEventDetails = async () => {
        try {
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(`/event-studio/events/${event_id}`);
          setEvent(response.data);
          setFormValues(response.data); // Initialize form with the event data
        } catch (error) {
          console.error('Error fetching event details:', error);
        }
      };

      fetchEventDetails();
    }
  }, [event_id]);

  // Handle form value changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => prevValues ? { ...prevValues, [name]: value } : null);
  };

  // Handle form submission (PUT request)
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formValues && event_id) {
      try {
        await baseHttpServiceInstance.put(`/event-studio/events/${event_id}`, formValues);
        alert('Event updated successfully!');
        // Optionally redirect or refresh the page
      } catch (error) {
        console.error('Error updating event:', error);
        alert('Failed to update event.');
      }
    }
  };

  if (!event || !formValues) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">Chi tiết sự kiện</Typography>
      </div>
      <Grid container spacing={3}>
        <Grid lg={4} md={6} xs={12}>
          <Card>
            <CardMedia
              sx={{ height: 140 }}
              image={event.bannerUrl || 'https://mui.com/static/images/cards/contemplative-reptile.jpg'}
              title={event.name}
            />
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                {event.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {event.description ? event.description : "Chưa có mô tả"}
              </Typography>
              <Stack direction="column" spacing={2} sx={{ alignItems: 'left', mt: 2 }}>
                <Stack direction="row" spacing={1}>
                  <HouseLineIcon fontSize="var(--icon-fontSize-sm)" />
                  <Typography color="text.secondary" display="inline" variant="body2">
                    Đơn vị tổ chức: {event.organizer}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                  <Typography color="text.secondary" display="inline" variant="body2">
                    {event.startDateTime && event.endDateTime
                      ? `${event.startDateTime} - ${event.endDateTime}`
                      : "Chưa xác định"}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                  <Typography color="text.secondary" display="inline" variant="body2">
                    {event.place ? event.place : "Chưa xác định"}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
            <Divider />
            <CardActions>
              <Button fullWidth variant="text">
                Thay đổi ảnh bìa
              </Button>
            </CardActions>
          </Card>
        </Grid>
        <Grid lg={8} md={6} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title="Thông tin sự kiện" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Tên sự kiện</InputLabel>
                      <OutlinedInput
                        value={formValues.name}
                        onChange={handleInputChange}
                        label="Tên sự kiện"
                        name="name"
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Đơn vị tổ chức</InputLabel>
                      <OutlinedInput
                        value={formValues.organizer}
                        onChange={handleInputChange}
                        label="Đơn vị tổ chức"
                        name="organizer"
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Email đơn vị tổ chức</InputLabel>
                      <OutlinedInput
                        value={formValues.organizerEmail}
                        onChange={handleInputChange}
                        label="Email đơn vị tổ chức"
                        name="organizerEmail"
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Số điện thoại đơn vị tổ chức</InputLabel>
                      <OutlinedInput
                        value={formValues.organizerPhoneNumber}
                        onChange={handleInputChange}
                        label="Số điện thoại đơn vị tổ chức"
                        name="organizerPhoneNumber"
                        type="tel"
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth >
                      <InputLabel>Mô tả</InputLabel>
                      <OutlinedInput
                        value={formValues.description || ''}
                        onChange={handleInputChange}
                        label="Mô tả"
                        name="description"
                        type="text"
                        multiline
                        minRows={2}
                        maxRows={10}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Địa điểm & Thời gian" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Địa điểm</InputLabel>
                      <OutlinedInput
                        value={formValues.place || ''}
                        onChange={handleInputChange}
                        label="Địa điểm"
                        name="place"
                      />
                    </FormControl>
                  </Grid>

                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>URL Địa điểm</InputLabel>
                      <OutlinedInput
                        value={formValues.locationUrl || ''}
                        onChange={handleInputChange}
                        label="URL Địa điểm"
                        name="locationUrl"
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Hướng dẫn thêm về địa điểm</InputLabel>
                      <OutlinedInput
                        value={formValues.locationInstruction || ''}
                        onChange={handleInputChange}
                        label="Hướng dẫn thêm về địa điểm"
                        name="locationInstruction"
                      />
                    </FormControl>
                  </Grid>

                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <TextField
                        label="Thời gian bắt đầu"
                        type="datetime-local"
                        value={formValues.startDateTime || ''}
                        onChange={(e) =>
                          handleInputChange({ target: { name: 'startDateTime', value: e.target.value } })
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid md={6} xs={12}>
                    <FormControl fullWidth required>
                      <TextField
                        label="Thời gian kết thúc"
                        type="datetime-local"
                        value={formValues.endDateTime || ''}
                        onChange={(e) =>
                          handleInputChange({ target: { name: 'endDateTime', value: e.target.value } })
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Thông tin khác" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth disabled>
                      <InputLabel>Slug</InputLabel>
                      <OutlinedInput value={event.slug} label="Slug" name="slug" />
                    </FormControl>
                  </Grid>

                  <Grid md={12} xs={12}>
                    <FormControl fullWidth disabled>
                      <InputLabel>Secure API key</InputLabel>
                      <OutlinedInput value={event.secureApiKey} label="Secure API key" name="secureApiKey" />
                    </FormControl>
                  </Grid>
                  <Grid md={12} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Cho phép hiển thị trên Marketplace</InputLabel>
                      <Select
                        label="Cho phép hiển thị trên Marketplace"
                        name="displayOnMarketplace"
                        value={formValues.displayOnMarketplace}
                        onChange={handleInputChange}
                      >
                        <MenuItem value={true}>Hiển thị</MenuItem>
                        <MenuItem value={false}>Không hiển thị</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button type="submit" variant="contained">
                Lưu
              </Button>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
