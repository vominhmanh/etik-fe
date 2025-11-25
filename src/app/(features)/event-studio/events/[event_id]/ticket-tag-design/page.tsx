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
import { useTranslation } from '@/contexts/locale-context';

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
  { value: '81x64mm', label: '81 x 64 mm', width: 81, height: 64 },
];

/** ---------------- Components list ---------------- */
const getDefaultComponents = (tt: (vi: string, en: string) => string): { label: string; key: string }[] => [
  { label: tt('Tên sự kiện', 'Event Name'), key: 'eventName' },
  { label: tt('Danh sách vé', 'Tickets List'), key: 'ticketsList' },
  { label: tt('Mã Check-in', 'Check-in Code'), key: 'eCode' },
  { label: tt('Ảnh QR', 'QR Image'), key: 'eCodeQr' },
  { label: tt('Thời gian bắt đầu', 'Start Date Time'), key: 'startDateTime' },
  { label: tt('Thời gian kết thúc', 'End Date Time'), key: 'endDateTime' },
  { label: tt('Địa điểm', 'Place'), key: 'place' },
  
  { label: tt('Tên khách mời', 'Customer Name'), key: 'customerName' },
  { label: tt('Địa chỉ khách mời', 'Customer Address'), key: 'customerAddress' },
  { label: tt('Điện thoại khách mời', 'Customer Phone'), key: 'customerPhone' },
  { label: tt('Email Khách mời', 'Customer Email'), key: 'customerEmail' },
];

const getDefaultComponentLabels = (tt: (vi: string, en: string) => string): Record<string, string> => {
  return getDefaultComponents(tt).reduce<Record<string, string>>((acc, comp) => {
    acc[comp.key] = comp.label;
    return acc;
  }, {});
};

const DEFAULT_TEMPLATE_SIZE = '50x50mm';

const cloneComponentSettings = (settings: Record<string, ComponentSettings>) =>
  Object.fromEntries(Object.entries(settings).map(([key, value]) => [key, { ...value }]));

const buildSelectedComponentMap = (keys: string[], tt: (vi: string, en: string) => string) =>
  keys.reduce<Record<string, SelectedComponent>>((acc, key) => {
    const labels = getDefaultComponentLabels(tt);
    acc[key] = { key, label: labels[key] || key };
    return acc;
  }, {});

/** ---------------- Default templates ---------------- */
const defaultTemplates: Record<
  string,
  {
    selectedComponents: string[];
    componentSettings: Record<string, ComponentSettings>;
  }
> = {
  '40x30mm': {
    selectedComponents: ['customerName', 'eCodeQr', 'eCode', 'eventName'],
    componentSettings: {
      eventName: { width: 100, height: 12, top: 1, left: 0, fontSize: 8, color: '000000' },
      customerName: { width: 100, height: 15, top: 18, left: 0, fontSize: 11, color: '000000' },
      startDateTime: { width: 60, height: 8, top: 29, left: 5, fontSize: 7, color: '000000' },
      place: { width: 60, height: 8, top: 38, left: 5, fontSize: 7, color: '000000' },
      eCodeQr: { width: 30, height: 30, top: 50, left: 60, fontSize: 10, color: '000000' },
      eCode: { width: 30, height: 8, top: 80, left: 60, fontSize: 7, color: '000000' },
    },
  },
  '50x40mm': {
    selectedComponents: ['customerName', 'eCodeQr', 'eCode', 'eventName'],
    componentSettings: {
      eventName: { width: 100, height: 12, top: 1, left: 0, fontSize: 8, color: '000000' },
      customerName: { width: 100, height: 15, top: 18, left: 0, fontSize: 11, color: '000000' },
      startDateTime: { width: 60, height: 8, top: 29, left: 5, fontSize: 7, color: '000000' },
      place: { width: 60, height: 8, top: 38, left: 5, fontSize: 7, color: '000000' },
      eCodeQr: { width: 30, height: 30, top: 50, left: 60, fontSize: 10, color: '000000' },
      eCode: { width: 30, height: 8, top: 80, left: 60, fontSize: 7, color: '000000' },
    },
  },
  '50x50mm': {
    selectedComponents: ['customerName', 'eCodeQr', 'eCode', 'eventName'],
    componentSettings: {
      eventName: { width: 100, height: 12, top: 1, left: 0, fontSize: 8, color: '000000' },
      customerName: { width: 100, height: 15, top: 18, left: 0, fontSize: 11, color: '000000' },
      startDateTime: { width: 60, height: 8, top: 29, left: 5, fontSize: 7, color: '000000' },
      place: { width: 60, height: 8, top: 38, left: 5, fontSize: 7, color: '000000' },
      eCodeQr: { width: 30, height: 30, top: 50, left: 60, fontSize: 10, color: '000000' },
      eCode: { width: 30, height: 8, top: 80, left: 60, fontSize: 7, color: '000000' },
    },
  },
  '50x30mm': {
    selectedComponents: ['customerName', 'eCodeQr', 'eCode', 'eventName'],
    componentSettings: {
      eventName: { width: 100, height: 12, top: 1, left: 0, fontSize: 8, color: '000000' },
      customerName: { width: 100, height: 15, top: 18, left: 0, fontSize: 11, color: '000000' },
      startDateTime: { width: 60, height: 8, top: 29, left: 5, fontSize: 7, color: '000000' },
      place: { width: 60, height: 8, top: 38, left: 5, fontSize: 7, color: '000000' },
      eCodeQr: { width: 30, height: 30, top: 50, left: 60, fontSize: 10, color: '000000' },
      eCode: { width: 30, height: 8, top: 80, left: 60, fontSize: 7, color: '000000' },
    },
  },
};

/** ---------------- Page ---------------- */
export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt } = useTranslation();
  useEffect(() => {
    document.title = tt('Thiết kế tem nhãn | ETIK - Vé điện tử & Quản lý sự kiện', 'Tag Design | ETIK - E-tickets & Event Management');
  }, [tt]);
  const { event_id } = params;
  const notificationCtx = useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState(false);

  const defaultTemplate = defaultTemplates[DEFAULT_TEMPLATE_SIZE];
  const [selectedComponents, setSelectedComponents] = useState<Record<string, SelectedComponent>>(() =>
    buildSelectedComponentMap(defaultTemplate.selectedComponents, tt)
  );
  const [componentSettings, setComponentSettings] = useState<Record<string, ComponentSettings>>(() =>
    cloneComponentSettings(defaultTemplate.componentSettings)
  );
  const [selectedSize, setSelectedSize] = useState<string>(DEFAULT_TEMPLATE_SIZE);
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
          const { size, selectedComponents: apiSelected, componentSettings: apiSettings } = response.data;
          const effectiveSize = size || DEFAULT_TEMPLATE_SIZE;
          const hasValidApiConfig =
            Array.isArray(apiSelected) &&
            apiSelected.length > 0 &&
            apiSettings &&
            Object.keys(apiSettings).length > 0;

          if (hasValidApiConfig) {
            const labels = getDefaultComponentLabels(tt);
            setSelectedSize(effectiveSize);
            setSelectedComponents(
              apiSelected.reduce((acc, c) => {
                acc[c.key] = { key: c.key, label: c.label || labels[c.key] || c.key };
                return acc;
              }, {} as Record<string, SelectedComponent>)
            );
            setComponentSettings(cloneComponentSettings(apiSettings));
          } else {
            const fallbackTemplate = defaultTemplates[effectiveSize] || defaultTemplates[DEFAULT_TEMPLATE_SIZE];
            setSelectedSize(effectiveSize);
            setSelectedComponents(buildSelectedComponentMap(fallbackTemplate.selectedComponents, tt));
            setComponentSettings(cloneComponentSettings(fallbackTemplate.componentSettings));
          }
        }
      } catch (error: any) {
        const fallbackTemplate = defaultTemplates[DEFAULT_TEMPLATE_SIZE];
        setSelectedSize(DEFAULT_TEMPLATE_SIZE);
        setSelectedComponents(buildSelectedComponentMap(fallbackTemplate.selectedComponents, tt));
        setComponentSettings(cloneComponentSettings(fallbackTemplate.componentSettings));
        notificationCtx.warning(tt(`Không thể tải cấu hình, sử dụng mặc định.`, `Unable to load configuration, using default.`) + ` ${error}`);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };
    fetchSettings();
    return () => {
      isCancelled = true;
    };
  }, [event_id, notificationCtx, tt]);

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
      if (response.status === 200) notificationCtx.success(tt('Cấu hình template đã được lưu thành công!', 'Template configuration saved successfully!'));
    } catch (error: any) {
      notificationCtx.error(tt(`Lỗi khi lưu cấu hình:`, `Error saving configuration:`) + ` ${error.message}`);
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
    const template = defaultTemplates[selectedSize] || defaultTemplates[DEFAULT_TEMPLATE_SIZE];
    if (!template) return;
    setSelectedComponents(buildSelectedComponentMap(template.selectedComponents, tt));
    setComponentSettings(cloneComponentSettings(template.componentSettings));
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
      eCodeQr: 'https://api.qrserver.com/v1/create-qr-code/?margin=16&size=140x140&data=FMPJ8A',
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
  const DEFAULT_PAPER_WIDTH_MM = 58; // driver POS-58: 58(48) x 210 mm
  const DEFAULT_SAFE_CONTENT_WIDTH_MM = 48;

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

  // rộng nội dung: sử dụng width của label trực tiếp
  // Nếu label width lớn hơn paper width mặc định, sử dụng label width làm paper width
  const contentWidthMm = currentSize.width;
  const paperWidthMm = Math.max(DEFAULT_PAPER_WIDTH_MM, contentWidthMm);
  const sideMarginMm = Math.max((paperWidthMm - contentWidthMm) / 2, 0);

  /** ---------- PREVIEW: scale theo px (không ảnh hưởng in) ---------- */
  const PX_PER_MM = 96 / 25.4; // ~3.7795 px/mm
  const PREVIEW_MAX_WIDTH_PX = 520; // khung preview mong muốn
  const previewScale = Math.min(PREVIEW_MAX_WIDTH_PX / (contentWidthMm * PX_PER_MM), 1);
  const previewStageW = contentWidthMm * PX_PER_MM * previewScale;
  const previewStageH = contentHeightMm * PX_PER_MM * previewScale;

  const printCss = `
  @page { size: ${contentWidthMm}mm auto; margin: 0; }

  @media print {
    html, body {
      width: ${contentWidthMm}mm;
      margin: 0; padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body * { visibility: hidden !important; }
    .print-area, .print-area * { visibility: visible !important; }

    .print-area {
      position: fixed !important;
      top: 0 !important; left: 0 !important;
      width: ${contentWidthMm}mm !important;
      height: auto !important;
      margin: 0 !important; padding: 0 !important;
      display: block !important;
      overflow: visible !important;
      page-break-inside: avoid;
    }

    /* căn GIỮA ngang bằng margin:auto; width theo mm thực */
    .print-canvas {
      width: ${Math.min(contentWidthMm, contentWidthMm)}mm !important;
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
              {tt("Chọn kích thước tem nhãn:", "Select tag size:")}
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
                {tt("Sử dụng thiết kế mặc định", "Use default design")}
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
              <CardHeader title={tt("Chọn thành phần", "Select Components")} titleTypographyProps={{ variant: 'subtitle2' }} />
              <Divider />
              <List dense>
                {getDefaultComponents(tt).map(({ label, key }) => (
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
                  {tt("Quay lại thiết kế", "Back to Design")}
                </Button>
              )}
              <Button variant="outlined" color="primary" onClick={handleTestPrint} disabled={isLoading}>
                {tt("In thử", "Test Print")}
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveTemplateSettings} disabled={isLoading}>
                {isLoading ? tt('Đang lưu...', 'Saving...') : tt('Lưu thiết kế', 'Save Design')}
              </Button>
            </div>
          </Stack>
        </Grid>
      </Grid>

      {isLoading && <div className="absolute text-white text-lg bg-black/60 px-4 py-2 rounded-md">Loading...</div>}
    </>
  );
}
