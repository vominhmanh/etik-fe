'use client';

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
  Box,
  Button,
  Card,
  CardHeader,
  Divider,
  FormControl,
  FormControlLabel,
  Checkbox,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';

/** ---------------- Types ---------------- */
interface LabelSize {
  value: string;
  label: string;
  width: number;
  height: number;
}

interface ComponentData {
  id: string;
  key: string;
  label: string;
  x: number; // px position
  y: number; // px position
  width: number; // px
  height: number; // px
  fontSize: number; // px
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string; // hex without #
  backgroundColor: string; // hex without #, empty for transparent
  textAlign: 'left' | 'center' | 'right';
  customText?: string; // For custom text component
  imageUrl?: string; // For image component
  zIndex?: number; // Layering order
  includeTitle?: boolean; // For builtin name key: include title (Mr./Ms.) in display
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

interface TicketTagSettings {
  name?: string;
  size: string;
  customSize?: { width: number; height: number } | null;
  components: ComponentData[];
}

interface VisibleFieldOption {
  id?: number;
  value: string;
  label: string;
}

interface VisibleField {
  id?: number;
  internal_name?: string;
  label: string;
  field_type: string;
  builtin_key?: string | null;
  options?: VisibleFieldOption[] | null;
}

/** ---------------- Default Sizes ---------------- */
const defaultLabelSizes: LabelSize[] = [
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
  { label: tt('Tên show diễn ra', 'Show Name'), key: 'showName' },
  { label: tt('Loại vé', 'Ticket Category'), key: 'ticketCategory' },
  // Ticket Holder specific (per-ticket fields)
  { label: tt('Tên người sở hữu vé', 'Ticket Holder Name'), key: 'ticketHolderName' },
  { label: tt('Email người sở hữu vé', 'Ticket Holder Email'), key: 'ticketHolderEmail' },
  { label: tt('SĐT người sở hữu vé', 'Ticket Holder Phone'), key: 'ticketHolderPhone' },
  { label: tt('Ảnh', 'Image'), key: 'image' },
  { label: tt('Text tùy chọn', 'Custom Text'), key: 'customText' },
  { label: tt('ID đơn hàng', 'Transaction ID'), key: 'transactionId' },
  { label: tt('TID vé', 'Ticket TID'), key: 'ticketTid' },
];

const PX_PER_MM = 96 / 25.4; // ~3.7795 px/mm
const CANVAS_SCALE = 2; // Scale factor for easier design (2x = 2mm per pixel)
const MAX_CANVAS_WIDTH = 600; // Max canvas width in pixels
const MAX_CANVAS_HEIGHT = 500; // Max canvas height in pixels

/** ---------------- Default Templates ---------------- */
const getDefaultTemplates = (tt: (vi: string, en: string) => string, canvasWidthPx: number, canvasHeightPx: number): Array<{ name: string; components: ComponentData[] }> => {
  const templates: Array<{ name: string; components: ComponentData[] }> = [
    {
      name: tt('Template 1: Cơ bản', 'Template 1: Basic'),
      components: [
        {
          id: 'eventName-1',
          key: 'eventName',
          label: tt('Tên sự kiện', 'Event Name'),
          x: canvasWidthPx * 0.1,
          y: canvasHeightPx * 0.05,
          width: canvasWidthPx * 0.8,
          height: canvasHeightPx * 0.15,
          fontSize: 14,
          fontFamily: 'Arial',
          fontWeight: 'bold' as const,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          color: '000000',
          backgroundColor: '',
          textAlign: 'center' as const,
        },
        {
          id: 'name-1',
          key: 'name',
          label: tt('Họ tên', 'Full Name'),
          x: canvasWidthPx * 0.1,
          y: canvasHeightPx * 0.25,
          width: canvasWidthPx * 0.8,
          height: canvasHeightPx * 0.15,
          fontSize: 12,
          fontFamily: 'Arial',
          fontWeight: 'normal' as const,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          color: '000000',
          backgroundColor: '',
          textAlign: 'left' as const,
          includeTitle: true,
        },
        {
          id: 'eCodeQr-1',
          key: 'eCodeQr',
          label: tt('Ảnh QR', 'QR Image'),
          x: canvasWidthPx * 0.6,
          y: canvasHeightPx * 0.45,
          width: canvasWidthPx * 0.3,
          height: canvasWidthPx * 0.3,
          fontSize: 10,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '000000',
          backgroundColor: '',
          textAlign: 'center',
        },
        {
          id: 'eCode-1',
          key: 'eCode',
          label: tt('Mã Check-in', 'Check-in Code'),
          x: canvasWidthPx * 0.6,
          y: canvasHeightPx * 0.8,
          width: canvasWidthPx * 0.3,
          height: canvasHeightPx * 0.1,
          fontSize: 10,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '000000',
          backgroundColor: '',
          textAlign: 'center',
        },
      ],
    },
    {
      name: tt('Template 2: Đầy đủ', 'Template 2: Full'),
      components: [
        {
          id: 'eventName-2',
          key: 'eventName',
          label: tt('Tên sự kiện', 'Event Name'),
          x: canvasWidthPx * 0.05,
          y: canvasHeightPx * 0.02,
          width: canvasWidthPx * 0.9,
          height: canvasHeightPx * 0.12,
          fontSize: 13,
          fontFamily: 'Arial',
          fontWeight: 'bold' as const,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          color: '000000',
          backgroundColor: '',
          textAlign: 'center' as const,
        },
        {
          id: 'name-2',
          key: 'name',
          label: tt('Họ tên', 'Full Name'),
          x: canvasWidthPx * 0.05,
          y: canvasHeightPx * 0.16,
          width: canvasWidthPx * 0.5,
          height: canvasHeightPx * 0.12,
          fontSize: 11,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '000000',
          backgroundColor: '',
          textAlign: 'left',
          includeTitle: true,
        },
        {
          id: 'startDateTime-2',
          key: 'startDateTime',
          label: tt('Thời gian bắt đầu', 'Start Date Time'),
          x: canvasWidthPx * 0.05,
          y: canvasHeightPx * 0.3,
          width: canvasWidthPx * 0.5,
          height: canvasHeightPx * 0.08,
          fontSize: 9,
          fontFamily: 'Arial',
          fontWeight: 'normal' as const,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          color: '000000',
          backgroundColor: '',
          textAlign: 'left' as const,
        },
        {
          id: 'place-2',
          key: 'place',
          label: tt('Địa điểm', 'Place'),
          x: canvasWidthPx * 0.05,
          y: canvasHeightPx * 0.4,
          width: canvasWidthPx * 0.5,
          height: canvasHeightPx * 0.08,
          fontSize: 9,
          fontFamily: 'Arial',
          fontWeight: 'normal' as const,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          color: '000000',
          backgroundColor: '',
          textAlign: 'left' as const,
        },
        {
          id: 'eCodeQr-2',
          key: 'eCodeQr',
          label: tt('Ảnh QR', 'QR Image'),
          x: canvasWidthPx * 0.6,
          y: canvasHeightPx * 0.16,
          width: canvasWidthPx * 0.35,
          height: canvasWidthPx * 0.35,
          fontSize: 10,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '000000',
          backgroundColor: '',
          textAlign: 'center',
        },
        {
          id: 'eCode-2',
          key: 'eCode',
          label: tt('Mã Check-in', 'Check-in Code'),
          x: canvasWidthPx * 0.6,
          y: canvasHeightPx * 0.55,
          width: canvasWidthPx * 0.35,
          height: canvasHeightPx * 0.08,
          fontSize: 9,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '000000',
          backgroundColor: '',
          textAlign: 'center',
        },
      ],
    },
    {
      name: tt('Template 3: QR lớn', 'Template 3: Large QR'),
      components: [
        {
          id: 'eventName-3',
          key: 'eventName',
          label: tt('Tên sự kiện', 'Event Name'),
          x: canvasWidthPx * 0.1,
          y: canvasHeightPx * 0.05,
          width: canvasWidthPx * 0.8,
          height: canvasHeightPx * 0.12,
          fontSize: 12,
          fontFamily: 'Arial',
          fontWeight: 'bold' as const,
          fontStyle: 'normal' as const,
          textDecoration: 'none' as const,
          color: '000000',
          backgroundColor: '',
          textAlign: 'center' as const,
        },
        {
          id: 'eCodeQr-3',
          key: 'eCodeQr',
          label: tt('Ảnh QR', 'QR Image'),
          x: canvasWidthPx * 0.25,
          y: canvasHeightPx * 0.2,
          width: canvasWidthPx * 0.5,
          height: canvasWidthPx * 0.5,
          fontSize: 10,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '000000',
          backgroundColor: '',
          textAlign: 'center',
        },
        {
          id: 'name-3',
          key: 'name',
          label: tt('Họ tên', 'Full Name'),
          x: canvasWidthPx * 0.1,
          y: canvasHeightPx * 0.75,
          width: canvasWidthPx * 0.8,
          height: canvasHeightPx * 0.1,
          fontSize: 11,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '000000',
          backgroundColor: '',
          textAlign: 'center',
          includeTitle: true,
        },
        {
          id: 'eCode-3',
          key: 'eCode',
          label: tt('Mã Check-in', 'Check-in Code'),
          x: canvasWidthPx * 0.1,
          y: canvasHeightPx * 0.88,
          width: canvasWidthPx * 0.8,
          height: canvasHeightPx * 0.08,
          fontSize: 9,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '000000',
          backgroundColor: '',
          textAlign: 'center',
        },
      ],
    },
  ];
  return templates;
};

/** ---------------- Page ---------------- */
export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt, locale } = useTranslation();
  const router = useRouter();
  useEffect(() => {
    document.title = tt('Tạo thiết kế tem nhãn mới | ETIK - Vé điện tử & Quản lý sự kiện', 'Create New Tag Design | ETIK - E-tickets & Event Management');
  }, [tt]);
  const { event_id } = params;
  const notificationCtx = useContext(NotificationContext);
  const [isLoading, setIsLoading] = useState(false);

  // Design name state
  const [designName, setDesignName] = useState<string>('');

  // Label size state
  const [selectedSize, setSelectedSize] = useState<string>('50x50mm');
  const [customSize, setCustomSize] = useState<{ width: number; height: number } | null>(null);
  const [showCustomSize, setShowCustomSize] = useState(false);

  // Components state
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [visibleFields, setVisibleFields] = useState<VisibleField[]>([]);

  // Canvas refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const hasUserEditedRef = useRef(false);
  const triggerPrint = useReactToPrint({
    content: () => printAreaRef.current,
  });

  // Calculate current label size
  const currentLabelSize = useMemo(() => {
    if (showCustomSize && customSize) {
      return customSize;
    }
    const size = defaultLabelSizes.find((s) => s.value === selectedSize);
    return size ? { width: size.width, height: size.height } : { width: 50, height: 50 };
  }, [selectedSize, customSize, showCustomSize]);

  // Canvas dimensions in mm
  const canvasWidthMm = currentLabelSize.width;
  const canvasHeightMm = currentLabelSize.height;
  
  // Canvas dimensions in pixels (for display, scaled for easier design)
  const rawCanvasWidthPx = useMemo(() => (canvasWidthMm * PX_PER_MM * CANVAS_SCALE), [canvasWidthMm]);
  const rawCanvasHeightPx = useMemo(() => (canvasHeightMm * PX_PER_MM * CANVAS_SCALE), [canvasHeightMm]);
  
  // Auto-scale to fit container
  const canvasScale = useMemo(() => {
    const scaleX = MAX_CANVAS_WIDTH / rawCanvasWidthPx;
    const scaleY = MAX_CANVAS_HEIGHT / rawCanvasHeightPx;
    return Math.min(1, scaleX, scaleY); // Don't scale up, only down
  }, [rawCanvasWidthPx, rawCanvasHeightPx]);
  
  const canvasWidthPx = rawCanvasWidthPx * canvasScale;
  const canvasHeightPx = rawCanvasHeightPx * canvasScale;
  
  // Helper functions to convert between mm and px
  const mmToPx = (mm: number) => mm * PX_PER_MM * CANVAS_SCALE * canvasScale;
  const pxToMm = (px: number) => px / (PX_PER_MM * CANVAS_SCALE * canvasScale);

  // Map API visible field to component key
  const mapFieldToComponentKey = (f: VisibleField): string => {
    switch (f.builtin_key) {
      case 'name':
        return 'name';
      case 'email':
        return 'email';
      case 'phone_number':
        return 'phone';
      case 'dob':
        return 'dob';
      case 'address':
        return 'address';
      case 'idcard_number':
        return 'idcard_number';
      default:
        // Prefer internal_name when available; append id for stability/uniqueness
        if (f.internal_name && f.internal_name.trim().length > 0) {
          return `form_${f.internal_name}${f.id ? `_${f.id}` : ''}`;
        }
        if (typeof f.id === 'number') {
          return `form_field_${f.id}`;
        }
        const safeLabel = (f.label || 'field')
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '');
        return `form_${safeLabel}`;
    }
  };

  // Fetch visible fields for dynamic components
  useEffect(() => {
    async function fetchVisible() {
      try {
        const res = await baseHttpServiceInstance.get(`/event-studio/events/${event_id}/ticket-tag-designs/visible-fields`);
        setVisibleFields(res.data?.fields || []);
      } catch (error: any) {
        notificationCtx.error(tt('Lỗi tải danh sách fields hiển thị:', 'Failed to load visible fields:') + ` ${error.message}`);
      }
    }
    fetchVisible();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event_id]);

  const getBuiltinLabelForKey = (key: string): string | null => {
    // Force language by current locale to avoid stale memoization in tt
    const vi = {
      name: 'Họ tên',
      email: 'Email',
      phone: 'Số điện thoại',
      dob: 'Ngày sinh',
      address: 'Địa chỉ',
      idcard_number: 'CMND/CCCD',
    } as const;
    const en = {
      name: 'Full Name',
      email: 'Email',
      phone: 'Phone Number',
      dob: 'Date of Birth',
      address: 'Address',
      idcard_number: 'ID Card Number',
    } as const;
    const dict = locale === 'en' ? en : vi;
    return (dict as any)[key] || null;
  };

  // Component list combining static + dynamic fields
  const componentList = useMemo(() => {
    const staticList = getDefaultComponents(tt);
    const dynamicList = visibleFields.map((f) => {
      const key = mapFieldToComponentKey(f);
      const builtinLabel = getBuiltinLabelForKey(key);
      return {
        label: builtinLabel || f.label,
        key,
      };
    });
    return [...staticList, ...dynamicList];
  }, [tt, visibleFields, locale]);

  // Handle size change
  const handleSizeChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomSize(true);
      if (!customSize) {
        setCustomSize({ width: 50, height: 50 });
      }
    } else {
      setShowCustomSize(false);
      setSelectedSize(value);
      hasUserEditedRef.current = true;
    }
  };

  // Handle custom size input
  const handleCustomSizeChange = (field: 'width' | 'height', value: number) => {
    setCustomSize((prev) => {
      const newSize = { ...(prev || { width: 50, height: 50 }), [field]: value };
      hasUserEditedRef.current = true;
      return newSize;
    });
  };

  // Add component from list
  const handleAddComponent = (key: string, label: string) => {
    const newComponent: ComponentData = {
      id: `${key}-${Date.now()}`,
      key,
      label,
      x: 10, // px
      y: 10, // px
      width: key === 'image' ? 100 : 100, // px
      height: key === 'image' ? 100 : 30, // px
      fontSize: 12, // px
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '000000',
      backgroundColor: '',
      textAlign: 'left',
      zIndex: 1,
      verticalAlign: 'middle',
      ...(key === 'customText' ? { customText: tt('Nhập text của bạn', 'Enter your text') } : {}),
      ...(key === 'image' ? { imageUrl: '' } : {}),
      ...(key === 'name' ? { includeTitle: true } : {}),
      ...(key === 'ticketHolderName' ? { includeTitle: true } : {}),
    };
    setComponents((prev) => [...prev, newComponent]);
    setSelectedComponentId(newComponent.id);
    hasUserEditedRef.current = true;
  };

  // Handle drag
  const handleDrag = (id: string, e: DraggableEvent, data: DraggableData) => {
    setComponents((prev) =>
      prev.map((comp) => {
        if (comp.id === id) {
          const newX = Math.max(0, Math.min(canvasWidthPx - comp.width, comp.x + data.x));
          const newY = Math.max(0, Math.min(canvasHeightPx - comp.height, comp.y + data.y));
          return { ...comp, x: newX, y: newY };
        }
        return comp;
      })
    );
    hasUserEditedRef.current = true;
  };

  // Handle resize
  const handleResize = (id: string, e: React.SyntheticEvent, data: ResizeCallbackData) => {
    setComponents((prev) =>
      prev.map((comp) => {
        if (comp.id === id) {
          const newWidth = Math.max(20, data.size.width); // min 20px
          const newHeight = Math.max(20, data.size.height); // min 20px
          return {
            ...comp,
            width: newWidth,
            height: newHeight,
          };
        }
        return comp;
      })
    );
    hasUserEditedRef.current = true;
  };

  // Upload image for Image component
  const handleUploadImageForComponent = async (file: File, componentId: string) => {
    try {
      const presignedResponse = await baseHttpServiceInstance.post('/common/s3/generate_presigned_url', {
        filename: file.name,
        content_type: file.type,
      });
      const { presignedUrl, fileUrl } = presignedResponse.data as { presignedUrl: string; fileUrl: string };

      await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      updateComponentProperty(componentId, 'imageUrl', fileUrl);
      // keep snake_case for visibility/back-compat in state
      updateComponentProperty(componentId, 'image_url' as any, fileUrl);
      // persist in schema-supported field so backend stores it
      updateComponentProperty(componentId, 'customText', fileUrl);
      notificationCtx.success(tt('Tải ảnh thành công', 'Image uploaded successfully'));
    } catch (error: any) {
      notificationCtx.error(tt('Lỗi tải ảnh:', 'Image upload error:') + ` ${error.message}`);
    }
  };

  // Update component property
  const updateComponentProperty = (id: string, property: keyof ComponentData | 'image_url', value: any) => {
    setComponents((prev) =>
      prev.map((comp) => (comp.id === id ? { ...comp, [property]: value } : comp))
    );
    hasUserEditedRef.current = true;
  };

  // Delete component
  const handleDeleteComponent = (id: string) => {
    setComponents((prev) => prev.filter((comp) => comp.id !== id));
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
    hasUserEditedRef.current = true;
  };

  // Load template
  const handleLoadTemplate = (templateIndex: number) => {
    const templates = getDefaultTemplates(tt, canvasWidthPx, canvasHeightPx);
    if (templates[templateIndex]) {
      const template = templates[templateIndex];
      // Generate new IDs for components to avoid conflicts
      const newComponents = template.components.map((comp) => ({
        ...comp,
        id: `${comp.key}-${Date.now()}-${Math.random()}`,
      }));
      setComponents(newComponents);
      setSelectedComponentId(null);
      hasUserEditedRef.current = true;
      notificationCtx.success(tt(`Đã tải template: ${template.name}`, `Template loaded: ${template.name}`));
    }
  };

  // Get selected component
  const selectedComponent = useMemo(
    () => components.find((c) => c.id === selectedComponentId) || null,
    [components, selectedComponentId]
  );

  // No fetch settings for create page - start with empty design

  /** ---------- Create new design ---------- */
  const handleSaveTemplateSettings = async () => {
    try {
      setIsLoading(true);
      // include image_url for backend compatibility
      const payloadComponents = components.map((c) =>
        c.key === 'image'
          ? ({ ...c, image_url: (c as any).imageUrl ?? (c as any).image_url ?? '' } as any)
          : c
      );
      const payload: TicketTagSettings = {
        name: designName || tt('Thiết kế mới', 'New Design'),
        size: showCustomSize ? 'custom' : selectedSize,
        customSize: showCustomSize && customSize ? customSize : undefined,
        components: payloadComponents as any,
      };
      const response: AxiosResponse<{ id: number }> = await baseHttpServiceInstance.post(
        `/event-studio/events/${event_id}/ticket-tag-designs`,
        payload
      );
      if (response.status === 200 || response.status === 201) {
        const newDesignId = response.data?.id;
        notificationCtx.success(tt('Thiết kế đã được tạo thành công!', 'Design created successfully!'));
        // Redirect to edit page with new ID
        if (newDesignId) {
          router.push(`/event-studio/events/${event_id}/ticket-tag-designs/${newDesignId}`);
        } else {
          // Fallback: redirect to list page
          router.push(`/event-studio/events/${event_id}/ticket-tag-designs`);
        }
      }
    } catch (error: any) {
      notificationCtx.error(tt(`Lỗi khi tạo thiết kế:`, `Error creating design:`) + ` ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helpers to build preview values
  const formatDateVi = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };
  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatDateEn = (d: Date) => `${monthShort[d.getMonth()]} ${d.getDate()}${ordinal(d.getDate())} ${d.getFullYear()}`;

  const buildPreviewBase = (): Record<string, string> => ({
    eventName: 'Sự kiện ETIK',
    ticketsList: 'Vé VIP - 2 vé',
    eCode: 'FMPJ8A',
    eCodeQr: 'https://api.qrserver.com/v1/create-qr-code/?margin=16&size=140x140&data=FMPJ8A',
    startDateTime: '15/01/2025 19:00',
    endDateTime: '15/01/2025 22:00',
    place: 'Trung tâm Hội nghị Quốc gia',
  });

  const buildPreviewValueForField = (f: VisibleField): string => {
    // Builtin samples
    const today = new Date(2025, 0, 1);
    if (f.builtin_key === 'name') return 'Nguyễn Văn A';
    if (f.builtin_key === 'email') return 'nguyenvana@example.com';
    if (f.builtin_key === 'phone_number') return '0901234567';
    if (f.builtin_key === 'address') return '123 Đường ABC, Q1, TP.HCM';
    if (f.builtin_key === 'idcard_number') return '012345678901';
    if (f.builtin_key === 'dob') return tt(formatDateVi(today), formatDateEn(today));

    // By field type
    if (f.field_type === 'radio') {
      const first = f.options?.[0];
      return first?.label || 'Option 1';
    }
    if (f.field_type === 'checkbox') {
      const labels = (f.options || []).map((o) => o.label).filter(Boolean);
      return labels.length ? labels.join(', ') : 'Option A, Option B';
    }
    if (f.field_type === 'date' || f.field_type === 'datetime') {
      return tt(formatDateVi(today), formatDateEn(today));
    }
    // default text
    return f.label;
  };

  const buildPreviewData = (): Record<string, string> => {
    const base = buildPreviewBase();
    for (const f of visibleFields) {
      const key = mapFieldToComponentKey(f);
      base[key] = buildPreviewValueForField(f);
    }
    return base;
  };

  // Toggle preview
  const handleTogglePreview = () => {
    if (!showPreview) {
      setPreviewData(buildPreviewData());
    } else {
      setPreviewData({});
    }
    setShowPreview(!showPreview);
  };

  /** ---------- Test print ---------- */
  const handleTestPrint = () => {
    setPreviewData(buildPreviewData());
    if (!triggerPrint) return;
    setTimeout(() => {
      triggerPrint(undefined);
    }, 100);
  };

  // Print CSS
  const printCss = `
    @page { size: ${currentLabelSize.width}mm ${currentLabelSize.height}mm; margin: 0; }
    @media print {
      html, body {
        width: ${currentLabelSize.width}mm;
        height: ${currentLabelSize.height}mm;
        margin: 0; padding: 0;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body * { visibility: hidden !important; }
      .print-area, .print-area * { visibility: visible !important; }
      .print-area {
        position: fixed !important;
        top: 0 !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: ${currentLabelSize.width}mm !important;
        height: ${currentLabelSize.height}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        overflow: visible !important;
        box-sizing: border-box !important;
      }
      .print-area * {
        padding: 0 !important;
        margin: 0 !important;
        box-sizing: border-box !important;
      }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printCss }} />

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          aria-label={tt('Quay lại', 'Back')}
          onClick={() =>
            router.push(
              `${locale === 'en' ? '/en' : ''}/event-studio/events/${event_id}/ticket-tag-designs`
            )
          }
          size="small"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {tt('Tạo thiết kế tem nhãn', 'Create Tag Design')}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Left Sidebar: Size selector and Component list */}
        <Grid item xs={12} md={3}>
          <Stack spacing={2}>
            {/* Design Name */}
            <Card>
              <CardHeader title={tt("Tên thiết kế", "Design Name")} titleTypographyProps={{ variant: 'subtitle2' }} />
              <Divider />
              <Box sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={designName}
                  onChange={(e) => {
                    setDesignName(e.target.value);
                    hasUserEditedRef.current = true;
                  }}
                  placeholder={tt("Nhập tên thiết kế", "Enter design name")}
                />
              </Box>
            </Card>

            {/* Size Selector */}
            <Card>
              <CardHeader title={tt("Kích thước tem nhãn", "Label Size")} titleTypographyProps={{ variant: 'subtitle2' }} />
              <Divider />
              <Box sx={{ p: 2 }}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <Select value={showCustomSize ? 'custom' : selectedSize} onChange={(e) => handleSizeChange(e.target.value)}>
                    {defaultLabelSizes.map((size) => (
                      <MenuItem key={size.value} value={size.value}>
                        {size.label}
                      </MenuItem>
                    ))}
                    <MenuItem value="custom">{tt("Tùy chỉnh", "Custom")}</MenuItem>
                  </Select>
                </FormControl>
                {showCustomSize && (
                  <Stack spacing={1}>
                    <TextField
                      label={tt("Chiều rộng (mm)", "Width (mm)")}
                      type="number"
                      size="small"
                      value={customSize?.width || 50}
                      onChange={(e) => handleCustomSizeChange('width', Number(e.target.value))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                      }}
                    />
                    <TextField
                      label={tt("Chiều cao (mm)", "Height (mm)")}
                      type="number"
                      size="small"
                      value={customSize?.height || 50}
                      onChange={(e) => handleCustomSizeChange('height', Number(e.target.value))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">mm</InputAdornment>,
                      }}
                    />
                  </Stack>
                )}
              </Box>
            </Card>

            {/* Component List */}
            <Card>
              <CardHeader title={tt("Thành phần", "Components")} titleTypographyProps={{ variant: 'subtitle2' }} />
              <Divider />
              <List dense>
                {componentList.map(({ label, key }, idx) => (
                  <ListItem
                    key={`${key}-${idx}`}
                    button
                    onClick={() => handleAddComponent(key, label)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.08)' },
                    }}
                  >
                    <Typography variant="body2">{label}</Typography>
                  </ListItem>
                ))}
              </List>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader title={tt("Template mẫu", "Templates")} titleTypographyProps={{ variant: 'subtitle2' }} />
              <Divider />
              <Box sx={{ p: 2 }}>
                <Stack spacing={1}>
                  {getDefaultTemplates(tt, canvasWidthPx, canvasHeightPx).map((template, index) => (
                    <Button
                      key={index}
                      variant="outlined"
                      size="small"
                      onClick={() => handleLoadTemplate(index)}
                      fullWidth
                      sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                    >
                      {template.name}
                    </Button>
                  ))}
                </Stack>
              </Box>
            </Card>

            {/* Action Buttons */}
            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showPreview}
                    onChange={handleTogglePreview}
                    size="small"
                  />
                }
                label={tt("Thay thế bằng nội dung", "Replace with content")}
                sx={{ ml: 0 }}
              />
              <Button variant="outlined" color="primary" onClick={handleTestPrint} disabled={isLoading} fullWidth>
                {tt("In thử", "Test Print")}
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveTemplateSettings} disabled={isLoading} fullWidth>
                {isLoading ? tt('Đang tạo...', 'Creating...') : tt('Tạo thiết kế', 'Create Design')}
              </Button>
            </Stack>
          </Stack>
        </Grid>

        {/* Center: Canvas */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              border: '2px solid #ddd',
              borderRadius: 2,
              p: 2,
              backgroundColor: '#f5f5f5',
              overflow: 'auto',
              maxHeight: '80vh',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                width: '100%',
                height: '100%',
                overflow: 'auto',
              }}
            >
              <Box
                ref={canvasRef}
                sx={{
                  position: 'relative',
                  width: `${canvasWidthPx}px`,
                  height: `${canvasHeightPx}px`,
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  flexShrink: 0,
                }}
              >
              {components.map((comp) => {
                const isSelected = comp.id === selectedComponentId;
                // For customText component, always show customText if available
                const displayText = comp.key === 'customText' && comp.customText
                  ? comp.customText
                  : showPreview
                    ? (previewData[comp.key] || comp.label)
                    : comp.label;

                return (
                  <div
                    key={comp.id}
                    style={{
                      position: 'absolute',
                      left: `${comp.x}px`,
                      top: `${comp.y}px`,
                      zIndex: comp.zIndex ?? 1,
                    }}
                  >
                    <Draggable
                      position={{ x: 0, y: 0 }}
                      onStop={(e, data) => {
                        handleDrag(comp.id, e, data);
                      }}
                    >
                      <div
                        onClick={() => setSelectedComponentId(comp.id)}
                        style={{
                          width: `${comp.width}px`,
                          height: `${comp.height}px`,
                          border: isSelected ? '2px solid #2196F3' : '1px dashed #ccc',
                          backgroundColor: comp.backgroundColor ? `#${comp.backgroundColor}` : 'transparent',
                          cursor: 'move',
                          display: 'flex',
                          alignItems: (comp.verticalAlign === 'top' ? 'flex-start' : comp.verticalAlign === 'bottom' ? 'flex-end' : 'center'),
                          justifyContent: comp.textAlign === 'center' ? 'center' : comp.textAlign === 'right' ? 'flex-end' : 'flex-start',
                          padding: '4px',
                          fontSize: `${comp.fontSize}px`,
                          fontFamily: comp.fontFamily || 'Arial',
                          fontWeight: comp.fontWeight,
                          fontStyle: comp.fontStyle,
                          color: `#${comp.color}`,
                          textAlign: comp.textAlign,
                          boxSizing: 'border-box',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#2196F3';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#ccc';
                          }
                        }}
                      >
                        {comp.key === 'eCodeQr' && showPreview && previewData[comp.key] ? (
                          <img src={previewData[comp.key]} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : comp.key === 'image' && ((comp as any).imageUrl || (comp as any).image_url || (comp as any).customText) ? (
                          <img src={(comp as any).imageUrl || (comp as any).image_url || (comp as any).customText} alt="Component" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <span
                            style={{
                              fontSize: `${comp.fontSize}px`,
                              fontFamily: comp.fontFamily || 'Arial',
                              fontWeight: comp.fontWeight,
                              fontStyle: comp.fontStyle,
                              textDecoration: comp.textDecoration,
                              color: `#${comp.color}`,
                              textAlign: comp.textAlign,
                              wordBreak: 'break-word',
                              width: '100%',
                            }}
                          >
                            {displayText}
                          </span>
                        )}
                        {/* Resize handle */}
                        {isSelected && (
                          <div
                            className="react-resizable-handle"
                            style={{
                              position: 'absolute',
                              width: '20px',
                              height: '20px',
                              bottom: 0,
                              right: 0,
                              background: 'linear-gradient(-45deg, transparent 0%, transparent 30%, #2196F3 30%, #2196F3 35%, transparent 35%, transparent 70%, #2196F3 70%, #2196F3 75%, transparent 75%)',
                              cursor: 'nwse-resize',
                              zIndex: 1000,
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startX = e.clientX;
                              const startY = e.clientY;
                              const startWidth = comp.width;
                              const startHeight = comp.height;

                              const handleMouseMove = (e: MouseEvent) => {
                                const deltaX = e.clientX - startX;
                                const deltaY = e.clientY - startY;
                                const newWidth = Math.max(20, startWidth + deltaX); // min 20px
                                const newHeight = Math.max(20, startHeight + deltaY); // min 20px
                                handleResize(comp.id, e as any, {
                                  size: { width: newWidth, height: newHeight },
                                  handle: 'se',
                                } as ResizeCallbackData);
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };

                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          />
                        )}
                      </div>
                    </Draggable>
                  </div>
                );
              })}
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Right Sidebar: Property Panel */}
        <Grid item xs={12} md={3}>
          {selectedComponent ? (
            <Card>
              <CardHeader
                title={tt("Thuộc tính", "Properties")}
                subheader={selectedComponent.label}
              />
              <Divider />
              <Box sx={{ p: 2 }}>
                <Stack spacing={2}>
                  {/* Size & Position */}
                  <Box>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
                      {tt("Kích thước & Vị trí", "Size & Position")}
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <TextField
                          label={tt("Rộng (px)", "Width (px)")}
                          type="number"
                          size="small"
                          fullWidth
                          value={selectedComponent.width}
                          onChange={(e) => {
                            const newWidth = Math.max(20, Number(e.target.value));
                            updateComponentProperty(selectedComponent.id, 'width', newWidth);
                          }}
                          inputProps={{ min: 20 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label={tt("Cao (px)", "Height (px)")}
                          type="number"
                          size="small"
                          fullWidth
                          value={selectedComponent.height}
                          onChange={(e) => {
                            const newHeight = Math.max(20, Number(e.target.value));
                            updateComponentProperty(selectedComponent.id, 'height', newHeight);
                          }}
                          inputProps={{ min: 20 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label={tt("X (px)", "X (px)")}
                          type="number"
                          size="small"
                          fullWidth
                          value={Math.round(selectedComponent.x)}
                          onChange={(e) => {
                            const newX = Math.max(0, Math.min(canvasWidthPx - selectedComponent.width, Number(e.target.value)));
                            updateComponentProperty(selectedComponent.id, 'x', newX);
                          }}
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label={tt("Y (px)", "Y (px)")}
                          type="number"
                          size="small"
                          fullWidth
                          value={Math.round(selectedComponent.y)}
                          onChange={(e) => {
                            const newY = Math.max(0, Math.min(canvasHeightPx - selectedComponent.height, Number(e.target.value)));
                            updateComponentProperty(selectedComponent.id, 'y', newY);
                          }}
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider />

                  {/* Custom Text Input - only for customText component */}
                  {selectedComponent.key === 'customText' && (
                    <>
                      <TextField
                        label={tt("Nhập text", "Enter Text")}
                        size="small"
                        fullWidth
                        multiline
                        rows={3}
                        value={selectedComponent.customText || ''}
                        onChange={(e) => updateComponentProperty(selectedComponent.id, 'customText', e.target.value)}
                        placeholder={tt("Nhập text của bạn...", "Enter your text...")}
                      />
                      <Divider />
                    </>
                  )}

                  {/* Image Upload & Layer - only for image component */}
                  {selectedComponent.key === 'image' && (
                    <>
                      <Box>
                        <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 'bold' }}>
                          {tt("Ảnh", "Image")}
                        </Typography>
                        {selectedComponent.imageUrl ? (
                          <Box sx={{ mb: 1, border: '1px solid #eee', borderRadius: 1, overflow: 'hidden' }}>
                            <img
                              src={selectedComponent.imageUrl}
                              alt="Preview"
                              style={{ width: '100%', height: 160, objectFit: 'contain', display: 'block' }}
                            />
                          </Box>
                        ) : null}
                        <Button variant="contained" component="label" size="small">
                          {tt("Chọn ảnh", "Choose Image")}
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadImageForComponent(file, selectedComponent.id);
                            }}
                          />
                        </Button>
                      </Box>

                      <Box>
                        <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                          {tt("Lớp ảnh", "Image Layer")}
                        </Typography>
                        <ToggleButtonGroup
                          value={(selectedComponent.zIndex ?? 1) >= 100 ? 'top' : (selectedComponent.zIndex ?? 1) <= 0 ? 'background' : 'normal'}
                          exclusive
                          onChange={(e, value) => {
                            if (!value) return;
                            if (value === 'top') {
                              updateComponentProperty(selectedComponent.id, 'zIndex', 100);
                            } else if (value === 'background') {
                              updateComponentProperty(selectedComponent.id, 'zIndex', 0);
                            } else {
                              updateComponentProperty(selectedComponent.id, 'zIndex', 1);
                            }
                          }}
                          size="small"
                        >
                          <ToggleButton value="background">{tt("Ảnh nền", "Background")}</ToggleButton>
                          <ToggleButton value="normal">{tt("Mặc định", "Default")}</ToggleButton>
                          <ToggleButton value="top">{tt("Trên cùng", "Topmost")}</ToggleButton>
                        </ToggleButtonGroup>
                      </Box>

                      <Divider />
                    </>
                  )}

                  {/* Include Title - for name or ticketHolderName */}
                  {(selectedComponent.key === 'name' || selectedComponent.key === 'ticketHolderName') && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedComponent.includeTitle !== false}
                          onChange={(e) =>
                            updateComponentProperty(selectedComponent.id, 'includeTitle', e.target.checked)
                          }
                          size="small"
                        />
                      }
                      label={tt('Bao gồm danh xưng', 'Include title (Mr./Ms.)')}
                    />
                  )}

                  {/* Font Formatting */}
                  <Box>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                      {tt("Định dạng chữ", "Text Formatting")}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      <ToggleButton
                        value="bold"
                        selected={selectedComponent.fontWeight === 'bold'}
                        onChange={() => {
                          updateComponentProperty(
                            selectedComponent.id,
                            'fontWeight',
                            selectedComponent.fontWeight === 'bold' ? 'normal' : 'bold'
                          );
                        }}
                        size="small"
                      >
                        <FormatBoldIcon fontSize="small" />
                      </ToggleButton>
                      <ToggleButton
                        value="italic"
                        selected={selectedComponent.fontStyle === 'italic'}
                        onChange={() => {
                          updateComponentProperty(
                            selectedComponent.id,
                            'fontStyle',
                            selectedComponent.fontStyle === 'italic' ? 'normal' : 'italic'
                          );
                        }}
                        size="small"
                      >
                        <FormatItalicIcon fontSize="small" />
                      </ToggleButton>
                      <ToggleButton
                        value="underline"
                        selected={selectedComponent.textDecoration === 'underline'}
                        onChange={() => {
                          updateComponentProperty(
                            selectedComponent.id,
                            'textDecoration',
                            selectedComponent.textDecoration === 'underline' ? 'none' : 'underline'
                          );
                        }}
                        size="small"
                      >
                        <FormatUnderlinedIcon fontSize="small" />
                      </ToggleButton>
                    </Stack>
                    <ToggleButtonGroup
                      value={selectedComponent.textAlign}
                      exclusive
                      onChange={(e, value) => {
                        if (value) updateComponentProperty(selectedComponent.id, 'textAlign', value);
                      }}
                      size="small"
                      fullWidth
                    >
                      <ToggleButton value="left">
                        <FormatAlignLeftIcon fontSize="small" />
                      </ToggleButton>
                      <ToggleButton value="center">
                        <FormatAlignCenterIcon fontSize="small" />
                      </ToggleButton>
                      <ToggleButton value="right">
                        <FormatAlignRightIcon fontSize="small" />
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Vertical Align */}
                  <Box>
                    <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                      {tt("Căn dọc", "Vertical Align")}
                    </Typography>
                    <ToggleButtonGroup
                      value={selectedComponent.verticalAlign || 'middle'}
                      exclusive
                      onChange={(e, value) => {
                        if (value) updateComponentProperty(selectedComponent.id, 'verticalAlign', value);
                      }}
                      size="small"
                      fullWidth
                    >
                      <ToggleButton value="top">{tt("Trên", "Top")}</ToggleButton>
                      <ToggleButton value="middle">{tt("Giữa", "Middle")}</ToggleButton>
                      <ToggleButton value="bottom">{tt("Dưới", "Bottom")}</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>

                  {/* Font Family */}
                  <FormControl fullWidth size="small">
                    <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                      {tt("Font chữ", "Font Family")}
                    </Typography>
                    <Select
                      value={selectedComponent.fontFamily || 'Arial'}
                      onChange={(e) => updateComponentProperty(selectedComponent.id, 'fontFamily', e.target.value)}
                    >
                      <MenuItem value="Arial">Arial</MenuItem>
                      <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                      <MenuItem value="Courier New">Courier New</MenuItem>
                      <MenuItem value="Verdana">Verdana</MenuItem>
                      <MenuItem value="Georgia">Georgia</MenuItem>
                      <MenuItem value="Helvetica">Helvetica</MenuItem>
                      <MenuItem value="Comic Sans MS">Comic Sans MS</MenuItem>
                      <MenuItem value="Impact">Impact</MenuItem>
                      <MenuItem value="Tahoma">Tahoma</MenuItem>
                      <MenuItem value="Trebuchet MS">Trebuchet MS</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Font Size */}
                  <TextField
                    label={tt("Cỡ chữ", "Font Size")}
                    type="number"
                    size="small"
                    fullWidth
                    value={selectedComponent.fontSize}
                    onChange={(e) => updateComponentProperty(selectedComponent.id, 'fontSize', Number(e.target.value))}
                    inputProps={{ min: 1, max: 100 }}
                  />

                  {/* Font Weight */}
                  <FormControl fullWidth size="small">
                    <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                      {tt("Độ đậm", "Font Weight")}
                    </Typography>
                    <Select
                      value={selectedComponent.fontWeight}
                      onChange={(e) => updateComponentProperty(selectedComponent.id, 'fontWeight', e.target.value)}
                    >
                      <MenuItem value="normal">{tt("Bình thường", "Normal")}</MenuItem>
                      <MenuItem value="bold">{tt("Đậm", "Bold")}</MenuItem>
                      <MenuItem value="100">100</MenuItem>
                      <MenuItem value="200">200</MenuItem>
                      <MenuItem value="300">300</MenuItem>
                      <MenuItem value="400">400</MenuItem>
                      <MenuItem value="500">500</MenuItem>
                      <MenuItem value="600">600</MenuItem>
                      <MenuItem value="700">700</MenuItem>
                      <MenuItem value="800">800</MenuItem>
                      <MenuItem value="900">900</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Text Color */}
                  <Box>
                    <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                      {tt("Màu chữ", "Text Color")}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: `#${selectedComponent.color}`,
                          border: '1px solid #ccc',
                        }}
                      />
                      <TextField
                        size="small"
                        value={selectedComponent.color}
                        onChange={(e) => updateComponentProperty(selectedComponent.id, 'color', e.target.value.replace('#', ''))}
                        placeholder="000000"
                        fullWidth
                      />
                    </Stack>
                  </Box>

                  {/* Background Color */}
                  <Box>
                    <Typography variant="caption" sx={{ mb: 0.5, display: 'block' }}>
                      {tt("Màu nền", "Background Color")}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1,
                          bgcolor: selectedComponent.backgroundColor ? `#${selectedComponent.backgroundColor}` : 'transparent',
                          border: '1px solid #ccc',
                        }}
                      />
                      <TextField
                        size="small"
                        value={selectedComponent.backgroundColor}
                        onChange={(e) => updateComponentProperty(selectedComponent.id, 'backgroundColor', e.target.value.replace('#', ''))}
                        placeholder={tt("Trong suốt", "Transparent")}
                        fullWidth
                      />
                    </Stack>
                  </Box>

                  {/* Delete Button */}
                  <Divider sx={{ my: 1 }} />
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={() => handleDeleteComponent(selectedComponent.id)}
                    sx={{ mt: 1 }}
                  >
                    {tt("Xóa", "Delete")}
                  </Button>
                </Stack>
              </Box>
            </Card>
          ) : (
            <Card>
              <CardHeader title={tt("Thuộc tính", "Properties")} titleTypographyProps={{ variant: 'subtitle2' }} />
              <Divider />
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {tt("Chọn một thành phần để chỉnh sửa", "Select a component to edit")}
                </Typography>
              </Box>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Print Area (hidden, for printing) */}
      <div
        ref={printAreaRef}
        className="print-area"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: `${currentLabelSize.width}mm`,
          height: `${currentLabelSize.height}mm`,
          minWidth: `${currentLabelSize.width}mm`,
          minHeight: `${currentLabelSize.height}mm`,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            backgroundColor: '#fff',
          }}
        >
          {components.map((comp) => {
            // For customText component, always show customText if available
            const displayText = comp.key === 'customText' && comp.customText
              ? comp.customText
              : showPreview
                ? (previewData[comp.key] || comp.label)
                : comp.label;
            // Convert px to mm for print (px on canvas -> mm for print)
            // Canvas px = mm * PX_PER_MM * CANVAS_SCALE * canvasScale
            // So: mm = px / (PX_PER_MM * CANVAS_SCALE * canvasScale)
            const xMm = comp.x / (PX_PER_MM * CANVAS_SCALE * canvasScale);
            const yMm = comp.y / (PX_PER_MM * CANVAS_SCALE * canvasScale);
            const widthMm = comp.width / (PX_PER_MM * CANVAS_SCALE * canvasScale);
            const heightMm = comp.height / (PX_PER_MM * CANVAS_SCALE * canvasScale);
            const fontSizeMm = comp.fontSize / (PX_PER_MM * CANVAS_SCALE * canvasScale);

            return (
              <Box
                key={comp.id}
                style={{
                  position: 'absolute',
                  left: `${xMm}mm`,
                  top: `${yMm}mm`,
                  width: `${widthMm}mm`,
                  height: `${heightMm}mm`,
                  minWidth: `${widthMm}mm`,
                  minHeight: `${heightMm}mm`,
                  backgroundColor: comp.backgroundColor ? `#${comp.backgroundColor}` : 'transparent',
                  backgroundImage: 'none',
                  display: 'flex',
                  alignItems: (comp.verticalAlign === 'top' ? 'flex-start' : comp.verticalAlign === 'bottom' ? 'flex-end' : 'center'),
                  justifyContent: comp.textAlign === 'center' ? 'center' : comp.textAlign === 'right' ? 'flex-end' : 'flex-start',
                  padding: '1mm',
                  boxSizing: 'border-box',
                  border: '0.01mm solid rgba(0,0,0,0.001)',
                  zIndex: comp.zIndex ?? 1,
                }}
              >
                {comp.key === 'eCodeQr' && showPreview && previewData[comp.key] ? (
                  <img src={previewData[comp.key]} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : comp.key === 'image' && ((comp as any).imageUrl || (comp as any).image_url || (comp as any).customText) ? (
                  <img src={(comp as any).imageUrl || (comp as any).image_url || (comp as any).customText} alt="Component" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span
                    style={{
                      fontSize: `${fontSizeMm}mm`,
                      fontFamily: comp.fontFamily || 'Arial',
                      fontWeight: String(comp.fontWeight),
                      fontStyle: comp.fontStyle as any,
                      textDecoration: comp.textDecoration as any,
                      color: `#${comp.color}`,
                      textAlign: comp.textAlign as any,
                      wordBreak: 'break-word',
                      width: '100%',
                      display: 'block',
                    }}
                  >
                    {displayText}
                  </span>
                )}
              </Box>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Typography variant="h6" sx={{ color: 'white' }}>
            {tt('Đang tải...', 'Loading...')}
          </Typography>
        </Box>
      )}
    </>
  );
}
