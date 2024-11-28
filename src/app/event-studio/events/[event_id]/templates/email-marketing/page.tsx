'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Avatar, Box, CardMedia, IconButton, InputAdornment, MenuItem, Select, Stack, TextField } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { ArrowSquareIn, Clipboard } from '@phosphor-icons/react/dist/ssr';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { HouseLine as HouseLineIcon } from '@phosphor-icons/react/dist/ssr/HouseLine';
import { MapPin as MapPinIcon } from '@phosphor-icons/react/dist/ssr/MapPin';
import { AxiosResponse } from 'axios';
import ReactQuill, { Quill } from 'react-quill';
import NotificationContext from '@/contexts/notification-context';
import 'react-quill/dist/quill.snow.css';
import dayjs from 'dayjs';
import RouterLink from 'next/link';

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
  avatarUrl: string;
  slug: string;
  secureApiKey: string;
  locationInstruction: string | null;
  displayOnMarketplace: boolean;
};


export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Chỉnh sửa email marketing| ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [formValues, setFormValues] = useState({
    title: "Cảm ơn Quý khách đã tham dự sự kiện!",
    senderName: "",
  });
  const { event_id } = params;
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [description, setDescription] = useState(
    `<h1>Thư cảm ơn</h1>
     <p>Kính gửi Quý khách {{ customer_name }},</p>
     <p>Cảm ơn đã tham dự sự kiện của chúng tôi, hẹn gặp lại Quý khách trong sự kiện sắp tới.</p>
     <p>Trân trọng,</p>
     <p>Ban tổ chức sự kiện.</p>`
  );

  const reactQuillRef = React.useRef<ReactQuill>(null);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const layout = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <style>
        body {
          background-color: #EDF0F2;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 15px;
          line-height: 28px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding-bottom: 10px;
        }
        .content {
          background: #fff;
          padding: 15px;
        }
        h1 {
          text-align: center;
          font-weight: bold;
          margin: 16px 0;
        }
        hr {
          margin: 30px 0;
        }
        .section {
          border: 1px solid #EDF0F2;
          padding: 10px;
          margin: 10px 5px;
          border-radius: 2px;
        }
        .cta {
          text-align: center;
          font-weight: bold;
          margin: 16px 0;
        }
        .cta a {
          display: inline-block;
          padding: 10px 20px;
          border: 2px solid #ccc;
          border-radius: 10px;
          background-color: #f2f2f2;
          text-decoration: none;
          color: #333;
        }
        ul {
          padding-left: 20px;
        }
        footer {
          text-align: center;
          margin-top: 16px;
        }
        footer small {
          display: block;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <img src="${event?.bannerUrl}" alt="Event Banner" style="max-width: 100%; height: auto;">
          <div>
            ${description}
          </div>
          <footer>
            <p>Email được phát hành bởi <a href="https://etik.io.vn">ETIK</a></p>
            <small>Bạn nhận được email này vì đã điền biểu mẫu đăng ký. Ngừng nhận thư tại đây: <a href="https://api.etik.io.vn/unsubscribe-mail">Unsubscribe</a></small>
            <small>You received this email because you filled out the registration form. Unsubscribe here: <a href="https://api.etik.io.vn/unsubscribe-mail">Unsubscribe</a></small>
          </footer>
        </div>
      </div>
    </body>
    </html>
  `;

  // Handle avatar selection
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedAvatar(file);
      // setPreviewAvatarUrl(URL.createObjectURL(file)); // Generate preview URL
      // setIsAvatarSelected(true); // Toggle button state
    }
  };

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
      notificationCtx.error('Error uploading avatar image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting another avatar
  const handleSelectOtherAvatar = () => {
    setSelectedAvatar(null);
    // setPreviewAvatarUrl(event?.avatarUrl || '');
    // setIsAvatarSelected(false); // Reset state
  };

  // Handle image selection
  const handleBannerImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // setPreviewBannerUrl(URL.createObjectURL(file)); // Generate preview URL
      // setIsImageSelected(true); // Toggle button state
    }
  };

  // Handle saving the image
  const handleSaveBannerImage = async () => {
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append('file', selectedImage);

    try {
      // Call API to upload the image
      setIsLoading(true);
      await baseHttpServiceInstance.post(`/event-studio/events/${event?.id}/upload_banner`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // On successful upload, reload the page or handle success
      window.location.reload(); // You can also call a function to update the state instead of reloading
    } catch (error) {
      notificationCtx.error('Error uploading banner image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting another image
  const handleSelectBannerOther = () => {
    setSelectedImage(null);
    // setPreviewBannerUrl(event?.bannerUrl || '');
    // setIsImageSelected(false); // Reset state
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
          setFormValues({ ...formValues, senderName: response.data.name });

          // setFormValues(response.data);
          // setDescription(response.data.description || '');
        } catch (error) {
          notificationCtx.error('Error fetching event details:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEventDetails();
    }
  }, [event_id]);


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const handleDescriptionChange = (value: string): void => {
    setDescription(value);
  };


  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formValues && event_id) {
      try {
        setIsLoading(true);
        await baseHttpServiceInstance.put(`/event-studio/events/${event_id}/templates/email-marketing`, { ...formValues, description });
        notificationCtx.success('Lưu thành công.');
      } catch (error) {
        notificationCtx.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopyToClipboard = (data: string) => {
    navigator.clipboard.writeText(data).then(() => {
      notificationCtx.success("Đã sao chép vào bộ nhớ tạm"); // Show success message
    }).catch(() => {
      notificationCtx.warning("Không thể sao chép, vui lòng thử lại"); // Handle errors
    });
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
          notificationCtx.error('Image upload failed:', error);
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

      <div>
        <Typography variant="h4">Chỉnh sửa email marketing</Typography>
      </div>

      <Grid container spacing={3}>
        <Grid item lg={12} md={12} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title="Lưu ý" />
              <Divider />
              <CardContent>
                <ul>
                  <li style={{ color: 'red' }}>Nghiêm cấm sử dụng Email marketing để phát tán spam, lừa đảo, chống phá chính quyền, và các hành vi trái pháp luật khác.</li>
                  <li>Sử dụng các cụm <code>{'{{ customer_name }}'}</code>, <code>{'{{ customer_email }}'}</code>, <code>{'{{ customer_address }}'}</code>, <code>{'{{ customer_phone_number }}'}</code> để đại diện cho thông tin từng khách hàng nếu cần.</li>
                </ul>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
        <Grid item lg={6} md={6} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title="Soạn nội dung" />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item md={12} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Tiêu đề</InputLabel>
                      <OutlinedInput
                        value={formValues.title}
                        onChange={handleInputChange}
                        label="Tiêu đề"
                        name="title"
                      />
                    </FormControl>
                  </Grid>
                  <Grid item md={12} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Tên người gửi</InputLabel>
                      <OutlinedInput
                        value={formValues.senderName}
                        onChange={handleInputChange}
                        label="Tên người gửi"
                        name="senderName"
                      />
                    </FormControl>
                  </Grid>
                  <Grid item md={12} xs={12}>
                    <ReactQuill
                      ref={reactQuillRef}
                      value={description}
                      onChange={handleDescriptionChange}
                      modules={{
                        toolbar: [
                          ["bold", "italic", "underline", "strike"],
                          [{ list: "ordered" }, { list: "bullet" }],
                          ["link", "image"],
                        ],
                      }}
                      placeholder="Mô tả"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Live Preview Section */}
        <Grid item lg={6} md={6} xs={12}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title="Preview" />
              <Divider />
              <CardContent>
                <h2>{formValues.title}</h2>
                <p><strong>From:</strong> {formValues.senderName}</p>
                <iframe
                  srcDoc={layout}
                  style={{
                    width: "100%",
                    height: "500px",
                    border: "none",
                    backgroundColor: "#fff",
                  }}
                  title="Live Preview"
                />
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
