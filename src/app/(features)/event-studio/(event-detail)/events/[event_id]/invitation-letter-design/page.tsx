"use client";

import NotificationContext from "@/contexts/notification-context";
import { baseHttpServiceInstance } from "@/services/BaseHttp.service";
import { CloudUpload } from "@mui/icons-material";
import { Box, Button, Card, CardHeader, Checkbox, Divider, FormControlLabel, Grid, Input, List, ListItem, Stack, TextField, Typography } from "@mui/material";
import { AxiosResponse } from "axios";
import { useContext, useEffect, useState } from "react";

interface SelectedComponent {
  key: string;
  label: string;
}

interface ComponentSettings {
  width: number;
  height: number;
  top: number;
  left: number;
  fontSize: number;
  color: string;
}

interface InvitationLetterSettings {
  imageUrl: string;
  selectedComponents: SelectedComponent[];
  componentSettings: Record<string, ComponentSettings>;
}

const defaultComponents: { label: string; key: string }[] = [
  { label: "Tên sự kiện", key: "eventName" },
  { label: "Tên khách mời", key: "customerName" },
  { label: "Địa chỉ khách mời", key: "customerAddress" },
  { label: "Điện thoại khách mời", key: "customerPhone" },
  { label: "Email Khách mời", key: "customerEmail" },
  { label: "Danh sách vé", key: "ticketsList" },
  { label: "Mã Check-in", key: "eCode" },
  { label: "Ảnh QR", key: "eCodeQr" },
  { label: "Thời gian bắt đầu", key: "startDateTime" },
  { label: "Thời gian kết thúc", key: "endDateTime" },
  { label: "Địa điểm", key: "place" },
];

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  useEffect(() => {
    document.title = "Thiết kế thư mời | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const { event_id } = params;
  const notificationCtx = useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState(false);

  // Selected components state
  const [selectedComponents, setSelectedComponents] = useState<Record<string, SelectedComponent>>({});
  const [componentSettings, setComponentSettings] = useState<Record<string, ComponentSettings>>({});
  const [imagePreview, setImagePreview] = useState<string>(
    "https://media.etik.vn/events/28/event_images/7ebfc214-c468-492a-808a-5b9c9557a6ae.png"
  );
  const [originalPreviewImage, setOriginalPreviewImage] = useState<string | null>(null);
  const [onPreviewMode, setOnPreviewMode] = useState<boolean>(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<InvitationLetterSettings> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/invitation-letter-settings`
        );

        if (response.status === 200) {
          const { imageUrl, selectedComponents, componentSettings } = response.data;

          setImagePreview(imageUrl);
          setOriginalPreviewImage(imageUrl);
          setSelectedComponents(
            selectedComponents.reduce((acc, component) => {
              acc[component.key] = component;
              return acc;
            }, {} as Record<string, SelectedComponent>)
          );
          setComponentSettings(componentSettings);
        }
      } catch (error: any) {
        notificationCtx.error(`Lỗi khi tải cấu hình: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [event_id]);

  const handleSaveTemplateSettings = async () => {
    try {
      setIsLoading(true);

      const payload = {
        eventId: event_id,
        imageUrl: imagePreview,
        selectedComponents: Object.values(selectedComponents),
        componentSettings: componentSettings
      };

      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/invitation-letter-settings`,
        payload
      );

      if (response.status === 200) {
        notificationCtx.success("Cấu hình template đã được lưu thành công!");
      }
    } catch (error: any) {
      notificationCtx.error(`Lỗi khi lưu cấu hình: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 🟢 Upload Image to Server
  const handleUpload = async (file: File) => {
    try {
      // Step 1: Request presigned URL from backend
      const presignedResponse = await baseHttpServiceInstance.post('/common/s3/generate_presigned_url', {
        filename: file.name,
        content_type: file.type,
      });

      const { presignedUrl, fileUrl } = presignedResponse.data;

      // Step 2: Upload file directly to S3 using presigned URL
      await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      setImagePreview(fileUrl); // Set new image preview
      setOnPreviewMode(true);
    } catch (error: any) {
      const message =
        // 1) If it's a JS Error instance
        error instanceof Error ? error.message
        // 2) If it's an AxiosError with a response body
        : error.response?.data?.message
          ? error.response.data.message
        // 3) If it's a plain string
        : typeof error === 'string'
          ? error
        // 4) Fallback to JSON‐dump of the object
        : JSON.stringify(error);
      notificationCtx.error(`Lỗi tải ảnh:  ${message}`);
    }
  };

  // 🟢 Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleUpload(event.target.files[0]);
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (key: string, label: string) => {
    setSelectedComponents((prev) => {
      const newState = { ...prev };

      if (newState[key]) {
        delete newState[key]; // Remove if unchecked
      } else {
        newState[key] = { key, label };
        if (!componentSettings[key]) {
          setComponentSettings((prevSettings) => ({
            ...prevSettings,
            [key]: { width: 20, height: 10, top: 10, left: 10, fontSize: 30, color: 'FFFFFF' },
          }));
        }
      }

      return newState;
    });
  };

  // Handle input change for settings
  const handleInputChange = (key: string, field: keyof ComponentSettings, value: number | string) => {
    setComponentSettings((prevSettings) => ({
      ...prevSettings,
      [key]: {
        ...prevSettings[key],
        [field]: value,
      },
    }));
  };

  return (
    <>
      <Grid container spacing={1}>
        {/* Image Preview */}
        <Grid item xs={12} sm={6} md={6}>
          <div
            style={{
              position: "relative",
              maxWidth: "100%",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "start",
            }}
          >
            {/* Image Container */}
            <div
              style={{
                position: "relative",
                display: "inline-block",
                width: "100%",
                height: "auto",
                containerType: 'inline-size',
              }}
            >
              <Box
                component="img"
                src={imagePreview}
                alt="Event Image"
                sx={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  objectFit: "contain",
                  objectPosition: "top",
                  borderRadius: "8px",
                  marginBottom: "10px",
                }}
              />

              {/* Overlaying Components */}
              {Object.values(selectedComponents).map(({ key, label }) => (
                <div
                  key={key}
                  style={{
                    position: "absolute",
                    top: `${componentSettings[key]?.top}%`,
                    left: `${componentSettings[key]?.left}%`,
                    width: `${componentSettings[key]?.width}%`,
                    height: `${componentSettings[key]?.height}%`,
                    fontSize: `${componentSettings[key]?.fontSize / 10}cqw`,
                    background: "rgba(0,0,0,0.5)",
                    color: `#${componentSettings[key]?.color}`,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: "1.5%",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Upload controls below preview */}
          <div>
            <Input
              type="file"
              inputProps={{ accept: "image/*" }}
              onChange={handleFileChange}
              sx={{ display: "none" }}
              id="upload-image"
            />
            <label htmlFor="upload-image">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUpload />}
                size="small"
                sx={{ mt: 1 }}
              >
                Chọn ảnh thư mời
              </Button>
            </label>
            <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {onPreviewMode && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setOnPreviewMode(false);
                    setImagePreview(originalPreviewImage || imagePreview);
                  }}
                >
                  Hủy chọn
                </Button>
              )}
            </Box>
          </div>
        </Grid>
        {/* Controls */}
        <Grid item xs={12} sm={6} md={6}>
          <Stack spacing={3}>
            <Card>
              <CardHeader title="Chọn thành phần" titleTypographyProps={{ variant: 'subtitle2' }} />
              <Divider />
              <List dense>
                {defaultComponents.map(({ label, key }) => (
                  <ListItem
                    dense
                    divider
                    key={key}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.08)' },
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 0,
                      px: 1,
                      minHeight: 36,
                    }}
                  >
                    <Grid container spacing={0.5} alignItems="center">
                      <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                          control={
                            <Checkbox size="small"
                              checked={!!selectedComponents[key]}
                              onChange={() => handleCheckboxChange(key, label)}
                            />
                          }
                          label={<Typography variant="caption">{label}</Typography>}
                        />
                      </Grid>
                      <Grid item xs={12} md={8}>
                        {selectedComponents[key] && (
                          <Stack direction={'row'} style={{ gap: '4px' }}>
                            <TextField
                              sx={{
                                width: '64px',
                                '& .MuiInputBase-input, & .MuiOutlinedInput-input': { fontSize: 11, padding: 0, textAlign: 'center' },
                                '& .MuiInputLabel-root': { fontSize: 11 },
                                '& input[type=number]': { MozAppearance: 'textfield' },
                                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                              }}
                              label="W%"
                              type="number"
                              value={componentSettings[key]?.width || ""}
                              onChange={(e) => handleInputChange(key, "width", Number(e.target.value))}
                              size="small"
                            />
                            <TextField
                              sx={{
                                width: '64px',
                                '& .MuiInputBase-input, & .MuiOutlinedInput-input': { fontSize: 11, padding: 0, textAlign: 'center' },
                                '& .MuiInputLabel-root': { fontSize: 11 },
                                '& input[type=number]': { MozAppearance: 'textfield' },
                                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                              }}
                              label="H%"
                              type="number"
                              value={componentSettings[key]?.height || ""}
                              onChange={(e) => handleInputChange(key, "height", Number(e.target.value))}
                              size="small"
                            />
                            <TextField
                              sx={{
                                width: '64px',
                                '& .MuiInputBase-input, & .MuiOutlinedInput-input': { fontSize: 11, padding: 0, textAlign: 'center' },
                                '& .MuiInputLabel-root': { fontSize: 11 },
                                '& input[type=number]': { MozAppearance: 'textfield' },
                                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                              }}
                              label="Top%"
                              type="number"
                              value={componentSettings[key]?.top || ""}
                              onChange={(e) => handleInputChange(key, "top", Number(e.target.value))}
                              size="small"
                            />
                            <TextField
                              sx={{
                                width: '64px',
                                '& .MuiInputBase-input, & .MuiOutlinedInput-input': { fontSize: 11, padding: 0, textAlign: 'center' },
                                '& .MuiInputLabel-root': { fontSize: 11 },
                                '& input[type=number]': { MozAppearance: 'textfield' },
                                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                              }}
                              label="Left%"
                              type="number"
                              value={componentSettings[key]?.left || ""}
                              onChange={(e) => handleInputChange(key, "left", Number(e.target.value))}
                              size="small"
                            />
                            <TextField
                              sx={{
                                width: '64px',
                                '& .MuiInputBase-input, & .MuiOutlinedInput-input': { fontSize: 11, padding: 0, textAlign: 'center' },
                                '& .MuiInputLabel-root': { fontSize: 11 },
                                '& input[type=number]': { MozAppearance: 'textfield' },
                                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                              }}
                              label="Font%"
                              type="number"
                              value={componentSettings[key]?.fontSize || ""}
                              onChange={(e) => handleInputChange(key, "fontSize", Number(e.target.value))}
                              size="small"
                            />
                            <TextField
                              sx={{ width: '72px', '& .MuiInputBase-input, & .MuiOutlinedInput-input': { fontSize: 11, padding: 0, textAlign: 'center' }, '& .MuiInputLabel-root': { fontSize: 11 } }}
                              label="Color"
                              type="text"
                              value={componentSettings[key]?.color || ""}
                              onChange={(e) => handleInputChange(key, "color", e.target.value)}
                              size="small"
                            />
                          </Stack>
                        )}
                      </Grid>
                    </Grid>

                  </ListItem>))}

              </List>
            </Card>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveTemplateSettings}
                disabled={isLoading} // Disable while loading
              >
                {isLoading ? "Đang lưu..." : "Lưu Template"}
              </Button>
            </div>
          </Stack>


        </Grid>


        {/* Component Selection */}

      </Grid>

      {isLoading && <div className="absolute text-white text-lg bg-black/60 px-4 py-2 rounded-md">Loading...</div>}
    </>
  );
}
