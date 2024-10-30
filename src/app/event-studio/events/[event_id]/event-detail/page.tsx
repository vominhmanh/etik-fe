'use client';

import * as React from 'react';
import NotificationContext from '@/contexts/notification-context';
import Typography from '@mui/material/Typography';
import { Clock as ClockIcon } from "@phosphor-icons/react/dist/ssr/Clock";
import { MapPin as MapPinIcon } from "@phosphor-icons/react/dist/ssr/MapPin";
import { HouseLine as HouseLineIcon } from "@phosphor-icons/react/dist/ssr/HouseLine";
import { Avatar, Box, CardMedia, MenuItem, Select } from "@mui/material";
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
import { useCallback, useEffect, useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { AxiosResponse } from 'axios';
import { ArrowSquareIn } from '@phosphor-icons/react/dist/ssr';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import dayjs from 'dayjs';

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

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [formValues, setFormValues] = useState<EventResponse | null>(null);
  const { event_id } = params;
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string>(event?.bannerUrl || '');
  const [isImageSelected, setIsImageSelected] = React.useState(false);
  const [description, setDescription] = useState<string>('');
  const reactQuillRef = React.useRef<ReactQuill>(null);
  const notificationCtx = React.useContext(NotificationContext);

  // Handle image selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file)); // Generate preview URL
      setIsImageSelected(true); // Toggle button state
    }
  };

  // Handle saving the image
  const handleSaveImage = async () => {
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append('file', selectedImage);

    try {
      // Call API to upload the image
      await baseHttpServiceInstance.post(`/event-studio/events/${event?.id}/upload_banner`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // On successful upload, reload the page or handle success
      window.location.reload(); // You can also call a function to update the state instead of reloading
    } catch (error) {
      notificationCtx.error('Error uploading banner image:', error);
    }
  };

  // Handle selecting another image
  const handleSelectOther = () => {
    setSelectedImage(null);
    setPreviewUrl(event?.bannerUrl || '');
    setIsImageSelected(false); // Reset state
  };


  useEffect(() => {
    if (event_id) {
      const fetchEventDetails = async () => {
        try {
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(`/event-studio/events/${event_id}`);
          setEvent(response.data);
          setFormValues(response.data);
          setDescription(response.data.description || '');
        } catch (error) {
          notificationCtx.error('Error fetching event details:', error);
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

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setFormValues((prevValues) => prevValues ? { ...prevValues, description: value } : null);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formValues && event_id) {
      try {
        await baseHttpServiceInstance.put(`/event-studio/events/${event_id}`, { ...formValues, description });
        notificationCtx.success('Event updated successfully!');
      } catch (error) {
        notificationCtx.error('Error updating event:', error);
      }
    }
  };


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
          const response = await baseHttpServiceInstance.post(`/event-studio/events/${event_id}/upload_image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          const imageUrl = response.data.imageUrl; // Adjust based on response
          const quill = reactQuillRef.current;
          if (quill) {
            const range = quill.getEditorSelection();
            range && quill.getEditor().insertEmbed(range.index, "image", imageUrl);
          }
        } catch (error) {
          notificationCtx.error('Image upload failed:', error);
        }
      }
    };
  }, []);

  // Custom Toolbar Options
  const modules = {
    toolbar: {
      container: [
        [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
        [{ 'size': [] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: handleImageUpload,   // <- 
      },
    },
    clipboard: {
      matchVisual: false,
    },
  }

  if (!event || !formValues) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid lg={8} md={6} xs={12}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: 16 / 6, // 16:9 aspect ratio (modify as needed)
              overflow: 'hidden',
              border: 'grey 1px',
              borderRadius: '20px',
              backgroundColor: 'gray'
            }}
          >
            <img
              src={event?.bannerUrl}
              alt="Car"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 'auto',
                objectFit: 'cover', // or 'contain' depending on your preference
              }}
            />
          </Box>
        </Grid>
        <Grid lg={4} md={6} xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Stack direction="column" spacing={2}>
                <Stack direction="row" spacing={2} style={{ alignItems: 'center' }}>
                  <div>
                    <Avatar sx={{ height: '80px', width: '80px', fontSize: "2rem" }}>{event?.name[0].toUpperCase()}</Avatar>
                  </div>
                  <Typography variant="h5" sx={{ width: '100%', textAlign: 'center' }}>{event?.name}</Typography>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <HouseLineIcon fontSize="var(--icon-fontSize-sm)" />
                  <Typography color="text.secondary" display="inline" variant="body2">
                    Đơn vị tổ chức: {event?.organizer}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <ClockIcon fontSize="var(--icon-fontSize-sm)" />
                  <Typography color="text.secondary" display="inline" variant="body2">
                    {event?.startDateTime && event?.endDateTime
                      ? `${dayjs(event.startDateTime || 0).format('HH:mm:ss DD/MM/YYYY')} - ${dayjs(event.endDateTime || 0).format('HH:mm:ss DD/MM/YYYY')}`
                      : "Chưa xác định"}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                  <Typography color="text.secondary" display="inline" variant="body2">
                    {event?.place ? event?.place : "Chưa xác định"}
                  </Typography>
                </Stack>
              </Stack>
              <div style={{ marginTop: '20px' }}>
                <Button fullWidth variant='contained' target='_blank' href={`/events/${event?.slug}`} size="small" endIcon={<ArrowSquareIn />}>
                  Đến trang Marketplace của sự kiện
                </Button>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <div>
        <Typography variant="h4">Chi tiết sự kiện</Typography>
      </div>
      <Grid container spacing={3}>
        <Grid lg={4} md={6} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardMedia sx={{ height: 140 }} image={previewUrl || ''} title={event.name} />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {event.name}
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
                        ? `${dayjs(event.startDateTime || 0).format('HH:mm:ss DD/MM/YYYY')} - ${dayjs(event.endDateTime || 0).format('HH:mm:ss DD/MM/YYYY')}`
                        : 'Chưa xác định'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <MapPinIcon fontSize="var(--icon-fontSize-sm)" />
                    <Typography color="text.secondary" display="inline" variant="body2">
                      {event.place ? event.place : 'Chưa xác định'}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
              <Divider />
              <CardActions>
                {isImageSelected ? (
                  <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                    <Button fullWidth variant="contained" onClick={handleSaveImage}>
                      Lưu ảnh bìa
                    </Button>
                    <Button fullWidth variant="outlined" onClick={handleSelectOther}>
                      Chọn ảnh khác
                    </Button>
                  </Stack>
                ) : (
                  <Button fullWidth variant="text" component="label">
                    Thay đổi ảnh bìa
                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                  </Button>
                )}
              </CardActions>
            </Card>
            <Card>
              <CardHeader title="Đơn vị tổ chức" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={12} xs={12}>
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
                  <Grid md={12} xs={12}>
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
                  <Grid md={12} xs={12}>
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

                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
        <Grid lg={8} md={6} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title="Thông tin sự kiện" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid md={12} xs={12}>
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
                  <Grid md={12} xs={12}>
                    <ReactQuill
                      ref={reactQuillRef}
                      value={description}
                      onChange={handleDescriptionChange}
                      modules={modules}
                      placeholder="Mô tả"
                    />
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
              <Button type="submit" variant="contained" onClick={handleFormSubmit}>
                Lưu
              </Button>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
