'use client';

import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service'; // Axios instance
import { Stack } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import { AxiosResponse } from 'axios';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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


type GetEmailTemplateResponse = {
  title: string | null;
  senderName: string | null;
  description: string | null;
};

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  React.useEffect(() => {
    document.title = "Chỉnh sửa email marketing| ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const [event, setEvent] = useState<EventResponse | null>(null);
  const [formValues, setFormValues] = useState({
    title: "Đây là template mẫu.",
    senderName: "",
  });
  const [template, setTemplate] = useState<GetEmailTemplateResponse | null>(null);
  const { event_id } = params;
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [description, setDescription] = useState(
    `<h1>Template mẫu</h1>
     <p>Hãy chỉnh sửa nội dung template này để gửi đến khách hàng của bạn.</p>
     <p>Sử dụng cụm {{ customer_name }} nếu bạn muốn đại diện cho tên khách hàng.</p>
     <p><b>Cảm ơn bạn đã sử dụng ETIK.</b></p>`
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
  useEffect(() => {
    
  }, [event_id, notificationCtx]);
  
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
        } catch (error) {
          notificationCtx.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      const fetchEmailTemplate = async () => {
        try {
          setIsLoading(true);
          const response = await baseHttpServiceInstance.get(`/event-studio/events/${event_id}/templates/email-marketing`);
          setTemplate(response.data);
          
          setFormValues({
            title: response.data.title || '',
            senderName: response.data.senderName || '',
          });
          if (response.data.description) {
            setDescription(response.data.description)
          }
        } catch (error) {
          notificationCtx.error(error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchEventDetails();
      fetchEmailTemplate();
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


  const handleFormSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
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
          notificationCtx.error('Lỗi:', error);
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
                  <li style={{ color: 'red' }}>Nghiêm cấm sử dụng Email marketing để phát tán spam, lừa đảo, virus, tuyên truyền chống Nhà nước và các hành vi trái pháp luật khác.</li>
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
