"use client";

import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { CloudUpload } from '@mui/icons-material';
import { Box, Button, Card, CardContent, CardHeader, Checkbox, Divider, FormControlLabel, Grid, Input, List, ListItem, Stack, TextField, Typography } from '@mui/material';
import { AxiosResponse } from 'axios';
import { useContext, useEffect, useMemo, useState } from 'react';

interface CustomersTableProps {
  eventId: number;
}

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

const defaultComponents: { label: string; key: string }[] = [
  { label: 'Tên sự kiện', key: 'eventName' },
  { label: 'Tên khách mời', key: 'customerName' },
  { label: 'Địa chỉ khách mời', key: 'customerAddress' },
  { label: 'SĐT khách mời', key: 'customerPhone' },
  { label: 'Email Khách mời', key: 'customerEmail' },
  { label: 'Danh sách vé', key: 'ticketsList' },
  { label: 'Mã Check-in', key: 'eCode' },
  { label: 'Ảnh QR', key: 'eCodeQr' },
  { label: 'Thời gian bắt đầu', key: 'startDateTime' },
  { label: 'Thời gian kết thúc', key: 'endDateTime' },
  { label: 'Địa điểm', key: 'place' },
];

export default function UploadImagePage({ eventId = 0 }: CustomersTableProps) {
  const notificationCtx = useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalPreviewImage, setOriginalPreviewImage] = useState<string | null>(null);
  const [onPreviewMode, setOnPreviewMode] = useState<boolean>(false);

  const [selectedComponents, setSelectedComponents] = useState<Record<string, SelectedComponent>>({});
  const [componentSettings, setComponentSettings] = useState<Record<string, ComponentSettings>>({});

  const storageKey = useMemo(() => `welcomeBannerSettings_ev_${eventId}`, [eventId]);

  // 🟢 Fetch background image and local overlay settings
  useEffect(() => {
    async function fetchBackgroundImage() {
      try {
        const response = await baseHttpServiceInstance.get(
          `/event-studio/events/${eventId}/mini-app-welcome-banner`
        );
        setImagePreview(response.data.imageUrl);
        setOriginalPreviewImage(response.data.imageUrl);

        // Load overlay settings from API if provided
        if (Array.isArray(response.data.selectedComponents)) {
          setSelectedComponents(
            response.data.selectedComponents.reduce((acc: Record<string, SelectedComponent>, comp: SelectedComponent) => {
              acc[comp.key] = comp;
              return acc;
            }, {} as Record<string, SelectedComponent>)
          );
        }
        if (response.data.componentSettings) {
          setComponentSettings(response.data.componentSettings as Record<string, ComponentSettings>);
        }
      } catch (error: any) {
        // notificationCtx.error(`Lỗi khi tải ảnh nền: ${error?.message || 'Unknown error'}`);
      }
    }

    // Load overlay settings from localStorage (if any)
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          selectedComponents: SelectedComponent[];
          componentSettings: Record<string, ComponentSettings>;
        };
        setSelectedComponents(
          parsed.selectedComponents.reduce((acc, comp) => {
            acc[comp.key] = comp;
            return acc;
          }, {} as Record<string, SelectedComponent>)
        );
        setComponentSettings(parsed.componentSettings || {});
      }
    } catch {
      // ignore localStorage parse errors
    }

    fetchBackgroundImage();
  }, [eventId, storageKey]);

  // 🟢 Upload Image
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

      setImagePreview(fileUrl);
      setOnPreviewMode(true);
    } catch (error: any) {
      const message =
        error instanceof Error
          ? error.message
          : error?.response?.data?.message
            ? error.response.data.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error);
      notificationCtx.error(`Lỗi tải ảnh: ${message}`);
    }
  };

  // 🟢 Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleUpload(event.target.files[0]);
    }
  };

  // 🟢 Save background image and persist overlay settings to localStorage
    const handleSave = async () => {
      try {
        setIsLoading(true);
  
        const payload = {
          eventId: eventId,
          imageUrl: imagePreview,
          selectedComponents: Object.values(selectedComponents),
          componentSettings: componentSettings
        };
  
        const response: AxiosResponse = await baseHttpServiceInstance.post(
          `/event-studio/events/${eventId}/mini-app-welcome-banner`,
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


  // 🟢 Checkbox change for components
  const handleCheckboxChange = (key: string, label: string) => {
    setSelectedComponents((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = { key, label };
        if (!componentSettings[key]) {
          setComponentSettings((prevSettings) => ({
            ...prevSettings,
            [key]: { width: 20, height: 10, top: 10, left: 10, fontSize: 30, color: 'FFFFFF' },
          }));
        }
      }
      return next;
    });
  };

  // 🟢 Update settings for a component
  const handleInputChange = (key: string, field: keyof ComponentSettings, value: number | string) => {
    setComponentSettings((prevSettings) => ({
      ...prevSettings,
      [key]: {
        ...prevSettings[key],
        [field]: value as never,
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
              position: 'relative',
              maxWidth: '100%',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'start',
            }}
          >
            {/* Image Container */}
            <div
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '100%',
                height: 'auto',
                containerType: 'inline-size',
              }}
            >
              <Box
                component="img"
                src={imagePreview || ''}
                alt="Event Image"
        sx={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                  objectPosition: 'top',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  backgroundColor: imagePreview ? 'transparent' : '#f5f5f5',
                }}
              />

              {/* Overlaying Components */}
              {Object.values(selectedComponents).map(({ key, label }) => (
                <div
                  key={key}
                  style={{
                    position: 'absolute',
                    top: `${componentSettings[key]?.top}%`,
                    left: `${componentSettings[key]?.left}%`,
                    width: `${componentSettings[key]?.width}%`,
                    height: `${componentSettings[key]?.height}%`,
                    fontSize: `${(componentSettings[key]?.fontSize || 30) / 10}cqw`,
                    background: 'rgba(0,0,0,0.5)',
                    color: `#${componentSettings[key]?.color || 'FFFFFF'}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
                    borderRadius: '1.5%',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Upload controls moved below preview */}
              <div>
                <Input
                  type="file"
                  inputProps={{ accept: 'image/*' }}
                  onChange={handleFileChange}
                  sx={{ display: 'none' }}
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
                    Chọn ảnh nền
                  </Button>
                </label>
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {onPreviewMode && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setOnPreviewMode(false);
                        setImagePreview(originalPreviewImage);
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
                            <Checkbox size="small" checked={!!selectedComponents[key]} onChange={() => handleCheckboxChange(key, label)} />
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
                              value={componentSettings[key]?.width ?? ''}
                              onChange={(e) => handleInputChange(key, 'width', Number(e.target.value))}
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
                              value={componentSettings[key]?.height ?? ''}
                              onChange={(e) => handleInputChange(key, 'height', Number(e.target.value))}
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
                              value={componentSettings[key]?.top ?? ''}
                              onChange={(e) => handleInputChange(key, 'top', Number(e.target.value))}
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
                              value={componentSettings[key]?.left ?? ''}
                              onChange={(e) => handleInputChange(key, 'left', Number(e.target.value))}
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
                              value={componentSettings[key]?.fontSize ?? ''}
                              onChange={(e) => handleInputChange(key, 'fontSize', Number(e.target.value))}
                              size="small"
                            />
                            <TextField
                              sx={{ width: '72px', '& .MuiInputBase-input, & .MuiOutlinedInput-input': { fontSize: 11, padding: 0, textAlign: 'center' }, '& .MuiInputLabel-root': { fontSize: 11 } }}
                              label="Color"
                              type="text"
                              value={componentSettings[key]?.color ?? ''}
                              onChange={(e) => handleInputChange(key, 'color', e.target.value)}
                              size="small"
                            />
                          </Stack>
                        )}
                      </Grid>
                    </Grid>
                  </ListItem>
                ))}
              </List>
            </Card>

            <div>
              <Button size="small" variant="contained" color="primary" onClick={handleSave} disabled={!imagePreview || isLoading}>
                {isLoading ? 'Lưu...' : 'Lưu cấu hình'}
      </Button>
            </div>
          </Stack>
        </Grid>
      </Grid>

      {isLoading && (
        <div className="absolute text-white text-lg bg-black/60 px-4 py-2 rounded-md">Loading...</div>
      )}
    </>
  );
}
