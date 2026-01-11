'use client';

import NotificationContext from '@/contexts/notification-context';
import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import { Box, CardActions, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, InputLabel, styled, Table, TableBody, TableCell, TableHead, TableRow, Checkbox, FormControlLabel, Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';
import axios, { AxiosResponse } from 'axios';
import { LocalizedLink } from '@/components/homepage/localized-link';
import FormHelperText from '@mui/material/FormHelperText';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import * as XLSX from 'xlsx';

import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { Download, Pencil, Plus, Upload, X, Question } from '@phosphor-icons/react/dist/ssr';
import { PHONE_COUNTRIES } from '@/config/phone-countries';
import { Schedules } from './schedules';
import { TicketCategories } from './ticket-categories';
import { useTranslation } from '@/contexts/locale-context';
import { calculateVoucherDiscount } from '@/utils/voucher-discount';
import { getPaymentMethodLabel } from '@/utils/payment';
import dayjs from 'dayjs';

export type TicketCategory = {
  id: number;
  avatar: string | null;
  name: string;
  price: number;
  type: string;
  description: string;
  status: string;
  quantity: number;
  sold: number;
  disabled: boolean;
};

export type Show = {
  id: number;
  name: string;
  avatar: string;
  status: string;
  type: string;
  disabled: boolean;
  startDateTime: string; // backend response provides date as string
  endDateTime: string; // backend response provides date as string
  ticketCategories: TicketCategory[];
};

export type EventResponse = {
  name: string;
  organizer: string;
  description: string;
  startDateTime: string | null;
  endDateTime: string | null;
  place: string | null;
  locationUrl: string | null;
  bannerUrl: string;
  slug: string;
  locationInstruction: string | null;
  shows: Show[];
};

// Form field config type
type FormFieldConfig = {
  id: number;
  kind: string;
  builtinKey: string | null;
  internalName: string;
  label: string;
  fieldType: string;
  visible: boolean;
  required: boolean;
  note: string | null;
  sortOrder: number;
  options?: Array<{ value: string; label: string }>;
};

// Define the Customer type dynamically based on form fields
type Customer = Record<string, string>;
type CustomerExcelInput = Record<string, string>;
type CustomerValidationError = { lineId: number; field: string; input: string; msg: string };
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});
type TicketHolderInfo = { title: string; name: string; email: string; phone: string };


// Helper function to get payment method label (will be converted with tt in component)

// customerFieldLabelMap will be built dynamically from form fields
const getCustomerFieldLabelMap = (fields: FormFieldConfig[], tt: (vi: string, en: string) => string): Record<string, string> => {
  const map: Record<string, string> = {};
  fields.forEach(field => {
    const key = field.builtinKey || field.internalName;
    const normalizedKey = field.builtinKey === 'phone_number' ? 'phoneNumber' :
      field.builtinKey === 'idcard_number' ? 'idcardNumber' : key;
    map[normalizedKey] = field.label;
  });
  return map;
};
const normalizeFieldKey = (field: string): string =>
  field.replace(/[-_\s]+(.)?/g, (_match, group) => (group ? group.toUpperCase() : '')).trim();

// Helper function to get builtin key label in bilingual
const getBuiltinKeyLabel = (builtinKey: string | null, tt: (vi: string, en: string) => string): string | null => {
  if (!builtinKey) return null;
  const labelMap: Record<string, { vi: string; en: string }> = {
    'title': { vi: 'Danh xưng', en: 'Title' },
    'name': { vi: 'Tên', en: 'Name' },
    'email': { vi: 'Email', en: 'Email' },
    'phone_number': { vi: 'Số điện thoại', en: 'Phone Number' },
    'address': { vi: 'Địa chỉ', en: 'Address' },
    'dob': { vi: 'Ngày sinh', en: 'Date of Birth' },
    'idcard_number': { vi: 'Số CMND/CCCD', en: 'ID Card Number' },
  };
  const mapped = labelMap[builtinKey];
  return mapped ? tt(mapped.vi, mapped.en) : null;
};

// Helper function to get field type label
const getFieldTypeLabel = (field: FormFieldConfig, tt: (vi: string, en: string) => string): string => {
  const typeMap: Record<string, { vi: string; en: string }> = {
    'text': { vi: 'Text', en: 'Text' },
    'number': { vi: 'Số', en: 'Number' },
    'date': { vi: 'Ngày', en: 'Date' },
    'datetime': { vi: 'Ngày giờ', en: 'Date Time' },
    'time': { vi: 'Giờ', en: 'Time' },
    'radio': { vi: 'Chọn một', en: 'Single Choice' },
    'checkbox': { vi: 'Chọn nhiều', en: 'Multiple Choice' },
  };
  const mapped = typeMap[field.fieldType];
  return mapped ? tt(mapped.vi, mapped.en) : field.fieldType;
};

// Helper function to get format hint text for a field
const getFormatHint = (field: FormFieldConfig): string => {
  if (field.fieldType === 'date') {
    return 'DD/MM/YYYY';
  } else if (field.fieldType === 'datetime') {
    return 'DD/MM/YYYY HH:mm:ss';
  } else if (field.fieldType === 'time') {
    return 'HH:mm:ss';
  } else if (field.fieldType === 'radio' && field.options && field.options.length > 0) {
    return field.options.map(opt => opt.label).join(' | ');
  } else if (field.fieldType === 'checkbox' && field.options && field.options.length > 0) {
    return `[${field.options.map(opt => opt.label).join(', ')}]`;
  }
  return '';
};

export default function Page({ params }: { params: { event_id: number } }): React.JSX.Element {
  const { tt, locale } = useTranslation();
  React.useEffect(() => {
    document.title = tt("Tạo đơn hàng theo lô | ETIK - Vé điện tử & Quản lý sự kiện", "Create Bulk Orders | ETIK - E-tickets & Event Management");
  }, [tt]);
  const [event, setEvent] = React.useState<EventResponse | null>(null);
  const [ticketQuantity, setTicketQuantity] = React.useState<number>(1);
  const [extraFee, setExtraFee] = React.useState<number>(0);
  const router = useRouter(); // Use useRouter from next/navigation
  const [selectedCategories, setSelectedCategories] = React.useState<Record<number, Record<number, number>>>({});
  const [paymentMethod, setPaymentMethod] = React.useState<string>('napas247');
  const [ticketHolders, setTicketHolders] = React.useState<string[]>(['']);
  const notificationCtx = React.useContext(NotificationContext);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [selectedSchedules, setSelectedSchedules] = React.useState<Show[]>([]);
  const [ticketHoldersByCategory, setTicketHoldersByCategory] = React.useState<Record<string, TicketHolderInfo[]>>({});
  const [requestedCategoryModalId, setRequestedCategoryModalId] = React.useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);
  const [customerValidationErrors, setCustomerValidationErrors] = React.useState<CustomerValidationError[]>([]);
  const [formFields, setFormFields] = React.useState<FormFieldConfig[]>([]);

  // Voucher states
  const [availableVouchers, setAvailableVouchers] = React.useState<any[]>([]);
  const [appliedVoucher, setAppliedVoucher] = React.useState<any | null>(null);
  const [manualDiscountCode, setManualDiscountCode] = React.useState<string>('');
  const [voucherDetailModalOpen, setVoucherDetailModalOpen] = React.useState<boolean>(false);
  const [selectedVoucherForDetail, setSelectedVoucherForDetail] = React.useState<any | null>(null);

  // Get visible fields sorted by sortOrder
  const visibleFields = React.useMemo(() => {
    return formFields
      .filter(f => f.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [formFields]);

  // Get default title based on locale
  const getDefaultTitle = React.useCallback((): string => {
    return locale === 'en' ? 'Mx.' : tt('Bạn', 'You');
  }, [locale, tt]);

  const createEmptyCustomer = React.useCallback((): Customer => {
    const customer: Customer = {};
    visibleFields.forEach(field => {
      const key = field.builtinKey || field.internalName;
      // Map builtin keys to customer object keys
      if (field.builtinKey === 'title') {
        customer.title = getDefaultTitle();
      } else if (field.builtinKey === 'name') {
        customer.name = '';
      } else if (field.builtinKey === 'email') {
        customer.email = '';
      } else if (field.builtinKey === 'phone_number') {
        customer.phoneNumber = '';
        customer.phoneCountryCode = '+84'; // Default country code
      } else if (field.builtinKey === 'address') {
        customer.address = '';
      } else if (field.builtinKey === 'dob') {
        customer.dob = '';
      } else if (field.builtinKey === 'idcard_number') {
        customer.idcardNumber = '';
      } else {
        // Custom field
        customer[field.internalName] = '';
      }
    });
    return customer;
  }, [visibleFields, getDefaultTitle]);

  const [customers, setCustomers] = React.useState<Customer[]>(() => [{ ...createEmptyCustomer() }]);

  // Do not change existing customers' title when locale changes; keep original value as entered

  // Update customers when form fields are loaded
  React.useEffect(() => {
    if (visibleFields.length > 0 && customers.length > 0) {
      // Update existing customers to include new fields
      const updatedCustomers = customers.map(customer => {
        const updated = { ...customer };
        visibleFields.forEach(field => {
          const key = field.builtinKey || field.internalName;
          if (field.builtinKey === 'name' && !('name' in updated)) {
            updated.name = '';
          } else if (field.builtinKey === 'email' && !('email' in updated)) {
            updated.email = '';
          } else if (field.builtinKey === 'phone_number') {
            if (!('phoneNumber' in updated)) {
              updated.phoneNumber = '';
            }
            if (!('phoneCountryCode' in updated)) {
              updated.phoneCountryCode = '+84';
            }
          } else if (field.builtinKey === 'address' && !('address' in updated)) {
            updated.address = '';
          } else if (field.builtinKey === 'dob' && !('dob' in updated)) {
            updated.dob = '';
          } else if (field.builtinKey === 'idcard_number' && !('idcardNumber' in updated)) {
            updated.idcardNumber = '';
          } else if (!field.builtinKey && !(field.internalName in updated)) {
            updated[field.internalName] = '';
          }
        });
        return updated;
      });
      setCustomers(updatedCustomers);
    } else if (visibleFields.length > 0 && customers.length === 0) {
      // Initialize with one empty customer if none exist
      setCustomers([createEmptyCustomer()]);
    }
  }, [visibleFields.length, createEmptyCustomer]);

  const customerErrorsMap = React.useMemo<Record<number, Record<string, CustomerValidationError[]>>>(() => {
    return customerValidationErrors.reduce((acc, error) => {
      const rowIndex = error.lineId - 1;
      if (rowIndex < 0) return acc;
      const key = normalizeFieldKey(error.field);
      if (!acc[rowIndex]) acc[rowIndex] = {};
      if (!acc[rowIndex][key]) acc[rowIndex][key] = [];
      acc[rowIndex][key].push(error);
      return acc;
    }, {} as Record<number, Record<string, CustomerValidationError[]>>);
  }, [customerValidationErrors]);

  const sortedValidationErrors = React.useMemo(() => {
    return [...customerValidationErrors].sort((a, b) => {
      if (a.lineId === b.lineId) {
        return normalizeFieldKey(a.field).localeCompare(normalizeFieldKey(b.field));
      }
      return a.lineId - b.lineId;
    });
  }, [customerValidationErrors]);

  // Handle change in customer fields
  const handleCustomerChange = (index: number, fieldKey: string, value: string) => {
    const updatedCustomers = [...customers];
    updatedCustomers[index][fieldKey] = value;
    setCustomers(updatedCustomers);
    setCustomerValidationErrors(prev =>
      prev.filter(err => !(err.lineId === index + 1 && normalizeFieldKey(err.field) === fieldKey))
    );
  };

  // Add a new customer
  const addCustomer = () => {
    setCustomers([...customers, createEmptyCustomer()]);
  };

  // Remove a customer
  const removeCustomer = (index: number) => {
    const updatedCustomers = customers.filter((_, i) => i !== index);
    setCustomers(updatedCustomers);
  };

  // Fetch form config
  React.useEffect(() => {
    if (params.event_id) {
      const fetchFormConfig = async () => {
        try {
          const response: AxiosResponse<{ fields: FormFieldConfig[] }> = await baseHttpServiceInstance.get(
            `/event-studio/events/${params.event_id}/forms/checkout/config`
          );
          if (response.data?.fields) {
            setFormFields(response.data.fields);
          }
        } catch (error) {
          // If form config doesn't exist, use default fields
          console.error('Failed to load form config', error);
        }
      };
      fetchFormConfig();
    }
  }, [params.event_id]);

  // Update customers when form fields change
  React.useEffect(() => {
    if (visibleFields.length > 0 && customers.length > 0) {
      // Update existing customers to include new fields
      const updatedCustomers = customers.map(customer => {
        const updated = { ...customer };
        visibleFields.forEach(field => {
          const key = field.builtinKey || field.internalName;
          if (field.builtinKey === 'name' && !('name' in updated)) {
            updated.name = '';
          } else if (field.builtinKey === 'email' && !('email' in updated)) {
            updated.email = '';
          } else if (field.builtinKey === 'phone_number') {
            if (!('phoneNumber' in updated)) {
              updated.phoneNumber = '';
            }
            if (!('phoneCountryCode' in updated)) {
              updated.phoneCountryCode = '+84';
            }
          } else if (field.builtinKey === 'address' && !('address' in updated)) {
            updated.address = '';
          } else if (field.builtinKey === 'dob' && !('dob' in updated)) {
            updated.dob = '';
          } else if (field.builtinKey === 'idcard_number' && !('idcardNumber' in updated)) {
            updated.idcardNumber = '';
          } else if (!field.builtinKey && !(field.internalName in updated)) {
            updated[field.internalName] = '';
          }
        });
        return updated;
      });
      setCustomers(updatedCustomers);
    }
  }, [visibleFields.length, tt]);

  // Fetch event details on component mount
  React.useEffect(() => {
    if (params.event_id) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          const response: AxiosResponse<EventResponse> = await baseHttpServiceInstance.get(
            `/event-studio/events/${params.event_id}/transactions/get-info-to-create-transaction`
          );
          setEvent(response.data);
          // setFormValues(response.data); // Initialize form with the event data
        } catch (error) {
          notificationCtx.error(error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    }
  }, [params.event_id]);

  // Fetch available public vouchers
  React.useEffect(() => {
    const fetchAvailableVouchers = async () => {
      try {
        const response: AxiosResponse<any[]> = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/voucher-campaigns/public/available`
        );
        setAvailableVouchers(response.data || []);
      } catch (error) {
        // Silently fail - vouchers are optional
        console.error('Error fetching vouchers:', error);
      }
    };
    if (params.event_id) {
      fetchAvailableVouchers();
    }
  }, [params.event_id]);

  const handleCategorySelection = (showId: number, categoryId: number) => {
    setSelectedCategories(prevCategories => {
      const existingForShow = prevCategories[showId] || {};
      const exists = Object.prototype.hasOwnProperty.call(existingForShow, categoryId);
      const nextForShow = { ...existingForShow } as Record<number, number>;
      if (exists) {
        delete nextForShow[categoryId];
      } else {
        nextForShow[categoryId] = 1; // default quantity when toggled via list
      }
      return {
        ...prevCategories,
        [showId]: nextForShow,
      };
    });
  };

  const handleAddToCartQuantity = (showId: number, categoryId: number, quantity: number, holders?: TicketHolderInfo[]) => {
    setSelectedCategories(prev => {
      const forShow = prev[showId] || {};
      const updatedForShow = { ...forShow } as Record<number, number>;
      if (quantity <= 0) {
        delete updatedForShow[categoryId];
      } else {
        updatedForShow[categoryId] = quantity;
      }
      return {
        ...prev,
        [showId]: updatedForShow,
      };
    });

    const key = `${showId}-${categoryId}`;
    setTicketHoldersByCategory(prev => {
      if (quantity <= 0) {
        const next = { ...prev } as Record<string, TicketHolderInfo[]>;
        delete next[key];
        return next;
      }
      if (holders && holders.length > 0) {
        return { ...prev, [key]: holders.slice(0, quantity) };
      }
      // ensure existing array is sized to quantity
      const existing = prev[key] || [];
      const defaultTitle = locale === 'en' ? 'Mx.' : tt('Bạn', 'You');
      const sized = Array.from({ length: quantity }, (_, i) => existing[i] || { title: defaultTitle, name: '', email: '', phone: '' });
      return { ...prev, [key]: sized };
    });
  };

  const handleSelectionChange = (selected: Show[]) => {
    setSelectedSchedules(selected);
    const tmpObj: Record<number, Record<number, number>> = {}
    selected.forEach((s) => { tmpObj[s.id] = selectedCategories[s.id] || {} })
    setSelectedCategories(tmpObj);

    // filter holders to only keep keys for selected shows
    const allowedShowIds = new Set(selected.map(s => s.id));
    setTicketHoldersByCategory(prev => {
      const next: Record<string, TicketHolderInfo[]> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const showIdStr = k.split('-')[0];
        const sid = parseInt(showIdStr);
        if (allowedShowIds.has(sid)) next[k] = v;
      });
      return next;
    });
  };

  const handleCreateClick = () => {
    // Validate all customers based on required fields
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const missingFields: string[] = [];

      visibleFields.forEach(field => {
        if (field.required) {
          const key = field.builtinKey || field.internalName;
          let value = '';
          if (field.builtinKey === 'name') {
            value = customer.name || '';
          } else if (field.builtinKey === 'email') {
            value = customer.email || '';
          } else if (field.builtinKey === 'phone_number') {
            value = customer.phoneNumber || '';
          } else if (field.builtinKey === 'address') {
            value = customer.address || '';
          } else if (field.builtinKey === 'dob') {
            value = customer.dob || '';
          } else if (field.builtinKey === 'idcard_number') {
            value = customer.idcardNumber || '';
          } else {
            value = customer[field.internalName] || '';
          }

          if (!value || value.trim() === '') {
            missingFields.push(field.label);
          }
        }
      });

      if (missingFields.length > 0) {
        notificationCtx.warning(tt(`Vui lòng điền đầy đủ các thông tin bắt buộc cho khách hàng ${i + 1}: ${missingFields.join(', ')}`, `Please fill in all required information for customer ${i + 1}: ${missingFields.join(', ')}`));
        return;
      }
    }

    if (ticketQuantity <= 0) {
      notificationCtx.warning(tt('Vui lòng điền đầy đủ các thông tin bắt buộc', 'Please fill in all required information'));
      return;
    }

    const totalSelectedCategories = Object.values(selectedCategories).reduce((sum, catMap) => sum + Object.keys(catMap || {}).length, 0);
    if (totalSelectedCategories === 0) {
      notificationCtx.warning(tt('Vui lòng chọn ít nhất 1 loại vé', 'Please select at least 1 ticket type'));
      return;
    }

    setConfirmOpen(true);
  };

  // Generate Excel template with dynamic headers and example rows
  const handleDownloadTemplate = () => {
    if (visibleFields.length === 0) {
      notificationCtx.warning(tt('Vui lòng đợi form config được tải xong', 'Please wait for form config to finish loading'));
      return;
    }

    // Create headers: All visible field labels
    // For phone_number, add 2 columns: "Country Code" and the field label
    const countryCodeHeader = tt('Mã quốc gia', 'Country Code');
    const headers: string[] = [];
    visibleFields.forEach(field => {
      if (field.builtinKey === 'phone_number') {
        // Use bilingual label for builtinKey
        const builtinLabel = getBuiltinKeyLabel(field.builtinKey, tt) || field.label;
        headers.push(countryCodeHeader, builtinLabel);
      } else {
        // Use bilingual label for builtinKey, otherwise use field.label from backend
        const builtinLabel = getBuiltinKeyLabel(field.builtinKey, tt);
        headers.push(builtinLabel || field.label);
      }
    });

    // Generate 3 example rows with proper format
    const exampleRows: any[] = [];
    for (let i = 0; i < 3; i++) {
      const row: any = {};

      visibleFields.forEach(field => {
        let exampleValue = '';

        if (field.builtinKey === 'title') {
          exampleValue = locale === 'en'
            ? (i === 0 ? 'Mr.' : i === 1 ? 'Ms.' : 'Mx.')
            : (i === 0 ? tt('Anh', 'Mr.') : i === 1 ? tt('Chị', 'Ms.') : tt('Bạn', 'You'));
        } else if (field.builtinKey === 'name') {
          exampleValue = i === 0 ? 'Nguyễn Văn A' : i === 1 ? 'Trần Thị B' : 'Lê Văn C';
        } else if (field.builtinKey === 'email') {
          exampleValue = i === 0 ? 'nguyenvana@example.com' : i === 1 ? 'tranthib@example.com' : 'levanc@example.com';
        } else if (field.builtinKey === 'phone_number') {
          // Phone number will be handled separately with country code
          // Skip here, will add to row separately
        } else if (field.builtinKey === 'address') {
          exampleValue = i === 0 ? '123 Đường ABC, Quận 1, TP.HCM' : i === 1 ? '456 Đường XYZ, Quận 2, TP.HCM' : '789 Đường DEF, Quận 3, TP.HCM';
        } else if (field.builtinKey === 'dob') {
          exampleValue = i === 0 ? '15/03/1990' : i === 1 ? '20/07/1995' : '10/11/2000';
        } else if (field.builtinKey === 'idcard_number') {
          exampleValue = i === 0 ? '123456789012' : i === 1 ? '234567890123' : '345678901234';
        } else if (field.fieldType === 'date') {
          exampleValue = i === 0 ? '25/12/2024' : i === 1 ? '26/12/2024' : '27/12/2024';
        } else if (field.fieldType === 'datetime') {
          exampleValue = i === 0 ? '25/12/2024 14:30:00' : i === 1 ? '26/12/2024 15:45:00' : '27/12/2024 16:00:00';
        } else if (field.fieldType === 'time') {
          exampleValue = i === 0 ? '14:30:00' : i === 1 ? '15:45:00' : '16:00:00';
        } else if (field.fieldType === 'radio' && field.options && field.options.length > 0) {
          // Use first option as example
          exampleValue = field.options[0].label;
        } else if (field.fieldType === 'checkbox' && field.options && field.options.length > 0) {
          // Use first 2 options as example, separated by comma
          const selectedOptions = field.options.slice(0, Math.min(2, field.options.length));
          exampleValue = selectedOptions.map(opt => opt.label).join(', ');
        } else if (field.fieldType === 'number') {
          exampleValue = i === 0 ? '100' : i === 1 ? '200' : '300';
        } else {
          // Text field
          exampleValue = i === 0 ? `${tt('Ví dụ', 'Example')} ${field.label} 1` : i === 1 ? `${tt('Ví dụ', 'Example')} ${field.label} 2` : `${tt('Ví dụ', 'Example')} ${field.label} 3`;
        }

        // Handle phone_number separately with country code
        if (field.builtinKey === 'phone_number') {
          const builtinLabel = getBuiltinKeyLabel(field.builtinKey, tt) || field.label;
          row[countryCodeHeader] = i === 0 ? '+84' : i === 1 ? '+84' : '+84';
          row[builtinLabel] = i === 0 ? '0901234567' : i === 1 ? '0912345678' : '0923456789';
        } else {
          // Use bilingual label for builtinKey, otherwise use field.label from backend
          const builtinLabel = getBuiltinKeyLabel(field.builtinKey, tt);
          row[builtinLabel || field.label] = exampleValue;
        }
      });

      exampleRows.push(row);
    }

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(exampleRows, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, tt('Thông tin người mua', 'Customer Information'));

    // Download file
    XLSX.writeFile(workbook, tt('template-thong-tin-nguoi-mua.xlsx', 'template-customer-information.xlsx'));
  };

  // Handle file upload and parse the Excel file
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = XLSX.utils.sheet_to_json<CustomerExcelInput>(sheet);

        // Map Excel columns to customer fields based on form config (using column labels)
        const countryCodeHeaderKey = tt('Mã quốc gia', 'Country Code');
        const defaultTitle = getDefaultTitle();
        const formattedData: Customer[] = parsedData.map(d => {
          const customer: Customer = {};
          // Initialize title with default if not found in visibleFields later (but usually we rely on fields)
          // Actually, we should only set properties that are in visibleFields or special handling

          visibleFields.forEach(field => {
            // Try to match both bilingual label and backend label for builtinKey
            const builtinLabel = getBuiltinKeyLabel(field.builtinKey, tt);
            const excelKey = builtinLabel || field.label; // Use bilingual label if available, otherwise use field.label
            // Try to find value using either bilingual label or backend label
            const excelValue = d[excelKey] || d[field.label] || '';

            // Map to customer object keys
            if (field.builtinKey === 'title') {
              customer.title = String(excelValue) || defaultTitle;
            } else if (field.builtinKey === 'name') {
              customer.name = String(excelValue);
            } else if (field.builtinKey === 'email') {
              customer.email = String(excelValue);
            } else if (field.builtinKey === 'phone_number') {
              // Get country code from "Country Code" column, default to +84
              const countryCode = d[countryCodeHeaderKey] || '+84';
              customer.phoneCountryCode = String(countryCode);
              customer.phoneNumber = String(excelValue);
            } else if (field.builtinKey === 'address') {
              customer.address = String(excelValue);
            } else if (field.builtinKey === 'dob') {
              customer.dob = String(excelValue);
            } else if (field.builtinKey === 'idcard_number') {
              customer.idcardNumber = String(excelValue);
            } else {
              // Custom field - try both bilingual label and backend label
              const customValue = d[excelKey] || d[field.label] || '';
              customer[field.internalName] = String(customValue);
            }
          });
          return customer;
          // If title field is NOT visible but is required for logic, we might need default.
          // But based on requirement, if it's not in visibleFields, we don't care about it (or it's handled by default in handleSubmit if needed)
          if (!customer.title && visibleFields.some(f => f.builtinKey === 'title')) {
            customer.title = defaultTitle;
          } else if (!customer.title && !visibleFields.some(f => f.builtinKey === 'title')) {
            // If not visible, we might still want a default title for backend compatibility if it relies on it?
            // handleSubmit adds default title if missing.
          }
          return customer;
        });
        setCustomers(formattedData);
        event.target.value = ''
      };
      reader.readAsBinaryString(file);
    }
  };


  const handleExtraFeeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, ''); // Remove non-digit characters
    setExtraFee(Number(value));
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  // Get all tickets in order with details
  const orderTickets = React.useMemo(() => {
    const tickets: Array<{ showId: number; ticketCategoryId: number; price: number; quantity: number }> = [];
    Object.entries(selectedCategories).forEach(([showId, categories]) => {
      const show = event?.shows.find((show) => show.id === parseInt(showId));
      Object.entries(categories || {}).forEach(([categoryIdStr, qty]) => {
        const categoryId = parseInt(categoryIdStr);
        const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
        if (ticketCategory && qty > 0) {
          tickets.push({
            showId: parseInt(showId),
            ticketCategoryId: categoryId,
            price: ticketCategory.price,
            quantity: qty || 0,
          });
        }
      });
    });
    return tickets;
  }, [selectedCategories, event]);

  // Check if ticket is in voucher scope
  const isTicketInScope = React.useCallback((showId: number, ticketCategoryId: number, voucher: any): boolean => {
    if (voucher.applyToAll) {
      return true;
    }
    if (!voucher.ticketCategories || voucher.ticketCategories.length === 0) {
      return false;
    }
    return voucher.ticketCategories.some((tc: any) => tc.id === ticketCategoryId);
  }, []);

  // Validate voucher can be applied
  const validateVoucher = React.useCallback((voucher: any): { valid: boolean; message?: string } => {
    if (!voucher) {
      return { valid: false, message: tt('Voucher không hợp lệ', 'Invalid voucher') };
    }

    // Check if multiple code voucher (one-time use) is used with multiple customers
    // Multiple code vouchers: each code can only be used once, so only 1 transaction allowed
    if (voucher.codeType === 'multiple' && customers.length > 1) {
      return {
        valid: false,
        message: tt(
          'Mã khuyến mãi này chỉ có thể áp dụng cho 1 đơn hàng. Vui lòng tạo từng đơn hàng riêng biệt.',
          'Multiple code voucher (one-time use) can only be applied to 1 order. Please create orders separately.'
        ),
      };
    }

    // For single code voucher (multiple uses), validation will be done at backend
    // Frontend cannot check remaining uses without API call

    const ticketsInScope = orderTickets.filter((ticket) =>
      isTicketInScope(ticket.showId, ticket.ticketCategoryId, voucher)
    );
    const totalTicketsInScope = ticketsInScope.reduce((sum, t) => sum + t.quantity, 0);

    if (totalTicketsInScope === 0) {
      return {
        valid: false,
        message: tt('Đơn hàng không có vé thuộc phạm vi áp dụng của voucher', 'Order does not have tickets in voucher scope'),
      };
    }

    if (voucher.minTicketsRequired && totalTicketsInScope < voucher.minTicketsRequired) {
      return {
        valid: false,
        message: tt(
          `Voucher yêu cầu tối thiểu ${voucher.minTicketsRequired} vé trong phạm vi áp dụng`,
          `Voucher requires minimum ${voucher.minTicketsRequired} tickets in scope`
        ),
      };
    }

    if (voucher.maxTicketsAllowed && totalTicketsInScope > voucher.maxTicketsAllowed) {
      return {
        valid: false,
        message: tt(
          `Voucher chỉ cho phép tối đa ${voucher.maxTicketsAllowed} vé trong phạm vi áp dụng`,
          `Voucher allows maximum ${voucher.maxTicketsAllowed} tickets in scope`
        ),
      };
    }

    return { valid: true };
  }, [orderTickets, isTicketInScope, customers.length, tt]);

  // Calculate discount amount using helper function
  const discountAmount = React.useMemo(() => {
    if (!appliedVoucher) return 0;
    return calculateVoucherDiscount(appliedVoucher, orderTickets, isTicketInScope, validateVoucher);
  }, [appliedVoucher, orderTickets, isTicketInScope, validateVoucher]);

  // Check if applied voucher is still valid
  const voucherValidation = React.useMemo(() => {
    if (!appliedVoucher) {
      return { valid: true };
    }
    return validateVoucher(appliedVoucher);
  }, [appliedVoucher, validateVoucher]);

  // Calculate subtotal
  const subtotal = React.useMemo(() => {
    return orderTickets.reduce((sum, ticket) => sum + ticket.price * ticket.quantity, 0);
  }, [orderTickets]);

  // Calculate final total
  const finalTotal = React.useMemo(() => {
    return Math.max(0, subtotal + extraFee - discountAmount);
  }, [subtotal, extraFee, discountAmount]);

  // Handle apply voucher from list
  const handleApplyVoucher = React.useCallback((voucher: any) => {
    const validation = validateVoucher(voucher);
    setAppliedVoucher(voucher); // Always set to show the box, even if invalid
    setManualDiscountCode('');
    if (!validation.valid) {
      notificationCtx.error(validation.message || tt('Voucher không hợp lệ', 'Invalid voucher'));
      return;
    }
    notificationCtx.success(tt('Áp dụng mã khuyến mãi thành công', 'Voucher applied successfully'));
  }, [validateVoucher, notificationCtx, tt]);

  // Handle validate and display voucher from manual input
  const handleValidateAndDisplayVoucher = React.useCallback(async () => {
    if (!manualDiscountCode.trim()) {
      notificationCtx.warning(tt('Vui lòng nhập mã khuyến mãi', 'Please enter voucher code'));
      return;
    }

    try {
      const response: AxiosResponse<any> = await baseHttpServiceInstance.get(
        `/event-studio/events/${params.event_id}/voucher-campaigns/validate-voucher`,
        { params: { code: manualDiscountCode.trim() } }
      );
      const voucher = response.data;

      // Always set to show the box, even if validation fails
      setAppliedVoucher(voucher);
      setManualDiscountCode('');

      // Validate voucher after receiving from API
      const validation = validateVoucher(voucher);
      if (!validation.valid) {
        notificationCtx.error(validation.message || tt('Voucher không hợp lệ', 'Invalid voucher'));
        return;
      }

      notificationCtx.success(tt('Mã khuyến mãi hợp lệ', 'Voucher code is valid'));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || tt('Mã khuyến mãi không hợp lệ', 'Invalid voucher code');
      notificationCtx.error(errorMessage);
      setAppliedVoucher(null);
    }
  }, [manualDiscountCode, params.event_id, notificationCtx, validateVoucher, tt]);

  const handleSubmit = async () => {
    setConfirmOpen(false);

    // Validate required fields dynamically
    const invalidCustomers: number[] = [];
    customers.forEach((customer, index) => {
      visibleFields.forEach(field => {
        if (field.required) {
          const key = field.builtinKey || field.internalName;
          let value = '';
          if (field.builtinKey === 'name') {
            value = customer.name || '';
          } else if (field.builtinKey === 'email') {
            value = customer.email || '';
          } else if (field.builtinKey === 'phone_number') {
            value = customer.phoneNumber || '';
          } else if (field.builtinKey === 'address') {
            value = customer.address || '';
          } else if (field.builtinKey === 'dob') {
            value = customer.dob || '';
          } else if (field.builtinKey === 'idcard_number') {
            value = customer.idcardNumber || '';
          } else {
            value = customer[field.internalName] || '';
          }

          if (!value || value.trim() === '') {
            if (!invalidCustomers.includes(index)) {
              invalidCustomers.push(index);
            }
          }
        }
      });
    });

    if (invalidCustomers.length > 0) {
      const requiredFields = visibleFields.filter(f => f.required).map(f => f.label).join(', ');
      notificationCtx.warning(tt(`Vui lòng điền đầy đủ các thông tin bắt buộc: ${requiredFields}`, `Please fill in all required information: ${requiredFields}`));
      return;
    }

    if (Object.keys(selectedCategories).length == 0) {
      notificationCtx.warning(tt('Vui lòng chọn ít nhất 1 loại vé', 'Please select at least 1 ticket type'));
      return;
    }


    const emptyTicketShowIds = Object.entries(selectedCategories).filter(([showId, ticketCategoryId]) => (ticketCategoryId == null)).map(([showId, ticketCategoryId]) => (Number.parseInt(showId)));
    if (emptyTicketShowIds.length > 0) {
      const emptyTicketNames = event?.shows.filter(show => emptyTicketShowIds.includes(show.id)).map(show => show.name)
      notificationCtx.warning(tt(`Vui lòng chọn loại vé cho ${emptyTicketNames?.join(', ')}`, `Please select ticket type for ${emptyTicketNames?.join(', ')}`));
      return;
    }
    try {
      setIsLoading(true);
      setCustomerValidationErrors([]);

      const tickets = Object.entries(selectedCategories).flatMap(([showId, catMap]) => (
        Object.entries(catMap || {}).map(([categoryIdStr, qty]) => {
          const key = `${showId}-${categoryIdStr}`;
          const holders = ticketHoldersByCategory[key] || [];
          return {
            showId: parseInt(showId),
            ticketCategoryId: parseInt(categoryIdStr),
            quantity: qty || 0,
          };
        })
      ));

      // Prepare customers with form_answers separated from builtin fields
      const builtinKeys = ['name', 'email', 'phoneNumber', 'phoneCountryCode', 'address', 'dob', 'idcardNumber', 'title'];
      const defaultTitle = locale === 'en' ? 'Mx.' : tt('Bạn', 'You');
      const customersWithFormAnswers = customers.map(customer => {
        const customerData: any = {
          name: customer.name || '',
          email: customer.email || '',
          phoneNumber: customer.phoneNumber || '',
          phoneCountryCode: customer.phoneCountryCode || '+84',
          title: customer.title || defaultTitle,
        };

        // Add optional builtin fields if they exist
        if (customer.address) customerData.address = customer.address;
        if (customer.dob) customerData.dob = customer.dob;
        if (customer.idcardNumber) customerData.idcardNumber = customer.idcardNumber;

        // Collect custom fields into form_answers
        const formAnswers: Record<string, any> = {};
        visibleFields.forEach(field => {
          if (!field.builtinKey) {
            // This is a custom field
            const fieldValue = customer[field.internalName];
            if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
              if (field.fieldType === 'checkbox') {
                // For checkbox, fieldValue should already be an array
                if (Array.isArray(fieldValue)) {
                  formAnswers[field.internalName] = fieldValue;
                } else if (typeof fieldValue === 'string') {
                  // If it's a string, try to parse it (comma-separated values)
                  formAnswers[field.internalName] = fieldValue.split(',').map(v => v.trim()).filter(v => v);
                }
              } else {
                formAnswers[field.internalName] = fieldValue;
              }
            }
          } else if (field.builtinKey === 'idcard_number') {
            // idcard_number might be in form_answers if not in customer object
            const idcardValue = customer.idcardNumber || customer[field.internalName];
            if (idcardValue) {
              formAnswers[field.internalName] = idcardValue;
            }
          }
        });

        if (Object.keys(formAnswers).length > 0) {
          customerData.formAnswers = formAnswers; // Backend uses alias_generator=to_camel, so this will map to form_answers
        }

        return customerData;
      });

      const transactionData: any = {
        customers: customersWithFormAnswers,
        tickets,
        qrOption: "shared",
        paymentMethod,
        extraFee,
      };

      // Add voucher code if applied and valid
      if (appliedVoucher && voucherValidation.valid) {
        transactionData.voucherCode = appliedVoucher.code;
      }

      const response = await baseHttpServiceInstance.post(
        `/event-studio/events/${params.event_id}/transactions/create-bulk`,
        transactionData, {}, true
      );
      const newTransaction = response.data;
      setConfirmOpen(false);
      const path = `/event-studio/events/${params.event_id}/transactions`;
      router.push(locale === 'en' ? `/en${path}` : path); // Navigate to a different page on success
      notificationCtx.success(tt('Tạo giao dịch thành công', 'Transaction created successfully'));
    } catch (error) {
      const err: any = error as any;
      if ((axios.isAxiosError && axios.isAxiosError(err) && err.response?.status === 422) || err?.response?.status === 422) {
        const detail = err?.response?.data?.detail || [];
        const items: CustomerValidationError[] = Array.isArray(detail)
          ? detail.reduce((acc: CustomerValidationError[], d: any) => {
            const loc = d?.loc || [];
            const idx = typeof loc[2] === 'number' ? loc[2] : null;
            const field = String(loc[3] ?? '');
            if (idx == null) {
              return acc;
            }
            acc.push({
              lineId: idx + 1,
              field,
              input: String(d?.input ?? ''),
              msg: String(d?.msg ?? ''),
            });
            return acc;
          }, [])
          : [];
        setCustomerValidationErrors(items);
        setConfirmOpen(false);
      } else {
        setConfirmOpen(false);
        notificationCtx.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const totalSelectedTickets = React.useMemo(() => {
    return Object.values(selectedCategories).reduce((sum, catMap) => {
      const subtotal = Object.values(catMap || {}).reduce((s, q) => s + (q || 0), 0);
      return sum + subtotal;
    }, 0);
  }, [selectedCategories]);

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
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h4">{tt("Tạo đơn hàng theo lô", "Create Bulk Orders")}</Typography>
        </Stack>
      </Stack>
      <Grid container spacing={3}>
        <Grid lg={12} md={12} xs={12}>
          <Stack spacing={3}>
            {/* Customer Information Card */}
            <Card>
              <CardHeader
                subheader={tt("Mỗi đơn hàng 1 dòng.", "One order per row.")}
                title={tt("Thông tin người mua", "Customer Information")}
                action={
                  <Button color="inherit" component="label" role={undefined} size="small" startIcon={<Upload fontSize="var(--icon-fontSize-md)" />}>
                    {tt("Upload excel", "Upload Excel")}
                    <VisuallyHiddenInput
                      type="file"
                      accept=".xlsx, .xls"
                      onInput={handleFileUpload}
                    />
                  </Button>
                }
              />
              <Divider />
              <CardContent sx={{ padding: 0, position: 'relative', overflow: 'visible' }}>
                <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                  <Tooltip
                    title={
                      <Box>
                        <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold' }}>{tt("Hướng dẫn nhập liệu:", "Data Input Guide:")}</Typography>
                        <Typography variant="caption" component="div">{tt("• Ngày: DD/MM/YYYY (ví dụ: 25/12/2024)", "• Date: DD/MM/YYYY (example: 25/12/2024)")}</Typography>
                        <Typography variant="caption" component="div">{tt("• Ngày giờ: DD/MM/YYYY HH:mm:ss (ví dụ: 25/12/2024 14:30:00)", "• Date Time: DD/MM/YYYY HH:mm:ss (example: 25/12/2024 14:30:00)")}</Typography>
                        <Typography variant="caption" component="div">{tt("• Giờ: HH:mm:ss (ví dụ: 14:30:00)", "• Time: HH:mm:ss (example: 14:30:00)")}</Typography>
                        <Typography variant="caption" component="div">{tt("• Chọn một: Chọn chính xác một trong các tùy chọn", "• Single Choice: Select exactly one option")}</Typography>
                        <Typography variant="caption" component="div">{tt("• Chọn nhiều: Có thể chọn nhiều tùy chọn, cách nhau bằng dấu phẩy", "• Multiple Choice: Can select multiple options, separated by commas")}</Typography>
                      </Box>
                    }
                    arrow
                    placement="left"
                  >
                    <IconButton size="small" sx={{ color: 'text.secondary' }}>
                      <Question size={16} />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ overflowX: 'auto', width: '100%', maxHeight: 400 }}>
                  <Table sx={{ minWidth: '800px', width: 'max-content' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '20px', py: 1 }}></TableCell>
                        {visibleFields.map((field) => {
                          if (field.builtinKey === 'title' && visibleFields.some(f => f.builtinKey === 'name')) return null;
                          return (
                            <TableCell
                              key={field.id}
                              sx={{
                                py: 0,
                                ...(field.builtinKey === 'name' ? { minWidth: '200px', width: 'auto' } :
                                  field.builtinKey === 'email' ? { width: '200px' } :
                                    field.builtinKey === 'phone_number' ? { width: '200px' } :
                                      field.builtinKey === 'address' ? { width: '250px' } :
                                        field.builtinKey === 'dob' ? { width: '150px' } :
                                          !field.builtinKey ? { width: '200px' } : {})
                              }}
                            >
                              <Stack spacing={0}>
                                <Typography variant="body2">
                                  {(() => {
                                    // Use bilingual label for builtinKey, otherwise use field.label from backend
                                    const builtinLabel = getBuiltinKeyLabel(field.builtinKey, tt);
                                    return builtinLabel || field.label;
                                  })()}{field.required ? ' *' : ''}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '10px', fontStyle: 'italic' }}>
                                  {getFieldTypeLabel(field, tt)}
                                </Typography>
                              </Stack>
                            </TableCell>
                          );
                        })}
                        <TableCell sx={{ py: 1 }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customers.map((customer, index) => {
                        const rowErrors = customerErrorsMap[index] || {};
                        return (
                          <TableRow
                            hover
                            key={index}
                            sx={
                              rowErrors && Object.keys(rowErrors).length > 0
                                ? { backgroundColor: 'rgba(255, 152, 0, 0.08)' }
                                : undefined
                            }
                          >
                            <TableCell>{index + 1}</TableCell>
                            {visibleFields.map((field) => {
                              if (field.builtinKey === 'title' && visibleFields.some(f => f.builtinKey === 'name')) return null;

                              const fieldKey = field.builtinKey || field.internalName;
                              const normalizedKey = normalizeFieldKey(fieldKey);
                              const fieldErrors = rowErrors[normalizedKey] || [];

                              // Get value from customer object
                              let value = '';
                              if (field.builtinKey === 'title') {
                                value = customer.title || '';
                              } else if (field.builtinKey === 'name') {
                                value = customer.name || '';
                              } else if (field.builtinKey === 'email') {
                                value = customer.email || '';
                              } else if (field.builtinKey === 'phone_number') {
                                value = customer.phoneNumber || '';
                              } else if (field.builtinKey === 'address') {
                                value = customer.address || '';
                              } else if (field.builtinKey === 'dob') {
                                value = customer.dob || '';
                              } else if (field.builtinKey === 'idcard_number') {
                                value = customer.idcardNumber || '';
                              } else {
                                value = customer[field.internalName] || '';
                              }

                              // Determine the field key for onChange
                              let onChangeKey = fieldKey;
                              if (field.builtinKey === 'phone_number') {
                                onChangeKey = 'phoneNumber';
                              } else if (field.builtinKey === 'idcard_number') {
                                onChangeKey = 'idcardNumber';
                              }

                              return (
                                <TableCell key={field.id}>
                                  {field.builtinKey === 'name' ? (
                                    <FormControl fullWidth required={field.required} error={fieldErrors.length > 0}>
                                      <OutlinedInput
                                        name={`customer_${fieldKey}_${index}`}
                                        value={value}
                                        onChange={(e) =>
                                          handleCustomerChange(index, 'name', e.target.value)
                                        }
                                        size="small"
                                        sx={{ fontSize: '11px' }}
                                        startAdornment={
                                          visibleFields.some(f => f.builtinKey === 'title') ? (
                                            <InputAdornment position="start">
                                              <Select
                                                variant="standard"
                                                sx={{ fontSize: '11px' }}
                                                disableUnderline
                                                value={customer.title || getDefaultTitle()}
                                                onChange={(e) =>
                                                  handleCustomerChange(index, 'title', e.target.value)
                                                }
                                              >
                                                {['Anh', 'Chị', 'Bạn', 'Em', 'Ông', 'Bà', 'Cô', 'Thầy', 'Mr.', 'Ms.', 'Mx.', 'Miss'].map((title) => (
                                                  <MenuItem key={title} value={title}>{title}</MenuItem>
                                                ))}
                                              </Select>
                                            </InputAdornment>
                                          ) : null
                                        }
                                      />
                                      {fieldErrors.map((err, errIdx) => (
                                        <FormHelperText key={`${fieldKey}-error-${index}-${errIdx}`}>
                                          {`${err.msg}`}
                                        </FormHelperText>
                                      ))}
                                    </FormControl>
                                  ) : field.fieldType === 'radio' && field.options ? (
                                    <FormControl fullWidth required={field.required} error={fieldErrors.length > 0}>
                                      <Select
                                        value={value}
                                        onChange={(e) =>
                                          handleCustomerChange(index, onChangeKey, e.target.value)
                                        }
                                        size="small"
                                        sx={{ fontSize: '11px' }}
                                      >
                                        {field.options.map((opt) => (
                                          <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '11px' }}>
                                            {opt.label}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                      {fieldErrors.map((err, errIdx) => (
                                        <FormHelperText key={`${fieldKey}-error-${index}-${errIdx}`}>
                                          {`${err.msg}`}
                                        </FormHelperText>
                                      ))}
                                    </FormControl>
                                  ) : field.fieldType === 'checkbox' && field.options ? (
                                    <FormControl fullWidth required={field.required} error={fieldErrors.length > 0}>
                                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                        {field.options.map((opt) => {
                                          const checked = value.split(',').includes(opt.value);
                                          return (
                                            <FormControlLabel
                                              key={opt.value}
                                              control={
                                                <Checkbox
                                                  checked={checked}
                                                  onChange={(e) => {
                                                    const currentValues = value ? value.split(',').filter(v => v.trim()) : [];
                                                    let newValue = '';
                                                    if (e.target.checked) {
                                                      newValue = [...currentValues, opt.value].join(',');
                                                    } else {
                                                      newValue = currentValues.filter(v => v !== opt.value).join(',');
                                                    }
                                                    handleCustomerChange(index, onChangeKey, newValue);
                                                  }}
                                                  size="small"
                                                  sx={{ '& .MuiSvgIcon-root': { fontSize: '16px' } }}
                                                />
                                              }
                                              label={<Typography sx={{ fontSize: '11px' }}>{opt.label}</Typography>}
                                              sx={{ fontSize: '11px', margin: 0 }}
                                            />
                                          );
                                        })}
                                      </Stack>
                                      {fieldErrors.map((err, errIdx) => (
                                        <FormHelperText key={`${fieldKey}-error-${index}-${errIdx}`}>
                                          {`${err.msg}`}
                                        </FormHelperText>
                                      ))}
                                    </FormControl>
                                  ) : field.fieldType === 'date' ? (
                                    <FormControl fullWidth required={field.required} error={fieldErrors.length > 0}>
                                      <OutlinedInput
                                        name={`customer_${fieldKey}_${index}`}
                                        placeholder={tt("DD/MM/YYYY", "DD/MM/YYYY")}
                                        value={value}
                                        onChange={(e) => {
                                          // Allow user to type DD/MM/YYYY format
                                          let input = e.target.value;
                                          // Remove non-digit characters except /
                                          input = input.replace(/[^\d/]/g, '');
                                          // Auto-format: DD/MM/YYYY
                                          if (input.length <= 2) {
                                            // DD
                                            handleCustomerChange(index, onChangeKey, input);
                                          } else if (input.length <= 5) {
                                            // DD/MM
                                            if (input.length === 3 && !input.includes('/')) {
                                              input = input.slice(0, 2) + '/' + input.slice(2);
                                            }
                                            handleCustomerChange(index, onChangeKey, input);
                                          } else if (input.length <= 10) {
                                            // DD/MM/YYYY
                                            if (input.length === 6 && input.split('/').length === 2) {
                                              input = input + '/';
                                            }
                                            handleCustomerChange(index, onChangeKey, input.slice(0, 10));
                                          }
                                        }}
                                        size="small"
                                        sx={{ fontSize: '11px' }}
                                      />
                                      {fieldErrors.map((err, errIdx) => (
                                        <FormHelperText key={`${fieldKey}-error-${index}-${errIdx}`}>
                                          {`${err.msg}`}
                                        </FormHelperText>
                                      ))}
                                    </FormControl>
                                  ) : field.fieldType === 'datetime' ? (
                                    <FormControl fullWidth required={field.required} error={fieldErrors.length > 0}>
                                      <OutlinedInput
                                        name={`customer_${fieldKey}_${index}`}
                                        placeholder={tt("DD/MM/YYYY HH:mm:ss", "DD/MM/YYYY HH:mm:ss")}
                                        value={value}
                                        onChange={(e) => {
                                          let input = e.target.value;
                                          // Remove non-digit characters except /, :, and space
                                          input = input.replace(/[^\d/: ]/g, '');
                                          // Auto-format: DD/MM/YYYY HH:mm:ss
                                          if (input.length <= 10) {
                                            // Handle date part (DD/MM/YYYY)
                                            if (input.length === 3 && !input.includes('/')) {
                                              input = input.slice(0, 2) + '/' + input.slice(2);
                                            } else if (input.length === 6 && input.split('/').length === 2) {
                                              input = input + '/';
                                            }
                                            handleCustomerChange(index, onChangeKey, input.slice(0, 10));
                                          } else if (input.length <= 19) {
                                            // Handle datetime part
                                            if (input.length === 11 && !input.includes(' ')) {
                                              input = input.slice(0, 10) + ' ' + input.slice(10);
                                            } else if (input.length === 14 && input.split(':').length === 1) {
                                              input = input.slice(0, 13) + ':' + input.slice(13);
                                            } else if (input.length === 17 && input.split(':').length === 2) {
                                              input = input.slice(0, 16) + ':' + input.slice(16);
                                            }
                                            handleCustomerChange(index, onChangeKey, input.slice(0, 19));
                                          }
                                        }}
                                        size="small"
                                        sx={{ fontSize: '11px' }}
                                      />
                                      {fieldErrors.map((err, errIdx) => (
                                        <FormHelperText key={`${fieldKey}-error-${index}-${errIdx}`}>
                                          {`${err.msg}`}
                                        </FormHelperText>
                                      ))}
                                    </FormControl>
                                  ) : field.fieldType === 'time' ? (
                                    <FormControl fullWidth required={field.required} error={fieldErrors.length > 0}>
                                      <OutlinedInput
                                        name={`customer_${fieldKey}_${index}`}
                                        placeholder={tt("HH:mm:ss", "HH:mm:ss")}
                                        value={value}
                                        onChange={(e) => {
                                          let input = e.target.value;
                                          // Remove non-digit characters except :
                                          input = input.replace(/[^\d:]/g, '');
                                          // Auto-format: HH:mm:ss
                                          if (input.length <= 2) {
                                            // HH
                                            handleCustomerChange(index, onChangeKey, input);
                                          } else if (input.length <= 5) {
                                            // HH:mm
                                            if (input.length === 3 && !input.includes(':')) {
                                              input = input.slice(0, 2) + ':' + input.slice(2);
                                            }
                                            handleCustomerChange(index, onChangeKey, input);
                                          } else if (input.length <= 8) {
                                            // HH:mm:ss
                                            if (input.length === 6 && input.split(':').length === 2) {
                                              input = input + ':';
                                            }
                                            handleCustomerChange(index, onChangeKey, input.slice(0, 8));
                                          }
                                        }}
                                        size="small"
                                        sx={{ fontSize: '11px' }}
                                      />
                                      {fieldErrors.map((err, errIdx) => (
                                        <FormHelperText key={`${fieldKey}-error-${index}-${errIdx}`}>
                                          {`${err.msg}`}
                                        </FormHelperText>
                                      ))}
                                    </FormControl>
                                  ) : field.builtinKey === 'phone_number' ? (
                                    <FormControl fullWidth required={field.required} error={fieldErrors.length > 0}>
                                      <OutlinedInput
                                        name={`customer_${fieldKey}_${index}`}
                                        type="tel"
                                        value={value}
                                        onChange={(e) =>
                                          handleCustomerChange(index, onChangeKey, e.target.value)
                                        }
                                        size="small"
                                        sx={{ fontSize: '11px' }}
                                        startAdornment={
                                          <InputAdornment position="start">
                                            <Select
                                              variant="standard"
                                              sx={{ fontSize: '11px', minWidth: 40 }}
                                              disableUnderline
                                              value={customer.phoneCountryCode || '+84'}
                                              onChange={(e) =>
                                                handleCustomerChange(index, 'phoneCountryCode', e.target.value)
                                              }
                                              renderValue={(value) => {
                                                const country = PHONE_COUNTRIES.find(c => c.dialCode === value);
                                                return country ? country.dialCode : value;
                                              }}
                                            >
                                              {PHONE_COUNTRIES.map((country) => (
                                                <MenuItem key={country.iso2} value={country.dialCode}>
                                                  {country.nameVi} ({country.dialCode})
                                                </MenuItem>
                                              ))}
                                            </Select>
                                          </InputAdornment>
                                        }
                                      />
                                      {fieldErrors.map((err, errIdx) => (
                                        <FormHelperText key={`${fieldKey}-error-${index}-${errIdx}`}>
                                          {`${err.msg}`}
                                        </FormHelperText>
                                      ))}
                                    </FormControl>
                                  ) : field.builtinKey === 'address' ? (
                                    <FormControl fullWidth required={field.required} error={fieldErrors.length > 0}>
                                      <OutlinedInput
                                        name={`customer_${fieldKey}_${index}`}
                                        type="text"
                                        value={value}
                                        onChange={(e) =>
                                          handleCustomerChange(index, onChangeKey, e.target.value)
                                        }
                                        size="small"
                                        sx={{ fontSize: '11px' }}
                                        multiline
                                        minRows={2}
                                        maxRows={4}
                                      />
                                      {fieldErrors.map((err, errIdx) => (
                                        <FormHelperText key={`${fieldKey}-error-${index}-${errIdx}`}>
                                          {`${err.msg}`}
                                        </FormHelperText>
                                      ))}
                                    </FormControl>
                                  ) : !field.builtinKey && field.fieldType === 'text' ? (
                                    // Custom text fields - allow multiline
                                    <FormControl fullWidth required={field.required} error={fieldErrors.length > 0}>
                                      <OutlinedInput
                                        name={`customer_${fieldKey}_${index}`}
                                        type="text"
                                        value={value}
                                        onChange={(e) =>
                                          handleCustomerChange(index, onChangeKey, e.target.value)
                                        }
                                        size="small"
                                        sx={{ fontSize: '11px' }}
                                        multiline
                                        minRows={1}
                                        maxRows={4}
                                      />
                                      {fieldErrors.map((err, errIdx) => (
                                        <FormHelperText key={`${fieldKey}-error-${index}-${errIdx}`}>
                                          {`${err.msg}`}
                                        </FormHelperText>
                                      ))}
                                    </FormControl>
                                  ) : (
                                    <FormControl fullWidth required={field.required} error={fieldErrors.length > 0}>
                                      <OutlinedInput
                                        name={`customer_${fieldKey}_${index}`}
                                        type={field.builtinKey === 'email' ? 'email' : field.fieldType === 'number' ? 'number' : 'text'}
                                        value={value}
                                        onChange={(e) =>
                                          handleCustomerChange(index, onChangeKey, e.target.value)
                                        }
                                        size="small"
                                        sx={{ fontSize: '11px' }}
                                      />
                                      {fieldErrors.map((err, errIdx) => (
                                        <FormHelperText key={`${fieldKey}-error-${index}-${errIdx}`}>
                                          {`${err.msg}`}
                                        </FormHelperText>
                                      ))}
                                    </FormControl>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell>
                              <IconButton onClick={() => removeCustomer(index)}>
                                <X />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              </CardContent>
              <Divider />
              <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button startIcon={<Plus />} size='small' onClick={addCustomer}>
                  {tt("Thêm hàng", "Add Row")}
                </Button>
                <Button startIcon={<Download />} size='small' onClick={handleDownloadTemplate}>
                  {tt("Tải file excel mẫu", "Download Excel Template")}
                </Button>
              </CardActions>
            </Card>
            {customerValidationErrors.length > 0 && (
              <Card sx={{ backgroundColor: '#FFF9ED' }}>
                <CardHeader
                  titleTypographyProps={{ variant: 'subtitle2', sx: { fontWeight: 600 } }}
                  subheader={tt("Vui lòng sửa các lỗi bên dưới", "Please fix the errors below")}
                  subheaderTypographyProps={{ variant: 'caption', sx: { color: 'warning.dark' } }}
                  sx={{ py: 1 }}
                />
                <Divider />
                <CardContent sx={{ py: 1, px: 2 }}>
                  <Stack spacing={0.5}>
                    {sortedValidationErrors.map((e, i) => {
                      const fieldKey = normalizeFieldKey(e.field);
                      const fieldLabelMap = getCustomerFieldLabelMap(formFields, tt);
                      const fieldLabel = fieldLabelMap[fieldKey] || e.field;
                      const displayValue = e.input ? e.input : tt('Trống', 'Empty');
                      return (
                        <Typography key={`${e.lineId}-${fieldKey}-${i}`} variant="caption" sx={{ lineHeight: 1.4 }}>
                          <Box component="span" sx={{ fontWeight: 600 }}>{tt(`Dòng ${e.lineId}`, `Line ${e.lineId}`)}</Box>
                          {` • ${fieldLabel}: `}
                          <Box component="span" sx={{ fontFamily: 'monospace' }}>{`"${displayValue}"`}</Box>
                          {` — ${e.msg}`}
                        </Typography>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
      </Grid>
      <Stack direction="row" spacing={3}>
        <Stack spacing={1} sx={{ flex: '1 1 auto' }}>
          <Typography variant="h5">{tt("Thông tin của từng đơn hàng", "Information for Each Order")}</Typography>
        </Stack>
      </Stack>
      <Grid container spacing={3}>
        {/* Schedules and Ticket Categories - Moved below */}
        <Grid lg={4} md={6} xs={12}>
          <Stack spacing={3}>
            <Schedules shows={event?.shows} onSelectionChange={handleSelectionChange} />
            {selectedSchedules && selectedSchedules.map(show => (
              <TicketCategories
                key={show.id}
                show={show}
                qrOption={'shared'}
                requestedCategoryModalId={requestedCategoryModalId || undefined}
                onModalRequestHandled={() => setRequestedCategoryModalId(null)}
                onCategorySelect={(categoryId: number) => handleCategorySelection(show.id, categoryId)}
                onAddToCart={(categoryId: number, quantity: number, holders?: { title: string; name: string; email: string; phone: string; }[]) => handleAddToCartQuantity(show.id, categoryId, quantity, holders)}
              />
            ))}
          </Stack>
        </Grid>
        <Grid lg={8} md={6} xs={12}>
          <Stack spacing={3}>
            {/* Ticket Quantity and Ticket Holders */}
            {totalSelectedTickets > 0 && (
              <Card>
                <CardHeader
                  title={tt("Danh sách vé", "Ticket List")}
                />
                <Divider />
                <CardContent>
                  <Stack spacing={3}>
                    {Object.entries(selectedCategories).flatMap(([showId, categories]) => {
                      const show = event?.shows.find((show) => show.id === parseInt(showId));
                      return Object.entries(categories || {}).map(([categoryIdStr, qty]) => {
                        const categoryId = parseInt(categoryIdStr);
                        const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
                        const quantity = qty || 0;
                        return (
                          <Stack spacing={3} key={`${showId}-${categoryId}`}>
                            <Stack direction={{ xs: 'column', md: 'row' }} key={`${showId}-${categoryId}`} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                                <TicketIcon fontSize="var(--icon-fontSize-md)" />
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{show?.name || tt('Chưa xác định', 'Not specified')} - {ticketCategory?.name || tt('Chưa rõ loại vé', 'Unknown ticket type')}</Typography>
                                <IconButton size="small" sx={{ ml: 1, alignSelf: 'flex-start' }} onClick={() => setRequestedCategoryModalId(categoryId)}><Pencil /></IconButton>
                              </Stack>
                              <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                                <Typography variant="caption">{formatPrice(ticketCategory?.price || 0)}</Typography>
                                <Typography variant="caption">x {quantity}</Typography>
                                <Typography variant="caption">
                                  = {formatPrice((ticketCategory?.price || 0) * quantity)}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Stack >
                        );
                      });
                    })}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Additional options (read-only) */}
            {totalSelectedTickets > 1 && (
              <Card>
                <CardHeader title={tt("Tùy chọn bổ sung", "Additional Options")} />
                <Divider />
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Stack>
                      <Typography variant="body2">{tt("Sử dụng mã QR riêng cho từng vé", "Use separate QR code for each ticket")}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {tt("Bạn cần nhập email cho từng vé.", "You need to enter email for each ticket.")}
                      </Typography>
                    </Stack>
                    <Checkbox checked={false} disabled />
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Voucher Card */}
            {(appliedVoucher || availableVouchers.length > 0) && (
              <Card>
                <CardHeader
                  title={tt("Khuyến mãi", "Discount")}
                  action={
                    !appliedVoucher && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <OutlinedInput
                          size="small"
                          name="discountCode"
                          placeholder={tt("Nhập mã khuyến mãi", "Enter discount code")}
                          value={manualDiscountCode}
                          onChange={(e) => setManualDiscountCode(e.target.value)}
                          sx={{ maxWidth: 180 }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleValidateAndDisplayVoucher}
                        >
                          {tt("Áp dụng", "Apply")}
                        </Button>
                      </Box>
                    )
                  }
                />
                {(appliedVoucher || availableVouchers.length > 0) && (
                  <>
                    <Divider />
                    <CardContent sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {appliedVoucher ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 2,
                            border: '1px solid',
                            borderColor: voucherValidation.valid ? 'success.main' : 'error.main',
                            borderRadius: 1,
                            bgcolor: voucherValidation.valid ? 'success.50' : 'error.50',
                            gap: 2,
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Stack spacing={0.5}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: voucherValidation.valid ? 'success.main' : 'error.main' }}>
                                  {tt('Đã áp dụng:', 'Applied:')} {appliedVoucher.code}
                                </Typography>
                                {voucherValidation.valid && (
                                  <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                                    - {appliedVoucher.discountType === 'percentage'
                                      ? `${appliedVoucher.discountValue}%`
                                      : `${appliedVoucher.discountValue.toLocaleString('vi-VN')} đ`}
                                    {appliedVoucher.applicationType === 'per_ticket' && (
                                      <Typography component="span" variant="body2" sx={{ ml: 0.5, fontWeight: 400 }}>
                                        {tt('mỗi vé', 'per ticket')}
                                      </Typography>
                                    )}
                                  </Typography>
                                )}
                              </Box>
                              {!voucherValidation.valid ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                  <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                                    {tt('Mã khuyến mãi không hợp lệ', 'Invalid discount code')}
                                    {voucherValidation.message && `: ${voucherValidation.message}`}
                                  </Typography>
                                  <Button
                                    variant="text"
                                    size="small"
                                    sx={{
                                      p: 0,
                                      minWidth: 'auto',
                                      fontSize: '0.75rem',
                                      textTransform: 'none',
                                      color: 'primary.main',
                                      '&:hover': { textDecoration: 'underline' }
                                    }}
                                    onClick={() => {
                                      setSelectedVoucherForDetail(appliedVoucher);
                                      setVoucherDetailModalOpen(true);
                                    }}
                                  >
                                    {tt('Xem thêm', 'View Details')}
                                  </Button>
                                </Box>
                              ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {appliedVoucher.name}
                                  </Typography>
                                  <Button
                                    variant="text"
                                    size="small"
                                    sx={{
                                      p: 0,
                                      minWidth: 'auto',
                                      fontSize: '0.75rem',
                                      textTransform: 'none',
                                      color: 'primary.main',
                                      '&:hover': { textDecoration: 'underline' }
                                    }}
                                    onClick={() => {
                                      setSelectedVoucherForDetail(appliedVoucher);
                                      setVoucherDetailModalOpen(true);
                                    }}
                                  >
                                    {tt('Xem thêm', 'View Details')}
                                  </Button>
                                </Box>
                              )}
                            </Stack>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setAppliedVoucher(null);
                              notificationCtx.info(tt('Đã xóa mã khuyến mãi', 'Removed discount code'));
                            }}
                            sx={{ color: 'error.main' }}
                          >
                            <X size={20} />
                          </IconButton>
                        </Box>
                      ) : (
                        availableVouchers.length > 0 && (
                          <Stack spacing={2}>
                            {availableVouchers.map((voucher) => {
                              const formatDiscount = (type: string, value: number) => {
                                if (type === 'percentage') {
                                  return `${value}%`;
                                }
                                return `${value.toLocaleString('vi-VN')} đ`;
                              };

                              const formatDate = (dateStr: string) => {
                                return dayjs(dateStr).format('DD/MM/YYYY HH:mm');
                              };

                              const conditions: string[] = [];
                              if (voucher.minTicketsRequired) {
                                conditions.push(tt(`Tối thiểu ${voucher.minTicketsRequired} vé`, `Min ${voucher.minTicketsRequired} tickets`));
                              }
                              if (voucher.maxTicketsAllowed) {
                                conditions.push(tt(`Tối đa ${voucher.maxTicketsAllowed} vé`, `Max ${voucher.maxTicketsAllowed} tickets`));
                              }
                              if (voucher.maxUsesPerUser) {
                                conditions.push(tt(`Tối đa ${voucher.maxUsesPerUser} lần/người`, `Max ${voucher.maxUsesPerUser} uses/person`));
                              }
                              if (voucher.requireLogin) {
                                conditions.push(tt('Yêu cầu đăng nhập', 'Requires login'));
                              }

                              return (
                                <Box
                                  key={voucher.id}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    gap: 2,
                                  }}
                                >
                                  <Box sx={{ flex: 1 }}>
                                    <Stack spacing={0.5}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                          {voucher.code}
                                        </Typography>
                                        <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                                          - {formatDiscount(voucher.discountType, voucher.discountValue)}
                                          {voucher.applicationType === 'per_ticket' && (
                                            <Typography component="span" variant="body2" sx={{ ml: 0.5, fontWeight: 400 }}>
                                              {tt('mỗi vé', 'per ticket')}
                                            </Typography>
                                          )}
                                        </Typography>
                                      </Box>
                                      <Typography variant="caption" color="text.secondary">
                                        {tt('Thời gian:', 'Valid:')} {formatDate(voucher.validFrom)} - {formatDate(voucher.validUntil)}
                                      </Typography>
                                      {conditions.length > 0 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                          <Typography variant="caption" color="text.secondary">
                                            {tt('Điều kiện:', 'Conditions:')} {conditions.join(', ')}
                                          </Typography>
                                          <Button
                                            variant="text"
                                            size="small"
                                            sx={{
                                              p: 0,
                                              minWidth: 'auto',
                                              fontSize: '0.75rem',
                                              textTransform: 'none',
                                              color: 'primary.main',
                                              '&:hover': { textDecoration: 'underline' }
                                            }}
                                            onClick={() => {
                                              setSelectedVoucherForDetail(voucher);
                                              setVoucherDetailModalOpen(true);
                                            }}
                                          >
                                            {tt('Xem thêm', 'View Details')}
                                          </Button>
                                        </Box>
                                      )}
                                      {conditions.length === 0 && (
                                        <Button
                                          variant="text"
                                          size="small"
                                          sx={{
                                            alignSelf: 'flex-start',
                                            p: 0,
                                            minWidth: 'auto',
                                            fontSize: '0.75rem',
                                            textTransform: 'none',
                                            color: 'primary.main',
                                            '&:hover': { textDecoration: 'underline' }
                                          }}
                                          onClick={() => {
                                            setSelectedVoucherForDetail(voucher);
                                            setVoucherDetailModalOpen(true);
                                          }}
                                        >
                                          {tt('Xem thêm', 'View Details')}
                                        </Button>
                                      )}
                                    </Stack>
                                  </Box>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleApplyVoucher(voucher)}
                                  >
                                    {tt('Áp dụng', 'Apply')}
                                  </Button>
                                </Box>
                              );
                            })}
                          </Stack>
                        )
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            )}

            {/* Extra Fee */}
            <Card>
              <CardHeader
                title={tt("Phụ phí", "Extra Fee")}
                subheader={tt("(nếu có)", "(if any)")}
                action={
                  <OutlinedInput
                    name="extraFee"
                    value={extraFee.toLocaleString()} // Format as currency
                    onChange={handleExtraFeeChange}
                    sx={{ maxWidth: 180 }}
                    endAdornment={<InputAdornment position="end">đ</InputAdornment>}
                  />
                }
              />
            </Card>

            {Object.values(selectedCategories).some((catMap) => Object.keys(catMap || {}).length > 0) && (
              <Card>
                <CardContent>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {tt("Tổng tiền vé:", "Ticket Total:")}
                      </Typography>
                      <Typography variant="body2">
                        {formatPrice(subtotal)}
                      </Typography>
                    </Box>
                    {extraFee > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {tt("Phụ phí:", "Extra Fee:")}
                        </Typography>
                        <Typography variant="body2">
                          {formatPrice(extraFee)}
                        </Typography>
                      </Box>
                    )}
                    {appliedVoucher && discountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {tt("Giảm giá:", "Discount:")}
                        </Typography>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                          - {formatPrice(discountAmount)}
                        </Typography>
                      </Box>
                    )}
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{tt("Tổng cộng:", "Total:")}</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {formatPrice(finalTotal)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}
            {/* Payment Method */}
            <Card>
              <CardHeader
                title={tt("Phương thức thanh toán", "Payment Method")}
                action={
                  <FormControl sx={{ maxWidth: 180, minWidth: 180 }}>
                    <Select
                      name="payment_method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <MenuItem value=""></MenuItem>
                      <MenuItem value="cash">{tt("Tiền mặt", "Cash")}</MenuItem>
                      <MenuItem value="transfer">{tt("Chuyển khoản", "Bank Transfer")}</MenuItem>
                      <MenuItem value="napas247">{tt("Napas 247", "Napas 247")}</MenuItem>
                    </Select>
                  </FormControl>
                }
              />
            </Card>


            {/* Submit Button */}
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end', mt: '3' }}>
              <Button variant="contained" onClick={handleCreateClick}>
                {tt("Tạo", "Create")}
              </Button>
            </Grid>
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="md">
              <DialogTitle sx={{ color: "primary.main" }}>{tt(`Xác nhận tạo ${customers.length} đơn hàng`, `Confirm creating ${customers.length} orders`)}</DialogTitle>
              <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {/* <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Thông tin người mua mỗi đơn hàng</Typography> */}
                  <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {customers.map((customer, index) => (
                      <Box key={index} sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {tt(`Người mua ${index + 1}`, `Customer ${index + 1}`)}
                        </Typography>
                        {visibleFields.map((field) => {
                          const fieldKey = field.builtinKey || field.internalName;
                          let value = '';
                          if (field.builtinKey === 'name') {
                            value = customer.name || '';
                          } else if (field.builtinKey === 'email') {
                            value = customer.email || '';
                          } else if (field.builtinKey === 'phone_number') {
                            value = customer.phoneNumber || '';
                          } else if (field.builtinKey === 'address') {
                            value = customer.address || '';
                          } else if (field.builtinKey === 'dob') {
                            value = customer.dob || '';
                          } else if (field.builtinKey === 'idcard_number') {
                            value = customer.idcardNumber || '';
                          } else {
                            value = customer[field.internalName] || '';
                          }

                          // Format name field with title
                          if (field.builtinKey === 'name') {
                            value = customer.title ? `${customer.title} ${value}` : value;
                          }

                          return (
                            <Box key={field.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">{field.label}</Typography>
                              <Typography variant="body2">{value || '-'}</Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    ))}
                  </Box>
                  <Divider />

                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{tt("Danh sách vé mỗi đơn hàng", "Ticket list for each order")}</Typography>
                  <Stack spacing={1}>
                    {Object.entries(selectedCategories).flatMap(([showId, categories]) => {
                      const show = event?.shows.find((show) => show.id === parseInt(showId));
                      return Object.entries(categories || {}).map(([categoryIdStr, qty]) => {
                        const categoryId = parseInt(categoryIdStr);
                        const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
                        const quantity = qty || 0;
                        return (
                          <Stack spacing={0} key={`confirm-${showId}-${categoryId}`}>
                            <Stack direction={{ xs: 'column', md: 'row' }} key={`${showId}-${categoryId}`} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                                <TicketIcon fontSize="var(--icon-fontSize-md)" />
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{show?.name || tt('Chưa xác định', 'Not specified')} - {ticketCategory?.name || tt('Chưa rõ loại vé', 'Unknown ticket type')}</Typography>
                              </Stack>
                              <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                                <Typography variant="caption">{formatPrice(ticketCategory?.price || 0)}</Typography>
                                <Typography variant="caption">x {quantity}</Typography>
                                <Typography variant="caption">
                                  = {formatPrice((ticketCategory?.price || 0) * quantity)}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Stack>
                        );
                      });
                    })}
                  </Stack>
                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{tt("Phương thức thanh toán", "Payment Method")}</Typography>
                    <Typography variant="body2">{getPaymentMethodLabel(paymentMethod, tt)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{tt("Phụ phí", "Extra Fee")}</Typography>
                    <Typography variant="body2">{formatPrice(extraFee)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{tt("Tổng cộng", "Total")}</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {formatPrice(
                        Object.entries(selectedCategories).reduce((total, [showId, categories]) => {
                          const show = event?.shows.find((show) => show.id === parseInt(showId));
                          const categoriesTotal = Object.entries(categories || {}).reduce((sub, [categoryIdStr, qty]) => {
                            const categoryId = parseInt(categoryIdStr);
                            const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
                            return sub + (ticketCategory?.price || 0) * (qty || 0);
                          }, 0);
                          return total + categoriesTotal;
                        }, 0)
                      )}
                    </Typography>
                  </Box>
                  {extraFee > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {tt("Phụ phí:", "Extra Fee:")}
                      </Typography>
                      <Typography variant="body2">
                        {formatPrice(extraFee)}
                      </Typography>
                    </Box>
                  )}
                  {appliedVoucher && discountAmount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        {tt("Giảm giá:", "Discount:")} ({appliedVoucher.code})
                      </Typography>
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                        - {formatPrice(discountAmount)}
                      </Typography>
                    </Box>
                  )}
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {tt("Tổng cộng", "Total")}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {formatPrice(finalTotal)}
                    </Typography>
                  </Box>
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmOpen(false)}>{tt("Quay lại", "Back")}</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>{tt("Xác nhận", "Confirm")}</Button>
              </DialogActions>
            </Dialog>

            {/* Voucher Detail Modal */}
            <Dialog
              open={voucherDetailModalOpen}
              onClose={() => {
                setVoucherDetailModalOpen(false);
                setSelectedVoucherForDetail(null);
              }}
              fullWidth
              maxWidth="md"
            >
              <DialogTitle sx={{ color: "primary.main" }}>
                {tt("Chi tiết khuyến mãi", "Voucher Details")}
              </DialogTitle>
              <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {selectedVoucherForDetail && (
                  <Stack spacing={3} sx={{ mt: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {tt("Mã khuyến mãi", "Voucher Code")}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                        {selectedVoucherForDetail.code}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {tt("Giảm giá:", "Discount:")}
                        </Typography>
                        <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>
                          {selectedVoucherForDetail.discountType === 'percentage'
                            ? `${selectedVoucherForDetail.discountValue}%`
                            : `${selectedVoucherForDetail.discountValue.toLocaleString('vi-VN')} đ`}
                          {selectedVoucherForDetail.applicationType === 'per_ticket' && (
                            <Typography component="span" variant="body2" sx={{ ml: 0.5, fontWeight: 400 }}>
                              {tt('mỗi vé', 'per ticket')}
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {tt("Tên chiến dịch", "Campaign Name")}
                      </Typography>
                      <Typography variant="body1">
                        {selectedVoucherForDetail.name}
                      </Typography>
                      {selectedVoucherForDetail.content && (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                          {selectedVoucherForDetail.content}
                        </Typography>
                      )}
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {tt("Thời gian hiệu lực", "Validity Period")}
                      </Typography>
                      <Typography variant="body2">
                        {tt("Từ:", "From:")} {dayjs(selectedVoucherForDetail.validFrom).format('DD/MM/YYYY HH:mm')}
                      </Typography>
                      <Typography variant="body2">
                        {tt("Đến:", "To:")} {dayjs(selectedVoucherForDetail.validUntil).format('DD/MM/YYYY HH:mm')}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {tt("Loại áp dụng", "Application Type")}
                      </Typography>
                      <Typography variant="body1">
                        {selectedVoucherForDetail.applicationType === 'total_order'
                          ? tt('Giảm chung trên tổng đơn hàng', 'Discount on Total Order')
                          : tt('Giảm theo vé', 'Discount per Ticket')}
                      </Typography>
                      {selectedVoucherForDetail.applicationType === 'per_ticket' && selectedVoucherForDetail.maxTicketsToDiscount && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {tt(`Tối đa ${selectedVoucherForDetail.maxTicketsToDiscount} vé được giảm giá`, `Maximum ${selectedVoucherForDetail.maxTicketsToDiscount} tickets can receive discount`)}
                        </Typography>
                      )}
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {tt("Phạm vi áp dụng", "Application Scope")}
                      </Typography>
                      {selectedVoucherForDetail.applyToAll ? (
                        <Typography variant="body1">
                          {tt("Toàn bộ suất diễn và toàn bộ hạng vé", "All Shows and All Ticket Categories")}
                        </Typography>
                      ) : (
                        <Stack spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            {tt("Chỉ áp dụng cho các hạng vé sau:", "Only applies to the following ticket categories:")}
                          </Typography>
                          {selectedVoucherForDetail.ticketCategories && selectedVoucherForDetail.ticketCategories.length > 0 ? (
                            <Stack spacing={0.5}>
                              {selectedVoucherForDetail.ticketCategories.map((tc: any, index: number) => (
                                <Typography key={`tc-${index}`} variant="body2">
                                  • {tc.show ? `${tc.show.name} - ` : ''}{tc.name}
                                </Typography>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              {tt("Chưa có hạng vé nào được chọn", "No ticket categories selected")}
                            </Typography>
                          )}
                        </Stack>
                      )}
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {tt("Điều kiện áp dụng", "Application Conditions")}
                      </Typography>
                      <Stack spacing={1}>
                        {selectedVoucherForDetail.minTicketsRequired ? (
                          <Typography variant="body2">
                            {tt("Số lượng vé tối thiểu:", "Minimum tickets required:")} <strong>{selectedVoucherForDetail.minTicketsRequired}</strong>
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {tt("Số lượng vé tối thiểu: Không giới hạn", "Minimum tickets required: Unlimited")}
                          </Typography>
                        )}
                        {selectedVoucherForDetail.maxTicketsAllowed ? (
                          <Typography variant="body2">
                            {tt("Số lượng vé tối đa:", "Maximum tickets allowed:")} <strong>{selectedVoucherForDetail.maxTicketsAllowed}</strong>
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {tt("Số lượng vé tối đa: Không giới hạn", "Maximum tickets allowed: Unlimited")}
                          </Typography>
                        )}
                        {selectedVoucherForDetail.maxUsesPerUser ? (
                          <Typography variant="body2">
                            {tt("Số lần sử dụng tối đa mỗi người:", "Maximum uses per user:")} <strong>{selectedVoucherForDetail.maxUsesPerUser}</strong>
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            {tt("Số lần sử dụng tối đa mỗi người: Không giới hạn", "Maximum uses per user: Unlimited")}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          {tt("Yêu cầu đăng nhập:", "Requires login:")} <strong>{selectedVoucherForDetail.requireLogin ? tt('Có', 'Yes') : tt('Không', 'No')}</strong>
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => {
                  setVoucherDetailModalOpen(false);
                  setSelectedVoucherForDetail(null);
                }}>
                  {tt("Đóng", "Close")}
                </Button>
                {selectedVoucherForDetail && !appliedVoucher && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleApplyVoucher(selectedVoucherForDetail);
                      setVoucherDetailModalOpen(false);
                      setSelectedVoucherForDetail(null);
                    }}
                  >
                    {tt("Áp dụng mã này", "Apply This Code")}
                  </Button>
                )}
              </DialogActions>
            </Dialog>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
