'use client';

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Box,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { AxiosResponse } from 'axios';
import { useReactToPrint } from 'react-to-print';

import NotificationContext from '@/contexts/notification-context';

/** ---------------- Types ---------------- */
interface SelectedComponent {
  key: string;
  label: string;
}
interface ComponentSettings {
  width: number; // %
  height: number; // %
  top: number; // %
  left: number; // %
  fontSize: number; // arbitrary unit, mapped to mm below
  color: string; // hex w/o '#'
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

/** ---------------- Sizes ---------------- */
const labelSizes: LabelSize[] = [
  { value: '40x30mm', label: '40 x 30 mm', width: 40, height: 30 },
  { value: '50x40mm', label: '50 x 40 mm', width: 50, height: 40 },
  { value: '50x50mm', label: '50 x 50 mm', width: 50, height: 50 },
  { value: '50x30mm', label: '50 x 30 mm', width: 50, height: 30 },
];

/** ---------------- Components list ---------------- */
const defaultComponents: { label: string; key: string }[] = [
  { label: 'Tên sự kiện', key: 'eventName' },
  { label: 'Tên khách mời', key: 'customerName' },
  { label: 'Địa chỉ khách mời', key: 'customerAddress' },
  { label: 'Điện thoại khách mời', key: 'customerPhone' },
  { label: 'Email Khách mời', key: 'customerEmail' },
  { label: 'Danh sách vé', key: 'ticketsList' },
  { label: 'Mã Check-in', key: 'eCode' },
  { label: 'Ảnh QR', key: 'eCodeQr' },
  { label: 'Thời gian bắt đầu', key: 'startDateTime' },
  { label: 'Thời gian kết thúc', key: 'endDateTime' },
  { label: 'Địa điểm', key: 'place' },
];

/** ---------------- Default templates ---------------- */
const defaultTemplates: Record<
  string,
  {
    selectedComponents: string[];
    componentSettings: Record<string, ComponentSettings>;
  }
> = {
  '40x30mm': {
    selectedComponents: ['eventName', 'customerName', 'eCodeQr', 'eCode'],
    componentSettings: {
      eventName: { width: 50, height: 12, top: 5, left: 5, fontSize: 10, color: '000000' },
      customerName: { width: 50, height: 10, top: 18, left: 5, fontSize: 10, color: '000000' },
      eCodeQr: { width: 25, height: 25, top: 50, left: 70, fontSize: 10, color: '000000' },
      eCode: { width: 25, height: 8, top: 75, left: 70, fontSize: 6, color: '000000' },
    },
  },
  '50x40mm': {
    selectedComponents: ['eventName', 'customerName', 'place', 'eCodeQr', 'eCode'],
    componentSettings: {
      eventName: { width: 60, height: 12, top: 5, left: 5, fontSize: 12, color: '000000' },
      customerName: { width: 60, height: 10, top: 18, left: 5, fontSize: 9, color: '000000' },
      place: { width: 60, height: 8, top: 29, left: 5, fontSize: 7, color: '000000' },
      eCodeQr: { width: 25, height: 25, top: 45, left: 70, fontSize: 10, color: '000000' },
      eCode: { width: 25, height: 8, top: 70, left: 70, fontSize: 7, color: '000000' },
    },
  },
  '50x50mm': {
    selectedComponents: ['eventName', 'customerName', 'startDateTime', 'place', 'eCodeQr', 'eCode'],
    componentSettings: {
      eventName: { width: 60, height: 12, top: 5, left: 5, fontSize: 12, color: '000000' },
      customerName: { width: 60, height: 10, top: 18, left: 5, fontSize: 9, color: '000000' },
      startDateTime: { width: 60, height: 8, top: 29, left: 5, fontSize: 7, color: '000000' },
      place: { width: 60, height: 8, top: 38, left: 5, fontSize: 7, color: '000000' },
      eCodeQr: { width: 30, height: 30, top: 50, left: 65, fontSize: 10, color: '000000' },
      eCode: { width: 30, height: 8, top: 80, left: 65, fontSize: 7, color: '000000' },
    },
  },
  '50x30mm': {
    selectedComponents: ['eventName', 'customerName', 'eCodeQr', 'eCode'],
    componentSettings: {
      eventName: { width: 45, height: 12, top: 5, left: 5, fontSize: 11, color: '000000' },
      customerName: { width: 45, height: 10, top: 18, left: 5, fontSize: 10, color: '000000' },
      eCodeQr: { width: 25, height: 25, top: 50, left: 70, fontSize: 10, color: '000000' },
      eCode: { width: 25, height: 8, top: 75, left: 70, fontSize: 6, color: '000000' },
    },
  },
};

/** ---------------- Page ---------------- */
export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  useEffect(() => {
    document.title = 'Thiết kế tem nhãn | ETIK - Vé điện tử & Quản lý sự kiện';
  }, []);
  const { event_id } = params;
  const notificationCtx = useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedComponents, setSelectedComponents] = useState<Record<string, SelectedComponent>>({});
  const [componentSettings, setComponentSettings] = useState<Record<string, ComponentSettings>>({});
  const [selectedSize, setSelectedSize] = useState<string>('50x30mm');
  const [previewData, setPreviewData] = useState<Record<string, string>>({}); // print mode if non-empty
  const printAreaRef = useRef<HTMLDivElement>(null);
  const hasUserEditedRef = useRef(false);
  const triggerPrint = useReactToPrint({
    content: () => printAreaRef.current,
  });

  /** ---------- Fetch settings ---------- */
  useEffect(() => {
    let isCancelled = false;
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response: AxiosResponse<TicketTagSettings> = await baseHttpServiceInstance.get(
          `/event-studio/events/${event_id}/ticket-tag-settings`
        );
        if (response.status === 200 && !hasUserEditedRef.current && !isCancelled) {
          const { size, selectedComponents, componentSettings } = response.data;
          setSelectedSize(size || '50x30mm');
          setSelectedComponents(
            selectedComponents.reduce(
              (acc, c) => {
                acc[c.key] = c;
                return acc;
              },
              {} as Record<string, SelectedComponent>
            )
          );
          setComponentSettings(componentSettings);
        }
      } catch (error: any) {
        notificationCtx.error(`Lỗi khi tải cấu hình: ${error}`);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };
    fetchSettings();
    return () => {
      isCancelled = true;
    };
  }, [event_id, notificationCtx]);

  /** ---------- Save settings ---------- */
  const handleSaveTemplateSettings = async () => {
    try {
      setIsLoading(true);
      const payload = {
        size: selectedSize,
        selectedComponents: Object.values(selectedComponents),
        componentSettings,
      };
      const response: AxiosResponse = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/ticket-tag-settings`,
        payload
      );
      if (response.status === 200) notificationCtx.success('Cấu hình template đã được lưu thành công!');
    } catch (error: any) {
      notificationCtx.error(`Lỗi khi lưu cấu hình: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /** ---------- UI handlers ---------- */
  const handleCheckboxChange = (key: string, label: string) => {
    hasUserEditedRef.current = true;
    setSelectedComponents((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else {
        next[key] = { key, label };
        if (!componentSettings[key]) {
          setComponentSettings((ps) => ({
            ...ps,
            [key]: { width: 20, height: 10, top: 10, left: 10, fontSize: 10, color: '000000' },
          }));
        }
      }
      return next;
    });
  };
  const handleInputChange = (key: string, field: keyof ComponentSettings, value: number | string) => {
    hasUserEditedRef.current = true;
    setComponentSettings((ps) => ({ ...ps, [key]: { ...ps[key], [field]: value } as ComponentSettings }));
  };
  const applyDefaultTemplate = () => {
    hasUserEditedRef.current = true;
    const template = defaultTemplates[selectedSize];
    if (!template) return;
    const newSelected: Record<string, SelectedComponent> = {};
    template.selectedComponents.forEach((k) => {
      const comp = defaultComponents.find((c) => c.key === k);
      if (comp) newSelected[k] = { key: k, label: comp.label };
    });
    setSelectedComponents(newSelected);
    setComponentSettings({ ...template.componentSettings });
    notificationCtx.success('Đã áp dụng thiết kế mặc định!');
  };

  /** ---------- Test print ---------- */
  const handleTestPrint = () => {
    const mock: Record<string, string> = {
      eventName: 'Sự kiện ETIK',
      customerName: 'Nguyễn Văn A',
      customerAddress: '123 Đường ABC, Q1, TP.HCM',
      customerPhone: '0901234567',
      customerEmail: 'nguyenvana@example.com',
      ticketsList: 'Vé VIP - 2 vé',
      eCode: 'FMPJ8A',
      eCodeQr: 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=FMPJ8A',
      startDateTime: '15/01/2025 19:00',
      endDateTime: '15/01/2025 22:00',
      place: 'Trung tâm Hội nghị Quốc gia',
    };
    setPreviewData(mock);
    if (!triggerPrint) return;
    setTimeout(() => {
      triggerPrint(undefined);
    }, 100);
  };

  /** ---------- Print & Preview sizes ---------- */
  const PAPER_WIDTH_MM = 58; // driver POS-58: 58(48) x 210 mm
  const SAFE_CONTENT_WIDTH_MM = 48;

  const currentSize = useMemo(() => labelSizes.find((s) => s.value === selectedSize) || labelSizes[0], [selectedSize]);

  // helper: % -> mm theo label chọn
  const mmX = (percent: number) => (percent * currentSize.width) / 100;
  const mmY = (percent: number) => (percent * currentSize.height) / 100;

  // tính chiều cao nội dung thực (mm)
  const contentHeightMm = useMemo(() => {
    const maxBottom = Object.values(selectedComponents).reduce((mx, { key }) => {
      const s = componentSettings[key];
      if (!s) return mx;
      return Math.max(mx, mmY(s.top) + mmY(s.height));
    }, 0);
    return Math.max(maxBottom, currentSize.height);
  }, [selectedComponents, componentSettings, currentSize.height]);

  // rộng nội dung: không vượt quá vùng in hữu dụng
  const contentWidthMm = Math.min(currentSize.width, SAFE_CONTENT_WIDTH_MM);
  const sideMarginMm = Math.max((PAPER_WIDTH_MM - contentWidthMm) / 2, 0);

  /** ---------- PREVIEW: scale theo px (không ảnh hưởng in) ---------- */
  const PX_PER_MM = 96 / 25.4; // ~3.7795 px/mm
  const PREVIEW_MAX_WIDTH_PX = 520; // khung preview mong muốn
  const previewScale = Math.min(PREVIEW_MAX_WIDTH_PX / (contentWidthMm * PX_PER_MM), 1);
  const previewStageW = contentWidthMm * PX_PER_MM * previewScale;
  const previewStageH = contentHeightMm * PX_PER_MM * previewScale;

  const printCss = `
  @page { size: ${PAPER_WIDTH_MM}mm auto; margin: 0; }

  @media print {
    html, body {
      width: ${PAPER_WIDTH_MM}mm;
      margin: 0; padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body * { visibility: hidden !important; }
    .print-area, .print-area * { visibility: visible !important; }

    .print-area {
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      width: ${PAPER_WIDTH_MM}mm !important;
      height: auto !important;
      margin: 0 !important; padding: 0 !important;
      display: block !important;
      overflow: visible !important;
      page-break-inside: avoid;
    }

    /* căn GIỮA ngang bằng margin:auto; width theo mm thực */
    .print-canvas {
      width: ${Math.min(contentWidthMm, SAFE_CONTENT_WIDTH_MM)}mm !important;
      height: ${contentHeightMm}mm !important;
      margin: 0 auto !important;     /* <- CENTER */
      transform: none !important;     /* bỏ zoom preview khi in */
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      position: relative !important;
    }
  }
  `;

  return (
    <>
      {/* CSS in */}
      <style dangerouslySetInnerHTML={{ __html: printCss }} />

      <Grid container spacing={2}>
        {/* Column 1: Size selector and buttons */}
        <Grid item xs={12} md={3}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Chọn kích thước tem nhãn:
            </Typography>
            <Select
              value={selectedSize}
              onChange={(e) => {
                hasUserEditedRef.current = true;
                setSelectedSize(e.target.value);
              }}
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
            </Box>
          </Box>
        </Grid>

        {/* Column 2: Canvas Preview (tỉ lệ đúng, không ảnh hưởng in) */}
        <Grid item xs={12} md={5}>
          {/* Khung stage theo px, giữ đúng ratio bằng transform scale */}
          <div
            className="print-area"
            ref={printAreaRef}
            style={{
              position: 'relative',
              width: `${Math.round(previewStageW)}px`,
              height: `${Math.round(previewStageH)}px`,
              overflow: 'visible',
              display: 'block',
            }}
          >
            <Box
              className="print-canvas"
              sx={{
                // KÍCH THƯỚC THẬT theo mm (phục vụ in)
                width: `${contentWidthMm}mm`,
                height: `${contentHeightMm}mm`,
                marginLeft: `${sideMarginMm}mm`,
                marginRight: `${sideMarginMm}mm`,
                position: 'relative',

                // PREVIEW: scale xuống khung stage (màn hình)
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',

                // viền/đổ bóng CHỈ ở preview
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '2px solid #333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',

                '@media print': {
                  border: 'none',
                  boxShadow: 'none',
                  borderRadius: 0,
                },
              }}
            >
              {/* Layer chứa các thành phần */}
              <div style={{ position: 'absolute', inset: 0 }}>
                {Object.values(selectedComponents).map(({ key, label }) => {
                  const s = componentSettings[key];
                  if (!s) return null;

                  const isPrintMode = Object.keys(previewData).length > 0;
                  const displayText = isPrintMode ? previewData[key] || label : label;
                  const showBackground = !isPrintMode;

                  const styleBase: React.CSSProperties = {
                    position: 'absolute',
                    top: `${(s.top * currentSize.height) / 100}mm`,
                    left: `${(s.left * currentSize.width) / 100}mm`,
                    width: `${(s.width * currentSize.width) / 100}mm`,
                    height: `${(s.height * currentSize.height) / 100}mm`,
                    color: `#${s.color || '000000'}`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '1.5%',
                    boxSizing: 'border-box',
                    background: showBackground ? 'rgba(0,0,0,0.08)' : 'transparent',
                    fontSize: `${(s.fontSize || 10) / 3}mm`,
                  };

                  if (key === 'eCodeQr' && isPrintMode && previewData[key]) {
                    return (
                      <img
                        key={key}
                        src={previewData[key]}
                        alt="QR Code"
                        style={{ ...styleBase, objectFit: 'contain' }}
                        className="print-component"
                      />
                    );
                  }

                  return (
                    <div key={key} style={styleBase} className="print-component">
                      {displayText}
                    </div>
                  );
                })}
              </div>
            </Box>
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
                            <Checkbox
                              size="small"
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
                                '& .MuiInputBase-input, & .MuiOutlinedInput-input': {
                                  fontSize: 11,
                                  padding: 0,
                                  textAlign: 'center',
                                },
                                '& .MuiInputLabel-root': { fontSize: 11 },
                                '& input[type=number]': { MozAppearance: 'textfield' },
                                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                                  { WebkitAppearance: 'none', margin: 0 },
                              }}
                              label="W%"
                              type="number"
                              value={componentSettings[key]?.width || ''}
                              onChange={(e) => handleInputChange(key, 'width', Number(e.target.value))}
                              size="small"
                            />
                            <TextField
                              sx={{
                                width: '64px',
                                '& .MuiInputBase-input, & .MuiOutlinedInput-input': {
                                  fontSize: 11,
                                  padding: 0,
                                  textAlign: 'center',
                                },
                                '& .MuiInputLabel-root': { fontSize: 11 },
                                '& input[type=number]': { MozAppearance: 'textfield' },
                                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                                  { WebkitAppearance: 'none', margin: 0 },
                              }}
                              label="H%"
                              type="number"
                              value={componentSettings[key]?.height || ''}
                              onChange={(e) => handleInputChange(key, 'height', Number(e.target.value))}
                              size="small"
                            />
                            <TextField
                              sx={{
                                width: '64px',
                                '& .MuiInputBase-input, & .MuiOutlinedInput-input': {
                                  fontSize: 11,
                                  padding: 0,
                                  textAlign: 'center',
                                },
                                '& .MuiInputLabel-root': { fontSize: 11 },
                                '& input[type=number]': { MozAppearance: 'textfield' },
                                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                                  { WebkitAppearance: 'none', margin: 0 },
                              }}
                              label="Top%"
                              type="number"
                              value={componentSettings[key]?.top || ''}
                              onChange={(e) => handleInputChange(key, 'top', Number(e.target.value))}
                              size="small"
                            />
                            <TextField
                              sx={{
                                width: '64px',
                                '& .MuiInputBase-input, & .MuiOutlinedInput-input': {
                                  fontSize: 11,
                                  padding: 0,
                                  textAlign: 'center',
                                },
                                '& .MuiInputLabel-root': { fontSize: 11 },
                                '& input[type=number]': { MozAppearance: 'textfield' },
                                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                                  { WebkitAppearance: 'none', margin: 0 },
                              }}
                              label="Left%"
                              type="number"
                              value={componentSettings[key]?.left || ''}
                              onChange={(e) => handleInputChange(key, 'left', Number(e.target.value))}
                              size="small"
                            />
                            <TextField
                              sx={{
                                width: '64px',
                                '& .MuiInputBase-input, & .MuiOutlinedInput-input': {
                                  fontSize: 11,
                                  padding: 0,
                                  textAlign: 'center',
                                },
                                '& .MuiInputLabel-root': { fontSize: 11 },
                                '& input[type=number]': { MozAppearance: 'textfield' },
                                '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
                                  { WebkitAppearance: 'none', margin: 0 },
                              }}
                              label="Font"
                              type="number"
                              value={componentSettings[key]?.fontSize || ''}
                              onChange={(e) => handleInputChange(key, 'fontSize', Number(e.target.value))}
                              size="small"
                            />
                            <TextField
                              sx={{
                                width: '72px',
                                '& .MuiInputBase-input, & .MuiOutlinedInput-input': {
                                  fontSize: 11,
                                  padding: 0,
                                  textAlign: 'center',
                                },
                                '& .MuiInputLabel-root': { fontSize: 11 },
                              }}
                              label="Color"
                              type="text"
                              value={componentSettings[key]?.color || ''}
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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
              <Button variant="outlined" color="primary" onClick={handleTestPrint} disabled={isLoading}>
                In thử
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveTemplateSettings} disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu thiết kế'}
              </Button>
            </div>
          </Stack>
        </Grid>
      </Grid>

      {isLoading && <div className="absolute text-white text-lg bg-black/60 px-4 py-2 rounded-md">Loading...</div>}
    </>
  );
}
