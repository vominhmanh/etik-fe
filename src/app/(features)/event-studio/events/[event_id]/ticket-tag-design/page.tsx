"use client";

import NotificationContext from "@/contexts/notification-context";
import { baseHttpServiceInstance } from "@/services/BaseHttp.service";
import { Box, Button, Card, CardHeader, Checkbox, Divider, FormControlLabel, Grid, List, ListItem, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
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

interface TicketTagSettings {
  size: string;
  selectedComponents: SelectedComponent[];
  componentSettings: Record<string, ComponentSettings>;
}

interface LabelSize {
  value: string;
  label: string;
  width: number;
  height: number;
}

const labelSizes: LabelSize[] = [
  { value: "40x30mm", label: "40 x 30 mm", width: 40, height: 30 },
  { value: "50x40mm", label: "50 x 40 mm", width: 50, height: 40 },
  { value: "50x50mm", label: "50 x 50 mm", width: 50, height: 50 },
  { value: "50x30mm", label: "50 x 30 mm", width: 50, height: 30 },
];

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

// Default templates for each label size
const defaultTemplates: Record<string, {
  selectedComponents: string[];
  componentSettings: Record<string, ComponentSettings>;
}> = {
  "40x30mm": {
    selectedComponents: ["eventName", "customerName", "eCodeQr", "eCode"],
    componentSettings: {
      eventName: { width: 50, height: 12, top: 5, left: 5, fontSize: 10, color: "000000" },
      customerName: { width: 50, height: 10, top: 18, left: 5, fontSize: 10, color: "000000" },
      eCodeQr: { width: 25, height: 25, top: 50, left: 70, fontSize: 10, color: "000000" },
      eCode: { width: 25, height: 8, top: 75, left: 70, fontSize: 6, color: "000000" },
    },
  },
  "50x40mm": {
    selectedComponents: ["eventName", "customerName", "place", "eCodeQr", "eCode"],
    componentSettings: {
      eventName: { width: 60, height: 12, top: 5, left: 5, fontSize: 12, color: "000000" },
      customerName: { width: 60, height: 10, top: 18, left: 5, fontSize: 9, color: "000000" },
      place: { width: 60, height: 8, top: 29, left: 5, fontSize: 7, color: "000000" },
      eCodeQr: { width: 25, height: 25, top: 45, left: 70, fontSize: 10, color: "000000" },
      eCode: { width: 25, height: 8, top: 70, left: 70, fontSize: 7, color: "000000" },
    },
  },
  "50x50mm": {
    selectedComponents: ["eventName", "customerName", "startDateTime", "place", "eCodeQr", "eCode"],
    componentSettings: {
      eventName: { width: 60, height: 12, top: 5, left: 5, fontSize: 12, color: "000000" },
      customerName: { width: 60, height: 10, top: 18, left: 5, fontSize: 9, color: "000000" },
      startDateTime: { width: 60, height: 8, top: 29, left: 5, fontSize: 7, color: "000000" },
      place: { width: 60, height: 8, top: 38, left: 5, fontSize: 7, color: "000000" },
      eCodeQr: { width: 30, height: 30, top: 50, left: 65, fontSize: 10, color: "000000" },
      eCode: { width: 30, height: 8, top: 80, left: 65, fontSize: 7, color: "000000" },
    },
  },
  "50x30mm": {
    selectedComponents: ["eventName", "customerName", "eCodeQr", "eCode"],
    componentSettings: {
      eventName: { width: 45, height: 12, top: 5, left: 5, fontSize: 11, color: "000000" },
      customerName: { width: 45, height: 10, top: 18, left: 5, fontSize: 10, color: "000000" },
      eCodeQr: { width: 25, height: 25, top: 50, left: 70, fontSize: 10, color: "000000" },
      eCode: { width: 25, height: 8, top: 75, left: 70, fontSize: 6, color: "000000" },
    },
  },
};

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  useEffect(() => {
    document.title = "Thiết kế tem nhãn | ETIK - Vé điện tử & Quản lý sự kiện";
  }, []);
  const { event_id } = params;
  const notificationCtx = useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState(false);

  // Selected components state
  const [selectedComponents, setSelectedComponents] = useState<Record<string, SelectedComponent>>({});
  const [componentSettings, setComponentSettings] = useState<Record<string, ComponentSettings>>({});
  const [selectedSize, setSelectedSize] = useState<string>("40x30mm");
  // Preview data for printing (mock values)
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<TicketTagSettings> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/ticket-tag-settings`
        );

        if (response.status === 200) {
          const { size, selectedComponents, componentSettings } = response.data;

          setSelectedSize(size || "40x30mm");
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
        size: selectedSize,
        selectedComponents: Object.values(selectedComponents),
        componentSettings: componentSettings
      };

      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/ticket-tag-settings`,
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
            [key]: { width: 20, height: 10, top: 10, left: 10, fontSize: 10, color: 'FFFFFF' },
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

  // Apply default template for current size
  const applyDefaultTemplate = () => {
    const template = defaultTemplates[selectedSize];
    if (!template) return;

    // Convert selected components array to object format
    const newSelectedComponents: Record<string, SelectedComponent> = {};
    template.selectedComponents.forEach((key) => {
      const component = defaultComponents.find((c) => c.key === key);
      if (component) {
        newSelectedComponents[key] = { key, label: component.label };
      }
    });

    // Set selected components and settings
    setSelectedComponents(newSelectedComponents);
    setComponentSettings({ ...template.componentSettings });
    notificationCtx.success("Đã áp dụng thiết kế mặc định!");
  };

  // Open print dialog for test print with mock data
  const handleTestPrint = () => {
    // Set mock data for printing
    const mockData: Record<string, string> = {
      eventName: "Sự kiện ETIK",
      customerName: "Nguyễn Văn A",
      customerAddress: "123 Đường ABC, Quận 1, TP.HCM",
      customerPhone: "0901234567",
      customerEmail: "nguyenvana@example.com",
      ticketsList: "Vé VIP - 2 vé",
      eCode: "FMPJ8A",
      eCodeQr: "https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=FMPJ8A",
      startDateTime: "15/01/2025 19:00",
      endDateTime: "15/01/2025 22:00",
      place: "Trung tâm Hội nghị Quốc gia",
    };
    
    setPreviewData(mockData);
    
    // Wait for state to update, then print
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Get selected size dimensions
  const currentSize = labelSizes.find(size => size.value === selectedSize) || labelSizes[0];
  const aspectRatio = currentSize.width / currentSize.height;

  return (
    <>
      {/* Print-only styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              margin: 0;
            }
            
            body * {
              visibility: hidden;
            }
            
            .print-area, .print-area * {
              visibility: visible;
            }
            
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
            }
          }
        `
      }} />
      
      <Grid container spacing={2}>
        {/* Column 1: Size selector and buttons */}
        <Grid item xs={12} md={3}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Chọn kích thước tem nhãn:
            </Typography>
            <Select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              size="small"
              fullWidth
              sx={{ mb: 2 }}
            >
              {labelSizes.map((size) => (
                <MenuItem key={size.value} value={size.value}>
                  {size.label}
                </MenuItem>
              ))}
            </Select>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={applyDefaultTemplate}
                sx={{ fontSize: '0.75rem' }}
                fullWidth
              >
                Sử dụng thiết kế mặc định
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={applyDefaultTemplate}
                sx={{ fontSize: '0.75rem' }}
                fullWidth
              >
                Quay về mặc định
              </Button>
            </Box>
          </Box>
        </Grid>

        {/* Column 2: Canvas Preview */}
        <Grid item xs={12} md={5}>
          <div
            className="print-area"
            style={{
              position: "relative",
              maxWidth: "100%",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "start",
            }}
          >
            {/* Canvas Container */}
            <div
              style={{
                position: "relative",
                display: "inline-block",
                width: "100%",
                maxWidth: "400px",
              }}
            >
              {/* White Canvas with aspect ratio */}
              <Box
                className="print-canvas"
                sx={{
                  width: "100%",
                  paddingTop: `${(1 / aspectRatio) * 100}%`, // Maintain aspect ratio
                  position: "relative",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "8px",
                  border: "2px solid #333333",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  '@media print': {
                    border: 'none',
                    boxShadow: 'none',
                    borderRadius: 0,
                    paddingTop: '0 !important',
                    width: `${currentSize.width}mm !important`,
                    height: `${currentSize.height}mm !important`,
                  },
                }}
              >
                {/* Canvas content area */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {/* Overlaying Components */}
                  {Object.values(selectedComponents).map(({ key, label }) => {
                    const settings = componentSettings[key];
                    if (!settings) return null;
                    
                    // Check if we're in print mode (has previewData)
                    const isPrintMode = Object.keys(previewData).length > 0;
                    const displayText = isPrintMode ? (previewData[key] || label) : label;
                    const showBackground = !isPrintMode; // Show gray background only in design mode
                    
                    // For QR code, render as image in print mode
                    if (key === "eCodeQr" && isPrintMode && previewData[key]) {
                      return (
                        <img
                          key={key}
                          src={previewData[key]}
                          alt="QR Code"
                          style={{
                            position: "absolute",
                            top: `${settings.top}%`,
                            left: `${settings.left}%`,
                            width: `${settings.width}%`,
                            height: `${settings.height}%`,
                            objectFit: "contain",
                          }}
                          className="print-component"
                        />
                      );
                    }
                    
                    return (
                      <div
                        key={key}
                        style={{
                          position: "absolute",
                          top: `${settings.top}%`,
                          left: `${settings.left}%`,
                          width: `${settings.width}%`,
                          height: `${settings.height}%`,
                          fontSize: `${settings.fontSize / 25}cqw`,
                          background: showBackground ? "rgba(0,0,0,0.5)" : "transparent",
                          color: `#${settings.color || '000000'}`,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          borderRadius: "1.5%",
                          boxSizing: "border-box",
                        }}
                        className="print-component"
                      >
                        {displayText}
                      </div>
                    );
                  })}
                </div>
              </Box>
            </div>
          </div>
        </Grid>

        {/* Column 3: Components list */}
        <Grid item xs={12} md={4}>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              {Object.keys(previewData).length > 0 && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setPreviewData({})}
                  disabled={isLoading}
                  size="small"
                >
                  Quay lại thiết kế
                </Button>
              )}
              <Button
                variant="outlined"
                color="primary"
                onClick={handleTestPrint}
                disabled={isLoading}
              >
                In thử
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveTemplateSettings}
                disabled={isLoading}
              >
                {isLoading ? "Đang lưu..." : "Lưu thiết kế"}
              </Button>
            </div>
          </Stack>
        </Grid>
      </Grid>

      {isLoading && <div className="absolute text-white text-lg bg-black/60 px-4 py-2 rounded-md">Loading...</div>}
    </>
  );
}
